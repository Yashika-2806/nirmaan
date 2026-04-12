import api from '@/lib/axios';

/**
 * Service for interacting with AI features
 */
export const aiService = {
    /**
     * Get AI feedback on a DSA problem solution (legacy endpoint)
     * @param questionTitle Title of the problem
     * @param userAnswer The user's answer or code
     * @param currentQuestion The full question description or context
     * @returns The AI's feedback in { success, feedback } format
     */
    generateFeedback: async (questionTitle: string, userAnswer: string, currentQuestion: string) => {
        try {
            const response = await api.post('/ai/review', {
                questionTitle,
                userAnswer,
                currentQuestion
            });

            return response.data;
        } catch (error) {
            console.error('AI Service Error (generateFeedback):', error);
            throw error;
        }
    },

    /**
     * Get structured DSA solution analysis (new improved endpoint)
     * Returns detailed interview-ready feedback with:
     * - Approach summary
     * - Correctness evaluation
     * - Time/Space complexity
     * - Strengths and improvements
     * - Optimal solution
     * - Edge cases
     * - Interview tips
     * 
     * @param problemTitle Title of the problem
     * @param problemDescription Full problem description
     * @param code User's solution code
     * @param language Programming language (python, javascript, java, cpp, nodejs, typescript)
     * @returns Structured analysis object with detailed feedback
     */
    analyzeDSASolution: async (
        problemTitle: string,
        problemDescription: string,
        code: string,
        language: string
    ) => {
        try {
            const response = await api.post('/dsa/analyze', {
                problemTitle,
                problemDescription,
                code,
                language
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Analysis failed');
            }

            return response.data;
        } catch (error) {
            console.error('DSA Analysis Error:', error);
            throw error;
        }
    }
};

