const logger = require('../utils/logger');
const ApiResponse = require('../utils/response');
const { ERROR_CODES } = require('../../config/constants');

class AppError extends Error {
    constructor(message, statusCode, errorCode = ERROR_CODES.INTERNAL_ERROR) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404, ERROR_CODES.NOT_FOUND);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new AppError(message, 409, ERROR_CODES.VALIDATION_ERROR);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        const message = 'Validation failed';
        return ApiResponse.badRequest(res, message, errors);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
    }

    // Operational errors
    if (error.isOperational) {
        return ApiResponse.error(
            res,
            error.message,
            error.statusCode || 500,
            error.errorCode
        );
    }

    // Programming or unknown errors
    return ApiResponse.internalError(
        res,
        process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : err.message
    );
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
};
