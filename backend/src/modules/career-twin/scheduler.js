const cron = require('node-cron');
const logger = require('../../core/utils/logger');
const syncManager = require('./sync-manager');

let queueCron = null;
let sourceCron = null;

function startCareerTwinScheduler() {
    if (queueCron || sourceCron) {
        return;
    }

    // Every 5 minutes: process due queue items.
    queueCron = cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await syncManager.processQueue({ limit: 10 });
            if (result.picked > 0) {
                logger.info('Career Twin queue sync tick', result);
            }
        } catch (error) {
            logger.error('Career Twin queue sync tick failed', { error: error.message });
        }
    });

    // Every 30 minutes: enqueue configured providers from env.
    sourceCron = cron.schedule('*/30 * * * *', async () => {
        try {
            const result = await syncManager.enqueueConfiguredSources();
            if (result.totalSources > 0) {
                logger.info('Career Twin source enqueue tick', result);
            }
        } catch (error) {
            logger.error('Career Twin source enqueue tick failed', { error: error.message });
        }
    });

    logger.info('Career Twin scheduler started');
}

module.exports = {
    startCareerTwinScheduler,
};
