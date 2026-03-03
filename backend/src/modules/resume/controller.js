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
            return next(new AppError('Full Name is required', 400));
        }

        const generatedData = await profileScraperService.generateResumeFromProfiles(req.body);

        res.status(200).json({
            success: true,
            data: generatedData
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Analyze resume and get ATS score
// @route   POST /api/resume/analyze
// @access  Private
exports.analyzeResume = async (req, res, next) => {
    try {
        const { resumeData, jobDescription } = req.body;

        if (!resumeData) {
            return next(new AppError('Resume data is required', 400));
        }

        const analysis = await geminiService.analyzeResume(resumeData, jobDescription);

        // If resume ID provided, save the score
        if (req.body.resumeId) {
            await Resume.findOneAndUpdate(
                { _id: req.body.resumeId, userId: req.user.userId },
                { 'analysis.atsScore': analysis.atsScore, 'analysis.improvements': analysis.improvements },
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            data: analysis
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Regenerate professional summary
// @route   POST /api/resume/regenerate-summary
// @access  Private
exports.regenerateSummary = async (req, res, next) => {
    try {
        const { resumeData } = req.body;

        if (!resumeData) {
            return next(new AppError('Resume data is required', 400));
        }

        const summary = await geminiService.regenerateSummary(resumeData);

        res.status(200).json({
            success: true,
            data: { summary }
        });
    } catch (error) {
        next(error);
    }
};
