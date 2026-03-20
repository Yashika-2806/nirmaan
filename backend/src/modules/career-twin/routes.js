const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const controller = require('./controller');
const { protect, restrictTo } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');
const ApiResponse = require('../../core/utils/response');
const { ROLES } = require('../../config/constants');

const router = express.Router();
router.use(protect);

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const syncJobsSchema = Joi.object({
    source: Joi.string().max(80).optional(),
    jobs: Joi.array().items(Joi.object({
        externalId: Joi.string().allow('').optional(),
        sourceUrl: Joi.string().allow('').optional(),
        applyUrl: Joi.string().allow('').optional(),
        company: Joi.string().required(),
        title: Joi.string().required(),
        location: Joi.string().allow('').optional(),
        workMode: Joi.string().valid('remote', 'hybrid', 'onsite', 'unknown').optional(),
        employmentType: Joi.string().allow('').optional(),
        description: Joi.string().allow('').optional(),
        requiredSkills: Joi.array().items(Joi.string()).optional(),
        niceToHaveSkills: Joi.array().items(Joi.string()).optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        compensationText: Joi.string().allow('').optional(),
        postedAt: Joi.string().allow('').optional(),
        expiresAt: Joi.string().allow('').optional(),
    })).min(1).required(),
});

const tailorSchema = Joi.object({
    jobId: Joi.string().pattern(objectIdRegex).required(),
});

const statusSchema = Joi.object({
    status: Joi.string().valid('draft', 'applied', 'shortlisted', 'interview', 'rejected', 'offer', 'withdrawn').required(),
    note: Joi.string().max(600).allow('').optional(),
});

const applySchema = Joi.object({
    applyMode: Joi.string().valid('assisted', 'user_approved', 'manual').default('assisted'),
});

const adminQueueSchema = Joi.object({
    sourceType: Joi.string().valid('greenhouse', 'lever', 'workday').required(),
    sourceKey: Joi.string().max(400).required(),
});

const runQueueSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(25).default(8),
});

const sourceConfigSchema = Joi.object({
    sourceType: Joi.string().valid('greenhouse', 'lever', 'workday').required(),
    sourceKey: Joi.string().max(400).required(),
    label: Joi.string().max(120).allow('').optional(),
    enabled: Joi.boolean().optional(),
    autoDisableEnabled: Joi.boolean().optional(),
    autoDisableBypass: Joi.boolean().optional(),
    syncIntervalMinutes: Joi.number().integer().min(5).max(1440).optional(),
    defaults: Joi.object({
        company: Joi.string().allow('').optional(),
        workMode: Joi.string().valid('remote', 'hybrid', 'onsite', 'unknown').optional(),
        employmentType: Joi.string().allow('').optional(),
    }).optional(),
});

const sourceConfigUpdateSchema = Joi.object({
    label: Joi.string().max(120).allow('').optional(),
    enabled: Joi.boolean().optional(),
    autoDisableEnabled: Joi.boolean().optional(),
    autoDisableBypass: Joi.boolean().optional(),
    failureStreak: Joi.number().integer().min(0).optional(),
    syncIntervalMinutes: Joi.number().integer().min(5).max(1440).optional(),
    sourceKey: Joi.string().max(400).optional(),
    defaults: Joi.object({
        company: Joi.string().allow('').optional(),
        workMode: Joi.string().valid('remote', 'hybrid', 'onsite', 'unknown').optional(),
        employmentType: Joi.string().allow('').optional(),
    }).optional(),
}).min(1);

router.post('/resume/upload-text', aiLimiter, async (req, res, next) => {
    try {
        if (!req.body || typeof req.body.resumeText !== 'string' || !req.body.resumeText.trim()) {
            return ApiResponse.badRequest(res, 'resumeText is required');
        }
        return controller.uploadResume(req, res, next);
    } catch (error) {
        return next(error);
    }
});

router.post('/resume/upload-file', aiLimiter, upload.single('resume'), async (req, res, next) => {
    try {
        if (!req.file) {
            return ApiResponse.badRequest(res, 'resume file is required');
        }
        const mimetype = String(req.file.mimetype || '');
        if (mimetype !== 'application/pdf') {
            return ApiResponse.badRequest(res, 'Only PDF files are supported currently');
        }

        const parsed = await pdfParse(req.file.buffer);
        req.file.resumeTextExtracted = parsed.text || '';
        req.body.preferences = req.body.preferences ? JSON.parse(req.body.preferences) : {};

        return controller.uploadResume(req, res, next);
    } catch (error) {
        return next(error);
    }
});

router.post('/jobs/sync', validate(syncJobsSchema), controller.syncJobs);
router.get('/recommendations', controller.getRecommendations);
router.post('/resume/tailor', aiLimiter, validate(tailorSchema), controller.generateTailoredResume);
router.post('/apply/:jobId', aiLimiter, validate(applySchema), controller.applyToJob);
router.get('/applications', controller.getApplications);
router.get('/applications/:userId', controller.getApplications);
router.patch('/applications/:applicationId/status', validate(statusSchema), controller.updateApplicationStatus);
router.get('/dashboard', controller.getDashboard);
router.get('/analytics/funnel', controller.getAnalytics);

router.post('/admin/sync/trigger', restrictTo(ROLES.ADMIN), controller.triggerConfiguredSync);
router.post('/admin/sync/queue', restrictTo(ROLES.ADMIN), validate(adminQueueSchema), controller.queueSingleSync);
router.post('/admin/sync/run', restrictTo(ROLES.ADMIN), validate(runQueueSchema), controller.runSyncQueue);
router.get('/admin/sync/status', restrictTo(ROLES.ADMIN), controller.getSyncStatus);
router.get('/admin/sources', restrictTo(ROLES.ADMIN), controller.listSources);
router.post('/admin/sources', restrictTo(ROLES.ADMIN), validate(sourceConfigSchema), controller.createSource);
router.patch('/admin/sources/:sourceId', restrictTo(ROLES.ADMIN), validate(sourceConfigUpdateSchema), controller.updateSource);
router.delete('/admin/sources/:sourceId', restrictTo(ROLES.ADMIN), controller.deleteSource);
router.post('/admin/sources/:sourceId/queue', restrictTo(ROLES.ADMIN), controller.queueSourceById);
router.post('/admin/sources/:sourceId/recover', restrictTo(ROLES.ADMIN), controller.recoverSource);

module.exports = router;
