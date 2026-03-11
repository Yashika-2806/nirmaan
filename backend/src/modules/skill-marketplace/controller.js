const ApiResponse = require('../../core/utils/response');
const skillMarketplaceService = require('./service');

const skillMarketplaceController = {
    async upsertProfile(req, res, next) {
        try {
            const profile = await skillMarketplaceService.upsertProfile(req.user.userId, req.body);
            return ApiResponse.success(res, profile, 'Skill profile saved');
        } catch (error) {
            return next(error);
        }
    },

    async getMyProfile(req, res, next) {
        try {
            const profile = await skillMarketplaceService.getProfileByUserId(req.user.userId);
            return ApiResponse.success(res, profile, 'Skill profile fetched');
        } catch (error) {
            return next(error);
        }
    },

    async detectSkills(req, res, next) {
        try {
            const result = await skillMarketplaceService.detectSkills(req.user.userId, req.body);
            return ApiResponse.success(res, result, 'Skills detected successfully');
        } catch (error) {
            return next(error);
        }
    },

    async getMatches(req, res, next) {
        try {
            const limit = parseInt(req.query.limit, 10) || 5;
            const matches = await skillMarketplaceService.getTopMatches(req.user.userId, Math.min(limit, 10));

            return ApiResponse.success(res, {
                matches,
                aiMentorRecommended: matches.length === 0,
            }, 'Top matches fetched');
        } catch (error) {
            return next(error);
        }
    },

    async createRequest(req, res, next) {
        try {
            const request = await skillMarketplaceService.createRequest(req.user.userId, req.body);
            return ApiResponse.created(res, request, 'Skill request posted');
        } catch (error) {
            return next(error);
        }
    },

    async listRequests(req, res, next) {
        try {
            const requests = await skillMarketplaceService.listRequests({
                status: req.query.status,
                skill: req.query.skill,
            });
            return ApiResponse.success(res, requests, 'Skill requests fetched');
        } catch (error) {
            return next(error);
        }
    },

    async claimRequest(req, res, next) {
        try {
            const request = await skillMarketplaceService.claimRequest(req.params.id, req.user.userId);
            return ApiResponse.success(res, request, 'Request claimed successfully');
        } catch (error) {
            return next(error);
        }
    },

    async completeRequest(req, res, next) {
        try {
            const request = await skillMarketplaceService.completeRequest(req.params.id, req.user.userId);
            return ApiResponse.success(res, request, 'Request marked completed');
        } catch (error) {
            return next(error);
        }
    },

    async scheduleSession(req, res, next) {
        try {
            const session = await skillMarketplaceService.scheduleSession(req.body);
            return ApiResponse.created(res, session, 'Learning session scheduled');
        } catch (error) {
            return next(error);
        }
    },

    async listSessions(req, res, next) {
        try {
            const sessions = await skillMarketplaceService.listSessions(req.user.userId);
            return ApiResponse.success(res, sessions, 'Sessions fetched');
        } catch (error) {
            return next(error);
        }
    },

    async completeSession(req, res, next) {
        try {
            const session = await skillMarketplaceService.completeSession(req.params.id, req.user.userId);
            return ApiResponse.success(res, session, 'Session marked completed');
        } catch (error) {
            return next(error);
        }
    },

    async leaveReview(req, res, next) {
        try {
            const review = await skillMarketplaceService.leaveReview(req.user.userId, req.body);
            return ApiResponse.created(res, review, 'Review submitted');
        } catch (error) {
            return next(error);
        }
    },

    async listMyReviews(req, res, next) {
        try {
            const reviews = await skillMarketplaceService.listReviewsForUser(req.user.userId);
            return ApiResponse.success(res, reviews, 'Reviews fetched');
        } catch (error) {
            return next(error);
        }
    },

    async getPointsSummary(req, res, next) {
        try {
            const points = await skillMarketplaceService.getPointsSummary(req.user.userId);
            return ApiResponse.success(res, points, 'Points summary fetched');
        } catch (error) {
            return next(error);
        }
    },

    async generateAIMentorPlan(req, res, next) {
        try {
            const response = await skillMarketplaceService.generateAIMentorResponse(req.body);
            return ApiResponse.success(res, response, 'AI mentor response generated');
        } catch (error) {
            return next(error);
        }
    },

    async fetchExternalProfiles(req, res, next) {
        try {
            const { github, leetcode, codeforces } = req.query;
            if (!github && !leetcode && !codeforces) {
                return ApiResponse.error(res, 'At least one username (github, leetcode, or codeforces) is required', 400);
            }
            const data = await skillMarketplaceService.fetchExternalProfiles(
                github,
                leetcode,
                codeforces
            );
            return ApiResponse.success(res, data, 'External profiles fetched');
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = skillMarketplaceController;
