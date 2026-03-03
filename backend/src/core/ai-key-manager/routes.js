const express = require('express');
const Joi = require('joi');
const aiKeyController = require('./controller');
const { protect, restrictTo } = require('../auth/middleware');
const { validate } = require('../middleware/validation');
const { ROLES, MODULES, AI_PROVIDERS } = require('../../config/constants');

const router = express.Router();

// All routes require admin access
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

// Validation schemas
const addKeySchema = Joi.object({
    keyName: Joi.string().required(),
    apiKey: Joi.string().required(),
    provider: Joi.string().valid(...Object.values(AI_PROVIDERS)).default(AI_PROVIDERS.GEMINI),
    assignedModules: Joi.array().items(Joi.string().valid(...Object.values(MODULES))).required(),
    limits: Joi.object({
        dailyTokenLimit: Joi.number().min(1000),
        requestsPerMinute: Joi.number().min(1).max(1000),
    }),
    priority: Joi.number().min(1).max(10).default(1),
    description: Joi.string(),
});

const updateKeySchema = Joi.object({
    keyName: Joi.string(),
    apiKey: Joi.string(),
    assignedModules: Joi.array().items(Joi.string().valid(...Object.values(MODULES))),
    limits: Joi.object({
        dailyTokenLimit: Joi.number().min(1000),
        requestsPerMinute: Joi.number().min(1).max(1000),
    }),
    priority: Joi.number().min(1).max(10),
    description: Joi.string(),
});

// Routes
router.post('/', validate(addKeySchema), aiKeyController.addKey);
router.get('/', aiKeyController.getAllKeys);
router.get('/usage/stats', aiKeyController.getUsageStats);
router.get('/usage/by-module', aiKeyController.getUsageByModule);
router.get('/performance', aiKeyController.getKeyPerformance);
router.get('/:id', aiKeyController.getKeyById);
router.put('/:id', validate(updateKeySchema), aiKeyController.updateKey);
router.patch('/:id/toggle', aiKeyController.toggleStatus);
router.delete('/:id', aiKeyController.deleteKey);

module.exports = router;
