const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: String,
    type: { type: String, enum: ['course', 'book', 'article', 'project', 'practice'] },
    url: { type: String, default: '' },
});

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    skills: [String],
    resources: [resourceSchema],
    duration: { type: String, default: '' },
    weeklyHours: { type: Number, default: 10 },
    deliverable: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
});

const roadmapSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true },
        summary: { type: String, default: '' },
        currentRole: { type: String, required: true },
        targetGoal: { type: String, required: true },
        timelineMonths: { type: Number, required: true },
        currentSkills: [String],
        experienceNotes: { type: String, default: '' },
        milestones: [milestoneSchema],
        totalSkills: [String],
        keyInsights: [String],
        status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    },
    { timestamps: true }
);

// Virtual: completion percentage
roadmapSchema.virtual('completionPercent').get(function () {
    if (!this.milestones.length) return 0;
    const done = this.milestones.filter(m => m.completed).length;
    return Math.round((done / this.milestones.length) * 100);
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
