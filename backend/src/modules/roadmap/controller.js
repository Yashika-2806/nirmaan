const roadmapService = require('./service');
const ApiResponse = require('../../core/utils/response');

const roadmapController = {
    async generateRoadmap(req, res, next) {
        try {
            const {
                currentRole,
                targetGoal,
                goal,
                timelineMonths,
                duration,
                currentSkills,
                experienceNotes,
            } = req.body;
            const roadmap = await roadmapService.generateRoadmap({
                userId: req.user.userId,
                currentRole,
                targetGoal: targetGoal || goal,
                timelineMonths: parseInt(timelineMonths || duration),
                currentSkills: currentSkills || [],
                experienceNotes: experienceNotes || '',
            });
            return ApiResponse.created(res, roadmap, 'Roadmap generated successfully');
        } catch (err) {
            next(err);
        }
    },

    async getRoadmaps(req, res, next) {
        try {
            const roadmaps = await roadmapService.getRoadmaps(req.user.userId);
            return ApiResponse.success(res, roadmaps, 'Roadmaps fetched');
        } catch (err) {
            next(err);
        }
    },

    async getRoadmap(req, res, next) {
        try {
            const roadmap = await roadmapService.getRoadmap(req.params.id, req.user.userId);
            return ApiResponse.success(res, roadmap, 'Roadmap fetched');
        } catch (err) {
            next(err);
        }
    },

    async toggleMilestone(req, res, next) {
        try {
            const { milestoneIndex } = req.body;
            const roadmap = await roadmapService.toggleMilestone(
                req.params.id,
                req.user.userId,
                parseInt(milestoneIndex)
            );
            return ApiResponse.success(res, roadmap, 'Milestone updated');
        } catch (err) {
            next(err);
        }
    },

    async deleteRoadmap(req, res, next) {
        try {
            await roadmapService.deleteRoadmap(req.params.id, req.user.userId);
            return ApiResponse.success(res, null, 'Roadmap deleted');
        } catch (err) {
            next(err);
        }
    },
};

module.exports = roadmapController;
