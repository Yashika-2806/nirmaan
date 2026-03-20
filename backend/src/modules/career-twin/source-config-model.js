const mongoose = require('mongoose');

const SourceConfigSchema = new mongoose.Schema({
    sourceType: {
        type: String,
        enum: ['greenhouse', 'lever', 'workday'],
        required: true,
        index: true,
    },
    sourceKey: {
        type: String,
        required: true,
        trim: true,
    },
    label: {
        type: String,
        default: '',
        trim: true,
    },
    enabled: {
        type: Boolean,
        default: true,
        index: true,
    },
    autoDisableEnabled: {
        type: Boolean,
        default: true,
    },
    autoDisableBypass: {
        type: Boolean,
        default: false,
    },
    failureStreak: {
        type: Number,
        min: 0,
        default: 0,
    },
    autoDisabledAt: { type: Date },
    autoDisabledReason: { type: String, default: '' },
    syncIntervalMinutes: {
        type: Number,
        min: 5,
        max: 1440,
        default: 30,
    },
    defaults: {
        company: { type: String, default: '' },
        workMode: { type: String, enum: ['remote', 'hybrid', 'onsite', 'unknown'], default: 'unknown' },
        employmentType: { type: String, default: '' },
    },
    lastSyncedAt: { type: Date },
    lastSyncStatus: { type: String, enum: ['idle', 'success', 'failed'], default: 'idle' },
}, { timestamps: true });

SourceConfigSchema.index({ sourceType: 1, sourceKey: 1 }, { unique: true });

module.exports = mongoose.model('CareerTwinSourceConfig', SourceConfigSchema);
