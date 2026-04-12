const DSAProblem = require('./model');
const dsaAI = require('./ai-wrapper');
const dsaAnalysisFormatter = require('./analysis-formatter');
const { AppError } = require('../../core/middleware/error');
const { ERROR_CODES } = require('../../config/constants');

class DSAService {
    /**
     * Get problem explanation
     */
    async explainProblem(problemStatement, userId) {
        const explanation = await dsaAI.explainProblem(problemStatement, userId);
        return { explanation };
    }

    /**
     * Get solution approach
     */
    async getSolutionApproach(problemStatement, userId) {
        const approach = await dsaAI.generateApproach(problemStatement, userId);
        return { approach };
    }

    /**
     * Submit and analyze solution
     */
    async submitSolution(userId, submissionData) {
        const { problemId, title, difficulty, topics, code, language } = submissionData;

        // Get AI analysis
        const analysis = await dsaAI.analyzeSolution(
            title,
            code,
            language,
            userId
        );

        // Find or create problem record
        let problemRecord = await DSAProblem.findOne({ userId, problemId });

        if (!problemRecord) {
            problemRecord = new DSAProblem({
                userId,
                problemId,
                title,
                difficulty,
                topics,
            });
        }

        // Add attempt
        problemRecord.attempts.push({
            code,
            language,
            analysis: {
                correctness: analysis,
                feedback: analysis,
            },
        });

        // Check if solved (simple heuristic - can be improved)
        if (analysis.toLowerCase().includes('correct') ||
            analysis.toLowerCase().includes('optimal')) {
            problemRecord.solved = true;
            problemRecord.solvedAt = new Date();
        }

        await problemRecord.save();

        return {
            analysis,
            solved: problemRecord.solved,
            attemptCount: problemRecord.attempts.length,
        };
    }

    /**
     * Analyze solution with structured interview-ready feedback
     * This is the new improved endpoint that returns comprehensive structured analysis
     * 
     * @param {string} problemTitle - Title of the problem
     * @param {string} problemDescription - Full problem description
     * @param {string} code - User's solution code
     * @param {string} language - Programming language
     * @param {string} userId - User ID for logging
     * @returns {Promise<object>} - Structured analysis object
     */
    async analyzeSolutionStructured(problemTitle, problemDescription, code, language, userId) {
        console.log(`[DSAService] Starting structured analysis for "${problemTitle}"`);
        
        try {
            // Get structured analysis from formatter
            const analysis = await dsaAnalysisFormatter.analyzeSolution(
                problemTitle,
                problemDescription,
                code,
                language,
                30000 // 30 second timeout
            );

            console.log(`[DSAService] ✅ Analysis complete for user ${userId}`);

            // Determine if solution is correct based on analysis
            const isCorrect = analysis.correctness === 'Correct' || 
                            analysis.rating === 'Strong' || 
                            analysis.rating === 'Good';

            return {
                success: true,
                analysis,
                isCorrect,
                displayText: dsaAnalysisFormatter.formatForDisplay(analysis),
            };
        } catch (error) {
            console.error(`[DSAService] ❌ Analysis failed:`, error.message);

            throw new AppError(
                `Unable to analyze your solution. ${error.message}. Please try again.`,
                503,
                ERROR_CODES.AI_SERVICE_ERROR
            );
        }
    }

    /**
     * Get user's DSA analytics
     */
    async getUserAnalytics(userId) {
        const problems = await DSAProblem.find({ userId });

        const analytics = {
            totalProblems: problems.length,
            solvedProblems: problems.filter(p => p.solved).length,
            byDifficulty: {
                easy: problems.filter(p => p.difficulty === 'easy').length,
                medium: problems.filter(p => p.difficulty === 'medium').length,
                hard: problems.filter(p => p.difficulty === 'hard').length,
            },
            solvedByDifficulty: {
                easy: problems.filter(p => p.difficulty === 'easy' && p.solved).length,
                medium: problems.filter(p => p.difficulty === 'medium' && p.solved).length,
                hard: problems.filter(p => p.difficulty === 'hard' && p.solved).length,
            },
            topicDistribution: this.getTopicDistribution(problems),
            recentActivity: problems.slice(-10).reverse(),
        };

        return analytics;
    }

    /**
     * Generate follow-up questions
     */
    async getFollowUpQuestions(problemStatement, difficulty, userId) {
        const questions = await dsaAI.generateFollowUp(problemStatement, difficulty, userId);
        return { questions };
    }

    /**
     * Helper: Get topic distribution
     */
    getTopicDistribution(problems) {
        const distribution = {};

        problems.forEach(problem => {
            problem.topics?.forEach(topic => {
                distribution[topic] = (distribution[topic] || 0) + 1;
            });
        });

        return Object.entries(distribution)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count);
    }
}

module.exports = new DSAService();
