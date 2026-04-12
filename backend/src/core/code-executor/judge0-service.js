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
                logger.warn('Judge0 API key not configured. Using TEST MODE.');
                return this.executeCodeTestMode(sourceCode, language);
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

            // Fallback to test mode if API key not configured
            if (!config.judge0.apiKey) {
                logger.warn('Judge0 API key not configured. Using TEST MODE for submission.');
                return this.executeWithTestCasesTestMode(sourceCode, language, testCases);
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

    /**
     * Execute code in TEST MODE (when Judge0 API key not configured)
     * Returns mock execution results for development/testing
     */
    static executeCodeTestMode(sourceCode, language) {
        logger.info(`[TEST MODE] Executing code in language: ${language}`);

        // Mock execution result - simulates successful code run
        const mockOutput = this.generateMockOutput(sourceCode, language);

        return {
            success: true,
            status: {
                id: 3,
                description: 'Accepted',
            },
            stdout: mockOutput,
            stderr: '',
            compile_output: '',
            message: 'Accepted (Test Mode)',
            time: (Math.random() * 0.5 + 0.1).toFixed(2), // 0.1 - 0.6 seconds
            memory: Math.floor(Math.random() * 10 + 5) * 1024, // 5-15 MB
            testMode: true,
            warning: '⚠️ Running in TEST MODE. Real code execution disabled. Add JUDGE0_API_KEY to production .env to enable actual execution.',
        };
    }

    /**
     * Generate mock output based on code content
     */
    static generateMockOutput(sourceCode, language) {
        // Try to extract print statements or return values
        if (language === 'python') {
            // Match: print(...), print(...), etc
            const printMatches = sourceCode.match(/print\((.*?)\)/g);
            if (printMatches && printMatches.length > 0) {
                // Extract the argument of the last print statement
                const lastPrint = printMatches[printMatches.length - 1];
                const contentMatch = lastPrint.match(/print\((.*)\)/);
                if (contentMatch) {
                    let content = contentMatch[1].trim();
                    // Remove quotes if it's a string
                    if ((content.startsWith('"') && content.endsWith('"')) || 
                        (content.startsWith("'") && content.endsWith("'"))) {
                        return content.slice(1, -1) + '\n';
                    }
                    // Return lists, tuples, numbers as-is
                    if (content.match(/^\[.*\]$/) || content.match(/^\(.*\)$/) || !isNaN(content)) {
                        return content + '\n';
                    }
                    // For variable names or expressions, return a reasonable mock
                    return '[0, 1]\n'; // Default for two-sum problem
                }
            }
        }

        if (language === 'javascript') {
            const logMatches = sourceCode.match(/console\.log\((.*?)\)/g);
            if (logMatches && logMatches.length > 0) {
                const lastLog = logMatches[logMatches.length - 1];
                const contentMatch = lastLog.match(/console\.log\((.*)\)/);
                if (contentMatch) {
                    let content = contentMatch[1].trim();
                    if ((content.startsWith('"') && content.endsWith('"')) || 
                        (content.startsWith("'") && content.endsWith("'"))) {
                        return content.slice(1, -1) + '\n';
                    }
                    // Try to parse JSON arrays
                    if (content.startsWith('[') && content.endsWith(']')) {
                        try {
                            JSON.parse(content); // Validate JSON
                            return content + '\n';
                        } catch (e) {
                            // Invalid JSON, return as-is
                            return content + '\n';
                        }
                    }
                    return '[0, 1]\n'; // Default for two-sum
                }
            }
        }

        // For other languages or if no print found
        return '[0, 1]\n'; // Default mock output for sample problem
    }

    /**
     * Execute with test cases in TEST MODE
     * Simulates all test cases passing
     */
    static executeWithTestCasesTestMode(sourceCode, language, testCases) {
        logger.info(`[TEST MODE] Executing ${testCases.length} test cases in TEST MODE`);

        const results = testCases.map((testCase, index) => ({
            id: index + 1,
            input: testCase.input || '',
            expected: testCase.expected || '',
            output: testCase.expected, // Mock: output matches expected
            passed: true, // Mock: all tests pass in test mode
            error: '',
            time: (Math.random() * 0.3 + 0.05).toFixed(2),
            memory: Math.floor(Math.random() * 5 + 2) * 1024,
        }));

        return {
            success: true,
            verdict: 'Accepted',
            passedCount: testCases.length,
            failedCount: 0,
            totalCount: testCases.length,
            testCases: results,
            testMode: true,
            warning: '⚠️ Running in TEST MODE. Real code execution disabled. Add JUDGE0_API_KEY to production .env to enable actual test case checking.',
        };
    }
}

module.exports = Judge0Service;
