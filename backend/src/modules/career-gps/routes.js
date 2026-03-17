const express = require('express');
const Joi = require('joi');
const controller = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');
const { ALLOWED_TARGET_ROLES } = require('./career-goal-model');

const router = express.Router();
router.use(protect);

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const setGoalSchema = Joi.object({
    targetRole: Joi.string().valid(...ALLOWED_TARGET_ROLES).required(),
    notes: Joi.string().max(500).allow('').optional(),
});

const updateProgressSchema = Joi.object({
    roadmapId: Joi.string().pattern(objectIdRegex).required(),
    taskId: Joi.string().pattern(objectIdRegex).optional(),
    missionId: Joi.string().pattern(objectIdRegex).optional(),
    incrementBy: Joi.number().integer().min(1).max(50).optional(),
    markCompleted: Joi.boolean().optional(),
});

router.post('/set-goal', aiLimiter, validate(setGoalSchema), controller.setGoal);
router.get('/roadmap/:userId', controller.getRoadmap);
router.post('/update-progress', validate(updateProgressSchema), controller.updateProgress);
router.get('/probability/:userId', controller.getProbability);
router.get('/missions/:userId', controller.getMissions);

module.exports = router;
