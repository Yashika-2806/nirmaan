const ApiResponse = require('../../core/utils/response');
const service = require('./service');

const growthAnalyticsController = {
    async trackEvent(req, res, next) {
        try {
            const result = await service.recordEvent({
                event: req.body.event,
                source: req.body.source,
                props: req.body.props,
                sessionId: req.body.sessionId,
                occurredAt: req.body.occurredAt,
                userId: null,
            });

            return ApiResponse.success(res, result, 'Growth event recorded', 202);
        } catch (error) {
            return next(error);
        }
    },

    async getFunnelMetrics(req, res, next) {
        try {
            const data = await service.getFunnelMetrics({
                lookbackDays: req.query.lookbackDays,
            });
            return ApiResponse.success(res, data, 'Funnel metrics fetched');
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = growthAnalyticsController;
