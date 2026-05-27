'use client';

/**
 * useExecutionStream
 * 
 * Consumes the /api/interview/execution-stream/:jobId SSE endpoint
 * to receive real-time execution status updates without polling.
 * 
 * Usage:
 *   const { status, verdict, testCases, summary, error, isComplete } = useExecutionStream(jobId);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TestCaseResult, ExecutionSummary } from '@/components/interview/test-cases-panel';

export type StreamStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'timeout' | 'error';

interface ExecutionStreamState {
    status:     StreamStatus;
    message:    string;
    verdict:    string | null;
    testCases:  TestCaseResult[];
    summary:    ExecutionSummary | null;
    error:      string | null;
    isComplete: boolean;
}

const initialState: ExecutionStreamState = {
    status:     'idle',
    message:    '',
    verdict:    null,
    testCases:  [],
    summary:    null,
    error:      null,
    isComplete: false,
};

export function useExecutionStream(jobId: string | null) {
    const [state, setState] = useState<ExecutionStreamState>(initialState);
    const esRef = useRef<EventSource | null>(null);

    const cleanup = useCallback(() => {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!jobId) {
            setState(initialState);
            return;
        }

        // Close any existing stream
        cleanup();
        setState(prev => ({ ...prev, status: 'queued', message: 'Connecting to execution stream...', isComplete: false }));

        // Get token for authenticated SSE
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
            : '';

        // EventSource doesn't support custom headers — pass token as query param
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const url = `${apiBase}/interview/execution-stream/${jobId}?token=${encodeURIComponent(token)}`;

        const es = new EventSource(url);
        esRef.current = es;

        es.addEventListener('connected', () => {
            setState(prev => ({ ...prev, status: 'queued', message: 'Stream connected. Waiting for execution...' }));
        });

        es.addEventListener('progress', (e) => {
            try {
                const data = JSON.parse((e as MessageEvent).data);
                setState(prev => ({
                    ...prev,
                    status:  data.state === 'running' ? 'running' : 'queued',
                    message: data.message || 'Processing...',
                }));
            } catch { /* ignore parse errors */ }
        });

        es.addEventListener('completed', (e) => {
            try {
                const data = JSON.parse((e as MessageEvent).data);
                setState({
                    status:     'completed',
                    message:    'Execution complete',
                    verdict:    data.verdict || null,
                    testCases:  data.testCases || [],
                    summary:    data.summary   || null,
                    error:      null,
                    isComplete: true,
                });
            } catch { /* ignore */ }
            cleanup();
        });

        es.addEventListener('failed', (e) => {
            try {
                const data = JSON.parse((e as MessageEvent).data);
                setState({
                    status:     'failed',
                    message:    data.error || 'Execution failed',
                    verdict:    data.verdict || 'Execution Error',
                    testCases:  [],
                    summary:    null,
                    error:      data.error || 'Execution failed',
                    isComplete: true,
                });
            } catch { /* ignore */ }
            cleanup();
        });

        es.addEventListener('timeout', (e) => {
            try {
                const data = JSON.parse((e as MessageEvent).data);
                setState({
                    status:     'timeout',
                    message:    data.message || 'Execution timed out',
                    verdict:    'Time Limit Exceeded',
                    testCases:  [],
                    summary:    null,
                    error:      'Execution timed out after 60 seconds',
                    isComplete: true,
                });
            } catch { /* ignore */ }
            cleanup();
        });

        es.addEventListener('error', (e) => {
            try {
                const data = (e as MessageEvent).data ? JSON.parse((e as MessageEvent).data) : null;
                setState(prev => ({
                    ...prev,
                    status:     'error',
                    message:    data?.message || 'Stream error',
                    error:      data?.message || 'Stream connection error',
                    isComplete: true,
                }));
            } catch { /* ignore */ }
            cleanup();
        });

        es.onerror = () => {
            setState(prev => {
                if (prev.isComplete) return prev; // Already finished
                return {
                    ...prev,
                    status:     'error',
                    message:    'Connection lost',
                    error:      'Lost connection to execution stream. Try again.',
                    isComplete: true,
                };
            });
            cleanup();
        };

        return cleanup;
    }, [jobId, cleanup]);

    return state;
}
