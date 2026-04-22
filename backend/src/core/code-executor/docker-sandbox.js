const Docker = require('dockerode');
const path = require('path');
const fs = require('fs');
const logger = require('../../core/utils/logger');
const config = require('../../config/env');

class DockerSandboxExecutor {
    constructor() {
        this.docker = new Docker({
            socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
        });
        this.images = {
            python: 'python:3.11-slim',
            java: 'openjdk:17-slim',
            cpp: 'gcc:12-bullseye',
            javascript: 'node:18-alpine',
            c: 'gcc:12-bullseye',
            go: 'golang:1.21-alpine',
            rust: 'rust:1.70-alpine',
        };
    }

    /**
     * Check if Docker is available
     */
    async isAvailable() {
        try {
            await this.docker.ping();
            return true;
        } catch (error) {
            logger.warn('Docker not available:', error.message);
            return false;
        }
    }

    /**
     * Ensure required images are pulled
     */
    async ensureImage(language) {
        const imageName = this.images[language];
        if (!imageName) {
            throw new Error(`Unsupported language: ${language}`);
        }

        try {
            const image = this.docker.getImage(imageName);
            await image.inspect();
            logger.debug(`Image ${imageName} already present`);
        } catch (error) {
            if (error.statusCode === 404) {
                logger.info(`Pulling image ${imageName}...`);
                await this.docker.pull(imageName);
                logger.info(`Image ${imageName} pulled successfully`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Execute code in isolated Docker container
     * @param {string} sourceCode - The source code to execute
     * @param {string} language - Programming language
     * @param {string} stdin - Standard input
     * @param {object} options - Execution options (timeLimit, memoryLimit)
     * @returns {object} Execution result
     */
    async executeCode(sourceCode, language, stdin = '', options = {}) {
        const timeLimit = options.timeLimit || 5; // seconds
        const memoryLimit = options.memoryLimit || 128; // MB
        
        try {
            // Ensure image is available
            await this.ensureImage(language);

            // Prepare execution environment based on language
            const { entrypoint, workingDir, mountDir } = this.getLanguageConfig(language);
            const tempDir = path.join('/tmp', `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
            
            // Create temporary directory and write code
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const filename = path.join(tempDir, this.getFilename(language));
            fs.writeFileSync(filename, sourceCode);

            // Create stdin file
            const stdinFile = path.join(tempDir, 'stdin.txt');
            fs.writeFileSync(stdinFile, stdin);

            // Execute in container
            const result = await this._executeInContainer(
                language,
                tempDir,
                entrypoint,
                workingDir,
                timeLimit,
                memoryLimit
            );

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });

            return result;
        } catch (error) {
            logger.error('Docker execution error:', error.message);
            return {
                success: false,
                verdict: 'Execution Error',
                stdout: '',
                stderr: error.message,
                compileOutput: '',
                executionTime: 0,
                memory: 0,
                error: error.message,
            };
        }
    }

    /**
     * Execute code with test cases
     * @param {string} sourceCode - The source code
     * @param {string} language - Programming language
     * @param {array} testCases - Array of {input, expected} objects
     * @param {object} options - Execution options
     * @returns {object} Test results
     */
    async executeWithTestCases(sourceCode, language, testCases = [], options = {}) {
        try {
            if (!Array.isArray(testCases) || testCases.length === 0) {
                throw new Error('Test cases must be a non-empty array');
            }

            const results = [];
            let passedCount = 0;
            let failedCount = 0;

            for (let i = 0; i < testCases.length; i++) {
                const testCase = testCases[i];
                const result = await this.executeCode(
                    sourceCode,
                    language,
                    testCase.input || '',
                    options
                );

                const passed =
                    result.success &&
                    !result.compileOutput &&
                    !result.stderr &&
                    this.outputsMatch(result.stdout.trim(), testCase.expected.trim());

                results.push({
                    id: i + 1,
                    input: testCase.input || '',
                    expected: testCase.expected || '',
                    output: result.stdout || '',
                    passed,
                    error: result.stderr || result.compileOutput || '',
                    time: result.executionTime,
                    memory: result.memory,
                });

                if (passed) {
                    passedCount++;
                } else {
                    failedCount++;
                }
            }

            const verdict = this.getVerdict(failedCount, results);

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
     * Internal: Execute in Docker container
     */
    async _executeInContainer(language, volumePath, entrypoint, workingDir, timeLimit, memoryLimit) {
        const imageName = this.images[language];
        const containerName = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();

        let container = null;

        try {
            // Create container
            container = await this.docker.createContainer({
                Image: imageName,
                Cmd: entrypoint,
                WorkingDir: workingDir,
                Volumes: {
                    [workingDir]: {},
                },
                HostConfig: {
                    Binds: [`${volumePath}:${workingDir}`],
                    Memory: memoryLimit * 1024 * 1024, // Convert MB to bytes
                    CpuShares: 512,
                    PidsLimit: 50,
                    ReadonlyRootfs: false,
                    NetworkMode: 'none', // Disable network access
                },
                NetworkDisabled: true,
                name: containerName,
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
            });

            // Start container with timeout
            await container.start();

            // Wait for container to finish with timeout
            const executionResult = await Promise.race([
                container.wait(),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`Time Limit Exceeded (${timeLimit}s)`)),
                        timeLimit * 1000
                    )
                ),
            ]);

            // Get logs
            const logsStream = await container.logs({
                stdout: true,
                stderr: true,
                follow: false,
            });

            const output = await this._parseDockerLogs(logsStream);
            const executionTime = Date.now() - startTime;

            return {
                success: executionResult.StatusCode === 0,
                verdict: executionResult.StatusCode === 0 ? 'Accepted' : 'Runtime Error',
                stdout: output.stdout || '',
                stderr: output.stderr || '',
                compileOutput: output.stderr || '',
                executionTime: executionTime / 1000, // Convert to seconds
                memory: memoryLimit, // Simplified - actual memory usage would require stats API
                containerId: container.id,
            };
        } catch (error) {
            if (error.message.includes('Time Limit Exceeded')) {
                return {
                    success: false,
                    verdict: 'Time Limit Exceeded',
                    stdout: '',
                    stderr: error.message,
                    compileOutput: '',
                    executionTime: timeLimit,
                    memory: memoryLimit,
                    containerId: container?.id,
                };
            }

            return {
                success: false,
                verdict: 'Execution Error',
                stdout: '',
                stderr: error.message,
                compileOutput: '',
                executionTime: (Date.now() - startTime) / 1000,
                memory: 0,
                containerId: container?.id,
            };
        } finally {
            // Cleanup container
            if (container) {
                try {
                    await container.remove({ force: true });
                } catch (e) {
                    logger.warn('Failed to remove container:', e.message);
                }
            }
        }
    }

    /**
     * Parse Docker logs stream
     */
    async _parseDockerLogs(stream) {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            stream.on('data', (chunk) => {
                // Docker logs stream format includes header bytes
                const header = chunk.slice(0, 8);
                const streamType = header[0]; // 1=stdout, 2=stderr
                const data = chunk.slice(8).toString();

                if (streamType === 1) {
                    stdout += data;
                } else if (streamType === 2) {
                    stderr += data;
                }
            });

            stream.on('end', () => {
                resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            });

            stream.on('error', reject);
        });
    }

    /**
     * Get language-specific configuration
     */
    getLanguageConfig(language) {
        const configs = {
            python: {
                entrypoint: ['python', 'solution.py'],
                workingDir: '/app',
                filename: 'solution.py',
            },
            java: {
                entrypoint: ['java', 'Solution'],
                workingDir: '/app',
                filename: 'Solution.java',
            },
            cpp: {
                entrypoint: ['bash', '-c', 'g++ -o solution solution.cpp && ./solution < stdin.txt'],
                workingDir: '/app',
                filename: 'solution.cpp',
            },
            javascript: {
                entrypoint: ['node', 'solution.js'],
                workingDir: '/app',
                filename: 'solution.js',
            },
            c: {
                entrypoint: ['bash', '-c', 'gcc -o solution solution.c && ./solution < stdin.txt'],
                workingDir: '/app',
                filename: 'solution.c',
            },
            go: {
                entrypoint: ['bash', '-c', 'go run solution.go < stdin.txt'],
                workingDir: '/app',
                filename: 'solution.go',
            },
            rust: {
                entrypoint: ['bash', '-c', 'rustc solution.rs -o solution && ./solution < stdin.txt'],
                workingDir: '/app',
                filename: 'solution.rs',
            },
        };

        return configs[language] || configs.python;
    }

    /**
     * Get filename for language
     */
    getFilename(language) {
        return this.getLanguageConfig(language).filename;
    }

    /**
     * Compare outputs with normalization
     */
    outputsMatch(got, expected) {
        // Exact match
        if (got === expected) return true;

        // Whitespace normalization
        if (got.replace(/\s+/g, '') === expected.replace(/\s+/g, '')) return true;

        // Numeric comparison
        const gotNum = parseFloat(got);
        const expectedNum = parseFloat(expected);
        if (!isNaN(gotNum) && !isNaN(expectedNum)) {
            return Math.abs(gotNum - expectedNum) < 1e-9;
        }

        return false;
    }

    /**
     * Determine verdict based on test results
     */
    getVerdict(failedCount, results) {
        if (failedCount === 0) return 'Accepted';

        const hasTimeout = results.some(r => r.error.includes('Time Limit'));
        if (hasTimeout) return 'Time Limit Exceeded';

        const hasMemoryError = results.some(r => r.error.includes('Memory'));
        if (hasMemoryError) return 'Memory Limit Exceeded';

        const hasCompileError = results.some(r => r.error.includes('Compilation'));
        if (hasCompileError) return 'Compilation Error';

        const hasRuntimeError = results.some(r => r.error && !r.passed);
        if (hasRuntimeError) return 'Runtime Error';

        return 'Wrong Answer';
    }
}

module.exports = new DockerSandboxExecutor();
