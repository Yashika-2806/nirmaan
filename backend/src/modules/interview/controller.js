const interviewService = require('./service');
const ApiResponse = require('../../core/utils/response');

const interviewController = {
    async startSession(req, res, next) {
        try {
            const { company, role, round, experienceLevel, count } = req.body;
            const session = await interviewService.startSession({
                userId: req.user.userId,
                company,
                role,
                round: round || 'technical',
                experienceLevel: experienceLevel || 'mid',
                count: count || 8,
            });
            return ApiResponse.created(res, session, 'Interview session started');
        } catch (err) {
            next(err);
        }
    },

    async evaluateAnswer(req, res, next) {
        try {
            const { sessionId, questionIndex, answer } = req.body;
            const result = await interviewService.evaluateAnswer({
                sessionId,
                userId: req.user.userId,
                questionIndex,
                answer,
            });
            return ApiResponse.success(res, result, 'Answer evaluated');
        } catch (err) {
            next(err);
        }
    },

    async completeSession(req, res, next) {
        try {
            const { sessionId, durationSeconds } = req.body;
            const session = await interviewService.completeSession({
                sessionId,
                userId: req.user.userId,
                durationSeconds,
            });
            return ApiResponse.success(res, session, 'Session completed');
        } catch (err) {
            next(err);
        }
    },

    async getSessions(req, res, next) {
        try {
            const sessions = await interviewService.getSessions(req.user.userId);
            return ApiResponse.success(res, sessions, 'Sessions fetched');
        } catch (err) {
            next(err);
        }
    },

    async getSession(req, res, next) {
        try {
            const session = await interviewService.getSession(req.params.id, req.user.userId);
            return ApiResponse.success(res, session, 'Session fetched');
        } catch (err) {
            next(err);
        }
    },

    async deleteSession(req, res, next) {
        try {
            await interviewService.deleteSession(req.params.id, req.user.userId);
            return ApiResponse.success(res, null, 'Session deleted');
        } catch (err) {
            next(err);
        }
    },

    async checkPlagiarism(req, res, next) {
        try {
            const { question, answer } = req.body;
            const geminiService = require('../../core/ai/gemini-service');
            const result = await geminiService.checkAnswerOriginality({ question, answer });
            return ApiResponse.success(res, result, 'Plagiarism check complete');
        } catch (err) {
            next(err);
        }
    },
};

module.exports = interviewController;
