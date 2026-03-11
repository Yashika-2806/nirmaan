const express = require('express');
const Joi = require('joi');
const controller = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');

const router = express.Router();
router.use(protect);

const skillItemSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
});

const availabilitySchema = Joi.object({
    day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    timezone: Joi.string().max(100).optional(),
});

const upsertProfileSchema = Joi.object({
    teachSkills: Joi.array().items(skillItemSchema).max(100).optional(),
    learnSkills: Joi.array().items(skillItemSchema).max(100).optional(),
    experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
    availability: Joi.array().items(availabilitySchema).max(50).optional(),
});

const detectSkillsSchema = Joi.object({
    githubData: Joi.object().unknown(true).optional(),
    codingProfiles: Joi.object().unknown(true).optional(),
    resumeData: Joi.object().unknown(true).optional(),
    autoSave: Joi.boolean().default(false),
});

const createRequestSchema = Joi.object({
    skill: Joi.string().trim().min(2).max(80).required(),
    description: Joi.string().trim().min(10).max(1000).required(),
    preferredTime: Joi.string().trim().min(2).max(200).required(),
    rewardType: Joi.string().valid('skill-exchange', 'points').required(),
});

const scheduleSessionSchema = Joi.object({
    mentorId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    learnerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    skill: Joi.string().trim().min(2).max(80).required(),
    time: Joi.date().iso().required(),
    duration: Joi.number().integer().min(15).max(240).required(),
    meetingLink: Joi.string().uri().required(),
    requestId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    isAIMentorSession: Joi.boolean().optional(),
});

const leaveReviewSchema = Joi.object({
    sessionId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    feedback: Joi.string().trim().min(5).max(1000).required(),
});

const aiMentorSchema = Joi.object({
    learnSkill: Joi.string().trim().min(2).max(80).required(),
    currentLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').default('beginner'),
    goal: Joi.string().trim().max(300).allow('').optional(),
    userQuestion: Joi.string().trim().max(1000).allow('').optional(),
});

// User skill profile
router.get('/profile/me', controller.getMyProfile);
router.put('/profile/me', validate(upsertProfileSchema), controller.upsertProfile);

// AI skill detection + matching
router.post('/ai/detect-skills', aiLimiter, validate(detectSkillsSchema), controller.detectSkills);
router.get('/matches', controller.getMatches);

// Request board
router.post('/requests', validate(createRequestSchema), controller.createRequest);
router.get('/requests', controller.listRequests);
router.post('/requests/:id/claim', controller.claimRequest);
router.post('/requests/:id/complete', controller.completeRequest);

// Scheduling + sessions
router.post('/sessions', validate(scheduleSessionSchema), controller.scheduleSession);
router.get('/sessions', controller.listSessions);
router.post('/sessions/:id/complete', controller.completeSession);

// Reviews
router.post('/reviews', validate(leaveReviewSchema), controller.leaveReview);
router.get('/reviews/me', controller.listMyReviews);

// Points and AI mentor mode
router.get('/points/me', controller.getPointsSummary);
router.post('/ai-mentor/generate', aiLimiter, validate(aiMentorSchema), controller.generateAIMentorPlan);

// External profile fetching (GitHub, LeetCode, Codeforces)
router.get('/fetch-profiles', controller.fetchExternalProfiles);

module.exports = router;
