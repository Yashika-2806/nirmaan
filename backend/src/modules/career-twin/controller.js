const ApiResponse = require('../../core/utils/response');
const careerTwinService = require('./service');
const syncManager = require('./sync-manager');
const SourceConfig = require('./source-config-model');

const ensureSelf = (req, userId) => {
    if (String(req.user.userId) !== String(userId)) {
        throw new Error('Forbidden access to user data');
    }
};

const parsePositiveInt = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), max);
};

const controller = {
    async uploadResume(req, res, next) {
        try {
            const resumeText = req.body.resumeText || req.file?.resumeTextExtracted;
            if (!resumeText) {
                return ApiResponse.badRequest(res, 'resumeText is required or upload a supported PDF');
            }

            const profile = await careerTwinService.uploadResumeAndBuildProfile({
                userId: req.user.userId,
                resumeText,
                filename: req.file?.originalname || '',
                preferences: req.body.preferences || {},
            });

            return ApiResponse.success(res, { profile }, 'Resume parsed and profile updated');
        } catch (error) {
            next(error);
        }
    },

    async syncJobs(req, res, next) {
        try {
            const { jobs, source } = req.body;
            if (!Array.isArray(jobs) || jobs.length === 0) {
                return ApiResponse.badRequest(res, 'jobs array is required');
            }
            const result = await careerTwinService.syncJobs({ jobs, source: source || 'structured_feed' });
            return ApiResponse.success(res, result, 'Jobs synced');
        } catch (error) {
            next(error);
        }
    },

    async searchJobs(req, res, next) {
        try {
            const filters = {
                query: String(req.query.query || ''),
                location: String(req.query.location || ''),
                workMode: String(req.query.workMode || ''),
                limit: parsePositiveInt(req.query.limit, 40, 100),
                offset: parsePositiveInt(req.query.offset, 0, 5000),
            };

            const data = await careerTwinService.searchJobs(filters);
            return ApiResponse.success(res, data, 'Jobs fetched successfully');
        } catch (error) {
            next(error);
        }
    },

    async getJobDetail(req, res, next) {
        try {
            const { jobId } = req.params;
            const job = await careerTwinService.getJobDetail(jobId);
            if (!job) {
                return ApiResponse.notFound(res, 'Job not found');
            }
            return ApiResponse.success(res, { job }, 'Job details fetched');
        } catch (error) {
            next(error);
        }
    },

    async getRecommendations(req, res, next) {
        try {
            const filters = {
                query: req.query.query || '',
                location: req.query.location || '',
                workMode: req.query.workMode || '',
                limit: parsePositiveInt(req.query.limit, 40, 100),
                offset: parsePositiveInt(req.query.offset, 0, 5000),
            };
            const data = await careerTwinService.getRecommendations({ userId: req.user.userId, filters });
            return ApiResponse.success(res, data, 'Recommendations generated');
        } catch (error) {
            next(error);
        }
    },

    async generateTailoredResume(req, res, next) {
        try {
            const { jobId } = req.body;
            if (!jobId) {
                return ApiResponse.badRequest(res, 'jobId is required');
            }
            const data = await careerTwinService.generateTailoredResume({ userId: req.user.userId, jobId });
            return ApiResponse.success(res, data, 'Tailored resume generated');
        } catch (error) {
            next(error);
        }
    },

    async applyToJob(req, res, next) {
        try {
            const { jobId } = req.params;
            const { applyMode = 'assisted' } = req.body;
            const application = await careerTwinService.applyToJob({
                userId: req.user.userId,
                jobId,
                applyMode,
            });
            return ApiResponse.success(res, { application }, 'Application prepared successfully');
        } catch (error) {
            next(error);
        }
    },

    async getApplications(req, res, next) {
        try {
            const userId = req.params.userId || req.user.userId;
            ensureSelf(req, userId);
            const data = await careerTwinService.getApplications(userId);
            return ApiResponse.success(res, data, 'Application tracker loaded');
        } catch (error) {
            if (error.message.includes('Forbidden')) {
                return ApiResponse.forbidden(res, error.message);
            }
            next(error);
        }
    },

    async updateApplicationStatus(req, res, next) {
        try {
            const { applicationId } = req.params;
            const { status, note = '' } = req.body;
            if (!status) {
                return ApiResponse.badRequest(res, 'status is required');
            }

            const application = await careerTwinService.updateApplicationStatus({
                userId: req.user.userId,
                applicationId,
                status,
                note,
            });

            return ApiResponse.success(res, { application }, 'Application status updated');
        } catch (error) {
            next(error);
        }
    },

    async getDashboard(req, res, next) {
        try {
            const filters = {
                query: req.query.query || '',
                location: req.query.location || '',
                workMode: req.query.workMode || '',
                limit: parsePositiveInt(req.query.limit, 40, 100),
                offset: parsePositiveInt(req.query.offset, 0, 5000),
            };
            const data = await careerTwinService.getDashboard(req.user.userId, filters);
            return ApiResponse.success(res, data, 'AI Twin dashboard loaded');
        } catch (error) {
            next(error);
        }
    },

    async triggerConfiguredSync(req, res, next) {
        try {
            const result = await syncManager.enqueueConfiguredSources();
            return ApiResponse.success(res, result, 'Configured source sync queued');
        } catch (error) {
            return next(error);
        }
    },

    async queueSingleSync(req, res, next) {
        try {
            const { sourceType, sourceKey } = req.body;
            const queued = await syncManager.enqueueSync({ sourceType, sourceKey });
            if (!queued) {
                return ApiResponse.success(res, { id: null }, 'Source already queued or running');
            }
            return ApiResponse.success(res, { id: queued._id }, 'Source sync queued');
        } catch (error) {
            return next(error);
        }
    },

    async runSyncQueue(req, res, next) {
        try {
            const result = await syncManager.processQueue({ limit: Number(req.body.limit || 8) });
            return ApiResponse.success(res, result, 'Sync queue processed');
        } catch (error) {
            return next(error);
        }
    },

    async getSyncStatus(req, res, next) {
        try {
            const status = await syncManager.getStatus({ lookbackHours: Number(req.query.lookbackHours || 24) });
            return ApiResponse.success(res, status, 'Sync status fetched');
        } catch (error) {
            return next(error);
        }
    },

    async getAnalytics(req, res, next) {
        try {
            const data = await careerTwinService.getAnalytics({ lookbackDays: Number(req.query.lookbackDays || 30) });
            return ApiResponse.success(res, data, 'Career Twin analytics fetched');
        } catch (error) {
            return next(error);
        }
    },

    async listSources(req, res, next) {
        try {
            const sources = await SourceConfig.find().sort({ updatedAt: -1 }).lean();
            return ApiResponse.success(res, { sources }, 'Source configs fetched');
        } catch (error) {
            return next(error);
        }
    },

    async createSource(req, res, next) {
        try {
            const created = await SourceConfig.create(req.body);
            return ApiResponse.created(res, { source: created }, 'Source config created');
        } catch (error) {
            return next(error);
        }
    },

    async updateSource(req, res, next) {
        try {
            const source = await SourceConfig.findByIdAndUpdate(
                req.params.sourceId,
                { $set: req.body },
                { new: true, runValidators: true }
            );

            if (!source) {
                return ApiResponse.notFound(res, 'Source config not found');
            }

            return ApiResponse.success(res, { source }, 'Source config updated');
        } catch (error) {
            return next(error);
        }
    },

    async deleteSource(req, res, next) {
        try {
            const source = await SourceConfig.findByIdAndDelete(req.params.sourceId);
            if (!source) {
                return ApiResponse.notFound(res, 'Source config not found');
            }

            return ApiResponse.success(res, {}, 'Source config deleted');
        } catch (error) {
            return next(error);
        }
    },

    async queueSourceById(req, res, next) {
        try {
            const source = await SourceConfig.findById(req.params.sourceId).lean();
            if (!source) {
                return ApiResponse.notFound(res, 'Source config not found');
            }

            const queued = await syncManager.enqueueSync({ sourceType: source.sourceType, sourceKey: source.sourceKey });
            if (!queued) {
                return ApiResponse.success(res, { id: null }, 'Source already queued or running');
            }
            return ApiResponse.success(res, { id: queued._id }, 'Source queued for sync');
        } catch (error) {
            return next(error);
        }
    },

    async recoverSource(req, res, next) {
        try {
            const source = await SourceConfig.findById(req.params.sourceId);
            if (!source) {
                return ApiResponse.notFound(res, 'Source config not found');
            }

            source.enabled = true;
            source.failureStreak = 0;
            source.autoDisabledAt = null;
            source.autoDisabledReason = '';
            if (source.lastSyncStatus === 'failed') {
                source.lastSyncStatus = 'idle';
            }
            await source.save();

            const queued = await syncManager.enqueueSync({
                sourceType: source.sourceType,
                sourceKey: source.sourceKey,
            });

            return ApiResponse.success(
                res,
                {
                    source,
                    queuedSyncId: queued ? queued._id : null,
                    alreadyQueuedOrRunning: !queued,
                },
                queued ? 'Source recovered and queued for sync' : 'Source recovered; sync already queued/running'
            );
        } catch (error) {
            return next(error);
        }
    },

    /**
     * NEW: Upload and parse resume with Gemini AI skill extraction
     */
    async uploadAndParseResume(req, res, next) {
        try {
            const resumeText = req.body.resumeText || req.file?.resumeTextExtracted;
            if (!resumeText) {
                return ApiResponse.badRequest(res, 'resumeText is required or upload a supported PDF');
            }

            const profile = await careerTwinService.uploadResumeAndBuildProfile({
                userId: req.user.userId,
                resumeText,
                filename: req.file?.originalname || '',
                preferences: req.body.preferences || {},
            });

            return ApiResponse.success(res, { profile }, 'Resume parsed and profile updated with AI skill extraction');
        } catch (error) {
            next(error);
        }
    },

    /**
     * NEW: Search jobs based on resume-extracted skills using JSearch RapidAPI
     */
    async searchJobsForUser(req, res, next) {
        try {
            const result = await careerTwinService.searchJobsForUser(req.user.userId);
            return ApiResponse.success(res, result, 'Jobs fetched and ranked by fit score');
        } catch (error) {
            return ApiResponse.badRequest(res, error.message);
        }
    },

    /**
     * NEW: Start a fresh interview session — returns opening question.
     */
    async startInterviewSession(req, res, next) {
        try {
            const { jobTitle = 'Software Engineer' } = req.body;
            const result = await careerTwinService.startInterviewSession(req.user.userId, jobTitle);
            return ApiResponse.success(res, result, 'Interview session started');
        } catch (error) {
            return next(error);
        }
    },

    /**
     * NEW: Mock interview chat endpoint (multi-turn session mode).
     */
    async interviewChat(req, res, next) {
        try {
            const { userMessage, jobTitle = 'Developer', conversationHistory = [] } = req.body;
            if (!userMessage) {
                return ApiResponse.badRequest(res, 'userMessage is required');
            }

            const result = await careerTwinService.interviewChat({
                jobTitle,
                history: conversationHistory,
                userMessage,
            });

            return ApiResponse.success(res, result, 'Interview conversation progressed');
        } catch (error) {
            return next(error);
        }
    },

    /**
     * NEW: Evaluate completed interview session — returns score + feedback.
     */
    async evaluateInterviewSession(req, res, next) {
        try {
            const { jobTitle = 'Software Engineer', conversationHistory = [] } = req.body;
            const result = await careerTwinService.evaluateInterviewSession({
                jobTitle,
                history: conversationHistory,
            });
            return ApiResponse.success(res, result, 'Interview session evaluated');
        } catch (error) {
            return next(error);
        }
    },

    /**
     * NEW: Generate single mock interview response (backward-compat).
     */
    async generateInterviewerResponse(req, res, next) {
        try {
            const { userResponse, jobTitle } = req.body;
            if (!userResponse) {
                return ApiResponse.badRequest(res, 'userResponse is required');
            }

            const result = await careerTwinService.generateInterviewerResponse(userResponse, jobTitle || 'Developer');
            return ApiResponse.success(res, { interviewer: result }, 'Interview response generated');
        } catch (error) {
            return ApiResponse.badRequest(res, error.message);
        }
    },

    /**
     * NEW: Process user audio for interview via Gemini STT.
     */
    async processUserAudio(req, res, next) {
        try {
            if (!req.file) {
                return ApiResponse.badRequest(res, 'Audio file is required');
            }

            const result = await careerTwinService.processUserAudio(req.file.buffer, req.file.mimetype);
            return ApiResponse.success(res, result, 'Audio processed');
        } catch (error) {
            return next(error);
        }
    },
};

module.exports = controller;
