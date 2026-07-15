const express = require('express');

const router = express.Router();

// Import module routes
const authRoutes = require('../core/auth/routes');
const aiKeyRoutes = require('../core/ai-key-manager/routes');
const executorRoutes = require('../core/code-executor/routes');
const dsaRoutes = require('../modules/dsa/routes');
const aiRoutes = require('./ai-routes');
const resumeRoutes = require('../modules/resume/routes');
const interviewRoutes = require('../modules/interview/routes');
const interviewExecutionRoutes = require('../modules/interview/execution-routes-v2');
const executionStreamRoutes    = require('../modules/interview/execution-stream-routes');
const proctorRoutes = require('../modules/interview/proctor-routes');
const roadmapRoutes = require('../modules/roadmap/routes');
const careerTwinRoutes = require('../modules/career-twin/routes');
const skillMarketplaceRoutes = require('../modules/skill-marketplace/routes');
const gamificationRoutes = require('../modules/gamification/routes');
const growthAnalyticsRoutes = require('../modules/growth-analytics/routes');
const pdfRoutes = require('./pdf-routes');
const researchRoutes = require('./research-routes');

// Health check
router.get('/health', (req, res) => {
    const ExecutionQueue = require('../core/code-executor/execution-queue');
    res.json({
        success:   true,
        message:   'Career OS API is running',
        timestamp: new Date().toISOString(),
        services: {
            redis: ExecutionQueue.redisAvailable ? 'connected' : 'unavailable',
        },
    });
});

// Temporary Database Diagnostics
router.get('/db-test', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const state = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        let dbError = null;
        let usersCount = 0;
        try {
            const User = require('../core/auth/model');
            usersCount = await User.countDocuments();
        } catch (err) {
            dbError = {
                message: err.message,
                stack: err.stack,
                name: err.name
            };
        }

        res.json({
            success: true,
            connectionState: states[state] || state,
            usersCount,
            dbError,
            env: {
                hasMongoUri: !!process.env.MONGODB_URI,
                nodeEnv: process.env.NODE_ENV,
                mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 25) + '...' : null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin/ai-keys', aiKeyRoutes);
router.use('/executor', executorRoutes);
router.use('/dsa', dsaRoutes);
router.use('/ai', aiRoutes);
router.use('/resume', resumeRoutes);
router.use('/interview', interviewRoutes);
router.use('/interview', interviewExecutionRoutes);
router.use('/interview', executionStreamRoutes); // SSE real-time stream
router.use('/roadmap', roadmapRoutes);
router.use('/career-twin', careerTwinRoutes);
router.use('/skill-marketplace', skillMarketplaceRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/analytics', growthAnalyticsRoutes);
router.use('/pdf', pdfRoutes);
router.use('/proctor', proctorRoutes);
router.use('/research', researchRoutes);

module.exports = router;

