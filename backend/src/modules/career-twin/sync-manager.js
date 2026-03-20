const researchAgent = require('./agents/research-agent');
const JobSyncLog = require('./job-sync-log-model');
const SourceConfig = require('./source-config-model');
const { loadJobsForSource, getConfiguredSourcesFromEnv } = require('./providers/job-source-adapters');

const RETRY_DELAYS_MS = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000];
const AUTO_DISABLE_FAILURE_STREAK = Math.max(2, Number(process.env.CAREER_TWIN_AUTO_DISABLE_FAILURE_STREAK || 3));

class CareerTwinSyncManager {
    async enqueueSync({ sourceType, sourceKey, attempt = 1 }) {
        const existingQueuedOrRunning = await JobSyncLog.findOne({
            sourceType,
            sourceKey,
            status: { $in: ['queued', 'running'] },
        }).sort({ createdAt: -1 }).lean();

        if (existingQueuedOrRunning) {
            return null;
        }

        return JobSyncLog.create({
            sourceType,
            sourceKey,
            status: 'queued',
            attempt,
            queuedAt: new Date(),
            nextRetryAt: new Date(),
        });
    }

    async enqueueConfiguredSources() {
        const dbConfigs = await SourceConfig.find({ enabled: true }).lean();
        const dbSources = [];

        for (const cfg of dbConfigs) {
            const latest = await JobSyncLog.findOne({ sourceType: cfg.sourceType, sourceKey: cfg.sourceKey })
                .sort({ createdAt: -1 })
                .lean();

            const intervalMinutes = Math.max(5, Number(cfg.syncIntervalMinutes || 30));
            const baseTime = latest?.createdAt || cfg.lastSyncedAt || null;
            const due = !baseTime || (Date.now() - new Date(baseTime).getTime()) >= (intervalMinutes * 60 * 1000);

            if (due) {
                dbSources.push({
                    sourceType: cfg.sourceType,
                    sourceKey: cfg.sourceKey,
                });
            }
        }

        const envSources = getConfiguredSourcesFromEnv();
        const all = [...dbSources, ...envSources];
        const seen = new Set();
        const sources = all.filter((src) => {
            const key = `${src.sourceType}:${src.sourceKey}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const writes = sources.map((source) => this.enqueueSync(source));
        const results = await Promise.allSettled(writes);
        const queued = results.filter((x) => x.status === 'fulfilled' && x.value).length;
        return { queued, totalSources: sources.length };
    }

    async runSyncJob(log) {
        log.status = 'running';
        log.startedAt = new Date();
        await log.save();

        const sourceConfig = await SourceConfig.findOne({ sourceType: log.sourceType, sourceKey: log.sourceKey });

        try {
            const jobs = await loadJobsForSource(log.sourceType, log.sourceKey);
            const ingest = await researchAgent.ingestStructuredJobs({ jobs, source: `${log.sourceType}:${log.sourceKey}` });

            log.status = 'success';
            log.importedCount = Number(ingest.imported || 0);
            log.completedAt = new Date();
            log.errorMessage = '';
            await log.save();

            if (sourceConfig) {
                sourceConfig.lastSyncedAt = new Date();
                sourceConfig.lastSyncStatus = 'success';
                sourceConfig.failureStreak = 0;
                if (sourceConfig.autoDisabledReason && sourceConfig.enabled) {
                    sourceConfig.autoDisabledReason = '';
                    sourceConfig.autoDisabledAt = null;
                }
                await sourceConfig.save();
            }

            return { success: true, importedCount: log.importedCount };
        } catch (error) {
            const nextAttempt = Number(log.attempt || 1) + 1;
            const retryIndex = Math.min(nextAttempt - 2, RETRY_DELAYS_MS.length - 1);
            const canRetry = nextAttempt <= RETRY_DELAYS_MS.length + 1;

            log.status = 'failed';
            log.errorMessage = error.message || 'Unknown sync error';
            log.completedAt = new Date();
            await log.save();

            if (sourceConfig) {
                sourceConfig.lastSyncedAt = new Date();
                sourceConfig.lastSyncStatus = 'failed';
                sourceConfig.failureStreak = Number(sourceConfig.failureStreak || 0) + 1;

                const shouldAutoDisable = sourceConfig.autoDisableEnabled
                    && !sourceConfig.autoDisableBypass
                    && sourceConfig.failureStreak >= AUTO_DISABLE_FAILURE_STREAK;

                if (shouldAutoDisable && sourceConfig.enabled) {
                    sourceConfig.enabled = false;
                    sourceConfig.autoDisabledAt = new Date();
                    sourceConfig.autoDisabledReason = `failure_streak_${sourceConfig.failureStreak}`;
                }

                await sourceConfig.save();
            }

            if (canRetry) {
                const delay = RETRY_DELAYS_MS[retryIndex] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
                const retryAt = new Date(Date.now() + delay);
                await JobSyncLog.create({
                    sourceType: log.sourceType,
                    sourceKey: log.sourceKey,
                    status: 'queued',
                    attempt: nextAttempt,
                    queuedAt: new Date(),
                    nextRetryAt: retryAt,
                    metadata: {
                        retryOf: String(log._id),
                    },
                });
            }

            return { success: false, error: log.errorMessage };
        }
    }

    async processQueue({ limit = 6 } = {}) {
        const due = await JobSyncLog.find({
            status: 'queued',
            nextRetryAt: { $lte: new Date() },
        }).sort({ createdAt: 1 }).limit(limit);

        let successCount = 0;
        let failedCount = 0;
        let importedCount = 0;

        for (const log of due) {
            const result = await this.runSyncJob(log);
            if (result.success) {
                successCount += 1;
                importedCount += Number(result.importedCount || 0);
            } else {
                failedCount += 1;
            }
        }

        return {
            picked: due.length,
            successCount,
            failedCount,
            importedCount,
        };
    }

    async getStatus({ lookbackHours = 24 } = {}) {
        const since = new Date(Date.now() - (Math.max(1, Number(lookbackHours || 24)) * 60 * 60 * 1000));
        const logs = await JobSyncLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(200).lean();
        const configs = await SourceConfig.find().lean();

        const summary = logs.reduce((acc, log) => {
            acc.total += 1;
            if (log.status === 'success') acc.success += 1;
            if (log.status === 'failed') acc.failed += 1;
            if (log.status === 'queued') acc.queued += 1;
            if (log.status === 'running') acc.running += 1;
            acc.imported += Number(log.importedCount || 0);
            return acc;
        }, { total: 0, success: 0, failed: 0, queued: 0, running: 0, imported: 0 });

        const bySource = new Map();
        logs.forEach((log) => {
            const key = `${log.sourceType}:${log.sourceKey}`;
            if (!bySource.has(key)) {
                bySource.set(key, {
                    sourceType: log.sourceType,
                    sourceKey: log.sourceKey,
                    total: 0,
                    success: 0,
                    failed: 0,
                    latestStatus: log.status,
                    latestCompletedAt: log.completedAt || log.updatedAt || log.createdAt,
                    imported: 0,
                });
            }

            const row = bySource.get(key);
            row.total += 1;
            if (log.status === 'success') row.success += 1;
            if (log.status === 'failed') row.failed += 1;
            row.imported += Number(log.importedCount || 0);
        });

        const configMap = new Map(configs.map((cfg) => [`${cfg.sourceType}:${cfg.sourceKey}`, cfg]));

        const sourceHealth = [...bySource.values()].map((row) => {
            const successRate = row.total ? Math.round((row.success / row.total) * 100) : 0;
            const lastAgeHours = row.latestCompletedAt
                ? Math.round((Date.now() - new Date(row.latestCompletedAt).getTime()) / (60 * 60 * 1000))
                : null;

            let healthScore = Math.max(0, Math.min(100, successRate));
            const alerts = [];

            if (row.failed >= 2 && row.failed > row.success) {
                healthScore -= 20;
                alerts.push('consecutive_failures');
            }
            if (lastAgeHours !== null && lastAgeHours > 24) {
                healthScore -= 15;
                alerts.push('stale_sync');
            }
            if (row.latestStatus === 'running') {
                alerts.push('running');
            }

            const cfg = configMap.get(`${row.sourceType}:${row.sourceKey}`);
            if (cfg?.autoDisableBypass) {
                alerts.push('manual_override_enabled');
            }
            if (cfg && !cfg.enabled) {
                alerts.push('disabled');
            }
            if (cfg?.autoDisabledReason) {
                alerts.push('auto_disabled');
                healthScore = Math.min(healthScore, 40);
            }

            const healthStatus = healthScore >= 80
                ? 'healthy'
                : healthScore >= 55
                    ? 'warning'
                    : 'critical';

            return {
                sourceType: row.sourceType,
                sourceKey: row.sourceKey,
                successRate,
                healthScore,
                healthStatus,
                imported: row.imported,
                latestStatus: row.latestStatus,
                latestCompletedAt: row.latestCompletedAt,
                enabled: cfg ? Boolean(cfg.enabled) : true,
                autoDisableEnabled: cfg ? Boolean(cfg.autoDisableEnabled) : true,
                autoDisableBypass: cfg ? Boolean(cfg.autoDisableBypass) : false,
                failureStreak: cfg ? Number(cfg.failureStreak || 0) : 0,
                autoDisabledReason: cfg?.autoDisabledReason || '',
                alerts,
            };
        });

        configs.forEach((cfg) => {
            const key = `${cfg.sourceType}:${cfg.sourceKey}`;
            const exists = sourceHealth.some((item) => `${item.sourceType}:${item.sourceKey}` === key);
            if (!exists) {
                sourceHealth.push({
                    sourceType: cfg.sourceType,
                    sourceKey: cfg.sourceKey,
                    successRate: 0,
                    healthScore: cfg.enabled ? 70 : 40,
                    healthStatus: cfg.enabled ? 'warning' : 'critical',
                    imported: 0,
                    latestStatus: cfg.lastSyncStatus || 'idle',
                    latestCompletedAt: cfg.lastSyncedAt || null,
                    enabled: Boolean(cfg.enabled),
                    autoDisableEnabled: Boolean(cfg.autoDisableEnabled),
                    autoDisableBypass: Boolean(cfg.autoDisableBypass),
                    failureStreak: Number(cfg.failureStreak || 0),
                    autoDisabledReason: cfg.autoDisabledReason || '',
                    alerts: [
                        ...(cfg.enabled ? [] : ['disabled']),
                        ...(cfg.autoDisableBypass ? ['manual_override_enabled'] : []),
                        ...(cfg.autoDisabledReason ? ['auto_disabled'] : []),
                    ],
                });
            }
        });

        const alerts = sourceHealth
            .filter((item) => item.healthStatus !== 'healthy' || item.alerts.length > 0)
            .map((item) => ({
                sourceType: item.sourceType,
                sourceKey: item.sourceKey,
                healthStatus: item.healthStatus,
                alerts: item.alerts,
            }));

        return { summary, logs, sourceHealth, alerts };
    }
}

module.exports = new CareerTwinSyncManager();
