const AIKey = require('./model');
const aiKeyManager = require('./manager');
const Encryption = require('../utils/encryption');
const { AppError } = require('../middleware/error');
const { ERROR_CODES, AI_KEY_STATUS } = require('../../config/constants');

class AIKeyService {
    /**
     * Add new AI key
     * @param {Object} keyData - Key data
     * @param {string} addedBy - User ID who added the key
     * @returns {Promise<Object>} - Created key
     */
    async addKey(keyData, addedBy) {
        const { keyName, apiKey, provider, assignedModules, limits, priority, description } = keyData;

        // Check if key name already exists
        const existing = await AIKey.findOne({ keyName });
        if (existing) {
            throw new AppError('Key name already exists', 409, ERROR_CODES.VALIDATION_ERROR);
        }

        // Encrypt API key
        const encryptedKey = Encryption.encrypt(apiKey);

        // Create key
        const newKey = await AIKey.create({
            keyName,
            apiKey: encryptedKey,
            provider,
            assignedModules,
            limits: limits || {},
            priority: priority || 1,
            metadata: {
                description,
                addedBy,
            },
        });

        // Return without exposing encrypted key
        const keyObj = newKey.toObject();
        keyObj.apiKey = '***ENCRYPTED***';
        return keyObj;
    }

    /**
     * Get all keys (admin)
     * @returns {Promise<Array>} - List of keys
     */
    async getAllKeys() {
        const keys = await AIKey.find()
            .populate('metadata.addedBy', 'name email')
            .sort({ priority: -1, createdAt: -1 });

        // Mask API keys
        return keys.map(key => {
            const keyObj = key.toObject();
            keyObj.apiKey = '***ENCRYPTED***';
            return keyObj;
        });
    }

    /**
     * Get key by ID
     * @param {string} keyId - Key ID
     * @returns {Promise<Object>} - Key object
     */
    async getKeyById(keyId) {
        const key = await AIKey.findById(keyId).populate('metadata.addedBy', 'name email');

        if (!key) {
            throw new AppError('AI key not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const keyObj = key.toObject();
        keyObj.apiKey = '***ENCRYPTED***';
        return keyObj;
    }

    /**
     * Update key
     * @param {string} keyId - Key ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} - Updated key
     */
    async updateKey(keyId, updates) {
        const allowedUpdates = ['keyName', 'assignedModules', 'limits', 'priority', 'metadata.description'];
        const filteredUpdates = {};

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // If updating API key, encrypt it
        if (updates.apiKey) {
            filteredUpdates.apiKey = Encryption.encrypt(updates.apiKey);
        }

        const key = await AIKey.findByIdAndUpdate(keyId, filteredUpdates, {
            new: true,
            runValidators: true,
        });

        if (!key) {
            throw new AppError('AI key not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const keyObj = key.toObject();
        keyObj.apiKey = '***ENCRYPTED***';
        return keyObj;
    }

    /**
     * Toggle key status
     * @param {string} keyId - Key ID
     * @returns {Promise<Object>} - Updated key
     */
    async toggleKeyStatus(keyId) {
        const key = await AIKey.findById(keyId);

        if (!key) {
            throw new AppError('AI key not found', 404, ERROR_CODES.NOT_FOUND);
        }

        const newStatus = key.status === AI_KEY_STATUS.ACTIVE
            ? AI_KEY_STATUS.DISABLED
            : AI_KEY_STATUS.ACTIVE;

        key.status = newStatus;
        await key.save();

        const keyObj = key.toObject();
        keyObj.apiKey = '***ENCRYPTED***';
        return keyObj;
    }

    /**
     * Delete key
     * @param {string} keyId - Key ID
     */
    async deleteKey(keyId) {
        const key = await AIKey.findByIdAndDelete(keyId);

        if (!key) {
            throw new AppError('AI key not found', 404, ERROR_CODES.NOT_FOUND);
        }
    }

    /**
     * Get usage statistics
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} - Usage stats
     */
    async getUsageStats(filters) {
        return await aiKeyManager.getUsageStats(filters);
    }

    /**
     * Get key usage by module
     * @returns {Promise<Array>} - Usage by module
     */
    async getUsageByModule() {
        const AIUsageLog = require('./usage-log-model');

        const stats = await AIUsageLog.aggregate([
            {
                $group: {
                    _id: '$module',
                    totalRequests: { $sum: 1 },
                    totalTokens: { $sum: '$tokensUsed' },
                    avgResponseTime: { $avg: '$responseTime' },
                },
            },
            { $sort: { totalRequests: -1 } },
        ]);

        return stats;
    }

    /**
     * Get key performance metrics
     * @returns {Promise<Array>} - Performance metrics
     */
    async getKeyPerformance() {
        const keys = await AIKey.find();

        return keys.map(key => ({
            keyName: key.keyName,
            status: key.status,
            usage: {
                dailyTokens: key.usage.dailyTokens,
                dailyLimit: key.limits.dailyTokenLimit,
                utilizationPercent: (key.usage.dailyTokens / key.limits.dailyTokenLimit * 100).toFixed(2),
                requestCount: key.usage.requestCount,
                errorCount: key.metadata.errorCount,
            },
            assignedModules: key.assignedModules,
            priority: key.priority,
            lastUsed: key.metadata.lastUsed,
        }));
    }
}

module.exports = new AIKeyService();
