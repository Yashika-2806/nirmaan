const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');

const router = express.Router();
const geminiService = require('../core/ai/gemini-service');
const { protect } = require('../core/auth/middleware');
const { aiLimiter } = require('../core/middleware/rate-limit');
const ApiResponse = require('../core/utils/response');

// ─── Inline PDFSession Model ──────────────────────────────────────────────────
const pdfSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        originalName: { type: String, required: true },
        pageCount: { type: Number, default: 0 },
        wordCount: { type: Number, default: 0 },
        extractedText: { type: String, required: true },
    },
    { timestamps: true }
);

const PDFSession = mongoose.models.PDFSession || mongoose.model('PDFSession', pdfSessionSchema);

// ─── Multer Config ────────────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'pdf');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'));
    },
});

// All routes require auth
router.use(protect);

// ─── POST /api/pdf/upload ─────────────────────────────────────────────────────
router.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return ApiResponse.badRequest(res, 'No PDF file uploaded');
        }

        const fileBuffer = fs.readFileSync(req.file.path);
        let parsed;
        try {
            parsed = await pdfParse(fileBuffer);
        } catch (parseErr) {
            fs.unlinkSync(req.file.path);
            return ApiResponse.badRequest(res, 'Failed to parse PDF: ' + parseErr.message);
        }

        // Clean up uploaded file (we store text in DB)
        fs.unlinkSync(req.file.path);

        const extractedText = parsed.text || '';
        if (extractedText.trim().length < 50) {
            return ApiResponse.badRequest(res, 'PDF appears to be empty or unreadable (scanned image PDFs are not supported)');
        }

        const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

        const session = await PDFSession.create({
            userId: req.user.userId,
            originalName: req.file.originalname,
            pageCount: parsed.numpages || 0,
            wordCount,
            extractedText: extractedText.substring(0, 50000),
        });

        return ApiResponse.created(res, {
            sessionId: session._id,
            originalName: session.originalName,
            pageCount: session.pageCount,
            wordCount: session.wordCount,
        }, 'PDF uploaded and processed successfully');

    } catch (error) {
        console.error('[PDF] Upload error:', error);
        return ApiResponse.internalError(res, 'Failed to process PDF: ' + error.message);
    }
});

// ─── POST /api/pdf/quiz ───────────────────────────────────────────────────────
router.post('/quiz', aiLimiter, async (req, res) => {
    try {
        const { sessionId, numQuestions = 10 } = req.body;
        if (!sessionId) return ApiResponse.badRequest(res, 'sessionId is required');

        const session = await PDFSession.findOne({ _id: sessionId, userId: req.user.userId });
        if (!session) return ApiResponse.notFound(res, 'PDF session not found');

        const result = await geminiService.generatePDFQuiz(session.extractedText, Math.min(numQuestions, 15));
        if (result.error) return ApiResponse.internalError(res, result.error);

        return ApiResponse.success(res, { questions: result.questions }, 'Quiz generated successfully');

    } catch (error) {
        console.error('[PDF] Quiz generation error:', error);
        return ApiResponse.internalError(res, 'Failed to generate quiz');
    }
});

// ─── POST /api/pdf/marked-questions ──────────────────────────────────────────
router.post('/marked-questions', aiLimiter, async (req, res) => {
    try {
        const { sessionId, numQuestions = 6 } = req.body;
        if (!sessionId) return ApiResponse.badRequest(res, 'sessionId is required');

        const session = await PDFSession.findOne({ _id: sessionId, userId: req.user.userId });
        if (!session) return ApiResponse.notFound(res, 'PDF session not found');

        const result = await geminiService.generateMarkedQuestions(session.extractedText, Math.min(numQuestions, 10));
        if (result.error) return ApiResponse.internalError(res, result.error);

        return ApiResponse.success(res, { questions: result.questions }, 'Marked questions generated successfully');

    } catch (error) {
        console.error('[PDF] Marked questions error:', error);
        return ApiResponse.internalError(res, 'Failed to generate marked questions');
    }
});

// ─── POST /api/pdf/grade ──────────────────────────────────────────────────────
router.post('/grade', aiLimiter, async (req, res) => {
    try {
        const { question, marks, expectedAnswer, studentAnswer } = req.body;

        if (!question || !marks || !expectedAnswer || !studentAnswer) {
            return ApiResponse.badRequest(res, 'question, marks, expectedAnswer, and studentAnswer are required');
        }

        if (studentAnswer.trim().length < 2) {
            return ApiResponse.badRequest(res, 'Student answer cannot be empty');
        }

        const result = await geminiService.gradeStudentAnswer({
            question,
            marks: parseInt(marks),
            expectedAnswer,
            studentAnswer,
        });

        if (result.error) return ApiResponse.internalError(res, result.error);

        return ApiResponse.success(res, result, 'Answer graded successfully');

    } catch (error) {
        console.error('[PDF] Grade answer error:', error);
        return ApiResponse.internalError(res, 'Failed to grade answer');
    }
});

// ─── GET /api/pdf/sessions ────────────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await PDFSession.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .select('originalName pageCount wordCount createdAt')
            .limit(20)
            .lean();
        return ApiResponse.success(res, sessions, 'Sessions fetched');
    } catch (error) {
        return ApiResponse.internalError(res, 'Failed to fetch sessions');
    }
});

module.exports = router;
