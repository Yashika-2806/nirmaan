const geminiService = require('../../core/ai/gemini-service');
const Roadmap = require('./model');
const { AppError } = require('../../core/middleware/error');
const { ERROR_CODES } = require('../../config/constants');

class RoadmapService {
    async generateRoadmap({ userId, currentRole, targetGoal, timelineMonths, currentSkills = [], experienceNotes = '' }) {
        const result = await geminiService.generateRoadmap({
            currentRole,
            targetGoal,
            timelineMonths,
            skills: currentSkills,
            experience: experienceNotes,
        });

        if (result.error) {
            throw new AppError(result.error, 502, ERROR_CODES.AI_SERVICE_ERROR);
        }

        const roadmap = await Roadmap.create({
            userId,
            title: result.title,
            summary: result.summary,
            currentRole,
            targetGoal,
            timelineMonths,
            currentSkills,
            experienceNotes,
            milestones: result.milestones || [],
            totalSkills: result.totalSkills || [],
            keyInsights: result.keyInsights || [],
        });

        return roadmap;
    }

    async getRoadmaps(userId) {
        return Roadmap.find({ userId }).sort({ createdAt: -1 });
    }

    async getRoadmap(id, userId) {
        const roadmap = await Roadmap.findOne({ _id: id, userId });
        if (!roadmap) throw new AppError('Roadmap not found', 404, ERROR_CODES.NOT_FOUND);
        return roadmap;
    }

    async toggleMilestone(id, userId, milestoneIndex) {
        const roadmap = await Roadmap.findOne({ _id: id, userId });
        if (!roadmap) throw new AppError('Roadmap not found', 404, ERROR_CODES.NOT_FOUND);
        if (milestoneIndex < 0 || milestoneIndex >= roadmap.milestones.length) {
            throw new AppError('Invalid milestone index', 400, ERROR_CODES.VALIDATION_ERROR);
        }
        const m = roadmap.milestones[milestoneIndex];
        m.completed = !m.completed;
        m.completedAt = m.completed ? new Date() : null;

        // Mark roadmap completed if all milestones done
        const allDone = roadmap.milestones.every(ms => ms.completed);
        roadmap.status = allDone ? 'completed' : 'active';

        await roadmap.save();
        return roadmap;
    }

    async deleteRoadmap(id, userId) {
        const roadmap = await Roadmap.findOneAndDelete({ _id: id, userId });
        if (!roadmap) throw new AppError('Roadmap not found', 404, ERROR_CODES.NOT_FOUND);
        return roadmap;
    }
}

module.exports = new RoadmapService();
