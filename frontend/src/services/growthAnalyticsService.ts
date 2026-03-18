import api from '@/lib/axios';

export interface FunnelStageMetric {
    stage: string;
    count: number;
    conversionFromStart: number;
    dropFromPrevious: number;
}

export interface FunnelSourceMetric {
    source: string;
    count: number;
}

export interface FunnelMetricsResponse {
    lookbackDays: number;
    startDate: string;
    totals: {
        eventsTracked: number;
        landingClicks: number;
        registerSuccess: number;
        upgrades: number;
    };
    stages: FunnelStageMetric[];
    topSources: FunnelSourceMetric[];
}

export const growthAnalyticsService = {
    getFunnelMetrics: (lookbackDays = 30) =>
        api
            .get('/analytics/funnel', { params: { lookbackDays } })
            .then((response) => response.data.data as FunnelMetricsResponse),
};
