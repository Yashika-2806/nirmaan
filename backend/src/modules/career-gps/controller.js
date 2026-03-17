const ApiResponse = require('../../core/utils/response');
const careerGPSService = require('./service');

const ensureSelf = (req) => {
    const requestedUserId = req.params.userId;
    if (requestedUserId && requestedUserId !== req.user.userId) {
        throw new Error('Forbidden access to user data');
    }
};

const careerGPSController = {
    async setGoal(req, res, next) {
        try {
            const { targetRole, notes } = req.body;
            const goal = await careerGPSService.setGoal(req.user.userId, { targetRole, notes });
            return ApiResponse.created(res, goal, 'Career goal set successfully');
        } catch (error) {
            next(error);
        }
    },

    async getRoadmap(req, res, next) {
        try {
            ensureSelf(req);
            const data = await careerGPSService.getRoadmap(req.params.userId);
            return ApiResponse.success(res, data, 'Career roadmap fetched');
        } catch (error) {
            if (error.message.includes('Forbidden')) {
                return ApiResponse.forbidden(res, error.message);
            }
            next(error);
        }
    },

    async updateProgress(req, res, next) {
        try {
            const result = await careerGPSService.updateProgress(req.user.userId, req.body);
            return ApiResponse.success(res, result, 'Career progress updated');
        } catch (error) {
            next(error);
        }
    },

    async getProbability(req, res, next) {
        try {
            ensureSelf(req);
            const data = await careerGPSService.getProbability(req.params.userId);
            return ApiResponse.success(res, data, 'Career probability fetched');
        } catch (error) {
            if (error.message.includes('Forbidden')) {
                return ApiResponse.forbidden(res, error.message);
            }
            next(error);
        }
    },

    async getMissions(req, res, next) {
        try {
            ensureSelf(req);
            const data = await careerGPSService.getMissions(req.params.userId);
            return ApiResponse.success(res, data, 'Career missions fetched');
        } catch (error) {
            if (error.message.includes('Forbidden')) {
                return ApiResponse.forbidden(res, error.message);
            }
            next(error);
        }
    },
};

module.exports = careerGPSController;
