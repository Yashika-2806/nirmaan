const mongoose = require('mongoose');

/**
 * ProctorSession — stores real-time proctoring events and final scoring
 * Created when an interview starts, updated throughout, finalized on submit.
 */
const violationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['tab_switch', 'window_blur', 'fullscreen_exit', 'copy_paste', 'rapid_paste', 'face_missing', 'multiple_faces'],
        required: true,
    },
    timestamp:   { type: Date, default: Date.now },
    detail:      { type: String, default: '' },
    severity:    { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
}, { _id: false });

const proctorSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    interviewSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        index: true,
    },
    company:          { type: String, default: '' },
    role:             { type: String, default: '' },

    // Timing
    startTime:        { type: Date, default: Date.now },
    endTime:          { type: Date, default: null },
    durationSeconds:  { type: Number, default: 0 },
    timeLimitSeconds: { type: Number, default: 3600 }, // 60 min default

    // Proctoring state
    cameraEnabled:    { type: Boolean, default: false },
    micEnabled:       { type: Boolean, default: false },
    fullscreenEntered:{ type: Boolean, default: false },

    // Violation log
    violations: [violationSchema],

    // Violation summary counts
    violationCounts: {
        tabSwitches:     { type: Number, default: 0 },
        windowBlurs:     { type: Number, default: 0 },
        fullscreenExits: { type: Number, default: 0 },
        copyPastes:      { type: Number, default: 0 },
        rapidPastes:     { type: Number, default: 0 },
        faceMissing:     { type: Number, default: 0 },
        multipleFaces:   { type: Number, default: 0 },
    },

    // Final scoring (computed at end)
    scoring: {
        testCaseScore:   { type: Number, default: 0 },  // 70% weight
        timeScore:       { type: Number, default: 0 },  // 10% weight
        codeQualityScore:{ type: Number, default: 0 },  // 10% weight
        violationPenalty:{ type: Number, default: 0 },  // 10% weight (subtracted)
        finalScore:      { type: Number, default: 0 },  // 0–100
        grade:           { type: String, default: 'N/A' }, // A/B/C/D/F
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'completed', 'auto_submitted', 'abandoned'],
        default: 'active',
    },

    // Code similarity hash (for plagiarism)
    submissionHashes: [{
        questionId:  { type: String },
        codeHash:    { type: String },
        similarity:  { type: Number, default: 0 },
        flagged:     { type: Boolean, default: false },
    }],

}, { timestamps: true, collection: 'proctor_sessions' });

// Indexes
proctorSessionSchema.index({ userId: 1, createdAt: -1 });
proctorSessionSchema.index({ interviewSessionId: 1 });
proctorSessionSchema.index({ status: 1 });

// Methods
proctorSessionSchema.methods.addViolation = function(type, detail = '', severity = 'low') {
    this.violations.push({ type, detail, severity, timestamp: new Date() });

    const countMap = {
        tab_switch:      'tabSwitches',
        window_blur:     'windowBlurs',
        fullscreen_exit: 'fullscreenExits',
        copy_paste:      'copyPastes',
        rapid_paste:     'rapidPastes',
        face_missing:    'faceMissing',
        multiple_faces:  'multipleFaces',
    };
    const key = countMap[type];
    if (key) this.violationCounts[key] = (this.violationCounts[key] || 0) + 1;
};

proctorSessionSchema.methods.computeScore = function(testCasePct, timeTakenSeconds, aiCodeScore) {
    // testCasePct: 0–100 (% test cases passed)
    // timeTakenSeconds: how long they took
    // aiCodeScore: 0–100 from AI code quality

    const testCaseScore    = testCasePct * 0.70;
    const timeScore        = Math.max(0, 100 - (timeTakenSeconds / (this.timeLimitSeconds || 3600)) * 100) * 0.10;
    const codeQualityScore = (aiCodeScore || 0) * 0.10;

    // Penalty: each violation type deducts points
    const v = this.violationCounts;
    const penaltyPoints =
        (v.tabSwitches     || 0) * 5 +
        (v.windowBlurs     || 0) * 3 +
        (v.fullscreenExits || 0) * 5 +
        (v.copyPastes      || 0) * 10 +
        (v.rapidPastes     || 0) * 8 +
        (v.multipleFaces   || 0) * 15;
    const maxPenalty = 10;
    const violationPenalty = Math.min(penaltyPoints, maxPenalty);

    const rawFinal = testCaseScore + timeScore + codeQualityScore - violationPenalty;
    const finalScore = Math.max(0, Math.min(100, Math.round(rawFinal)));

    let grade = 'F';
    if (finalScore >= 90) grade = 'A+';
    else if (finalScore >= 80) grade = 'A';
    else if (finalScore >= 70) grade = 'B';
    else if (finalScore >= 60) grade = 'C';
    else if (finalScore >= 50) grade = 'D';

    this.scoring = { testCaseScore: Math.round(testCaseScore), timeScore: Math.round(timeScore), codeQualityScore: Math.round(codeQualityScore), violationPenalty: Math.round(violationPenalty), finalScore, grade };
    return this.scoring;
};

proctorSessionSchema.methods.toReport = function() {
    return {
        _id:               this._id,
        userId:            this.userId,
        interviewSessionId:this.interviewSessionId,
        company:           this.company,
        role:              this.role,
        startTime:         this.startTime,
        endTime:           this.endTime,
        durationSeconds:   this.durationSeconds,
        cameraEnabled:     this.cameraEnabled,
        micEnabled:        this.micEnabled,
        violationCounts:   this.violationCounts,
        violationLog:      this.violations,
        scoring:           this.scoring,
        status:            this.status,
        submissionHashes:  this.submissionHashes,
        createdAt:         this.createdAt,
    };
};

module.exports = mongoose.model('ProctorSession', proctorSessionSchema);
