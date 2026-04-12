const Judge0Service = require('./judge0-service');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

const executorController = {
    /**
     * Execute code on Judge0 (Run/Test endpoint)
     * POST /api/executor/judge0
     * Body: { sourceCode, language, stdin }
     */
    async judge0(req, res, next) {
        try {
            const { sourceCode, language, stdin, languageId } = req.body;

            // Validate required fields
            if (!sourceCode || !sourceCode.trim()) {
                return ApiResponse.error(res, 'Source code is required', 400);
            }

            if (!language && !languageId) {
                return ApiResponse.error(res, 'Language or language ID is required', 400);
            }

            // Use languageId if provided, otherwise get it from language name
            let finalLanguageId = languageId;
            let finalLanguage = language;

            if (!finalLanguageId && finalLanguage) {
                finalLanguageId = Judge0Service.getLanguageId(finalLanguage);
                if (!finalLanguageId) {
                    return ApiResponse.error(res, `Unsupported language: ${finalLanguage}`, 400);
                }
            }

            logger.info(`Executing code: language=${finalLanguage}, languageId=${finalLanguageId}`);

            // Execute code
            const result = await Judge0Service.executeCode(sourceCode, finalLanguage || '', stdin || '');

            if (!result.success && !result.testMode) {
                return ApiResponse.error(res, result.message || 'Code execution failed', 500, result);
            }

            // Return execution result (including testMode flag if applicable)
            return ApiResponse.success(res, result, result.testMode ? '⚠️ Test mode: ' + (result.message || 'Code executed in test mode') : 'Code execution completed');
        } catch (error) {
            logger.error('Judge0 controller error:', error.message);
            next(error);
        }
    },

    /**
     * Run code with sample input
     * POST /api/executor/run
     * Body: { sourceCode, language, stdin }
     */
    async run(req, res, next) {
        try {
            const { sourceCode, language, stdin } = req.body;

            if (!sourceCode || !sourceCode.trim()) {
                return ApiResponse.error(res, 'Source code is required', 400);
            }

            if (!language) {
                return ApiResponse.error(res, 'Language is required', 400);
            }

            logger.info(`Running code: language=${language}`);

            const result = await Judge0Service.executeCode(sourceCode, language, stdin || '');

            if (!result.success) {
                return ApiResponse.error(res, result.message || 'Code execution failed', 500, result);
            }

            return ApiResponse.success(res, result, 'Code executed successfully');
        } catch (error) {
            logger.error('Run controller error:', error.message);
            next(error);
        }
    },

    /**
     * Submit code against test cases
     * POST /api/executor/submit
     * Body: { sourceCode, language, testCases: [{input, expected}, ...] }
     */
    async submit(req, res, next) {
        try {
            const { sourceCode, language, testCases } = req.body;

            if (!sourceCode || !sourceCode.trim()) {
                return ApiResponse.error(res, 'Source code is required', 400);
            }

            if (!language) {
                return ApiResponse.error(res, 'Language is required', 400);
            }

            if (!Array.isArray(testCases) || testCases.length === 0) {
                return ApiResponse.error(res, 'Test cases must be a non-empty array', 400);
            }

            logger.info(`Submitting code: language=${language}, test_cases=${testCases.length}`);

            const result = await Judge0Service.executeWithTestCases(sourceCode, language, testCases);

            if (!result.success) {
                return ApiResponse.error(res, result.message || 'Submission failed', 500, result);
            }

            return ApiResponse.success(res, result, 'Submission evaluated');
        } catch (error) {
            logger.error('Submit controller error:', error.message);
            next(error);
        }
    },
};

module.exports = executorController;
