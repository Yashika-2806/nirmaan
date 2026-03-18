const express = require('express');
const Joi = require('joi');
const controller = require('./controller');
const { validate } = require('../../core/middleware/validation');
const { protect, restrictTo } = require('../../core/auth/middleware');
const { ROLES } = require('../../config/constants');

const router = express.Router();

const eventSchema = Joi.object({
    event: Joi.string().trim().max(120).required(),
    source: Joi.string().trim().max(120).default('unknown'),
    props: Joi.object().unknown(true).default({}),
    sessionId: Joi.string().trim().max(120).allow(null, ''),
    occurredAt: Joi.date().optional(),
});

const funnelQuerySchema = Joi.object({
    lookbackDays: Joi.number().integer().min(1).max(365).default(30),
});

router.post('/events', validate(eventSchema), controller.trackEvent);

router.get('/funnel', protect, restrictTo(ROLES.ADMIN), async (req, res, next) => {
    const { error, value } = funnelQuerySchema.validate(req.query, { stripUnknown: true });
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    req.query = value;
    return controller.getFunnelMetrics(req, res, next);
});

module.exports = router;
