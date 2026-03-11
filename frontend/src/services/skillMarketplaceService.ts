import api from '@/lib/axios';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillItem {
    name: string;
    experienceLevel: ExperienceLevel;
}

export interface AvailabilitySlot {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string;
    endTime: string;
    timezone?: string;
}

export interface SkillProfilePayload {
    teachSkills?: SkillItem[];
    learnSkills?: SkillItem[];
    experienceLevel?: ExperienceLevel;
    availability?: AvailabilitySlot[];
}

export interface SkillRequestPayload {
    skill: string;
    description: string;
    preferredTime: string;
    rewardType: 'skill-exchange' | 'points';
}

export interface SessionPayload {
    mentorId: string;
    learnerId: string;
    skill: string;
    time: string;
    duration: number;
    meetingLink: string;
    requestId?: string;
    isAIMentorSession?: boolean;
}

export const skillMarketplaceService = {
    getMyProfile: () => api.get('/skill-marketplace/profile/me').then((r) => r.data.data),

    upsertProfile: (data: SkillProfilePayload) =>
        api.put('/skill-marketplace/profile/me', data).then((r) => r.data.data),

    detectSkills: (data: {
        githubData?: Record<string, unknown>;
        codingProfiles?: Record<string, unknown>;
        resumeData?: Record<string, unknown>;
        autoSave?: boolean;
    }) => api.post('/skill-marketplace/ai/detect-skills', data).then((r) => r.data.data),

    getMatches: (limit = 5) =>
        api.get(`/skill-marketplace/matches?limit=${limit}`).then((r) => r.data.data),

    createRequest: (data: SkillRequestPayload) =>
        api.post('/skill-marketplace/requests', data).then((r) => r.data.data),

    listRequests: (params?: { status?: string; skill?: string }) =>
        api.get('/skill-marketplace/requests', { params }).then((r) => r.data.data),

    claimRequest: (requestId: string) =>
        api.post(`/skill-marketplace/requests/${requestId}/claim`).then((r) => r.data.data),

    completeRequest: (requestId: string) =>
        api.post(`/skill-marketplace/requests/${requestId}/complete`).then((r) => r.data.data),

    scheduleSession: (data: SessionPayload) =>
        api.post('/skill-marketplace/sessions', data).then((r) => r.data.data),

    listSessions: () => api.get('/skill-marketplace/sessions').then((r) => r.data.data),

    completeSession: (sessionId: string) =>
        api.post(`/skill-marketplace/sessions/${sessionId}/complete`).then((r) => r.data.data),

    leaveReview: (data: { sessionId: string; rating: number; feedback: string }) =>
        api.post('/skill-marketplace/reviews', data).then((r) => r.data.data),

    listMyReviews: () => api.get('/skill-marketplace/reviews/me').then((r) => r.data.data),

    getPointsSummary: () => api.get('/skill-marketplace/points/me').then((r) => r.data.data),

    generateAIMentorPlan: (data: {
        learnSkill: string;
        currentLevel?: ExperienceLevel;
        goal?: string;
        userQuestion?: string;
    }) => api.post('/skill-marketplace/ai-mentor/generate', data).then((r) => r.data.data),

    fetchExternalProfiles: (github?: string, leetcode?: string, codeforces?: string) => {
        const params = new URLSearchParams();
        if (github) params.set('github', github);
        if (leetcode) params.set('leetcode', leetcode);
        if (codeforces) params.set('codeforces', codeforces);
        return api.get(`/skill-marketplace/fetch-profiles?${params.toString()}`).then((r) => r.data.data as {
            profiles: {
                github?: { username: string; name: string; bio: string; publicRepos: number; languages: string[]; topics: string[]; topRepos: { name: string; language: string; stars: number; description: string }[]; summary: string };
                leetcode?: { username: string; ranking: number; totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number; topTags: string[]; summary: string };
                codeforces?: { username: string; rating: number; maxRating: number; rank: string; maxRank: string; summary: string };
            };
            errors: Record<string, string>;
            combinedSummary: string;
        });
    },
};
