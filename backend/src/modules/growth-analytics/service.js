const GrowthEvent = require('./event-model');

const FUNNEL_STAGES = [
    'cta_clicked',
    'register_submitted',
    'register_success',
    'dashboard_viewed',
    'paywall_viewed',
    'paywall_upgrade_clicked',
];

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

class GrowthAnalyticsService {
    async recordEvent(payload) {
        const event = await GrowthEvent.create({
            event: payload.event,
            source: payload.source || 'unknown',
            props: payload.props || {},
            userId: payload.userId || null,
            sessionId: payload.sessionId || null,
            occurredAt: payload.occurredAt || new Date(),
        });

        return {
            id: event._id,
            event: event.event,
            source: event.source,
            createdAt: event.createdAt,
        };
    }

    async getFunnelMetrics(options = {}) {
        const lookbackDays = Math.max(1, Math.min(365, Number(options.lookbackDays || 30)));
        const startDate = startOfDay(new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000));

        const events = await GrowthEvent.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    event: { $in: FUNNEL_STAGES },
                },
            },
            {
                $group: {
                    _id: '$event',
                    count: { $sum: 1 },
                },
            },
        ]);

        const byEvent = FUNNEL_STAGES.reduce((acc, stage) => {
            acc[stage] = 0;
            return acc;
        }, {});

        for (const row of events) {
            byEvent[row._id] = row.count;
        }

        const stageRows = FUNNEL_STAGES.map((stage, index) => {
            const current = byEvent[stage] || 0;
            const previous = index === 0 ? current : byEvent[FUNNEL_STAGES[index - 1]] || 0;
            const conversionFromStart = byEvent[FUNNEL_STAGES[0]] > 0
                ? Math.round((current / byEvent[FUNNEL_STAGES[0]]) * 100)
                : 0;
            const dropFromPrevious = previous > 0
                ? Math.max(0, Math.round(((previous - current) / previous) * 100))
                : 0;

            return {
                stage,
                count: current,
                conversionFromStart,
                dropFromPrevious,
            };
        });

        const sources = await GrowthEvent.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    event: 'cta_clicked',
                },
            },
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);

        const totals = {
            eventsTracked: stageRows.reduce((sum, row) => sum + row.count, 0),
            landingClicks: byEvent.cta_clicked || 0,
            registerSuccess: byEvent.register_success || 0,
            upgrades: byEvent.paywall_upgrade_clicked || 0,
        };

        return {
            lookbackDays,
            startDate,
            totals,
            stages: stageRows,
            topSources: sources.map((item) => ({
                source: item._id || 'unknown',
                count: item.count,
            })),
        };
    }
}

module.exports = new GrowthAnalyticsService();
