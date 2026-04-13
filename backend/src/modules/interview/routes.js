const express = require('express');
const Joi = require('joi');
const interviewController = require('./controller');
const { protect } = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const { aiLimiter } = require('../../core/middleware/rate-limit');

const router = express.Router();

router.use(protect);

const startSchema = Joi.object({
    company: Joi.string().required().min(1).max(100),
    role: Joi.string().required().min(2).max(100),
    round: Joi.string().valid('technical', 'behavioral', 'system-design', 'hr').default('technical'),
    experienceLevel: Joi.string().valid('fresher', 'mid', 'senior').default('mid'),
    count: Joi.number().integer().min(3).max(15).default(8),
});

const evaluateSchema = Joi.object({
    sessionId: Joi.string().required(),
    questionIndex: Joi.number().integer().min(0).required(),
    answer: Joi.string().required().min(5),
});

const completeSchema = Joi.object({
    sessionId: Joi.string().required(),
    durationSeconds: Joi.number().integer().min(0).optional(),
});

const plagiarismSchema = Joi.object({
    question: Joi.string().required().min(5),
    answer: Joi.string().required().min(10),
});

const evaluateCodeSchema = Joi.object({
    code: Joi.string().required().min(1).max(50000),
    language: Joi.string().required().valid('python', 'java', 'cpp', 'javascript'),
    verdict: Joi.string().required(),
    errorOutput: Joi.string().optional().allow('').max(10000),
    question: Joi.string().optional().allow('').max(5000),
    testResults: Joi.array().items(Joi.object({
        id: Joi.number(),
        input: Joi.string().allow(''),
        expected: Joi.string().allow(''),
        got: Joi.string().allow(''),
        passed: Joi.boolean(),
    })).optional(),
    executionTime: Joi.string().optional().allow(''),
    memory: Joi.string().optional().allow(''),
});

router.post('/start',             aiLimiter, validate(startSchema),          interviewController.startSession);
router.post('/evaluate',          aiLimiter, validate(evaluateSchema),       interviewController.evaluateAnswer);
router.post('/complete',                     validate(completeSchema),       interviewController.completeSession);
router.post('/plagiarism-check',  aiLimiter, validate(plagiarismSchema),     interviewController.checkPlagiarism);
router.post('/evaluate-code',     aiLimiter, validate(evaluateCodeSchema),   interviewController.evaluateCode);
router.get('/sessions',                                                       interviewController.getSessions);
router.get('/sessions/:id',                                                   interviewController.getSession);
router.delete('/sessions/:id',                                                interviewController.deleteSession);

module.exports = router;
