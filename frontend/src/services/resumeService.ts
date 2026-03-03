
import api from '@/lib/axios';

/**
 * Service for managing resumes
 */
export const resumeService = {
    getAllResumes: async () => {
        const response = await api.get('/resume');
        return response.data;
    },

    getResume: async (id: string) => {
        const response = await api.get(`/resume/${id}`);
        return response.data;
    },

    createResume: async (data: any) => {
        const response = await api.post('/resume', data);
        return response.data;
    },

    updateResume: async (id: string, data: any) => {
        const response = await api.put(`/resume/${id}`, data);
        return response.data;
    },

    deleteResume: async (id: string) => {
        const response = await api.delete(`/resume/${id}`);
        return response.data;
    },

    generateResume: async (data: any) => {
        const response = await api.post('/resume/generate', data);
        return response.data;
    },

    analyzeResume: async (resumeData: any, jobDescription?: string, resumeId?: string) => {
        const response = await api.post('/resume/analyze', { resumeData, jobDescription, resumeId });
        return response.data;
    },

    regenerateSummary: async (resumeData: any) => {
        const response = await api.post('/resume/regenerate-summary', { resumeData });
        return response.data;
    },
};
