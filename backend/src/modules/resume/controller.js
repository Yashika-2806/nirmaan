const Resume = require('./model');
const ApiResponse = require('../../core/utils/response');
const { AppError } = require('../../core/middleware/error');
const profileScraperService = require('./profile-scraper');
const geminiService = require('../../core/ai/gemini-service');

// @desc    Get all resumes for the logged in user
// @route   GET /api/resume
// @access  Private
exports.getResumes = async (req, res, next) => {
    try {
        const resumes = await Resume.find({ userId: req.user.userId, isActive: true })
            .select('name updatedAt version analysis.atsScore status')
            .sort('-updatedAt');

        res.status(200).json({
            success: true,
            count: resumes.length,
            data: resumes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single resume
// @route   GET /api/resume/:id
// @access  Private
exports.getResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user.userId,
            isActive: true
        });

        if (!resume) {
            return next(new AppError('Resume not found', 404));
        }

        res.status(200).json({
            success: true,
            data: resume
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new resume
// @route   POST /api/resume
// @access  Private
exports.createResume = async (req, res, next) => {
    try {
        // Add user to body
        req.body.userId = req.user.userId;

        // Default content structure if not provided
        if (!req.body.content) {
            req.body.content = {
                personal: {},
                experience: [],
                education: [],
                skills: [],
                projects: []
            };
        }

        const resume = await Resume.create(req.body);

        res.status(201).json({
            success: true,
            data: resume
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update resume
// @route   PUT /api/resume/:id
// @access  Private
exports.updateResume = async (req, res, next) => {
    try {
        let resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!resume) {
            return next(new AppError('Resume not found', 404));
        }

        // Update fields
        // Specifically handle nested updates carefully if needed, 
        // but for now relying on Mongoose findOneAndUpdate with full object replacement for content is safer 
        // or just let the client send the full object.

        resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: resume
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete resume (soft delete)
// @route   DELETE /api/resume/:id
// @access  Private
exports.deleteResume = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!resume) {
            return next(new AppError('Resume not found', 404));
        }

        // Soft delete
        resume.isActive = false;
        await resume.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate resume from profiles
// @route   POST /api/resume/generate
// @access  Private
exports.generateResume = async (req, res, next) => {
    try {
        const { fullName } = req.body;

        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: 'Full Name is required'
            });
        }

        const generatedData = await profileScraperService.generateResumeFromProfiles(req.body);

        // 1. Null / undefined
        if (!generatedData) {
            return res.status(500).json({
                success: false,
                message: 'AI failed to generate resume content. Please try again.',
                error: 'generateResumeFromProfiles returned null/undefined'
            });
        }

        // 2. Explicit error field (returned by geminiService on parse/API failures)
        if (generatedData.error) {
            const errorMsg = String(generatedData.error);
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit');
            const userMessage = isRateLimit
                ? 'AI quota exceeded. The free-tier daily limit has been reached. Please try again after midnight (Pacific Time) or add a paid API key.'
                : 'AI failed to generate resume content. Please try again.';
            return res.status(isRateLimit ? 429 : 500).json({
                success: false,
                message: userMessage,
                error: errorMsg
            });
        }

        // 3. String leak — should never happen after safe parser, but guard
        if (typeof generatedData === 'string') {
            return res.status(500).json({
                success: false,
                message: 'AI returned raw text instead of structured data. Please try again.',
                error: 'Response was a string, not an object'
            });
        }

        // 4. Valid object — ensure it has at least the 'personal' key
        if (typeof generatedData !== 'object' || !generatedData.personal) {
            return res.status(500).json({
                success: false,
                message: 'AI returned an incomplete resume structure. Please try again.',
                error: 'Missing required "personal" field in generated data'
            });
        }

        // 5. Success
        res.status(200).json({
            success: true,
            data: generatedData,
            message: "Resume generated successfully"
        });

    } catch (error) {
        console.error('[Resume Generate] Unhandled error:', error.message || error);
        const errorMsg = error.message || String(error);
        const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit');
        res.status(isRateLimit ? 429 : 500).json({
            success: false,
            message: isRateLimit
                ? 'AI quota exceeded. Please try again later.'
                : 'Resume generation failed. Please try again.',
            error: errorMsg
        });
    }
};


// @desc    Analyze resume and get ATS score
// @route   POST /api/resume/analyze
// @access  Private
exports.analyzeResume = async (req, res, next) => {
    try {
        const { resumeData, jobDescription } = req.body;

        if (!resumeData) {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required'
            });
        }

        const analysis = await geminiService.analyzeResume(resumeData, jobDescription);

        // Check error BEFORE saving to DB
        if (analysis && analysis.error) {
            const errorMsg = String(analysis.error);
            const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit');
            return res.status(isRateLimit ? 429 : 500).json({
                success: false,
                message: isRateLimit
                    ? 'AI quota exceeded. Please try again later.'
                    : 'AI failed to analyze resume. Please try again.',
                error: errorMsg
            });
        }

        // If resume ID provided, save the score (only on success)
        if (req.body.resumeId && analysis.atsScore) {
            try {
                await Resume.findOneAndUpdate(
                    { _id: req.body.resumeId, userId: req.user.userId },
                    { 'analysis.atsScore': analysis.atsScore, 'analysis.improvements': analysis.improvements },
                    { new: true }
                );
            } catch (dbErr) {
                console.error('[Resume Analyze] DB save failed:', dbErr.message);
                // Don't fail the whole response for a DB save issue
            }
        }

        res.status(200).json({
            success: true,
            data: analysis,
            message: "Resume analyzed successfully"
        });
    } catch (error) {
        console.error('[Resume Analyze] Unhandled error:', error.message || error);
        res.status(500).json({
            success: false,
            message: 'Resume analysis failed. Please try again.',
            error: error.message || String(error)
        });
    }
};


// @desc    Regenerate professional summary
// @route   POST /api/resume/regenerate-summary
// @access  Private
exports.regenerateSummary = async (req, res, next) => {
    try {
        const { resumeData } = req.body;

        if (!resumeData) {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required'
            });
        }

        const summary = await geminiService.regenerateSummary(resumeData);

        if (typeof summary === 'string' && (summary.startsWith('Error') || summary.startsWith('Configuration Error') || summary.startsWith('AI Service'))) {
            const isRateLimit = summary.includes('429') || summary.includes('quota');
            return res.status(isRateLimit ? 429 : 500).json({
                success: false,
                message: isRateLimit
                    ? 'AI quota exceeded. Please try again later.'
                    : 'AI failed to regenerate summary. Please try again.',
                error: summary
            });
        }

        res.status(200).json({
            success: true,
            data: { summary },
            message: "Summary regenerated successfully"
        });
    } catch (error) {
        console.error('[Resume RegenerateSummary] Unhandled error:', error.message || error);
        res.status(500).json({
            success: false,
            message: 'Summary regeneration failed. Please try again.',
            error: error.message || String(error)
        });
    }
};
