import api from '@/lib/axios';

export type CareerGoalOption =
    | 'Software Engineer'
    | 'Data Scientist'
    | 'Product Manager'
    | 'MBA Consultant'
    | 'Investment Analyst'
    | 'Marketing Manager'
    | 'Startup Founder';

export interface SkillProfileItem {
    skill: string;
    value: number;
}

export interface SkillGapItem {
    skill: string;
    current: number;
    required: number;
    gap: number;
}

export interface CareerTimelineStage {
    key: string;
    title: string;
    description: string;
    requiredTaskCompletions: number;
    unlocked: boolean;
    unlockedAt?: string | null;
    completed: boolean;
    completedAt?: string | null;
    order: number;
}

export interface CareerRoadmapTask {
    _id: string;
    weekNumber: number;
    title: string;
    description: string;
    category: 'dsa' | 'project' | 'interview' | 'resume' | 'communication' | 'research' | 'networking';
    targetCount: number;
    currentCount: number;
    completed: boolean;
    completedAt?: string | null;
    xpReward: number;
    linkedStageKey: string;
}

export interface CareerRoadmapData {
    _id: string;
    userId: string;
    goalId: string;
    targetRole: CareerGoalOption;
    careerReadinessScore: number;
    currentSkillProfile: SkillProfileItem[];
    requiredSkillProfile: SkillProfileItem[];
    gapAnalysis: SkillGapItem[];
    timelineStages: CareerTimelineStage[];
    tasks: CareerRoadmapTask[];
    recommendations: string[];
    status: 'active' | 'completed' | 'archived';
    updatedAt: string;
}

export interface CareerProgressData {
    completedTasks: number;
    totalTasks: number;
    progressPercent: number;
    totalXpEarned: number;
    readinessHistory: Array<{ score: number; source: string; at: string }>;
    timelineEvents: Array<{ type: string; title: string; at: string }>;
}

export interface CareerMissionItem {
    _id: string;
    title: string;
    category: 'dsa' | 'project' | 'interview' | 'resume' | 'communication' | 'networking';
    targetCount: number;
    currentCount: number;
    completed: boolean;
    completedAt?: string | null;
    xpReward: number;
    readinessImpact: number;
}

export interface CareerMissionData {
    _id: string;
    missionDate: string;
    status: 'active' | 'completed';
    source: 'ai' | 'fallback';
    items: CareerMissionItem[];
}

export interface CareerProbabilityData {
    startupCompany: number;
    midSizeTechCompany: number;
    topTechCompany: number;
    factors: Array<{ label: string; score: number; weight: number }>;
    lastComputedAt: string;
}

export const careerGpsService = {
    setGoal: (targetRole: CareerGoalOption, notes = '') =>
        api.post('/career-gps/set-goal', { targetRole, notes }).then((r) => r.data.data),

    getRoadmap: (userId: string) =>
        api.get(`/career-gps/roadmap/${userId}`).then((r) => r.data.data as {
            roadmap: CareerRoadmapData | null;
            progress: CareerProgressData | null;
        }),

    updateProgress: (data: {
        roadmapId: string;
        taskId?: string;
        missionId?: string;
        incrementBy?: number;
        markCompleted?: boolean;
    }) => api.post('/career-gps/update-progress', data).then((r) => r.data.data),

    getProbability: (userId: string) =>
        api.get(`/career-gps/probability/${userId}`).then((r) => r.data.data as {
            readinessScore: number;
            probability: CareerProbabilityData | null;
        }),

    getMissions: (userId: string) =>
        api.get(`/career-gps/missions/${userId}`).then((r) => r.data.data as CareerMissionData | null),
};
