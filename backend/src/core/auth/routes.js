const express = require('express');
const Joi = require('joi');
const authController = require('./controller');
const { protect } = require('./middleware');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2),
    profile: Joi.object({
        avatar: Joi.string().uri(),
        bio: Joi.string().max(500),
        currentRole: Joi.string(),
        targetRole: Joi.string(),
        experience: Joi.number().min(0),
        skills: Joi.array().items(Joi.string()),
        education: Joi.object({
            degree: Joi.string(),
            institution: Joi.string(),
            year: Joi.number(),
        }),
    }),
    preferences: Joi.object({
        learningStyle: Joi.string().valid('visual', 'auditory', 'kinesthetic', 'reading'),
        weeklyGoal: Joi.number().min(1).max(100),
        notifications: Joi.object({
            email: Joi.boolean(),
            push: Joi.boolean(),
        }),
    }),
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.use(protect);
router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
