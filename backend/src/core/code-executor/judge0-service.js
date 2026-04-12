const axios = require('axios');
const config = require('../../config/env');
const logger = require('../utils/logger');

const LANGUAGE_MAP = {
    python: 71,
    java: 62,
    cpp: 54,
    'c++': 54,
    javascript: 63,
    js: 63,
    c: 50,
    csharp: 51,
    'c#': 51,
    golang: 60,
    go: 60,
    rust: 73,
    swift: 19,
    kotlin: 78,
};

const VERDICT_MAP = {
    1: 'In Queue',
    2: 'Processing',
    3: 'Accepted',
    4: 'Wrong Answer',
    5: 'Time Limit Exceeded',
    6: 'Compilation Error',
    7: 'Runtime Error',
    8: 'System Error',
    9: 'Memory Limit Exceeded',
};

class Judge0Service {
    /**
     * Get language ID from language name.
     */
    static getLanguageId(language) {
        const normalized = (language || '').toLowerCase().trim();
        return LANGUAGE_MAP[normalized] || null;
    }

    /**
     * Get verdict description from status ID.
     */
    static getVerdictDescription(statusId) {
        return VERDICT_MAP[statusId] || 'Unknown Status';
    }

    /**
     * Submit code to Judge0 for execution.
     * @param {string} sourceCode - The source code to execute
     * @param {string} language - Programming language (python, java, cpp, javascript, etc.)
     * @param {string} stdin - Standard input for the program
     * @param {object} options - Additional options (timeout, memoryLimit, etc.)
     * @returns {object} Execution result with status, output, error, etc.
     */
    static async executeCode(sourceCode, language, stdin = '', options = {}) {
        try {
            // Validate inputs
            if (!sourceCode || !sourceCode.trim()) {
                throw new Error('Source code cannot be empty');
            }

            const languageId = this.getLanguageId(language);
            if (!languageId) {
                throw new Error(`Unsupported language: ${language}. Supported: python, java, cpp, javascript, c, go, rust, swift, kotlin`);
            }

            if (!config.judge0.apiKey) {
                logger.error('Judge0 API key not configured');
                throw new Error('Code execution service not configured. Please add JUDGE0_API_KEY to environment variables.');
            }

            const payload = {
                source_code: sourceCode,
                language_id: languageId,
                stdin: stdin || '',
                cpu_time_limit: options.timeLimit || 5,
                memory_limit: options.memoryLimit || 128000,
                number_of_runs: options.numberOfRuns || 1,
            };

            if (options.expectedOutput) {
                payload.expected_output = options.expectedOutput;
            }

            logger.info(`Executing code with language_id=${languageId}`, { language });

            // Create submission with Judge0
            const createResponse = await axios.post(`${config.judge0.baseUrl}/submissions?base64_encoded=false&wait=true`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-RapidAPI-Key': config.judge0.apiKey,
                    'X-RapidAPI-Host': config.judge0.apiHost,
                },
            });

            const submission = createResponse.data;
            const statusId = submission.status?.id || 0;
            const verdict = this.getVerdictDescription(statusId);

            logger.info(`Submission result: status_id=${statusId}, verdict=${verdict}`);

            // Format response for frontend
            return {
                success: true,
                status: {
                    id: statusId,
                    description: verdict,
                },
                stdout: submission.stdout || '',
                stderr: submission.stderr || '',
                compile_output: submission.compile_output || '',
                message: verdict,
                time: submission.time ? parseFloat(submission.time).toFixed(2) : '0.00',
                memory: submission.memory || 0,
                token: submission.token,
            };
        } catch (error) {
            logger.error('Judge0 execution error:', error.message);

            // Check if it's a network/config error vs code error
            const statusCode = error.response?.status;
            const errorData = error.response?.data;

            if (statusCode === 401 || statusCode === 403) {
                return {
                    success: false,
                    status: { id: 8, description: 'System Error' },
                    message: 'Judge0 authentication failed. Check API key configuration.',
                    stderr: 'Authentication Error',
                    stdout: '',
                    compile_output: '',
                };
            }

            if (statusCode === 429) {
                return {
                    success: false,
                    status: { id: 8, description: 'System Error' },
                    message: 'Judge0 rate limit exceeded. Please try again later.',
                    stderr: 'Rate Limit Exceeded',
                    stdout: '',
                    compile_output: '',
                };
            }

            return {
                success: false,
                status: { id: 8, description: 'System Error' },
                message: error.message || 'Code execution failed',
                stderr: error.message || 'Unknown error',
                stdout: '',
                compile_output: '',
            };
        }
    }

    /**
     * Execute code with test cases (for submission/judge system).
     * @param {string} sourceCode - The source code to execute
     * @param {string} language - Programming language
     * @param {array} testCases - Array of {input, expected} objects
     * @returns {object} Test results with passed/failed counts
     */
    static async executeWithTestCases(sourceCode, language, testCases = []) {
        try {
            if (!Array.isArray(testCases) || testCases.length === 0) {
                throw new Error('Test cases must be a non-empty array with {input, expected} format');
            }

            const results = [];
            let passedCount = 0;
            let failedCount = 0;

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                const result = await this.executeCode(sourceCode, language, testCase.input || '');

                const passed =
                    result.success &&
                    !result.compile_output &&
                    !result.stderr &&
                    result.stdout.trim() === (testCase.expected || '').trim();

                results.push({
                    id: i + 1,
                    input: testCase.input || '',
                    expected: testCase.expected || '',
                    output: result.stdout || '',
                    passed,
                    error: result.stderr || result.compile_output || '',
                    time: result.time,
                    memory: result.memory,
                });

                if (passed) {
                    passedCount++;
                } else {
                    failedCount++;
                }
            }

            const verdict =
                failedCount === 0 ? 'Accepted' :
                results.some(r => r.error) ? 'Runtime Error' :
                'Wrong Answer';

            return {
                success: true,
                verdict,
                passedCount,
                failedCount,
                totalCount: testCases.length,
                testCases: results,
            };
        } catch (error) {
            logger.error('Test case execution error:', error.message);
            return {
                success: false,
                verdict: 'Execution Error',
                message: error.message,
                passedCount: 0,
                failedCount: testCases.length,
                totalCount: testCases.length,
                testCases: [],
            };
        }
    }
}

module.exports = Judge0Service;
