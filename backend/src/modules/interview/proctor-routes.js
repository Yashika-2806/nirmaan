/**
 * Proctoring API Routes
 * Handles session lifecycle, violation logging, and final score computation.
 * Includes real plagiarism detection via SHA-256 + Jaccard + Levenshtein.
 */
const express   = require('express');
const Joi       = require('joi');
const rateLimit = require('express-rate-limit');
const { protect }  = require('../../core/auth/middleware');
const { validate } = require('../../core/middleware/validation');
const ApiResponse  = require('../../core/utils/response');
const logger       = require('../../core/utils/logger');
const ProctorSession = require('./models/proctor-session-model');
const crypto    = require('crypto');

const router = express.Router();
router.use(protect);

// Prevent violation spam: max 60 violations per minute per user
const violationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => String(req.user?._id || req.user?.userId || req.ip),
    message: { success: false, message: 'Too many violation events. Slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Plagiarism helpers ──────────────────────────────────────────────────────

/**
 * Tokenize code into a set of alphanumeric tokens for Jaccard similarity.
 */
function _tokenize(code) {
    return new Set((code || '').match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || []);
}

/**
 * Jaccard similarity between two code strings based on identifier tokens.
 * Returns 0.0 – 1.0
 */
function _jaccardSimilarity(code1, code2) {
    const set1 = _tokenize(code1);
    const set2 = _tokenize(code2);
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;

    let intersection = 0;
    for (const token of set1) {
        if (set2.has(token)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return intersection / union;
}

/**
 * Normalized Levenshtein distance — measures character-level edit distance.
 * Operates on the first 2000 chars of each string to avoid O(n²) blowup.
 * Returns 0.0 (totally different) – 1.0 (identical).
 */
function _normalizedLevenshtein(s1, s2) {
    const a = (s1 || '').substring(0, 2000);
    const b = (s2 || '').substring(0, 2000);
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    dp[0] = Array.from({ length: b.length + 1 }, (_, j) => j);

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    const maxLen = Math.max(a.length, b.length);
    return 1 - dp[a.length][b.length] / maxLen;
}

/**
 * Run plagiarism comparison for a single submission hash against recent sessions.
 * Returns { codeHash, similarity, flagged }
 */
async function _checkPlagiarism(questionId, rawCode, canonicalHash, currentSessionId, userId) {
    try {
        const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days

        const otherSessions = await ProctorSession.find({
            _id:    { $ne: currentSessionId },
            userId: { $ne: userId },
            'submissionHashes.questionId': questionId,
            createdAt: { $gte: recentCutoff },
        }).select('submissionHashes').limit(100).lean();

        let maxSimilarity = 0;
        let flagged = false;

        for (const other of otherSessions) {
            const matchingHash = (other.submissionHashes || []).find(
                h => String(h.questionId) === String(questionId)
            );
            if (!matchingHash?.codeHash) continue;

            // 1. Exact hash = 100% match
            if (matchingHash.codeHash === canonicalHash) {
                return { codeHash: canonicalHash, similarity: 100, flagged: true };
            }

            // 2. Combined similarity: Jaccard (60%) + Levenshtein (40%)
            const jaccard     = _jaccardSimilarity(rawCode, matchingHash.rawCode || '');
            const levenshtein = _normalizedLevenshtein(rawCode, matchingHash.rawCode || '');
            const combined    = Math.round((jaccard * 0.6 + levenshtein * 0.4) * 100);

            if (combined > maxSimilarity) maxSimilarity = combined;
            if (maxSimilarity >= 70) { flagged = true; break; }
        }

        return { codeHash: canonicalHash, similarity: maxSimilarity, flagged };
    } catch (err) {
        logger.warn('Plagiarism check error:', err.message);
        return { codeHash: canonicalHash, similarity: 0, flagged: false };
    }
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const startSchema = Joi.object({
    interviewSessionId: Joi.string().optional().allow(''),
    company:            Joi.string().optional().allow('').max(100),
    role:               Joi.string().optional().allow('').max(100),
    timeLimitSeconds:   Joi.number().min(60).max(14400).default(3600),
});

const violationSchema = Joi.object({
    proctorSessionId: Joi.string().required(),
    type: Joi.string().valid(
        'tab_switch', 'window_blur', 'fullscreen_exit',
        'copy_paste', 'rapid_paste', 'face_missing', 'multiple_faces'
    ).required(),
    detail:   Joi.string().optional().allow('').max(500),
    severity: Joi.string().valid('low', 'medium', 'high').default('low'),
});

const finishSchema = Joi.object({
    proctorSessionId:   Joi.string().required(),
    testCasePct:        Joi.number().min(0).max(100).default(0),
    timeTakenSeconds:   Joi.number().min(0).default(0),
    aiCodeScore:        Joi.number().min(0).max(100).default(0),
    status:             Joi.string().valid('completed', 'auto_submitted', 'abandoned').default('completed'),
    submissionHashes:   Joi.array().items(Joi.object({
        questionId: Joi.string(),
        codeHash:   Joi.string(),    // raw code for similarity comparison
        rawCode:    Joi.string().allow('').optional(),
    })).optional(),
    cameraEnabled:      Joi.boolean().optional(),
    micEnabled:         Joi.boolean().optional(),
});

const heartbeatSchema = Joi.object({
    proctorSessionId: Joi.string().required(),
    cameraEnabled:    Joi.boolean().optional(),
    micEnabled:       Joi.boolean().optional(),
    fullscreenActive: Joi.boolean().optional(),
});

// ─── POST /proctor/start ──────────────────────────────────────────────────────
router.post('/start', validate(startSchema), async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.userId;
        const { interviewSessionId, company, role, timeLimitSeconds } = req.body;

        const session = await ProctorSession.create({
            userId,
            interviewSessionId: interviewSessionId || undefined,
            company:  company  || '',
            role:     role     || '',
            timeLimitSeconds: timeLimitSeconds || 3600,
            startTime: new Date(),
            status: 'active',
        });

        logger.info(`Proctor session started: ${session._id} for user ${userId}`);

        return ApiResponse.created(res, {
            proctorSessionId: session._id,
            startTime:        session.startTime,
            timeLimitSeconds: session.timeLimitSeconds,
        }, 'Proctor session started');
    } catch (err) {
        next(err);
    }
});

// ─── POST /proctor/violation ──────────────────────────────────────────────────
router.post('/violation', violationLimiter, validate(violationSchema), async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.userId;
        const { proctorSessionId, type, detail, severity } = req.body;

        const session = await ProctorSession.findOne({ _id: proctorSessionId, userId });
        if (!session) {
            return ApiResponse.error(res, 'Proctor session not found', 404);
        }

        session.addViolation(type, detail || '', severity || 'low');
        await session.save();

        logger.warn(`Violation [${type}] recorded for session ${proctorSessionId}, user ${userId}`);

        return ApiResponse.success(res, {
            violationCounts: session.violationCounts,
            totalViolations: session.violations.length,
        }, 'Violation recorded');
    } catch (err) {
        next(err);
    }
});

// ─── POST /proctor/heartbeat ──────────────────────────────────────────────────
router.post('/heartbeat', validate(heartbeatSchema), async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.userId;
        const { proctorSessionId, cameraEnabled, micEnabled, fullscreenActive } = req.body;

        const session = await ProctorSession.findOne({ _id: proctorSessionId, userId });
        if (!session) {
            return ApiResponse.error(res, 'Proctor session not found', 404);
        }

        if (cameraEnabled !== undefined)    session.cameraEnabled    = cameraEnabled;
        if (micEnabled    !== undefined)    session.micEnabled       = micEnabled;
        if (fullscreenActive !== undefined) session.fullscreenEntered = fullscreenActive;
        await session.save();

        return ApiResponse.success(res, { ok: true }, 'Heartbeat received');
    } catch (err) {
        next(err);
    }
});

// ─── POST /proctor/finish ─────────────────────────────────────────────────────
router.post('/finish', validate(finishSchema), async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.userId;
        const {
            proctorSessionId, testCasePct, timeTakenSeconds,
            aiCodeScore, status, submissionHashes, cameraEnabled, micEnabled,
        } = req.body;

        const session = await ProctorSession.findOne({ _id: proctorSessionId, userId });
        if (!session) {
            return ApiResponse.error(res, 'Proctor session not found', 404);
        }

        // ── Real plagiarism detection ──────────────────────────────────────
        if (submissionHashes && submissionHashes.length > 0) {
            const results = await Promise.all(
                submissionHashes.map(async ({ questionId, codeHash, rawCode }) => {
                    const canonicalHash = crypto.createHash('sha256')
                        .update(rawCode || codeHash || '').digest('hex');
                    const plagResult = await _checkPlagiarism(
                        questionId, rawCode || codeHash || '',
                        canonicalHash, proctorSessionId, userId
                    );
                    return {
                        questionId,
                        rawCode: rawCode || '',
                        ...plagResult,
                    };
                })
            );
            session.submissionHashes = results;

            const flaggedCount = results.filter(h => h.flagged).length;
            if (flaggedCount > 0) {
                logger.warn(`🚨 Plagiarism detected: ${flaggedCount}/${results.length} submissions flagged in session ${proctorSessionId}`);
                // Add a plagiarism violation automatically
                session.addViolation('copy_paste', `${flaggedCount} submission(s) showed high similarity to existing solutions`, 'high');
            }
        }

        if (cameraEnabled !== undefined) session.cameraEnabled = cameraEnabled;
        if (micEnabled    !== undefined) session.micEnabled    = micEnabled;

        session.endTime         = new Date();
        session.durationSeconds = timeTakenSeconds || Math.round((session.endTime - session.startTime) / 1000);
        session.status          = status || 'completed';

        // Compute final weighted score
        const scoring = session.computeScore(testCasePct || 0, timeTakenSeconds || 0, aiCodeScore || 0);
        await session.save();

        const flaggedSubmissions = (session.submissionHashes || []).filter(h => h.flagged);
        logger.info(`Proctor session finished: ${proctorSessionId}, score=${scoring.finalScore}, flagged=${flaggedSubmissions.length}`);

        return ApiResponse.success(res, {
            scoring,
            violationCounts:    session.violationCounts,
            totalViolations:    session.violations.length,
            durationSeconds:    session.durationSeconds,
            status:             session.status,
            plagiarismWarning:  flaggedSubmissions.length > 0,
            flaggedSubmissions: flaggedSubmissions.length,
            similarityScores:   (session.submissionHashes || []).map(h => ({
                questionId:  h.questionId,
                similarity:  h.similarity,
                flagged:     h.flagged,
            })),
        }, 'Proctor session finalized');
    } catch (err) {
        next(err);
    }
});

// ─── GET /proctor/report/:proctorSessionId ────────────────────────────────────
router.get('/report/:proctorSessionId', async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.userId;
        const session = await ProctorSession.findOne({
            _id: req.params.proctorSessionId,
            userId,
        });

        if (!session) {
            return ApiResponse.error(res, 'Proctor session not found', 404);
        }

        return ApiResponse.success(res, session.toReport(), 'Proctor report');
    } catch (err) {
        next(err);
    }
});

// ─── GET /proctor/history ─────────────────────────────────────────────────────
router.get('/history', async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.userId;
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [sessions, total] = await Promise.all([
            ProctorSession
                .find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-violations -submissionHashes'),
            ProctorSession.countDocuments({ userId }),
        ]);

        return ApiResponse.success(res, {
            count:   sessions.length,
            total,
            page:    parseInt(page),
            pages:   Math.ceil(total / parseInt(limit)),
            sessions: sessions.map(s => s.toReport()),
        }, 'Proctor history');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
