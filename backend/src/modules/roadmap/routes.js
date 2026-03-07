const express = require('express');
const Joi = require('joi');
const roadmapController = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');

const router = express.Router();
router.use(protect);

const generateSchema = Joi.object({
    currentRole: Joi.string().required().min(2).max(100),
    targetGoal: Joi.string().required().min(5).max(200),
    timelineMonths: Joi.number().integer().valid(3, 6, 12, 18, 24).required(),
    currentSkills: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    experienceNotes: Joi.string().max(500).optional().allow(''),
});

const toggleSchema = Joi.object({
    milestoneIndex: Joi.number().integer().min(0).required(),
});

router.post('/generate',            aiLimiter, validate(generateSchema),    roadmapController.generateRoadmap);
router.get('/',                                                              roadmapController.getRoadmaps);
router.get('/:id',                                                           roadmapController.getRoadmap);
router.patch('/:id/milestone',                 validate(toggleSchema),       roadmapController.toggleMilestone);
router.delete('/:id',                                                        roadmapController.deleteRoadmap);

module.exports = router;
