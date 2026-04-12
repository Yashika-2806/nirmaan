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
const interviewExecutionRoutes = require('../modules/interview/execution-routes');
const roadmapRoutes = require('../modules/roadmap/routes');
const careerTwinRoutes = require('../modules/career-twin/routes');
const skillMarketplaceRoutes = require('../modules/skill-marketplace/routes');
const gamificationRoutes = require('../modules/gamification/routes');
const growthAnalyticsRoutes = require('../modules/growth-analytics/routes');
const pdfRoutes = require('./pdf-routes');
const researchRoutes = require('./research-routes');

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Career OS API is running',
        timestamp: new Date().toISOString(),
    });
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
router.use('/roadmap', roadmapRoutes);
router.use('/career-twin', careerTwinRoutes);
router.use('/skill-marketplace', skillMarketplaceRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/analytics', growthAnalyticsRoutes);
router.use('/pdf', pdfRoutes);
router.use('/research', researchRoutes);

module.exports = router;

