const ApiResponse = require('../../core/utils/response');
const { ROLES } = require('../../config/constants');
const gamificationService = require('./service');

const gamificationController = {
    async recordActivity(req, res, next) {
        try {
            const result = await gamificationService.recordActivity(req.user.userId, req.body, { asyncProcess: true });
            return ApiResponse.success(res, result, 'Activity accepted for processing', 202);
        } catch (error) {
            return next(error);
        }
    },

    async getProfile(req, res, next) {
        try {
            const targetUserId = req.params.userId;
            const isSelf = String(targetUserId) === String(req.user.userId);
            const isAdmin = req.user.role === ROLES.ADMIN;

            if (!isSelf && !isAdmin) {
                return ApiResponse.forbidden(res, 'You can only view your own gamification profile');
            }

            const profile = await gamificationService.getProfile(targetUserId);
            return ApiResponse.success(res, profile, 'Gamification profile fetched');
        } catch (error) {
            return next(error);
        }
    },

    async getLeaderboard(req, res, next) {
        try {
            const data = await gamificationService.getWeeklyLeaderboard(req.user.userId, {
                scope: req.query.scope || 'global',
                metric: req.query.metric || 'xp',
                limit: req.query.limit || 20,
            });
            return ApiResponse.success(res, data, 'Leaderboard fetched');
        } catch (error) {
            return next(error);
        }
    },

    async listQuests(req, res, next) {
        try {
            const quests = await gamificationService.listQuests(req.user.userId);
            return ApiResponse.success(res, quests, 'Quests fetched');
        } catch (error) {
            return next(error);
        }
    },

    async claimReward(req, res, next) {
        try {
            const result = await gamificationService.claimWeeklyQuestReward(req.user.userId, req.body.questId);
            return ApiResponse.success(res, result, 'Quest reward claimed successfully');
        } catch (error) {
            return next(error);
        }
    },

    async listSupportedActivities(req, res, next) {
        try {
            return ApiResponse.success(
                res,
                { activities: gamificationService.getSupportedActivities() },
                'Supported activity types fetched'
            );
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = gamificationController;
