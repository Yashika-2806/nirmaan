/**
 * SSE (Server-Sent Events) endpoint for real-time execution status delivery.
 * GET /api/interview/execution-stream/:jobId
 *
 * The client opens an EventSource connection; the server polls the job queue
 * every 800ms and pushes updates until the job is complete.
 * 
 * This replaces the need for WebSocket for this use case.
 */
const express = require('express');
const { protect } = require('../../core/auth/middleware');
const ExecutionQueue = require('../../core/code-executor/execution-queue');
const ExecutionResultModel = require('./models/execution-result-model');
const logger = require('../../core/utils/logger');

const router = express.Router();
router.use(protect);

/**
 * GET /api/interview/execution-stream/:jobId
 * Opens an SSE stream for real-time job status updates.
 */
router.get('/execution-stream/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.userId || req.user._id;

    // SSE headers
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const send = (event, data) => {
        try {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch { /* client disconnected */ }
    };

    // Send initial ping so client knows the stream is alive
    send('connected', { jobId, message: 'Stream opened' });

    let pollCount   = 0;
    const MAX_POLLS = 75; // 75 * 800ms = 60s max
    const INTERVAL  = 800;

    const interval = setInterval(async () => {
        pollCount++;

        try {
            const status = await ExecutionQueue.getJobStatus(jobId);

            if (!status) {
                send('error', { message: 'Job not found', jobId });
                clearInterval(interval);
                res.end();
                return;
            }

            // Ownership check
            if (status.data?.userId && String(status.data.userId) !== String(userId)) {
                send('error', { message: 'Access denied' });
                clearInterval(interval);
                res.end();
                return;
            }

            const state = status.state;

            if (state === 'active') {
                send('progress', { jobId, state: 'running', message: 'Executing code...' });
            } else if (state === 'waiting') {
                send('progress', { jobId, state: 'queued', message: 'Waiting in queue...' });
            } else if (state === 'completed') {
                // Fetch from DB if job result is available
                const result = status.result;
                if (result?.executionId) {
                    const dbResult = await ExecutionResultModel.findById(result.executionId).lean();
                    send('completed', {
                        jobId,
                        state:   'completed',
                        verdict: dbResult?.verdict || result.verdict,
                        testCases: (dbResult?.testCases || []).map(tc => ({
                            id:       tc.id,
                            passed:   tc.passed,
                            verdict:  tc.verdict,
                            time:     tc.time,
                            memory:   tc.memory,
                        })),
                        summary: dbResult?.summary || {},
                    });
                } else {
                    send('completed', { jobId, state: 'completed', ...result });
                }
                clearInterval(interval);
                res.end();
                return;
            } else if (state === 'failed') {
                send('failed', {
                    jobId,
                    state: 'failed',
                    error: status.failedReason || 'Execution failed',
                    verdict: 'Execution Error',
                });
                clearInterval(interval);
                res.end();
                return;
            }
        } catch (err) {
            logger.error('SSE poll error:', err.message);
            send('error', { message: err.message });
        }

        // Timeout
        if (pollCount >= MAX_POLLS) {
            send('timeout', { jobId, message: 'Execution timed out. Please try again.' });
            clearInterval(interval);
            res.end();
        }
    }, INTERVAL);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
        logger.info(`SSE stream closed for job ${jobId}`);
    });
});

module.exports = router;
