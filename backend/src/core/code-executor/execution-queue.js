const Queue = require('bull');
const redis = require('redis');
const logger = require('../../core/utils/logger');
const config = require('../../config/env');
const DockerSandboxExecutor = require('./docker-sandbox');
const Judge0Service = require('./judge0-service');
const ExecutionResultModel = require('../../modules/interview/models/execution-result-model');
const TestCaseModel = require('../../modules/interview/models/test-case-model');

/**
 * Execution queue for code execution requests
 * Uses Bull queue backed by Redis
 */
class ExecutionQueue {
    constructor() {
        this.redisAvailable = false;
        this.redisClient = null;
        this.executionQueue = null;

        this._init();
    }

    /**
     * Lazy initializer — called in constructor.
     * Failures here are logged but DO NOT crash the process.
     */
    _init() {
        try {
            const redisConfig = {
                host: config.redis?.host || 'localhost',
                port: config.redis?.port || 6379,
                password: config.redis?.password,
            };

            // Initialize Redis client (v3 style used by bull)
            this.redisClient = redis.createClient(redisConfig);
            this.redisClient.on('error', (err) => {
                if (this.redisAvailable) {
                    logger.warn('Redis connection error — async queue disabled:', err.message);
                    this.redisAvailable = false;
                }
            });
            this.redisClient.on('connect', () => {
                if (!this.redisAvailable) {
                    logger.info('Redis connected — async execution queue enabled');
                    this.redisAvailable = true;
                }
            });

            // Create Bull execution queue
            this.executionQueue = new Queue('code-execution', {
                redis: redisConfig,
                defaultJobOptions: {
                    attempts: 2,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: { age: 3600 },
                    removeOnFail: false,
                },
            });

            this.executionQueue.on('error', (err) => {
                logger.warn('Execution queue error:', err.message);
                this.redisAvailable = false;
            });

            this.executionQueue.on('ready', () => {
                this.redisAvailable = true;
                logger.info('Execution queue ready');
            });

            this.setupProcessors();
            logger.info('ExecutionQueue initialized (Redis-backed)');
        } catch (err) {
            logger.warn('ExecutionQueue: Redis not available — async queuing disabled. Synchronous execution only.', err.message);
            this.redisAvailable = false;
            this.executionQueue = null;
        }
    }

    /**
     * Setup job processors
     */
    setupProcessors() {
        // Process run jobs (sample test cases)
        this.executionQueue.process('run', 5, async (job) => {
            return await this.processRun(job);
        });

        // Process submit jobs (all test cases)
        this.executionQueue.process('submit', 3, async (job) => {
            return await this.processSubmit(job);
        });

        // Event listeners
        this.executionQueue.on('active', (job) => {
            logger.info(`Job ${job.id} started processing`);
        });

        this.executionQueue.on('completed', (job, result) => {
            logger.info(`Job ${job.id} completed`);
        });

        this.executionQueue.on('failed', (job, err) => {
            logger.error(`Job ${job.id} failed:`, err.message);
        });
    }

    /**
     * Queue a run request (test with sample cases)
     */
    async queueRun(data) {
        if (!this.redisAvailable || !this.executionQueue) {
            throw new Error('Async execution queue is unavailable (Redis not connected). Use synchronous execution instead.');
        }
        try {
            const { userId, questionId, sourceCode, language, sessionId } = data;

            const job = await this.executionQueue.add('run', {
                userId, questionId, sourceCode, language, sessionId,
                timestamp: Date.now(),
            }, {
                priority: 10,
                jobId: `run-${userId}-${Date.now()}`,
                timeout: 30000,
            });

            logger.info(`Queued run job: ${job.id}`);
            return { jobId: job.id, status: 'queued' };
        } catch (error) {
            logger.error('Failed to queue run:', error.message);
            throw error;
        }
    }

    /**
     * Queue a submit request (test with all cases)
     */
    async queueSubmit(data) {
        if (!this.redisAvailable || !this.executionQueue) {
            throw new Error('Async execution queue is unavailable (Redis not connected). Use synchronous execution instead.');
        }
        try {
            const { userId, questionId, sourceCode, language, sessionId } = data;

            const job = await this.executionQueue.add('submit', {
                userId, questionId, sourceCode, language, sessionId,
                timestamp: Date.now(),
            }, {
                priority: 5,
                jobId: `submit-${userId}-${Date.now()}`,
                timeout: 60000,
            });

            logger.info(`Queued submit job: ${job.id}`);
            return { jobId: job.id, status: 'queued' };
        } catch (error) {
            logger.error('Failed to queue submit:', error.message);
            throw error;
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        if (!this.redisAvailable || !this.executionQueue) {
            return { jobId, state: 'unavailable', message: 'Queue not connected' };
        }
        try {
            const job = await this.executionQueue.getJob(jobId);
            if (!job) {
                return null;
            }

            const state = await job.getState();
            const progress = job._progress;

            return {
                jobId: job.id,
                state,
                progress,
                data: job.data,
                result: job._result,
            };
        } catch (error) {
            logger.error('Failed to get job status:', error.message);
            throw error;
        }
    }

    /**
     * Process run job
     */
    async processRun(job) {
        const { userId, questionId, sourceCode, language, sessionId } = job.data;
        const startTime = Date.now();

        try {
            logger.info(`Processing run job for question: ${questionId}`);

            // Fetch visible test cases (sample only)
            const testCases = await TestCaseModel.getVisibleTestCases(questionId);

            if (testCases.length === 0) {
                logger.warn(`No visible test cases for question: ${questionId}`);
            }

            // Execute code
            let result;
            const dockerAvailable = await DockerSandboxExecutor.isAvailable();

            if (dockerAvailable) {
                logger.info('Using Docker sandbox for execution');
                result = await DockerSandboxExecutor.executeWithTestCases(
                    sourceCode,
                    language,
                    testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expected,
                    }))
                );
            } else {
                logger.info('Docker not available, falling back to Judge0');
                result = await Judge0Service.executeWithTestCases(
                    sourceCode,
                    language,
                    testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expected,
                    }))
                );
            }

            // Save execution result
            const executionResult = await ExecutionResultModel.create({
                userId,
                questionId,
                sessionId,
                type: 'run',
                sourceCode,
                language,
                verdict: result.verdict,
                stdout: result.stdout || '',
                stderr: result.stderr || '',
                testCases: result.testCases || [],
                summary: {
                    totalTests: result.totalCount || testCases.length,
                    passedTests: result.passedCount || 0,
                    failedTests: result.failedCount || testCases.length,
                },
                executionTime: (Date.now() - startTime) / 1000,
                executionEngine: dockerAvailable ? 'docker' : 'judge0',
            });

            return {
                success: true,
                executionId: executionResult._id,
                verdict: result.verdict,
                testCases: result.testCases,
                summary: executionResult.summary,
            };
        } catch (error) {
            logger.error('Run job failed:', error.message);

            // Save failed execution
            await ExecutionResultModel.create({
                userId,
                questionId,
                sessionId,
                type: 'run',
                sourceCode,
                language,
                verdict: 'Execution Error',
                stderr: error.message,
                executionTime: (Date.now() - startTime) / 1000,
            }).catch(e => logger.error('Failed to save error result:', e.message));

            throw error;
        }
    }

    /**
     * Process submit job
     */
    async processSubmit(job) {
        const { userId, questionId, sourceCode, language, sessionId } = job.data;
        const startTime = Date.now();

        try {
            logger.info(`Processing submit job for question: ${questionId}`);

            // Fetch all test cases (both visible and hidden)
            const testCases = await TestCaseModel.getAllTestCases(questionId);

            if (testCases.length === 0) {
                throw new Error(`No test cases found for question: ${questionId}`);
            }

            // Execute code
            let result;
            const dockerAvailable = await DockerSandboxExecutor.isAvailable();

            if (dockerAvailable) {
                logger.info('Using Docker sandbox for submission');
                result = await DockerSandboxExecutor.executeWithTestCases(
                    sourceCode,
                    language,
                    testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expected,
                    }))
                );
            } else {
                logger.info('Docker not available, falling back to Judge0');
                result = await Judge0Service.executeWithTestCases(
                    sourceCode,
                    language,
                    testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expected,
                    }))
                );
            }

            // Save execution result
            const executionResult = await ExecutionResultModel.create({
                userId,
                questionId,
                sessionId,
                type: 'submit',
                sourceCode,
                language,
                verdict: result.verdict,
                stdout: result.stdout || '',
                stderr: result.stderr || '',
                testCases: result.testCases || [],
                summary: {
                    totalTests: result.totalCount || testCases.length,
                    passedTests: result.passedCount || 0,
                    failedTests: result.failedCount || testCases.length,
                },
                executionTime: (Date.now() - startTime) / 1000,
                executionEngine: dockerAvailable ? 'docker' : 'judge0',
            });

            return {
                success: true,
                executionId: executionResult._id,
                verdict: result.verdict,
                testCases: result.testCases,
                summary: executionResult.summary,
            };
        } catch (error) {
            logger.error('Submit job failed:', error.message);

            // Save failed execution
            await ExecutionResultModel.create({
                userId,
                questionId,
                sessionId,
                type: 'submit',
                sourceCode,
                language,
                verdict: 'Execution Error',
                stderr: error.message,
                executionTime: (Date.now() - startTime) / 1000,
            }).catch(e => logger.error('Failed to save error result:', e.message));

            throw error;
        }
    }

    /**
     * Cleanup (stop queue)
     */
    async close() {
        await this.executionQueue.close();
        this.redisClient.quit();
        logger.info('Execution queue closed');
    }
}

module.exports = new ExecutionQueue();
