const express = require('express');

const router = express.Router();

// Import module routes
const authRoutes = require('../core/auth/routes');
const aiKeyRoutes = require('../core/ai-key-manager/routes');
const dsaRoutes = require('../modules/dsa/routes');
const aiRoutes = require('./ai-routes');
const resumeRoutes = require('../modules/resume/routes');
const interviewRoutes = require('../modules/interview/routes');
const roadmapRoutes = require('../modules/roadmap/routes');
const careerGPSRoutes = require('../modules/career-gps/routes');
const careerTwinRoutes = require('./career-twin-routes');
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
router.use('/dsa', dsaRoutes);
router.use('/ai', aiRoutes);
router.use('/resume', resumeRoutes);
router.use('/interview', interviewRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/career-gps', careerGPSRoutes);
router.use('/career-twin', careerTwinRoutes);
router.use('/skill-marketplace', skillMarketplaceRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/analytics', growthAnalyticsRoutes);
router.use('/pdf', pdfRoutes);
router.use('/research', researchRoutes);

module.exports = router;

