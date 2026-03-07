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
    }) => api.post('/roadmap/generate', data).then(r => r.data.data) as Promise<Roadmap>,

    getAll: () => api.get('/roadmap').then(r => r.data.data) as Promise<Roadmap[]>,

    getOne: (id: string) => api.get(`/roadmap/${id}`).then(r => r.data.data) as Promise<Roadmap>,

    toggleMilestone: (id: string, milestoneIndex: number) =>
        api.patch(`/roadmap/${id}/milestone`, { milestoneIndex }).then(r => r.data.data) as Promise<Roadmap>,

    delete: (id: string) => api.delete(`/roadmap/${id}`).then(r => r.data.data),
};
