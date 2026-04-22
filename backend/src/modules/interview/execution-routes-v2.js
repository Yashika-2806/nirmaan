const express = require('express');
const Joi = require('joi');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { apiLimiter } = require('../../core/middleware/rate-limit');
const ApiResponse = require('../../core/utils/response');
const logger = require('../../core/utils/logger');
const ExecutionQueue = require('../../core/code-executor/execution-queue');
const ExecutionResultModel = require('./models/execution-result-model');
const TestCaseModel = require('./models/test-case-model');
const AITestCaseGenerator = require('./ai-test-case-generator');
const DockerSandboxExecutor = require('../../core/code-executor/docker-sandbox');
const Judge0Service = require('../../core/code-executor/judge0-service');

const router = express.Router();

router.use(protect);

// ─── Validation Schemas ──────────────────────────────────────────────────────

const runSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000),
    language: Joi.string().required().lowercase().valid(
        'python', 'java', 'cpp', 'javascript', 'c', 'go', 'rust'
    ),
    questionId: Joi.string().required(),
    async: Joi.boolean().default(false),
});

const submitSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000),
    language: Joi.string().required().lowercase().valid(
        'python', 'java', 'cpp', 'javascript', 'c', 'go', 'rust'
    ),
    questionId: Joi.string().required(),
    sessionId: Joi.string().optional(),
    async: Joi.boolean().default(false),
});

// ─── Synchronous Execution Helper ────────────────────────────────────────────

async function executeCodeSync(sourceCode, language, testCases, isSubmit = false) {
    try {
        // Try Docker first
        const dockerAvailable = await DockerSandboxExecutor.isAvailable();

        let result;
        if (dockerAvailable && testCases.length > 0) {
            result = await DockerSandboxExecutor.executeWithTestCases(
                sourceCode,
                language,
                testCases
            );
        } else {
            // Fallback to Judge0
            result = await Judge0Service.executeWithTestCases(
                sourceCode,
                language,
                testCases
            );
        }

        return {
            success: result.success !== false,
            verdict: result.verdict || 'Execution Error',
            testCases: result.testCases || [],
            summary: {
                totalTests: result.totalCount || testCases.length,
                passedTests: result.passedCount || 0,
                failedTests: result.failedCount || testCases.length,
            },
        };
    } catch (error) {
        logger.error('Sync execution error:', error.message);
        return {
            success: false,
            verdict: 'Execution Error',
            error: error.message,
            testCases: [],
            summary: {
                totalTests: testCases.length,
                passedTests: 0,
                failedTests: testCases.length,
            },
        };
    }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/interview/run
 * Run code against sample test cases
 */
router.post('/run', apiLimiter, validate(runSchema), async (req, res, next) => {
    try {
        const { sourceCode, language, questionId, async: asyncExecution } = req.body;
        const userId = req.user._id;

        logger.info(`Run request: user=${userId}, question=${questionId}, async=${asyncExecution}`);

        // Fetch visible test cases (sample)
        const testCases = await TestCaseModel.getVisibleTestCases(questionId);

        if (!testCases || testCases.length === 0) {
            return ApiResponse.error(
                res,
                'No test cases found for this question. Please generate test cases first.',
                400
            );
        }

        // If async, queue the job
        if (asyncExecution) {
            const queueResult = await ExecutionQueue.queueRun({
                userId,
                questionId,
                sourceCode,
                language,
            });

            return ApiResponse.success(res, {
                jobId: queueResult.jobId,
                status: queueResult.status,
                message: 'Code execution queued. Check status with the jobId.',
            }, 'Job queued');
        }

        // Synchronous execution
        const testCasesData = testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
        }));

        const result = await executeCodeSync(sourceCode, language, testCasesData, false);

        // Save result
        const executionResult = await ExecutionResultModel.create({
            userId,
            questionId,
            type: 'run',
            sourceCode,
            language,
            verdict: result.verdict,
            testCases: result.testCases,
            summary: result.summary,
        });

        return ApiResponse.success(res, {
            executionId: executionResult._id,
            verdict: result.verdict,
            testCases: result.testCases.map(tc => ({
                id: tc.id,
                input: tc.input,
                expected: tc.expected,
                output: tc.output,
                passed: tc.passed,
                error: tc.error,
            })),
            summary: result.summary,
        }, 'Code executed');
    } catch (error) {
        logger.error('Run endpoint error:', error.message);
        next(error);
    }
});

/**
 * POST /api/interview/submit
 * Submit code against all test cases
 */
router.post('/submit', apiLimiter, validate(submitSchema), async (req, res, next) => {
    try {
        const { sourceCode, language, questionId, sessionId, async: asyncExecution } = req.body;
        const userId = req.user._id;

        logger.info(`Submit request: user=${userId}, question=${questionId}, async=${asyncExecution}`);

        // Fetch all test cases
        const testCases = await TestCaseModel.getAllTestCases(questionId);

        if (!testCases || testCases.length === 0) {
            return ApiResponse.error(
                res,
                'No test cases found for this question',
                400
            );
        }

        // If async, queue the job
        if (asyncExecution) {
            const queueResult = await ExecutionQueue.queueSubmit({
                userId,
                questionId,
                sourceCode,
                language,
                sessionId,
            });

            return ApiResponse.success(res, {
                jobId: queueResult.jobId,
                status: queueResult.status,
                message: 'Code submission queued. Check status with the jobId.',
            }, 'Job queued');
        }

        // Synchronous execution
        const testCasesData = testCases.map(tc => ({
            input: tc.input,
            expected: tc.expected,
        }));

        const result = await executeCodeSync(sourceCode, language, testCasesData, true);

        // Save result
        const executionResult = await ExecutionResultModel.create({
            userId,
            questionId,
            sessionId,
            type: 'submit',
            sourceCode,
            language,
            verdict: result.verdict,
            testCases: result.testCases,
            summary: result.summary,
        });

        return ApiResponse.success(res, {
            executionId: executionResult._id,
            verdict: result.verdict,
            testCases: result.testCases.map(tc => ({
                id: tc.id,
                input: tc.input,
                expected: tc.expected,
                output: tc.output,
                passed: tc.passed,
                error: tc.error,
            })),
            summary: result.summary,
            message: getVerdictMessage(result.verdict),
        }, 'Code submitted');
    } catch (error) {
        logger.error('Submit endpoint error:', error.message);
        next(error);
    }
});

/**
 * POST /api/interview/generate-test-cases
 * Generate test cases for a question using AI
 */
router.post('/generate-test-cases', validate(
    Joi.object({
        questionId: Joi.string().required(),
        count: Joi.number().min(1).max(20).default(10),
        includeEdgeCases: Joi.boolean().default(true),
    })
), async (req, res, next) => {
    try {
        const { questionId, count, includeEdgeCases } = req.body;

        logger.info(`Generating test cases for question: ${questionId}`);

        // Fetch question
        const InterviewQuestion = require('./models/interview-question-model');
        const question = await InterviewQuestion.findById(questionId);

        if (!question) {
            return ApiResponse.error(res, 'Question not found', 404);
        }

        // Generate test cases
        const generatedTestCases = await AITestCaseGenerator.generateTestCases(question, {
            count,
            includeEdgeCases,
        });

        // Save test cases
        const savedTestCases = await AITestCaseGenerator.saveGeneratedTestCases(
            questionId,
            generatedTestCases,
            true // Make sample test cases visible
        );

        return ApiResponse.success(res, {
            count: savedTestCases.length,
            testCases: savedTestCases.map(tc => tc.toPublic()),
            message: `Generated and saved ${savedTestCases.length} test cases`,
        }, 'Test cases generated');
    } catch (error) {
        logger.error('Test case generation error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/test-cases/:questionId
 * Get test cases for a question
 */
router.get('/test-cases/:questionId', async (req, res, next) => {
    try {
        const { questionId } = req.params;

        // Get visible test cases only (for students)
        const testCases = await TestCaseModel.getVisibleTestCases(questionId);

        return ApiResponse.success(res, {
            count: testCases.length,
            testCases: testCases.map(tc => tc.toPublic()),
        }, 'Test cases retrieved');
    } catch (error) {
        logger.error('Get test cases error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/execution/:executionId
 * Get execution result
 */
router.get('/execution/:executionId', async (req, res, next) => {
    try {
        const { executionId } = req.params;
        const userId = req.user._id;

        const execution = await ExecutionResultModel.findOne({
            _id: executionId,
            userId, // Ensure user owns this execution
        });

        if (!execution) {
            return ApiResponse.error(res, 'Execution not found', 404);
        }

        return ApiResponse.success(res, execution.toResponse(true), 'Execution retrieved');
    } catch (error) {
        logger.error('Get execution error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/job/:jobId
 * Get queue job status
 */
router.get('/job/:jobId', async (req, res, next) => {
    try {
        const { jobId } = req.params;

        const jobStatus = await ExecutionQueue.getJobStatus(jobId);

        if (!jobStatus) {
            return ApiResponse.error(res, 'Job not found', 404);
        }

        return ApiResponse.success(res, jobStatus, 'Job status retrieved');
    } catch (error) {
        logger.error('Get job status error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/attempts/:questionId
 * Get user's previous attempts
 */
router.get('/attempts/:questionId', async (req, res, next) => {
    try {
        const { questionId } = req.params;
        const userId = req.user._id;

        const attempts = await ExecutionResultModel.getQuestionAttempts(userId, questionId);

        return ApiResponse.success(res, {
            count: attempts.length,
            attempts: attempts.map(a => ({
                _id: a._id,
                type: a.type,
                verdict: a.verdict,
                language: a.language,
                summary: a.summary,
                createdAt: a.createdAt,
            })),
        }, 'Attempts retrieved');
    } catch (error) {
        logger.error('Get attempts error:', error.message);
        next(error);
    }
});

// ─── Helper Functions ────────────────────────────────────────────────────────

function getVerdictMessage(verdict) {
    const messages = {
        'Accepted': '✅ All test cases passed! Excellent solution.',
        'Partial Accept': '⚠️ Some test cases passed. Review failed cases.',
        'Wrong Answer': '❌ Output does not match expected. Check your logic.',
        'Runtime Error': '🔴 Code crashed during execution. Debug the error.',
        'Compilation Error': '🔴 Code did not compile. Fix syntax errors.',
        'Time Limit Exceeded': '⏱️ Code took too long. Optimize your solution.',
        'Memory Limit Exceeded': '💾 Code used too much memory. Optimize space.',
        'Execution Error': '❌ Unexpected error during execution. Try again.',
    };

    return messages[verdict] || 'Execution completed';
}

module.exports = router;
