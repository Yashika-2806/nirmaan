const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    id: Number,
    question: String,
    hint: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    category: String,
    answer: { type: String, default: '' },
    score: { type: Number, default: null },
    verdict: { type: String, default: null },
    strengths: [String],
    improvements: [String],
    idealAnswer: { type: String, default: '' },
    followUpQuestion: { type: String, default: '' },
    tip: { type: String, default: '' },
    answeredAt: { type: Date, default: null },
});

const interviewSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        company: { type: String, required: true, trim: true },
        role: { type: String, required: true, trim: true },
        round: {
            type: String,
            required: true,
            enum: ['technical', 'behavioral', 'system-design', 'hr'],
            default: 'technical',
        },
        experienceLevel: {
            type: String,
            enum: ['fresher', 'mid', 'senior'],
            default: 'mid',
        },
        questions: [questionSchema],
        status: {
            type: String,
            enum: ['in-progress', 'completed', 'abandoned'],
            default: 'in-progress',
        },
        overallScore: { type: Number, default: null },
        completedAt: { type: Date, default: null },
        durationSeconds: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Compute overall score before saving
interviewSessionSchema.pre('save', function (next) {
    const answered = this.questions.filter(q => q.score !== null);
    if (answered.length > 0) {
        this.overallScore = Math.round(
            answered.reduce((sum, q) => sum + q.score, 0) / answered.length
        );
    }
    next();
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
