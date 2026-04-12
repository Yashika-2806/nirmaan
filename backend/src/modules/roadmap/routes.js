const express = require('express');
const Joi = require('joi');
const roadmapController = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');

const router = express.Router();
router.use(protect);

const generateSchema = Joi.object({
    currentRole: Joi.string().trim().required().min(2).max(100),
    targetGoal: Joi.string().trim().min(2).max(200).optional(),
    goal: Joi.string().trim().min(2).max(200).optional(),
    timelineMonths: Joi.number().integer().min(1).max(24).optional(),
    duration: Joi.number().integer().min(1).max(24).optional(),
    currentSkills: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
    experienceNotes: Joi.string().trim().max(500).optional().allow(''),
})
    .or('targetGoal', 'goal')
    .or('timelineMonths', 'duration');

const toggleSchema = Joi.object({
    milestoneIndex: Joi.number().integer().min(0).required(),
});

router.post('/generate',            aiLimiter, validate(generateSchema),    roadmapController.generateRoadmap);
router.get('/',                                                              roadmapController.getRoadmaps);
router.get('/:id',                                                           roadmapController.getRoadmap);
router.patch('/:id/milestone',                 validate(toggleSchema),       roadmapController.toggleMilestone);
router.delete('/:id',                                                        roadmapController.deleteRoadmap);

module.exports = router;
