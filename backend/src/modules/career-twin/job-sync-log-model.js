const mongoose = require('mongoose');

const JobSyncLogSchema = new mongoose.Schema({
    sourceType: { type: String, required: true, index: true },
    sourceKey: { type: String, required: true, index: true },
    status: { type: String, enum: ['queued', 'running', 'success', 'failed'], default: 'queued', index: true },
    attempt: { type: Number, min: 1, default: 1 },
    importedCount: { type: Number, min: 0, default: 0 },
    errorMessage: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    queuedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    completedAt: { type: Date },
    nextRetryAt: { type: Date },
}, { timestamps: true });

JobSyncLogSchema.index({ sourceType: 1, sourceKey: 1, createdAt: -1 });

module.exports = mongoose.model('CareerTwinJobSyncLog', JobSyncLogSchema);
