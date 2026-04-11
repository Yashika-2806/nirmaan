const rateLimit = require('express-rate-limit');
const config = require('../../config/env');
const ApiResponse = require('../utils/response');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        ApiResponse.tooManyRequests(res, 'Rate limit exceeded. Please try again later.');
    },
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.rateLimit.authMax,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later',
    handler: (req, res) => {
        ApiResponse.tooManyRequests(res, 'Too many login attempts. Please try again after 15 minutes.');
    },
});

// AI endpoint limiter
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.rateLimit.aiMax,
    message: 'AI request limit exceeded',
    handler: (req, res) => {
        ApiResponse.tooManyRequests(res, 'AI request limit exceeded. Upgrade your plan for higher limits.');
    },
});

module.exports = {
    apiLimiter,
    authLimiter,
    aiLimiter,
};
