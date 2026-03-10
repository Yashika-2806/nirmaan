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
    difficulty?: 'easy' | 'medium' | 'hard';
    options: { A: string; B: string; C: string; D: string };
    optionReasons?: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    feedback: string;
}

export interface MarkedQuestion {
    id: number;
    question: string;
    marks: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    topic: string;
    focusPoints?: string[];
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
            headers: { 'Content-Type': undefined }, // let browser/axios set multipart boundary automatically
        });
        return res.data.data;
    },

    generateQuiz: (
        sessionId: string,
        options: { numQuestions?: number; difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' } = {}
    ): Promise<{ questions: QuizQuestion[] }> =>
        api.post('/pdf/quiz', {
            sessionId,
            numQuestions: options.numQuestions ?? 10,
            difficulty: options.difficulty ?? 'mixed',
        }).then(r => r.data.data),

    generateMarkedQuestions: (
        sessionId: string,
        options: {
            numQuestions?: number;
            difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
            markDistribution?: { '2': number; '3': number; '5': number; '8': number; '10': number };
        } = {}
    ): Promise<{ questions: MarkedQuestion[] }> =>
        api.post('/pdf/marked-questions', {
            sessionId,
            numQuestions: options.numQuestions ?? 6,
            difficulty: options.difficulty ?? 'mixed',
            markDistribution: options.markDistribution ?? { '2': 0, '3': 0, '5': 0, '8': 0, '10': 0 },
        }).then(r => r.data.data),

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
