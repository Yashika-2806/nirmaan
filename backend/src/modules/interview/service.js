const geminiService = require('../../core/ai/gemini-service');
const InterviewSession = require('./model');

class InterviewService {
    /**
     * Start a new interview session: generate questions + persist session.
     */
    async startSession({ userId, company, role, round, experienceLevel, count }) {
        const result = await geminiService.generateInterviewQuestions({
            company, role, round, experienceLevel, count,
        });

        if (result.error) throw new Error(result.error);

        const session = await InterviewSession.create({
            userId,
            company,
            role,
            round,
            experienceLevel,
            questions: result.questions,
            status: 'in-progress',
        });

        return session;
    }

    /**
     * Evaluate a single answer in an existing session and persist the result.
     */
    async evaluateAnswer({ sessionId, userId, questionIndex, answer }) {
        const session = await InterviewSession.findOne({ _id: sessionId, userId });
        if (!session) throw new Error('Session not found');
        if (questionIndex < 0 || questionIndex >= session.questions.length) {
            throw new Error('Invalid question index');
        }

        const q = session.questions[questionIndex];

        const evaluation = await geminiService.evaluateInterviewAnswer({
            company: session.company,
            role: session.role,
            round: session.round,
            question: q.question,
            hint: q.hint,
            answer,
            experienceLevel: session.experienceLevel,
        });

        if (evaluation.error) throw new Error(evaluation.error);

        // Persist answer + evaluation into the question sub-document
        session.questions[questionIndex].answer = answer;
        session.questions[questionIndex].score = evaluation.score;
        session.questions[questionIndex].verdict = evaluation.verdict;
        session.questions[questionIndex].strengths = evaluation.strengths || [];
        session.questions[questionIndex].improvements = evaluation.improvements || [];
        session.questions[questionIndex].idealAnswer = evaluation.idealAnswer || '';
        session.questions[questionIndex].followUpQuestion = evaluation.followUpQuestion || '';
        session.questions[questionIndex].tip = evaluation.tip || '';
        session.questions[questionIndex].answeredAt = new Date();

        await session.save();
        return { evaluation, session };
    }

    /**
     * Mark session as completed.
     */
    async completeSession({ sessionId, userId, durationSeconds }) {
        const session = await InterviewSession.findOne({ _id: sessionId, userId });
        if (!session) throw new Error('Session not found');

        session.status = 'completed';
        session.completedAt = new Date();
        if (durationSeconds) session.durationSeconds = durationSeconds;

        await session.save();
        return session;
    }

    /**
     * Get all sessions for a user (summary list).
     */
    async getSessions(userId) {
        return InterviewSession.find({ userId })
            .sort({ createdAt: -1 })
            .select('company role round experienceLevel status overallScore completedAt createdAt questions')
            .lean();
    }

    /**
     * Get full session detail.
     */
    async getSession(sessionId, userId) {
        const session = await InterviewSession.findOne({ _id: sessionId, userId }).lean();
        if (!session) throw new Error('Session not found');
        return session;
    }

    /**
     * Delete a session.
     */
    async deleteSession(sessionId, userId) {
        const session = await InterviewSession.findOneAndDelete({ _id: sessionId, userId });
        if (!session) throw new Error('Session not found');
        return true;
    }
}

module.exports = new InterviewService();
