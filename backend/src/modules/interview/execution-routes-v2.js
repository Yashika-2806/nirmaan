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

// ─── Output Normalization ─────────────────────────────────────────────────────

/**
 * Normalize execution output for comparison.
 * - Trim whitespace
 * - Normalize line endings
 * - Lowercase
 * - Float tolerance (±1e-6)
 */
function normalizeOutput(raw) {
    return (raw || '').replace(/\r\n/g, '\n').trim().toLowerCase();
}

function outputsMatch(got, expected) {
    const a = normalizeOutput(got);
    const b = normalizeOutput(expected);
    if (a === b) return true;

    // Multi-line: compare line by line
    const aLines = a.split('\n');
    const bLines = b.split('\n');
    if (aLines.length === bLines.length) {
        return aLines.every((line, i) => {
            if (line === bLines[i]) return true;
            // Float tolerance
            const fa = parseFloat(line), fb = parseFloat(bLines[i]);
            if (!isNaN(fa) && !isNaN(fb) && Math.abs(fa - fb) < 1e-6) return true;
            return false;
        });
    }
    return false;
}

/**
 * Map raw execution result to canonical verdict enum.
 */
function mapVerdict(result) {
    if (!result) return 'Execution Error';
    const raw = (result.verdict || result.status || '').toLowerCase();
    if (raw.includes('time limit') || raw.includes('tle'))   return 'Time Limit Exceeded';
    if (raw.includes('memory limit') || raw.includes('mle')) return 'Memory Limit Exceeded';
    if (raw.includes('compile') || raw.includes('compilation')) return 'Compilation Error';
    if (raw.includes('runtime') || raw.includes('runtime error')) return 'Runtime Error';
    if (raw.includes('accepted') || raw === 'accepted')       return 'Accepted';
    if (raw.includes('wrong'))                                 return 'Wrong Answer';
    if (raw.includes('partial'))                               return 'Partial Accept';
    if (result.success === false)                              return 'Execution Error';
    return result.verdict || 'Execution Error';
}

// ─── Synchronous Execution Helper ─────────────────────────────────────────────

/**
 * Execute code against test cases with:
 * - Docker-first, Judge0 fallback
 * - Parallel execution (max 4 concurrent)
 * - Normalized output comparison
 * - Structured verdicts
 */
async function executeCodeSync(sourceCode, language, testCases, isSubmit = false) {
    try {
        const dockerAvailable = await DockerSandboxExecutor.isAvailable();

        let rawResult;
        if (dockerAvailable && testCases.length > 0) {
            rawResult = await DockerSandboxExecutor.executeWithTestCases(
                sourceCode, language, testCases
            );
        } else {
            rawResult = await Judge0Service.executeWithTestCases(
                sourceCode, language, testCases
            );
        }

        // Normalize per-case results
        const normalizedCases = (rawResult.testCases || []).map((tc, idx) => {
            const matched = outputsMatch(tc.output, tc.expected);
            return {
                id:       idx + 1,
                input:    tc.input     || testCases[idx]?.input     || '',
                expected: tc.expected  || testCases[idx]?.expected  || '',
                output:   tc.output    || '',
                passed:   matched,
                error:    tc.error     || '',
                time:     tc.time      || 0,
                memory:   tc.memory    || 0,
                verdict:  matched ? 'Accepted' : (tc.error ? 'Runtime Error' : 'Wrong Answer'),
            };
        });

        // For cases not returned by executor, mark as error
        for (let i = normalizedCases.length; i < testCases.length; i++) {
            normalizedCases.push({
                id: i + 1,
                input:    testCases[i].input,
                expected: testCases[i].expected,
                output:   '',
                passed:   false,
                error:    'No output produced',
                time:     0,
                memory:   0,
                verdict:  'Runtime Error',
            });
        }

        const passedCount  = normalizedCases.filter(tc => tc.passed).length;
        const failedCount  = normalizedCases.length - passedCount;
        const allPassed    = passedCount === normalizedCases.length;
        const anyTLE       = normalizedCases.some(tc => tc.verdict === 'Time Limit Exceeded');
        const anyMLE       = normalizedCases.some(tc => tc.verdict === 'Memory Limit Exceeded');

        // Override verdict if execution-level error
        let finalVerdict = mapVerdict(rawResult);
        if (finalVerdict === 'Accepted' && !allPassed) {
            finalVerdict = 'Wrong Answer';
        }
        if (anyTLE) finalVerdict = 'Time Limit Exceeded';
        if (anyMLE) finalVerdict = 'Memory Limit Exceeded';

        return {
            success: allPassed,
            verdict: finalVerdict,
            stdout:  rawResult.stdout  || '',
            stderr:  rawResult.stderr  || rawResult.error || '',
            compileOutput: rawResult.compileOutput || '',
            testCases: normalizedCases,
            summary: {
                totalTests:  normalizedCases.length,
                passedTests: passedCount,
                failedTests: failedCount,
                passRate:    normalizedCases.length > 0
                    ? Math.round((passedCount / normalizedCases.length) * 100)
                    : 0,
            },
        };
    } catch (error) {
        logger.error('Sync execution error:', error.message);
        // Structured error verdict
        let verdict = 'Execution Error';
        if (/compile/i.test(error.message)) verdict = 'Compilation Error';
        if (/time/i.test(error.message))    verdict = 'Time Limit Exceeded';
        if (/memory/i.test(error.message))  verdict = 'Memory Limit Exceeded';

        return {
            success: false,
            verdict,
            stdout:  '',
            stderr:  error.message,
            error:   error.message,
            testCases: testCases.map((tc, i) => ({
                id:       i + 1,
                input:    tc.input,
                expected: tc.expected,
                output:   '',
                passed:   false,
                error:    error.message,
                time:     0,
                memory:   0,
                verdict,
            })),
            summary: {
                totalTests:  testCases.length,
                passedTests: 0,
                failedTests: testCases.length,
                passRate:    0,
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
        const userId = req.user.userId || req.user._id;

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

        const executionResult = await ExecutionResultModel.create({
            userId,
            questionId,
            type: 'run',
            sourceCode,
            language,
            verdict: result.verdict,
            stdout:  result.stdout,
            stderr:  result.stderr,
            compileOutput: result.compileOutput,
            testCases: result.testCases,
            summary: result.summary,
        });

        return ApiResponse.success(res, {
            executionId:   executionResult._id,
            verdict:       result.verdict,
            stdout:        result.stdout,
            stderr:        result.stderr,
            compileOutput: result.compileOutput || '',
            testCases: result.testCases.map(tc => ({
                id:       tc.id,
                input:    tc.input,
                expected: tc.expected,
                output:   tc.output,
                passed:   tc.passed,
                error:    tc.error,
                time:     tc.time,
                memory:   tc.memory,
                verdict:  tc.verdict,
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
        const userId = req.user.userId || req.user._id;

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

        const executionResult = await ExecutionResultModel.create({
            userId,
            questionId,
            sessionId,
            type: 'submit',
            sourceCode,
            language,
            verdict: result.verdict,
            stdout:  result.stdout,
            stderr:  result.stderr,
            compileOutput: result.compileOutput,
            testCases: result.testCases,
            summary: result.summary,
        });

        // Only expose sample (visible) test case results to prevent cheating
        const sampleCaseIds = new Set(
            testCases
                .filter((_, i) => i < 3) // first 3 are visible
                .map((_, i) => i + 1)
        );

        return ApiResponse.success(res, {
            executionId:   executionResult._id,
            verdict:       result.verdict,
            stdout:        result.stdout,
            stderr:        result.stderr,
            compileOutput: result.compileOutput || '',
            // Return all test case pass/fail but redact input/expected for hidden ones
            testCases: result.testCases.map(tc => ({
                id:       tc.id,
                input:    sampleCaseIds.has(tc.id) ? tc.input    : '[hidden]',
                expected: sampleCaseIds.has(tc.id) ? tc.expected : '[hidden]',
                output:   sampleCaseIds.has(tc.id) ? tc.output   : (tc.passed ? '[correct]' : '[wrong]'),
                passed:   tc.passed,
                error:    sampleCaseIds.has(tc.id) ? tc.error     : (tc.error ? '[error]' : ''),
                time:     tc.time,
                memory:   tc.memory,
                verdict:  tc.verdict,
                hidden:   !sampleCaseIds.has(tc.id),
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

        // Split: first 3 are sample (visible), rest are hidden
        const SAMPLE_COUNT = Math.min(3, generatedTestCases.length);
        const sampleCases  = generatedTestCases.slice(0, SAMPLE_COUNT);
        const hiddenCases  = generatedTestCases.slice(SAMPLE_COUNT);

        const savedSample = await AITestCaseGenerator.saveGeneratedTestCases(questionId, sampleCases, true);   // visible=true
        const savedHidden = hiddenCases.length > 0
            ? await AITestCaseGenerator.saveGeneratedTestCases(questionId, hiddenCases, false)  // visible=false
            : [];

        const totalSaved = savedSample.length + savedHidden.length;

        return ApiResponse.success(res, {
            count: totalSaved,
            sampleCount: savedSample.length,
            hiddenCount: savedHidden.length,
            testCases: savedSample.map(tc => tc.toPublic()), // Only expose sample cases
            message: `Generated ${totalSaved} test cases (${savedSample.length} sample, ${savedHidden.length} hidden)`,
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
        const userId = req.user.userId || req.user._id;

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
        const userId = req.user.userId || req.user._id;

        const jobStatus = await ExecutionQueue.getJobStatus(jobId);

        if (!jobStatus) {
            return ApiResponse.error(res, 'Job not found', 404);
        }

        // Ownership check: job data must belong to requesting user
        if (jobStatus.data && jobStatus.data.userId &&
            String(jobStatus.data.userId) !== String(userId)) {
            return ApiResponse.error(res, 'Access denied', 403);
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
        const userId = req.user.userId || req.user._id;

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

/**
 * GET /api/interview/problems
 * List all interview problems with pagination and filters
 */
router.get('/problems', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, difficulty, category, status } = req.query;
        const userId = req.user.userId || req.user._id;
        
        const InterviewQuestion = require('./models/interview-question-model');
        
        let filter = {};
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;
        
        const skip = (page - 1) * limit;
        
        const problems = await InterviewQuestion.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await InterviewQuestion.countDocuments(filter);
        
        // Get user's attempt status for each problem
        const problemsWithStatus = await Promise.all(problems.map(async (p) => {
            const attempts = await ExecutionResultModel.find({
                userId,
                questionId: p._id
            }).sort({ createdAt: -1 }).limit(1);
            
            const lastAttempt = attempts[0];
            return {
                _id: p._id,
                title: p.title,
                description: p.description,
                difficulty: p.difficulty,
                category: p.category,
                tags: p.tags || [],
                accepted: p.accepted_count || 0,
                submissions: p.submission_count || 0,
                testCaseCount: p.test_cases_count || 0,
                lastAttempt: lastAttempt ? {
                    verdict: lastAttempt.verdict,
                    createdAt: lastAttempt.createdAt
                } : null
            };
        }));
        
        return ApiResponse.success(res, {
            problems: problemsWithStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }, 'Problems retrieved');
    } catch (error) {
        logger.error('Get problems error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/problems/search
 * Search problems by keyword
 */
router.get('/problems/search', async (req, res, next) => {
    try {
        const { q, difficulty, category } = req.query;
        
        if (!q || q.length < 2) {
            return ApiResponse.error(res, 'Search query must be at least 2 characters', 400);
        }
        
        const InterviewQuestion = require('./models/interview-question-model');
        
        const filter = {
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ]
        };
        
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;
        
        const results = await InterviewQuestion.find(filter)
            .limit(50)
            .select('_id title difficulty category tags accepted_count submission_count');
        
        return ApiResponse.success(res, {
            results,
            count: results.length
        }, 'Search completed');
    } catch (error) {
        logger.error('Search problems error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/problems/:id
 * Get detailed problem information with examples
 */
router.get('/problems/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const InterviewQuestion = require('./models/interview-question-model');
        const problem = await InterviewQuestion.findById(id);
        
        if (!problem) {
            return ApiResponse.error(res, 'Problem not found', 404);
        }
        
        const testCasesCount = await TestCaseModel.countDocuments({
            questionId: id,
            isVisible: true
        });
        
        return ApiResponse.success(res, {
            _id: problem._id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            category: problem.category,
            tags: problem.tags || [],
            constraints: problem.constraints || [],
            functionSignature: problem.functionSignature,
            examples: problem.examples || [],
            testCaseCount: testCasesCount,
            accepted: problem.accepted_count || 0,
            submissions: problem.submission_count || 0,
            starterCode: {
                python: problem.starter_code?.python || '',
                java: problem.starter_code?.java || '',
                cpp: problem.starter_code?.cpp || '',
                javascript: problem.starter_code?.javascript || ''
            }
        }, 'Problem retrieved');
    } catch (error) {
        logger.error('Get problem error:', error.message);
        next(error);
    }
});

/**
 * POST /api/interview/problems/:id/ai-feedback
 * Get AI-powered feedback on submitted code
 */
router.post('/problems/:id/ai-feedback', validate(
    Joi.object({
        sourceCode: Joi.string().required().max(50000),
        language: Joi.string().required().valid('python', 'java', 'cpp', 'javascript', 'c', 'go', 'rust'),
        verdict: Joi.string().required(),
        executionId: Joi.string().optional()
    })
), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sourceCode, language, verdict, executionId } = req.body;
        const userId = req.user.userId || req.user._id;
        
        const InterviewQuestion = require('./models/interview-question-model');
        const problem = await InterviewQuestion.findById(id);
        
        if (!problem) {
            return ApiResponse.error(res, 'Problem not found', 404);
        }
        
        // Use AI to analyze code
        const GeminiService = require('../../core/ai/gemini-service');
        
        const feedbackPrompt = `
Analyze this ${language} code submission for the problem "${problem.title}".
The submission verdict is: ${verdict}

Problem Description:
${problem.description}

Submitted Code:
\`\`\`${language}
${sourceCode}
\`\`\`

Provide structured feedback in this format:
1. Overall Assessment: [1-2 sentences]
2. Strengths: [bullet points]
3. Areas for Improvement: [bullet points]
4. Time Complexity: [O(...)]
5. Space Complexity: [O(...)]
6. Suggested Optimizations: [if applicable]
7. Next Steps: [learning recommendations]
        `;
        
        const feedback = await GeminiService.generateContent(feedbackPrompt);
        
        return ApiResponse.success(res, {
            feedback,
            verdict,
            sourceCode: sourceCode.substring(0, 100) + '...',
            language
        }, 'Feedback generated');
    } catch (error) {
        logger.error('AI Feedback error:', error.message);
        next(error);
    }
});

/**
 * GET /api/interview/leaderboard
 * Get leaderboard with user rankings
 */
router.get('/leaderboard', async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;
        const userId = req.user.userId || req.user._id;
        const User = require('../../core/auth/model');

        // Get accepted submission counts per user with user info
        const leaderboard = await ExecutionResultModel.aggregate([
            { $match: { verdict: 'Accepted', type: 'submit' } },
            { $group: {
                _id: '$userId',
                acceptedCount: { $sum: 1 },
                lastSubmission: { $max: '$createdAt' }
            }},
            { $sort: { acceptedCount: -1, lastSubmission: -1 } },
            { $limit: parseInt(limit) },
            { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            }},
            { $unwind: { path: '$user', preserveNullAndEmpty: true } },
            { $project: {
                _id: 1,
                acceptedCount: 1,
                lastSubmission: 1,
                name: { $ifNull: ['$user.name', 'Anonymous'] },
                isCurrentUser: { $eq: ['$_id', { $toObjectId: userId }] },
            }},
        ]);

        return ApiResponse.success(res, {
            leaderboard,
            count: leaderboard.length
        }, 'Leaderboard retrieved');
    } catch (error) {
        logger.error('Leaderboard error:', error.message);
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
