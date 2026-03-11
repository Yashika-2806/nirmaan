import api from '@/lib/axios';

export type GamificationActivityType =
    | 'dsa_problem_solved'
    | 'mock_interview_completed'
    | 'resume_improved'
    | 'skill_marketplace_helped'
    | 'pdf_exam_session_completed'
    | 'research_task_completed'
    | 'roadmap_milestone_completed'
    | 'career_twin_session_completed';

export interface GamificationProfile {
    userId: string;
    level: number;
    levelTitle: string;
    totalXp: number;
    xpInCurrentLevel: number;
    xpForNextLevel: number;
    xpProgressPercentage: number;
    streakCurrent: number;
    streakLongest: number;
    readinessScore: number;
    stats: Record<string, number>;
    badgesEarnedCount: number;
    badges: Array<{
        _id: string;
        badgeKey: string;
        title: string;
        description: string;
        color: string;
        milestone: string;
        earnedAt: string;
    }>;
    credits: {
        balance: number;
        lifetimeEarned: number;
        lifetimeSpent: number;
    };
    rankings: {
        global: number | null;
        college: number | null;
    };
    currentQuest: {
        _id: string;
        status: 'active' | 'completed' | 'claimed' | 'expired';
        tasks: Array<{
            key: string;
            label: string;
            target: number;
            current: number;
            completed: boolean;
        }>;
        reward: {
            xp: number;
            credits: number;
            badgeKey?: string;
            badgeTitle?: string;
        };
        weekStart: string;
        weekEnd: string;
    };
    unlockedFeatures: string[];
}

export interface LeaderboardResponse {
    scope: 'global' | 'college';
    metric: 'xp' | 'dsa' | 'skill';
    weekStart: string;
    weekEnd: string;
    context: {
        institution: string | null;
    };
    entries: Array<{
        rank: number;
        userId: string;
        name: string;
        institution: string;
        score: number;
        xpEarned: number;
        dsaSolved: number;
        skillContributions: number;
    }>;
}

export const gamificationService = {
    recordActivity: (activityType: GamificationActivityType, metadata?: Record<string, unknown>) =>
        api.post('/gamification/activity', { activityType, metadata }).then((r) => r.data.data),

    getProfile: (userId: string) =>
        api.get(`/gamification/profile/${userId}`).then((r) => r.data.data as GamificationProfile),

    getLeaderboard: (params?: { scope?: 'global' | 'college'; metric?: 'xp' | 'dsa' | 'skill'; limit?: number }) =>
        api.get('/gamification/leaderboard', { params }).then((r) => r.data.data as LeaderboardResponse),

    getQuests: () => api.get('/gamification/quests').then((r) => r.data.data),

    claimReward: (questId?: string) =>
        api.post('/gamification/claim-reward', { questId }).then((r) => r.data.data),
};
