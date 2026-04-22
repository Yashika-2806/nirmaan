import api from '@/lib/axios';

/**
 * Interview Code Execution Service
 * Handles /run, /submit, and test case operations
 */

export interface TestCase {
    id: number;
    input: string;
    expected: string;
    output?: string;
    passed?: boolean;
    error?: string;
}

export interface ExecutionResult {
    executionId: string;
    verdict: string;
    testCases: TestCase[];
    summary: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
    };
    message?: string;
}

export interface JobStatus {
    jobId: string;
    state: string;
    progress?: number;
    result?: ExecutionResult;
}

class InterviewExecutionService {
    /**
     * Run code against sample test cases
     */
    async runCode(
        sourceCode: string,
        language: string,
        questionId: string,
        asyncExecution: boolean = false
    ): Promise<ExecutionResult | JobStatus> {
        try {
            const response = await api.post<any>('/interview/run', {
                sourceCode,
                language,
                questionId,
                async: asyncExecution,
            });

            return response.data.data;
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to run code'
            );
        }
    }

    /**
     * Submit code against all test cases
     */
    async submitCode(
        sourceCode: string,
        language: string,
        questionId: string,
        sessionId?: string,
        asyncExecution: boolean = false
    ): Promise<ExecutionResult | JobStatus> {
        try {
            const response = await api.post<any>('/interview/submit', {
                sourceCode,
                language,
                questionId,
                sessionId,
                async: asyncExecution,
            });

            return response.data.data;
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to submit code'
            );
        }
    }

    /**
     * Get execution result by ID
     */
    async getExecution(executionId: string): Promise<ExecutionResult> {
        try {
            const response = await api.get<any>(`/interview/execution/${executionId}`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to fetch execution'
            );
        }
    }

    /**
     * Get job status (for async execution)
     */
    async getJobStatus(jobId: string): Promise<JobStatus> {
        try {
            const response = await api.get<any>(`/interview/job/${jobId}`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to fetch job status'
            );
        }
    }

    /**
     * Get test cases for a question
     */
    async getTestCases(questionId: string): Promise<TestCase[]> {
        try {
            const response = await api.get<any>(`/interview/test-cases/${questionId}`);
            return response.data.data.testCases || [];
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to fetch test cases'
            );
        }
    }

    /**
     * Generate test cases for a question
     */
    async generateTestCases(
        questionId: string,
        count: number = 10,
        includeEdgeCases: boolean = true
    ): Promise<TestCase[]> {
        try {
            const response = await api.post<any>('/interview/generate-test-cases', {
                questionId,
                count,
                includeEdgeCases,
            });

            return response.data.data.testCases || [];
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to generate test cases'
            );
        }
    }

    /**
     * Get user's previous attempts on a question
     */
    async getAttempts(questionId: string) {
        try {
            const response = await api.get<any>(`/interview/attempts/${questionId}`);
            return response.data.data.attempts || [];
        } catch (error: any) {
            throw new Error(
                error?.response?.data?.message || 'Failed to fetch attempts'
            );
        }
    }

    /**
     * Poll job status until completion
     */
    async pollJobUntilComplete(
        jobId: string,
        timeoutMs: number = 120000,
        intervalMs: number = 1000
    ): Promise<ExecutionResult> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const status = await this.getJobStatus(jobId);

                if (status.state === 'completed') {
                    if (status.result) {
                        return status.result;
                    }
                    throw new Error('Job completed but no result available');
                }

                if (status.state === 'failed') {
                    throw new Error(`Job failed: ${status.state}`);
                }

                // Wait before polling again
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            } catch (error: any) {
                // Retry on network errors
                if (error.message.includes('Failed to fetch')) {
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Job execution timeout');
    }

    /**
     * Get verdict message
     */
    getVerdictMessage(verdict: string): string {
        const messages: Record<string, string> = {
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

    /**
     * Check if verdict is pass
     */
    isPassed(verdict: string): boolean {
        return verdict === 'Accepted' || verdict === 'Partial Accept';
    }
}

export default new InterviewExecutionService();
