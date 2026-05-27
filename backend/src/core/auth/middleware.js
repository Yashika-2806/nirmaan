const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const ApiResponse = require('../utils/response');
const { AppError } = require('../middleware/error');
const { ERROR_CODES, ROLES } = require('../../config/constants');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Get token from Authorization header (standard flow)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // 2. Fallback: query param token — only for SSE endpoints (EventSource can't set headers)
        if (!token && req.query.token && typeof req.query.token === 'string') {
            // Only allow for GET requests (SSE is always GET)
            if (req.method === 'GET') {
                token = req.query.token;
            }
        }

        if (!token) {
            return ApiResponse.unauthorized(res, 'Not authorized to access this route');
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
            next();
        } catch (error) {
            return ApiResponse.unauthorized(res, 'Invalid or expired token');
        }
    } catch (error) {
        next(error);
    }
};


// Restrict to specific roles
const restrictTo = (...roles) => {
    return async (req, res, next) => {
        const User = require('./model');

        try {
            const user = await User.findById(req.user.userId);

            if (!user) {
                return ApiResponse.unauthorized(res, 'User not found');
            }

            if (!roles.includes(user.role)) {
                return ApiResponse.forbidden(res, 'You do not have permission to perform this action');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Check subscription tier
const checkSubscription = (...tiers) => {
    return async (req, res, next) => {
        const User = require('./model');

        try {
            const user = await User.findById(req.user.userId);

            if (!user) {
                return ApiResponse.unauthorized(res, 'User not found');
            }

            if (!tiers.includes(user.subscription.tier)) {
                return ApiResponse.forbidden(
                    res,
                    'This feature requires a higher subscription tier. Please upgrade your plan.'
                );
            }

            // Check if subscription is valid
            if (user.subscription.validUntil && user.subscription.validUntil < new Date()) {
                return ApiResponse.forbidden(res, 'Your subscription has expired. Please renew.');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    protect,
    restrictTo,
    checkSubscription,
};
