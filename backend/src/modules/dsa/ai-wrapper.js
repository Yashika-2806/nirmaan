const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiKeyManager = require('../../core/ai-key-manager/manager');
const logger = require('../../core/utils/logger');
const { AppError } = require('../../core/middleware/error');
const { ERROR_CODES, MODULES } = require('../../config/constants');

class DSAAIWrapper {
    /**
     * Generate AI response for DSA queries
     * @param {string} prompt - User prompt
     * @param {string} userId - User ID for logging
     * @returns {Promise<string>} - AI response
     */
    async generateResponse(prompt, userId) {
        const startTime = Date.now();
        let selectedKey = null;

        try {
            // Get available AI key
            selectedKey = await aiKeyManager.getKey(MODULES.DSA);

            // Initialize Gemini
            const genAI = new GoogleGenerativeAI(selectedKey.apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            // Generate response
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Estimate tokens (rough estimate: 1 token ≈ 4 characters)
            const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
            const responseTime = Date.now() - startTime;

            // Log usage
            await aiKeyManager.logUsage({
                keyId: selectedKey._id,
                userId,
                module: MODULES.DSA,
                endpoint: 'generateResponse',
                tokensUsed,
                responseTime,
                success: true,
            });

            return text;
        } catch (error) {
            logger.error('DSA AI Error:', error);

            // Log failure
            if (selectedKey) {
                await aiKeyManager.logUsage({
                    keyId: selectedKey._id,
                    userId,
                    module: MODULES.DSA,
                    endpoint: 'generateResponse',
                    responseTime: Date.now() - startTime,
                    success: false,
                    error: {
                        code: error.code || 'UNKNOWN',
                        message: error.message,
                    },
                });

                await aiKeyManager.handleFailure(selectedKey._id, error);
            }

            throw new AppError(
                'AI service temporarily unavailable. Please try again.',
                503,
                ERROR_CODES.AI_SERVICE_ERROR
            );
        }
    }

    /**
     * Generate problem explanation
     */
    async explainProblem(problemStatement, userId) {
        const prompt = `As a DSA expert, explain this problem in simple terms with examples:

Problem: ${problemStatement}

Provide:
1. Problem understanding
2. Key concepts involved
3. Example walkthrough
4. Common pitfalls`;

        return await this.generateResponse(prompt, userId);
    }

    /**
     * Generate solution approach
     */
    async generateApproach(problemStatement, userId) {
        const prompt = `Provide a step-by-step approach to solve this DSA problem:

Problem: ${problemStatement}

Include:
1. Brute force approach
2. Optimized approach
3. Time and space complexity
4. Pseudocode`;

        return await this.generateResponse(prompt, userId);
    }

    /**
     * Analyze user's solution
     */
    async analyzeSolution(problemStatement, userCode, language, userId) {
        const prompt = `Analyze this ${language} solution for the given problem:

Problem: ${problemStatement}

User's Code:
\`\`\`${language}
${userCode}
\`\`\`

Provide:
1. Correctness analysis
2. Time and space complexity
3. Code quality feedback
4. Optimization suggestions
5. Edge cases to consider`;

        return await this.generateResponse(prompt, userId);
    }

    /**
     * Generate follow-up questions
     */
    async generateFollowUp(problemStatement, difficulty, userId) {
        const prompt = `Generate 3 follow-up questions based on this problem:

Problem: ${problemStatement}
Difficulty: ${difficulty}

Questions should:
1. Build upon the same concepts
2. Increase in difficulty progressively
3. Test different aspects of the algorithm`;

        return await this.generateResponse(prompt, userId);
    }
}

module.exports = new DSAAIWrapper();
