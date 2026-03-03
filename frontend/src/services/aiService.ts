
import api from '@/lib/axios';

/**
 * Service for interacting with AI features
 */
export const aiService = {
    /**
     * Get AI feedback on a DSA problem solution
     * @param questionTitle Title of the problem
     * @param userAnswer The user's answer or code
     * @param currentQuestion The full question description or context
     * @returns The AI's feedback
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
            console.error('AI Service Error:', error);
            throw error;
        }
    }
};
