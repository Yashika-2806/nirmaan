const express = require('express');
const Joi = require('joi');
const controller = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');

const router = express.Router();
router.use(protect);

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const activitySchema = Joi.object({
    activityType: Joi.string().valid(
        'dsa_problem_solved',
        'mock_interview_completed',
        'resume_improved',
        'skill_marketplace_helped',
        'pdf_exam_session_completed',
        'research_task_completed',
        'roadmap_milestone_completed',
        'career_twin_session_completed'
    ).required(),
    metadata: Joi.object().unknown(true).default({}),
});

const claimRewardSchema = Joi.object({
    questId: Joi.string().pattern(objectIdRegex).optional(),
});

const leaderboardQuerySchema = Joi.object({
    scope: Joi.string().valid('global', 'college').default('global'),
    metric: Joi.string().valid('xp', 'dsa', 'skill').default('xp'),
    limit: Joi.number().integer().min(1).max(50).default(20),
});

// Write activity events
router.post('/activity', validate(activitySchema), controller.recordActivity);

// Read profile and leaderboard
router.get('/profile/:userId', controller.getProfile);
router.get('/leaderboard', async (req, res, next) => {
    const { error, value } = leaderboardQuerySchema.validate(req.query, { stripUnknown: true });
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    req.query = value;
    return controller.getLeaderboard(req, res, next);
});

// Weekly quests and claiming rewards
router.get('/quests', controller.listQuests);
router.post('/claim-reward', validate(claimRewardSchema), controller.claimReward);

// Utility
router.get('/activities', controller.listSupportedActivities);

module.exports = router;
