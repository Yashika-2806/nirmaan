const express = require('express');
const Joi = require('joi');
const geminiService = require('../core/ai/gemini-service');
const { protect } = require('../core/auth/middleware');
const { validate } = require('../core/middleware/validation');
const ApiResponse = require('../core/utils/response');

const router = express.Router();
router.use(protect);

const simulateSchema = Joi.object({
    scenario: Joi.string().min(10).max(1200).required(),
});

router.post('/create', async (req, res, next) => {
    try {
        const twin = await geminiService.generateCareerTwinProfile({
            name: req.user?.name || 'Student',
            role: req.user?.role || 'learner',
        });

        if (twin.error) {
            return ApiResponse.badRequest(res, twin.error);
        }

        return ApiResponse.success(res, { twin }, 'Career twin created');
    } catch (error) {
        return next(error);
    }
});

router.post('/simulate', validate(simulateSchema), async (req, res, next) => {
    try {
        const simulation = await geminiService.simulateCareerTwinScenario({
            scenario: req.body.scenario,
            name: req.user?.name || 'Student',
        });

        if (simulation.error) {
            return ApiResponse.badRequest(res, simulation.error);
        }

        return ApiResponse.success(res, { simulation }, 'Career simulation generated');
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
