import api from '@/lib/axios';

export interface RoadmapResource {
    title: string;
    type: 'course' | 'book' | 'article' | 'project' | 'practice';
    url: string;
    paid?: boolean;
}

export interface RoadmapMilestone {
    title: string;
    description: string;
    skills: string[];
    resources: RoadmapResource[];
    duration: string;
    weeklyHours: number;
    deliverable: string;
    completed: boolean;
    completedAt?: string | null;
}

export interface Roadmap {
    _id: string;
    title: string;
    summary: string;
    currentRole: string;
    targetGoal: string;
    timelineMonths: number;
    currentSkills: string[];
    experienceNotes: string;
    milestones: RoadmapMilestone[];
    totalSkills: string[];
    keyInsights: string[];
    status: 'active' | 'completed' | 'archived';
    createdAt: string;
}

export const roadmapService = {
    generate: (data: {
        currentRole: string;
        targetGoal: string;
        timelineMonths: number;
        currentSkills?: string[];
        experienceNotes?: string;
    }) => {
        const allowedTimelines = [3, 6, 12, 18, 24] as const;
        const timeline = allowedTimelines.includes(data.timelineMonths as (typeof allowedTimelines)[number])
            ? data.timelineMonths
            : 6;

        const payload = {
            currentRole: data.currentRole.trim(),
            targetGoal: data.targetGoal.trim(),
            timelineMonths: timeline,
            currentSkills: (data.currentSkills || []).map((s) => s.trim()).filter(Boolean),
            experienceNotes: (data.experienceNotes || '').trim(),
        };

        return api.post('/roadmap/generate', payload).then(r => r.data.data) as Promise<Roadmap>;
    },

    getAll: () => api.get('/roadmap').then(r => r.data.data) as Promise<Roadmap[]>,

    getOne: (id: string) => api.get(`/roadmap/${id}`).then(r => r.data.data) as Promise<Roadmap>,

    toggleMilestone: (id: string, milestoneIndex: number) =>
        api.patch(`/roadmap/${id}/milestone`, { milestoneIndex }).then(r => r.data.data) as Promise<Roadmap>,

    delete: (id: string) => api.delete(`/roadmap/${id}`).then(r => r.data.data),
};
