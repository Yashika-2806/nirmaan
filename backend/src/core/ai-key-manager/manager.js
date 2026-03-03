const AIKey = require('./model');
const AIUsageLog = require('./usage-log-model');
const Encryption = require('../utils/encryption');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/error');
const { AI_KEY_STATUS, ERROR_CODES } = require('../../config/constants');
const cron = require('node-cron');

class AIKeyManager {
    constructor() {
        // Reset daily usage counters at midnight
        cron.schedule('0 0 * * *', () => {
            this.resetDailyUsage();
        });

        // Reset per-minute counters every minute
        cron.schedule('* * * * *', () => {
            this.resetMinuteCounters();
        });
    }

    /**
     * Get an available AI key for a specific module
     * @param {string} module - Module name
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object>} - AI key object
     */
    async getKey(module, retryCount = 0) {
        try {
            // 1. Fetch active keys for module
            const keys = await AIKey.find({
                assignedModules: module,
                status: AI_KEY_STATUS.ACTIVE,
            }).sort({ priority: -1, 'usage.dailyTokens': 1 });

            if (!keys.length) {
                throw new AppError(
                    `No AI keys configured for module: ${module}`,
                    503,
                    ERROR_CODES.AI_SERVICE_ERROR
                );
            }

            // 2. Filter by rate limits
            const now = new Date();
            const availableKeys = keys.filter(key => {
                // Check minute-based rate limit
                const minuteResetNeeded = now - new Date(key.usage.minuteResetTime) >= 60000;
                const requestsThisMinute = minuteResetNeeded ? 0 : key.usage.requestsThisMinute;

                // Check daily token limit
                const dailyLimitOk = key.usage.dailyTokens < key.limits.dailyTokenLimit;
                const minuteLimitOk = requestsThisMinute < key.limits.requestsPerMinute;

                return dailyLimitOk && minuteLimitOk;
            });

            if (!availableKeys.length) {
                // Retry logic with exponential backoff
                if (retryCount < 3) {
                    const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                    logger.warn(`No available keys for ${module}. Retrying in ${backoffTime}ms...`);
                    await this.sleep(backoffTime);
                    return this.getKey(module, retryCount + 1);
                }

                throw new AppError(
                    'All AI keys are currently at capacity. Please try again later.',
                    429,
                    ERROR_CODES.QUOTA_EXCEEDED
                );
            }

            // 3. Load balancing (weighted selection based on priority and usage)
            const selectedKey = this.weightedSelection(availableKeys);

            // 4. Reserve key (increment usage counters)
            await this.reserveKey(selectedKey._id);

            // 5. Decrypt API key
            selectedKey.apiKey = Encryption.decrypt(selectedKey.apiKey);

            return selectedKey;
        } catch (error) {
            logger.error(`Error getting AI key for ${module}:`, error);
            throw error;
        }
    }

    /**
     * Weighted selection algorithm for load balancing
     * @param {Array} keys - Available keys
     * @returns {Object} - Selected key
     */
    weightedSelection(keys) {
        // Calculate weights based on priority and inverse of usage
        const weights = keys.map(key => {
            const usageRatio = key.usage.dailyTokens / key.limits.dailyTokenLimit;
            const availabilityScore = 1 - usageRatio;
            return key.priority * availabilityScore * 10;
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < keys.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return keys[i];
            }
        }

        return keys[0]; // Fallback
    }

    /**
     * Reserve a key by incrementing usage counters
     * @param {string} keyId - Key ID
     */
    async reserveKey(keyId) {
        const now = new Date();

        await AIKey.findByIdAndUpdate(keyId, {
            $inc: {
                'usage.requestCount': 1,
                'usage.requestsThisMinute': 1,
            },
            $set: {
                'metadata.lastUsed': now,
            },
        });
    }

    /**
     * Log AI usage
     * @param {Object} logData - Usage log data
     */
    async logUsage(logData) {
        const { keyId, userId, module, endpoint, tokensUsed, responseTime, success, error } = logData;

        try {
            // Create usage log
            await AIUsageLog.create({
                keyId,
                userId,
                module,
                endpoint,
                tokensUsed: tokensUsed || 0,
                responseTime,
                success,
                error,
            });

            // Update key usage
            if (success && tokensUsed) {
                await AIKey.findByIdAndUpdate(keyId, {
                    $inc: {
                        'usage.totalTokens': tokensUsed,
                        'usage.dailyTokens': tokensUsed,
                    },
                });
            }

            // Increment error count if failed
            if (!success) {
                await AIKey.findByIdAndUpdate(keyId, {
                    $inc: { 'metadata.errorCount': 1 },
                });
            }
        } catch (error) {
            logger.error('Error logging AI usage:', error);
        }
    }

    /**
     * Handle AI key failure
     * @param {string} keyId - Key ID
     * @param {Object} error - Error object
     */
    async handleFailure(keyId, error) {
        try {
            // Check for quota exceeded errors
            if (
                error.code === 'QUOTA_EXCEEDED' ||
                error.message?.includes('quota') ||
                error.message?.includes('rate limit')
            ) {
                await AIKey.findByIdAndUpdate(keyId, {
                    status: AI_KEY_STATUS.QUOTA_EXCEEDED,
                });

                logger.warn(`AI Key ${keyId} marked as quota exceeded`);
            }

            // Disable key if too many errors
            const key = await AIKey.findById(keyId);
            if (key && key.metadata.errorCount > 50) {
                await AIKey.findByIdAndUpdate(keyId, {
                    status: AI_KEY_STATUS.DISABLED,
                });

                logger.error(`AI Key ${keyId} disabled due to excessive errors`);
            }
        } catch (err) {
            logger.error('Error handling AI key failure:', err);
        }
    }

    /**
     * Reset daily usage counters
     */
    async resetDailyUsage() {
        try {
            await AIKey.updateMany(
                {},
                {
                    $set: {
                        'usage.dailyTokens': 0,
                        'usage.lastReset': new Date(),
                    },
                }
            );

            // Re-enable quota exceeded keys
            await AIKey.updateMany(
                { status: AI_KEY_STATUS.QUOTA_EXCEEDED },
                { status: AI_KEY_STATUS.ACTIVE }
            );

            logger.info('Daily AI key usage reset completed');
        } catch (error) {
            logger.error('Error resetting daily usage:', error);
        }
    }

    /**
     * Reset per-minute request counters
     */
    async resetMinuteCounters() {
        try {
            const oneMinuteAgo = new Date(Date.now() - 60000);

            await AIKey.updateMany(
                { 'usage.minuteResetTime': { $lt: oneMinuteAgo } },
                {
                    $set: {
                        'usage.requestsThisMinute': 0,
                        'usage.minuteResetTime': new Date(),
                    },
                }
            );
        } catch (error) {
            logger.error('Error resetting minute counters:', error);
        }
    }

    /**
     * Get usage statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} - Usage statistics
     */
    async getUsageStats(filters = {}) {
        const { keyId, userId, module, startDate, endDate } = filters;

        const matchStage = {};
        if (keyId) matchStage.keyId = keyId;
        if (userId) matchStage.userId = userId;
        if (module) matchStage.module = module;
        if (startDate || endDate) {
            matchStage.timestamp = {};
            if (startDate) matchStage.timestamp.$gte = new Date(startDate);
            if (endDate) matchStage.timestamp.$lte = new Date(endDate);
        }

        const stats = await AIUsageLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    successfulRequests: {
                        $sum: { $cond: ['$success', 1, 0] },
                    },
                    totalTokens: { $sum: '$tokensUsed' },
                    avgResponseTime: { $avg: '$responseTime' },
                },
            },
        ]);

        return stats[0] || {
            totalRequests: 0,
            successfulRequests: 0,
            totalTokens: 0,
            avgResponseTime: 0,
        };
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AIKeyManager();
