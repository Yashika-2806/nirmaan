const Joi = require('joi');
const ApiResponse = require('../utils/response');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return ApiResponse.badRequest(res, 'Validation failed', errors);
        }

        next();
    };
};

// Common validation schemas
const schemas = {
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    }),
};

module.exports = {
    validate,
    schemas,
};
