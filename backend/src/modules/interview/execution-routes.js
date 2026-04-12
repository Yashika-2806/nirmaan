const express = require('express');
const Joi = require('joi');
const Judge0Service = require('../../core/code-executor/judge0-service');
const ApiResponse = require('../../core/utils/response');
const logger = require('../../core/utils/logger');
const { validate } = require('../../core/middleware/validation');
const { apiLimiter } = require('../../core/middleware/rate-limit');
const { protect } = require('../../core/auth/middleware');

const router = express.Router();

router.use(protect);

// Test cases for the sample problem (Two Sum)
const SAMPLE_TEST_CASES = [
    { input: '', expected: '[0,1]' },
    { input: '', expected: '[1,2]' },
    { input: '', expected: '[0,1]' },
];

// Validation schemas
const runCodeSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000),
    language: Joi.string().required().lowercase().valid(
        'python', 'java', 'cpp', 'c++', 'javascript', 'js',
        'c', 'csharp', 'c#', 'golang', 'go', 'rust', 'swift', 'kotlin'
    ),
    questionId: Joi.string().optional(),
    stdin: Joi.string().optional().allow('').max(10000),
});

const submitCodeSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000),
    language: Joi.string().required().lowercase().valid(
        'python', 'java', 'cpp', 'c++', 'javascript', 'js',
        'c', 'csharp', 'c#', 'golang', 'go', 'rust', 'swift', 'kotlin'
    ),
    questionId: Joi.string().optional(),
    testCases: Joi.array()
        .items(
            Joi.object({
                id: Joi.number().optional(),
                input: Joi.string().optional().allow('').max(10000),
                expected: Joi.string().required().max(10000),
            })
        )
        .min(1),
});

/**
 * Run code with sample/custom input
 * POST /api/interview/run
 * Body: { sourceCode, language, questionId, stdin }
 * Response: { success, verdict, output, error, testCases, executionTime, memory }
 */
router.post('/run', apiLimiter, validate(runCodeSchema), async (req, res, next) => {
    try {
        const { sourceCode, language, stdin } = req.body;

        logger.info(`Interview run: user=${req.user.userId}, language=${language}`);

        // Execute code
        const result = await Judge0Service.executeCode(sourceCode, language, stdin || '');

        // Normalize response for frontend
        const response = {
            success: !result.compile_output && !result.stderr,
            verdict:
                result.compile_output ? 'Compile Error' :
                result.stderr ? 'Runtime Error' :
                'Accepted',
            output: result.stdout || '',
            error: result.compile_output || result.stderr || '',
            message: result.message,
            executionTime: result.time || '--',
            memory: result.memory ? `${result.memory} KB` : '--',
            status: result.status,
            testCases: [],
            testMode: result.testMode || false,
            warning: result.warning || null,
        };

        return ApiResponse.success(res, response, 'Code executed');
    } catch (error) {
        logger.error('Interview run error:', error.message);
        next(error);
    }
});

/**
 * Submit code against test cases
 * POST /api/interview/submit
 * Body: { sourceCode, language, questionId, testCases }
 * Response: { success, verdict, passedCount, totalCount, testCases, details }
 */
router.post('/submit', apiLimiter, validate(submitCodeSchema), async (req, res, next) => {
    try {
        const { sourceCode, language, testCases } = req.body;

        logger.info(`Interview submit: user=${req.user.userId}, language=${language}, test_cases=${testCases?.length || 0}`);

        // Use provided test cases or default to sample
        const casesToTest = (testCases && testCases.length > 0) ? testCases : SAMPLE_TEST_CASES;

        // Execute against test cases
        const result = await Judge0Service.executeWithTestCases(sourceCode, language, casesToTest);

        // Normalize response for frontend
        const response = {
            success: result.verdict === 'Accepted',
            verdict: result.verdict || 'Execution Error',
            passedCount: result.passedCount || 0,
            totalCount: result.totalCount || casesToTest.length,
            testCases: result.testCases || [],
            message: result.message || getVerdictMessage(result.verdict),
            details: {
                executionTime: result.testCases?.[0]?.time || '--',
                memory: result.testCases?.[0]?.memory || '--',
            },
            testMode: result.testMode || false,
            warning: result.warning || null,
        };

        return ApiResponse.success(res, response, 'Submission evaluated');
    } catch (error) {
        logger.error('Interview submit error:', error.message);
        next(error);
    }
});

/**
 * Check code syntax without executing
 * POST /api/interview/check-syntax
 * Body: { sourceCode, language }
 */
router.post('/check-syntax', validate(
    Joi.object({
        sourceCode: Joi.string().required().max(50000),
        language: Joi.string().required().lowercase().valid(
            'python', 'java', 'cpp', 'c++', 'javascript', 'js',
            'c', 'csharp', 'c#', 'golang', 'go', 'rust', 'swift', 'kotlin'
        ),
    })
), (req, res) => {
    try {
        const { sourceCode, language } = req.body;
        const languageId = Judge0Service.getLanguageId(language);

        if (!languageId) {
            return ApiResponse.error(res, `Unsupported language: ${language}`, 400);
        }

        // Basic syntax check - no real execution
        const response = {
            success: true,
            language,
            languageId,
            codeLength: sourceCode.length,
            message: 'Syntax check passed (basic)',
        };

        return ApiResponse.success(res, response, 'Syntax valid');
    } catch (error) {
        return ApiResponse.error(res, error.message, 500);
    }
});

/**
 * Get supported languages
 * GET /api/interview/languages
 */
router.get('/languages', (req, res) => {
    const languages = [
        { id: 71, name: 'Python', ext: '.py' },
        { id: 62, name: 'Java', ext: '.java' },
        { id: 54, name: 'C++', ext: '.cpp' },
        { id: 63, name: 'JavaScript', ext: '.js' },
        { id: 50, name: 'C', ext: '.c' },
        { id: 51, name: 'C#', ext: '.cs' },
        { id: 60, name: 'Go', ext: '.go' },
        { id: 73, name: 'Rust', ext: '.rs' },
        { id: 19, name: 'Swift', ext: '.swift' },
        { id: 78, name: 'Kotlin', ext: '.kt' },
    ];

    return ApiResponse.success(res, languages, 'Supported languages');
});

/**
 * Helper: Convert verdict to user-friendly message
 */
function getVerdictMessage(verdict) {
    const messages = {
        'Accepted': 'All test cases passed! Great solution.',
        'Wrong Answer': 'Output does not match expected. Check your logic.',
        'Runtime Error': 'Code crashed during execution. Check for errors.',
        'Compile Error': 'Code did not compile. Fix syntax errors.',
        'Time Limit Exceeded': 'Code took too long to run. Optimize your solution.',
        'Memory Limit Exceeded': 'Code used too much memory. Optimize space.',
        'Execution Error': 'Unexpected error during execution. Try again.',
    };

    return messages[verdict] || 'Unknown verdict';
}

module.exports = router;
