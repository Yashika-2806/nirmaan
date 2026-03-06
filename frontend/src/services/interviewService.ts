import api from '@/lib/axios';

// All methods return r.data.data — the actual payload inside { success, message, data: {...} }
export const interviewService = {
    startSession: (data: { company: string; role: string; round: string; experienceLevel: string; count: number }) =>
        api.post('/interview/start', data).then(r => r.data.data),

    evaluateAnswer: (data: { sessionId: string; questionIndex: number; answer: string }) =>
        api.post('/interview/evaluate', data).then(r => r.data.data),

    completeSession: (data: { sessionId: string; durationSeconds: number }) =>
        api.post('/interview/complete', data).then(r => r.data.data),

    getSessions: () =>
        api.get('/interview/sessions').then(r => r.data.data),

    getSession: (id: string) =>
        api.get(`/interview/sessions/${id}`).then(r => r.data.data),

    deleteSession: (id: string) =>
        api.delete(`/interview/sessions/${id}`).then(r => r.data.data),

    checkPlagiarism: (data: { question: string; answer: string }) =>
        api.post('/interview/plagiarism-check', data).then(r => r.data.data) as Promise<{ isPlagiarized: boolean; confidence: 'low' | 'medium' | 'high'; reason: string }>,
};
