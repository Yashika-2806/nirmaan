import api from '@/lib/axios';

export interface PDFUploadResult {
    sessionId: string;
    originalName: string;
    pageCount: number;
    wordCount: number;
}

export interface QuizQuestion {
    id: number;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    feedback: string;
}

export interface MarkedQuestion {
    id: number;
    question: string;
    marks: number;
    topic: string;
    expectedAnswer: string;
}

export interface GradingResult {
    score: number;
    percentage: number;
    verdict: 'Excellent' | 'Good' | 'Partial' | 'Poor' | 'No Attempt';
    feedback: string;
    keyPointsCovered: string[];
    keyPointsMissed: string[];
}

export const pdfService = {
    upload: async (file: File): Promise<PDFUploadResult> => {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await api.post('/pdf/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data;
    },

    generateQuiz: (sessionId: string, numQuestions = 10): Promise<{ questions: QuizQuestion[] }> =>
        api.post('/pdf/quiz', { sessionId, numQuestions }).then(r => r.data.data),

    generateMarkedQuestions: (sessionId: string, numQuestions = 6): Promise<{ questions: MarkedQuestion[] }> =>
        api.post('/pdf/marked-questions', { sessionId, numQuestions }).then(r => r.data.data),

    gradeAnswer: (data: {
        question: string;
        marks: number;
        expectedAnswer: string;
        studentAnswer: string;
    }): Promise<GradingResult> =>
        api.post('/pdf/grade', data).then(r => r.data.data),

    getSessions: () =>
        api.get('/pdf/sessions').then(r => r.data.data),
};
