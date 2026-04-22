const mongoose = require('mongoose');

/**
 * ExecutionResult Schema
 * Tracks every code run and submission for analytics and history
 */
const ExecutionResultSchema = new mongoose.Schema({
    // User who ran the code
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // Question being solved
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
        required: true,
        index: true,
    },

    // Session context (interview session)
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        optional: true,
        index: true,
    },

    // Execution type
    type: {
        type: String,
        enum: ['run', 'submit'],
        required: true,
        index: true,
    },

    // Code and language
    sourceCode: {
        type: String,
        required: true,
        maxlength: 50000,
    },

    language: {
        type: String,
        enum: ['python', 'java', 'cpp', 'javascript', 'c', 'go', 'rust'],
        required: true,
        index: true,
    },

    // Execution result
    verdict: {
        type: String,
        enum: [
            'Idle',
            'Running',
            'Accepted',
            'Wrong Answer',
            'Runtime Error',
            'Compilation Error',
            'Time Limit Exceeded',
            'Memory Limit Exceeded',
            'Execution Error',
            'Partial Accept',
        ],
        required: true,
        index: true,
    },

    // Output and errors
    stdout: {
        type: String,
        optional: true,
        maxlength: 50000,
    },

    stderr: {
        type: String,
        optional: true,
        maxlength: 50000,
    },

    compileOutput: {
        type: String,
        optional: true,
        maxlength: 50000,
    },

    // Execution statistics
    executionTime: {
        type: Number,
        default: 0,
        description: 'in milliseconds',
    },

    memory: {
        type: Number,
        default: 0,
        description: 'in KB',
    },

    // Test cases results (for submit)
    testCases: [{
        id: Number,
        input: String,
        expected: String,
        output: String,
        passed: Boolean,
        error: String,
        time: Number,
        memory: Number,
    }],

    // Summary for submission
    summary: {
        totalTests: Number,
        passedTests: Number,
        failedTests: Number,
    },

    // Execution metadata
    executionEngine: {
        type: String,
        enum: ['judge0', 'docker', 'custom'],
        default: 'docker',
    },

    containerId: {
        type: String,
        optional: true,
        description: 'Docker container ID if executed in sandbox',
    },

    // AI Feedback (populated after execution)
    aiFeedback: {
        score: Number,
        strengths: [String],
        improvements: [String],
        timeComplexity: String,
        spaceComplexity: String,
        followUpQuestions: [String],
        generatedAt: Date,
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    collection: 'execution_results',
});

// Indexes
ExecutionResultSchema.index({ userId: 1, questionId: 1, createdAt: -1 });
ExecutionResultSchema.index({ sessionId: 1, type: 1 });
ExecutionResultSchema.index({ verdict: 1, type: 1 });

// Methods
ExecutionResultSchema.methods.isPassed = function() {
    return this.verdict === 'Accepted' || this.verdict === 'Partial Accept';
};

ExecutionResultSchema.methods.toResponse = function(hideCode = false) {
    const response = {
        _id: this._id,
        type: this.type,
        verdict: this.verdict,
        language: this.language,
        stdout: this.stdout,
        stderr: this.stderr,
        compileOutput: this.compileOutput,
        executionTime: this.executionTime,
        memory: this.memory,
        testCases: this.testCases,
        summary: this.summary,
        aiFeedback: this.aiFeedback,
        createdAt: this.createdAt,
    };

    if (!hideCode) {
        response.sourceCode = this.sourceCode;
    }

    return response;
};

ExecutionResultSchema.statics.getRecentByUser = async function(userId, limit = 10) {
    return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

ExecutionResultSchema.statics.getQuestionAttempts = async function(userId, questionId) {
    return this.find({ userId, questionId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('ExecutionResult', ExecutionResultSchema);
