import api from '@/lib/axios';

export type TwinWorkMode = 'remote' | 'hybrid' | 'onsite' | '';
export type FitCategory = 'strong_fit' | 'moderate_fit' | 'stretch';
export type ApplicationStatus = 'draft' | 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'withdrawn';

export interface CareerTwinRecommendation {
    jobId: string;
    externalId: string;
    title: string;
    company: string;
    location: string;
    workMode: TwinWorkMode | 'unknown';
    applyUrl: string;
    tags: string[];
    requiredSkills: string[];
    fitScore: number;
    interviewProbability: number;
    fitCategory: FitCategory;
    missingSkills: string[];
    resumeFitScore: number;
    reasoning: string[];
}

export interface CareerTwinApplication {
    _id: string;
    jobId: {
        _id: string;
        title: string;
        company: string;
        location: string;
        workMode: string;
        applyUrl: string;
        requiredSkills?: string[];
    };
    status: ApplicationStatus;
    matchScore: number;
    interviewProbability: number;
    fitCategory: FitCategory;
    missingSkills: string[];
    notes?: string;
    updatedAt: string;
}

export interface TwinDashboardData {
    recommendations: {
        profile: {
            headline: string;
            preferredRoles: string[];
            strengths: string[];
            topSkills: string[];
        };
        metrics: {
            totalJobs: number;
            strongFitCount: number;
            averageMatchScore: number;
        };
        recommendations: CareerTwinRecommendation[];
    };
    tracking: {
        applications: CareerTwinApplication[];
        kanban: Record<string, CareerTwinApplication[]>;
        skillGaps: Array<{ skill: string; demandCount: number; suggestion: string }>;
        aiSuggestions: string[];
        progress: {
            totalApplications: number;
            shortlistRate: number;
            offerRate: number;
            confidenceScore: number;
        };
    };
}

export interface CareerTwinFunnelMetrics {
    lookbackDays: number;
    startDate: string;
    totals: {
        applications: number;
        applied: number;
        shortlisted: number;
        interviews: number;
        offers: number;
        rejected: number;
    };
    stages: Array<{
        stage: string;
        count: number;
        conversionFromStart: number;
        dropFromPrevious: number;
    }>;
    fitCategoryConversion: Array<{
        fitCategory: FitCategory;
        total: number;
        shortlistRate: number;
        interviewRate: number;
        offerRate: number;
    }>;
}

export interface CareerTwinSourceConfig {
    _id: string;
    sourceType: 'greenhouse' | 'lever' | 'workday';
    sourceKey: string;
    label: string;
    enabled: boolean;
    autoDisableEnabled?: boolean;
    autoDisableBypass?: boolean;
    failureStreak?: number;
    autoDisabledAt?: string;
    autoDisabledReason?: string;
    syncIntervalMinutes: number;
    defaults?: {
        company?: string;
        workMode?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
        employmentType?: string;
    };
    lastSyncedAt?: string;
    lastSyncStatus?: 'idle' | 'success' | 'failed';
}

export const careerTwinService = {
    uploadResumeText: (resumeText: string, preferences = {}) =>
        api.post('/career-twin/resume/upload-text', { resumeText, preferences }).then((r) => r.data.data),

    uploadResumeFile: async (file: File, preferences: Record<string, unknown> = {}) => {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('preferences', JSON.stringify(preferences));

        const response = await api.post('/career-twin/resume/upload-file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },

    syncJobs: (jobs: Record<string, unknown>[], source = 'manual_feed') =>
        api.post('/career-twin/jobs/sync', { jobs, source }).then((r) => r.data.data),

    getDashboard: (filters?: { query?: string; location?: string; workMode?: TwinWorkMode; limit?: number }) =>
        api
            .get('/career-twin/dashboard', { params: filters || {} })
            .then((r) => r.data.data as TwinDashboardData),

    getRecommendations: (filters?: { query?: string; location?: string; workMode?: TwinWorkMode; limit?: number }) =>
        api
            .get('/career-twin/recommendations', { params: filters || {} })
            .then((r) => r.data.data as TwinDashboardData['recommendations']),

    tailorResume: (jobId: string) =>
        api.post('/career-twin/resume/tailor', { jobId }).then((r) => r.data.data as {
            job: { _id: string; title: string; company: string };
            tailored: {
                summary: string;
                bullets: string[];
                atsKeywords: string[];
                resumeFitScore: number;
                projectOrder: string[];
            };
        }),

    applyToJob: (jobId: string, applyMode: 'assisted' | 'user_approved' | 'manual' = 'assisted') =>
        api.post(`/career-twin/apply/${jobId}`, { applyMode }).then((r) => r.data.data),

    getApplications: () => api.get('/career-twin/applications').then((r) => r.data.data as TwinDashboardData['tracking']),

    updateApplicationStatus: (applicationId: string, status: ApplicationStatus, note = '') =>
        api.patch(`/career-twin/applications/${applicationId}/status`, { status, note }).then((r) => r.data.data),

    getAnalyticsFunnel: (lookbackDays = 30) =>
        api.get('/career-twin/analytics/funnel', { params: { lookbackDays } }).then((r) => r.data.data as CareerTwinFunnelMetrics),

    triggerConfiguredSync: () => api.post('/career-twin/admin/sync/trigger').then((r) => r.data.data),

    queueSourceSync: (sourceType: 'greenhouse' | 'lever' | 'workday', sourceKey: string) =>
        api.post('/career-twin/admin/sync/queue', { sourceType, sourceKey }).then((r) => r.data.data),

    runSyncQueue: (limit = 8) => api.post('/career-twin/admin/sync/run', { limit }).then((r) => r.data.data),

    getSyncStatus: (lookbackHours = 24) =>
        api.get('/career-twin/admin/sync/status', { params: { lookbackHours } }).then((r) => r.data.data as {
            summary: { total: number; success: number; failed: number; queued: number; running: number; imported: number };
            logs: Array<{
                _id: string;
                sourceType: string;
                sourceKey: string;
                status: string;
                attempt: number;
                importedCount: number;
                errorMessage?: string;
                createdAt: string;
                completedAt?: string;
            }>;
            sourceHealth: Array<{
                sourceType: string;
                sourceKey: string;
                successRate: number;
                healthScore: number;
                healthStatus: 'healthy' | 'warning' | 'critical';
                imported: number;
                latestStatus: string;
                latestCompletedAt?: string;
                enabled?: boolean;
                autoDisableEnabled?: boolean;
                autoDisableBypass?: boolean;
                failureStreak?: number;
                autoDisabledReason?: string;
                alerts: string[];
            }>;
            alerts: Array<{
                sourceType: string;
                sourceKey: string;
                healthStatus: 'healthy' | 'warning' | 'critical';
                alerts: string[];
            }>;
        }),

    listSourceConfigs: () =>
        api.get('/career-twin/admin/sources').then((r) => r.data.data as { sources: CareerTwinSourceConfig[] }),

    createSourceConfig: (payload: {
        sourceType: 'greenhouse' | 'lever' | 'workday';
        sourceKey: string;
        label?: string;
        enabled?: boolean;
        syncIntervalMinutes?: number;
        defaults?: {
            company?: string;
            workMode?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
            employmentType?: string;
        };
    }) => api.post('/career-twin/admin/sources', payload).then((r) => r.data.data),

    updateSourceConfig: (sourceId: string, payload: Partial<CareerTwinSourceConfig>) =>
        api.patch(`/career-twin/admin/sources/${sourceId}`, payload).then((r) => r.data.data),

    deleteSourceConfig: (sourceId: string) => api.delete(`/career-twin/admin/sources/${sourceId}`).then((r) => r.data.data),

    queueSourceById: (sourceId: string) =>
        api.post(`/career-twin/admin/sources/${sourceId}/queue`).then((r) => r.data.data),

    recoverSourceById: (sourceId: string) =>
        api.post(`/career-twin/admin/sources/${sourceId}/recover`).then((r) => r.data.data),
};
