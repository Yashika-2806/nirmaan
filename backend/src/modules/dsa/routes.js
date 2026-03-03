const express = require('express');
const Joi = require('joi');
const dsaController = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation schemas
const explainProblemSchema = Joi.object({
    problemStatement: Joi.string().required().min(10),
});

const submitSolutionSchema = Joi.object({
    problemId: Joi.string().required(),
    title: Joi.string().required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    topics: Joi.array().items(Joi.string()),
    code: Joi.string().required(),
    language: Joi.string().required(),
});

const followUpSchema = Joi.object({
    problemStatement: Joi.string().required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
});

// Routes
router.post('/explain', aiLimiter, validate(explainProblemSchema), dsaController.explainProblem);
router.post('/approach', aiLimiter, validate(explainProblemSchema), dsaController.getSolutionApproach);
router.post('/submit', aiLimiter, validate(submitSolutionSchema), dsaController.submitSolution);
router.post('/follow-up', aiLimiter, validate(followUpSchema), dsaController.getFollowUpQuestions);
router.get('/analytics', dsaController.getUserAnalytics);

module.exports = router;
