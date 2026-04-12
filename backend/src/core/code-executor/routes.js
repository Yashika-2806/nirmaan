const express = require('express');
const Joi = require('joi');
const executorController = require('./controller');
const { validate } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// Validation schemas
const executeSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000).messages({
        'string.empty': 'Source code is required',
        'string.max': 'Source code exceeds maximum length of 50KB',
    }),
    language: Joi.string().lowercase().optional().valid(
        'python', 'java', 'cpp', 'c++', 'javascript', 'js', 'c', 
        'csharp', 'c#', 'golang', 'go', 'rust', 'swift', 'kotlin'
    ),
    languageId: Joi.number().integer().optional().min(1).max(78),
    stdin: Joi.string().optional().allow('').max(10000),
});

const runSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000),
    language: Joi.string().required().lowercase().valid(
        'python', 'java', 'cpp', 'c++', 'javascript', 'js', 'c',
        'csharp', 'c#', 'golang', 'go', 'rust', 'swift', 'kotlin'
    ),
    stdin: Joi.string().optional().allow('').max(10000),
});

const submitSchema = Joi.object({
    sourceCode: Joi.string().required().max(50000),
    language: Joi.string().required().lowercase().valid(
        'python', 'java', 'cpp', 'c++', 'javascript', 'js', 'c',
        'csharp', 'c#', 'golang', 'go', 'rust', 'swift', 'kotlin'
    ),
    testCases: Joi.array()
        .items(
            Joi.object({
                input: Joi.string().optional().allow('').max(10000),
                expected: Joi.string().required().max(10000),
            })
        )
        .min(1)
        .required(),
});

// Routes
router.post('/judge0', apiLimiter, validate(executeSchema), executorController.judge0);
router.post('/run', apiLimiter, validate(runSchema), executorController.run);
router.post('/submit', apiLimiter, validate(submitSchema), executorController.submit);

// Health check
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Executor service is running' });
});

module.exports = router;
