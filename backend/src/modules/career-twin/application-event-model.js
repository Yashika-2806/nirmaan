const mongoose = require('mongoose');

const ApplicationEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareerTwinApplication',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['created', 'applied', 'status_updated', 'note_added', 'resume_generated', 'answer_prepared'],
        required: true,
        index: true,
    },
    fromStatus: { type: String, default: '' },
    toStatus: { type: String, default: '' },
    message: { type: String, default: '' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: String, enum: ['system', 'user', 'agent'], default: 'agent' },
}, { timestamps: true });

module.exports = mongoose.model('CareerTwinApplicationEvent', ApplicationEventSchema);
