const Resume = require('../resume/model');
const CareerTwinProfile = require('./career-twin-profile-model');
const CareerTwinJob = require('./job-model');
const CareerTwinApplication = require('./application-model');
const CareerTwinApplicationEvent = require('./application-event-model');

const profileAgent = require('./agents/profile-agent');
const researchAgent = require('./agents/research-agent');
const matchingAgent = require('./agents/matching-agent');
const resumeAgent = require('./agents/resume-agent');
const applyAgent = require('./agents/apply-agent');
const trackingAgent = require('./agents/tracking-agent');
const learningAgent = require('./agents/learning-agent');
const interviewAgent = require('./agents/interview-agent');

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const DEFAULT_SAFE_JOBS = [
    {
        sourceUrl: 'https://careers.google.com/',
        applyUrl: 'https://careers.google.com/',
        company: 'Google',
        title: 'Software Engineer Intern',
        location: 'Bengaluru',
        workMode: 'hybrid',
        employmentType: 'internship',
        description: 'Build and improve product features with scalable engineering practices.',
        requiredSkills: ['javascript', 'data structures', 'algorithms', 'node.js'],
        niceToHaveSkills: ['typescript', 'react', 'testing'],
        tags: ['internship', 'backend', 'full-stack'],
    },
    {
        sourceUrl: 'https://jobs.microsoft.com/',
        applyUrl: 'https://jobs.microsoft.com/',
        company: 'Microsoft',
        title: 'SDE Intern',
        location: 'Hyderabad',
        workMode: 'hybrid',
        employmentType: 'internship',
        description: 'Work on cloud and productivity products in collaborative teams.',
        requiredSkills: ['c++', 'problem solving', 'data structures', 'system design basics'],
        niceToHaveSkills: ['azure', 'python', 'javascript'],
        tags: ['internship', 'cloud'],
    },
    {
        sourceUrl: 'https://careers.atlassian.com/',
        applyUrl: 'https://careers.atlassian.com/',
        company: 'Atlassian',
        title: 'Graduate Software Engineer',
        location: 'Remote',
        workMode: 'remote',
        employmentType: 'full-time',
        description: 'Develop reliable services and product experiences for developer tools.',
        requiredSkills: ['java', 'apis', 'distributed systems', 'sql'],
        niceToHaveSkills: ['react', 'aws', 'docker'],
        tags: ['graduate', 'platform', 'remote'],
    },
];

class CareerTwinOrchestratorService {
    async searchJobs(filters = {}) {
        const normalizedFilters = {
            query: filters.query || '',
            location: filters.location || '',
            workMode: filters.workMode || '',
            limit: Number(filters.limit || 40),
            offset: Number(filters.offset || 0),
        };

        const [items, total] = await Promise.all([
            researchAgent.queryJobs(normalizedFilters),
            researchAgent.countJobs(normalizedFilters),
        ]);

        const limit = Math.min(Math.max(1, normalizedFilters.limit), 100);
        const offset = Math.max(0, normalizedFilters.offset);

        return {
            items,
            total,
            offset,
            limit,
            hasMore: offset + items.length < total,
        };
    }

    async getJobDetail(jobId) {
        if (!jobId) return null;
        return CareerTwinJob.findOne({ _id: jobId, isActive: true }).lean();
    }

    async getOrCreateProfile(userId) {
        let profile = await CareerTwinProfile.findOne({ userId });
        if (profile) return profile;

        const resume = await Resume.findOne({ userId, isActive: true }).sort({ updatedAt: -1 }).lean();
        const resumeText = JSON.stringify(resume?.content || {});
        const parsed = await profileAgent.parseResume({ resumeText, preferences: {} });

        try {
            profile = await CareerTwinProfile.create({
                userId,
                activeResumeId: resume?._id,
                summary: {
                    headline: parsed.headline,
                    preferredRoles: parsed.preferredRoles,
                    preferredLocations: parsed.preferredLocations,
                    workMode: parsed.workMode,
                    strengths: parsed.strengths,
                },
                projects: parsed.projects,
                experiences: parsed.experiences,
                skills: parsed.skills,
                skillsGraph: parsed.skillsGraph,
                parsedFrom: {
                    sourceType: resume ? 'existing_resume' : 'manual',
                    filename: '',
                    parsedAt: new Date(),
                },
            });
        } catch (error) {
            // Concurrent requests may both try to create the same unique user profile.
            if (error?.code === 11000) {
                profile = await CareerTwinProfile.findOne({ userId });
            } else {
                throw error;
            }
        }

        return profile;
    }

    async uploadResumeAndBuildProfile({ userId, resumeText, filename = '', preferences = {} }) {
        const parsed = await profileAgent.parseResume({ resumeText, preferences });

        const profile = await CareerTwinProfile.findOneAndUpdate(
            { userId },
            {
                $set: {
                    summary: {
                        headline: parsed.headline,
                        preferredRoles: parsed.preferredRoles,
                        preferredLocations: parsed.preferredLocations,
                        workMode: parsed.workMode,
                        strengths: parsed.strengths,
                    },
                    projects: parsed.projects,
                    experiences: parsed.experiences,
                    skills: parsed.skills,
                    skillsGraph: parsed.skillsGraph,
                    parsedFrom: {
                        sourceType: 'upload',
                        filename,
                        parsedAt: new Date(),
                    },
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return profile;
    }

    async syncJobs({ jobs, source }) {
        return researchAgent.ingestStructuredJobs({ jobs, source });
    }

    async getRecommendations({ userId, filters = {} }) {
        const profile = await this.getOrCreateProfile(userId);
        let jobs = await researchAgent.queryJobs({
            query: filters.query || (profile.summary?.preferredRoles?.[0] || ''),
            location: filters.location || '',
            workMode: filters.workMode || '',
            limit: filters.limit || 40,
            offset: filters.offset || 0,
        });

        if (!jobs.length) {
            await researchAgent.ingestStructuredJobs({
                jobs: DEFAULT_SAFE_JOBS,
                source: 'safe_seed',
            });

            jobs = await researchAgent.queryJobs({
                query: filters.query || (profile.summary?.preferredRoles?.[0] || ''),
                location: filters.location || '',
                workMode: filters.workMode || '',
                limit: filters.limit || 40,
                offset: filters.offset || 0,
            });
        }

        const matches = await matchingAgent.rankJobs({ profile, jobs });
        const jobMap = new Map(jobs.map((j) => [j.externalId, j]));

        const recommendations = matches.map((match) => {
            const job = jobMap.get(match.jobRef);
            if (!job) return null;
            return {
                jobId: job._id,
                externalId: job.externalId,
                title: job.title,
                company: job.company,
                location: job.location,
                workMode: job.workMode,
                applyUrl: job.applyUrl,
                tags: job.tags,
                requiredSkills: job.requiredSkills,
                fitScore: match.fitScore,
                interviewProbability: match.interviewProbability,
                fitCategory: match.fitCategory,
                missingSkills: match.missingSkills,
                resumeFitScore: match.resumeFitScore,
                reasoning: match.reasoning,
            };
        }).filter(Boolean);

        const strongFitCount = recommendations.filter((r) => r.fitCategory === 'strong_fit').length;
        const avgMatch = recommendations.length ? Math.round(recommendations.reduce((acc, r) => acc + r.fitScore, 0) / recommendations.length) : 0;

        return {
            profile: {
                headline: profile.summary?.headline,
                preferredRoles: profile.summary?.preferredRoles || [],
                strengths: profile.summary?.strengths || [],
                topSkills: (profile.skills || []).slice(0, 10).map((s) => s.name),
            },
            metrics: {
                totalJobs: recommendations.length,
                strongFitCount,
                averageMatchScore: avgMatch,
            },
            recommendations,
        };
    }

    async generateTailoredResume({ userId, jobId }) {
        const [profile, job] = await Promise.all([
            this.getOrCreateProfile(userId),
            CareerTwinJob.findById(jobId).lean(),
        ]);

        if (!job) {
            throw new Error('Job not found');
        }

        const tailored = await resumeAgent.generateTailoredResume({ profile, job });
        return { job, tailored };
    }

    async applyToJob({ userId, jobId, applyMode = 'assisted' }) {
        const [profile, job] = await Promise.all([
            this.getOrCreateProfile(userId),
            CareerTwinJob.findById(jobId).lean(),
        ]);

        if (!job) {
            throw new Error('Job not found');
        }

        const isManual = applyMode === 'manual';
        const isApplied = applyMode === 'user_approved' || isManual;

        let tailored = {
            summary: '',
            bullets: [],
            atsKeywords: [],
            resumeFitScore: 0,
        };

        let answers = {
            whyThisRole: '',
            whyYou: '',
            impactStory: '',
        };

        if (!isManual) {
            const generated = await Promise.all([
                this.generateTailoredResume({ userId, jobId }),
                applyAgent.prepareAnswers({ profile, job }),
            ]);
            tailored = generated[0].tailored;
            answers = generated[1];
        }

        const recommendations = await this.getRecommendations({ userId, filters: { query: job.title, location: job.location, limit: 20 } });
        const match = recommendations.recommendations.find((item) => String(item.jobId) === String(job._id));

        const application = await CareerTwinApplication.findOneAndUpdate(
            { userId, jobId: job._id },
            {
                $set: {
                    userId,
                    jobId: job._id,
                    applyMode,
                    status: isApplied ? 'applied' : 'draft',
                    matchScore: clamp(Number(match?.fitScore || 0), 0, 100),
                    interviewProbability: clamp(Number(match?.interviewProbability || 0), 0, 100),
                    fitCategory: match?.fitCategory || 'moderate_fit',
                    missingSkills: Array.isArray(match?.missingSkills) ? match.missingSkills : [],
                    tailoredResume: {
                        summary: tailored.summary,
                        bullets: tailored.bullets,
                        atsKeywords: tailored.atsKeywords,
                        resumeFitScore: clamp(Number(tailored.resumeFitScore || 0), 0, 100),
                    },
                    preparedAnswers: answers,
                    'timeline.lastUpdatedAt': new Date(),
                    ...(isApplied ? { 'timeline.appliedAt': new Date() } : {}),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const createdEventType = isApplied ? 'applied' : 'created';
        const createdEventMessage = isManual
            ? 'Application tracked as manual external apply'
            : applyMode === 'user_approved'
                ? 'Application submitted with user approval'
                : 'Application draft created';

        await trackingAgent.createEvent({
            userId,
            applicationId: application._id,
            type: createdEventType,
            toStatus: application.status,
            message: createdEventMessage,
            payload: { jobId: String(job._id), applyMode },
            createdBy: 'agent',
        });

        if (!isManual) {
            await trackingAgent.createEvent({
                userId,
                applicationId: application._id,
                type: 'resume_generated',
                message: 'Tailored resume generated',
                payload: { resumeFitScore: application.tailoredResume.resumeFitScore },
                createdBy: 'agent',
            });

            await trackingAgent.createEvent({
                userId,
                applicationId: application._id,
                type: 'answer_prepared',
                message: 'Application answers prepared',
                payload: {},
                createdBy: 'agent',
            });
        }

        return application;
    }

    async updateApplicationStatus({ userId, applicationId, status, note }) {
        const app = await trackingAgent.updateStatus({
            userId,
            applicationId,
            toStatus: status,
            note,
            createdBy: 'user',
        });

        await this.learnFromOutcomes(userId);
        return app;
    }

    async learnFromOutcomes(userId) {
        const profile = await this.getOrCreateProfile(userId);
        const recentApplications = await CareerTwinApplication.find({ userId })
            .populate('jobId')
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();

        const outcomeStatuses = new Set(['shortlisted', 'rejected', 'offer']);
        const recentOutcomes = recentApplications
            .filter((app) => outcomeStatuses.has(app.status))
            .map((app) => ({
                status: app.status,
                role: app.jobId?.title || '',
                matchedSkills: (app.jobId?.requiredSkills || []).filter((skill) =>
                    (profile.skills || []).some((s) => String(s.name).toLowerCase() === String(skill).toLowerCase())
                ),
                missingSkills: app.missingSkills || [],
            }));

        const learning = await learningAgent.learn({
            profileSignals: profile.learningSignals,
            recentOutcomes,
        });

        const roleWeights = learningAgent.applyWeightUpdates(profile.learningSignals?.roleOutcomeWeights || {}, learning.roleWeightUpdates);
        const skillWeights = learningAgent.applyWeightUpdates(profile.learningSignals?.skillOutcomeWeights || {}, learning.skillWeightUpdates);

        const totals = recentApplications.reduce((acc, app) => {
            acc.total += 1;
            if (app.status === 'shortlisted') acc.shortlisted += 1;
            if (app.status === 'rejected') acc.rejected += 1;
            if (app.status === 'offer') acc.offered += 1;
            return acc;
        }, { total: 0, shortlisted: 0, rejected: 0, offered: 0 });

        profile.learningSignals = {
            ...profile.learningSignals,
            totalApplications: totals.total,
            shortlisted: totals.shortlisted,
            rejected: totals.rejected,
            offered: totals.offered,
            roleOutcomeWeights: roleWeights,
            skillOutcomeWeights: skillWeights,
        };

        await profile.save();
        return { learningSignals: profile.learningSignals, insights: learning.insights };
    }

    async getApplications(userId) {
        const [applications, events, kanban, profile] = await Promise.all([
            CareerTwinApplication.find({ userId }).populate('jobId').sort({ updatedAt: -1 }).lean(),
            CareerTwinApplicationEvent.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
            trackingAgent.getKanban(userId),
            this.getOrCreateProfile(userId),
        ]);

        const skillGaps = this.deriveSkillGaps(applications, profile);

        return {
            applications,
            events,
            kanban,
            skillGaps,
            aiSuggestions: this.buildAiSuggestions(applications, profile, skillGaps),
            progress: this.computeProgress(profile),
        };
    }

    deriveSkillGaps(applications, profile) {
        const profileSkills = new Set((profile.skills || []).map((s) => String(s.name).toLowerCase()));
        const counter = new Map();

        applications.forEach((app) => {
            (app.jobId?.requiredSkills || []).forEach((skill) => {
                const key = String(skill).toLowerCase();
                if (!profileSkills.has(key)) {
                    counter.set(key, (counter.get(key) || 0) + 1);
                }
            });
        });

        return [...counter.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, freq]) => ({ skill, demandCount: freq, suggestion: `Build one proof project highlighting ${skill}.` }));
    }

    buildAiSuggestions(applications, profile, skillGaps) {
        const rejected = applications.filter((a) => a.status === 'rejected').length;
        const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
        const offers = applications.filter((a) => a.status === 'offer').length;

        const suggestions = [
            `Current conversion: ${shortlisted}/${applications.length || 1} shortlisted.`,
            `Top skill gap: ${(skillGaps[0]?.skill || 'none')} - prioritize this for next 2 weeks.`,
            `Role focus: ${(profile.summary?.preferredRoles || []).join(', ') || 'Set preferred roles in profile.'}`,
        ];

        if (rejected > shortlisted) {
            suggestions.push('Rejection rate is high: tighten role targeting and improve resume tailoring depth.');
        }
        if (offers > 0) {
            suggestions.push('Offer signal detected: replicate winning resume style and interview narrative.');
        }
        return suggestions;
    }

    computeProgress(profile) {
        const signals = profile.learningSignals || {};
        const total = Number(signals.totalApplications || 0);
        const shortlisted = Number(signals.shortlisted || 0);
        const offered = Number(signals.offered || 0);

        return {
            totalApplications: total,
            shortlistRate: total ? Math.round((shortlisted / total) * 100) : 0,
            offerRate: total ? Math.round((offered / total) * 100) : 0,
            confidenceScore: clamp(Math.round((shortlisted * 8) + (offered * 20)), 0, 100),
        };
    }

    async getDashboard(userId, filters = {}) {
        const [recommendations, tracking] = await Promise.all([
            this.getRecommendations({ userId, filters }),
            this.getApplications(userId),
        ]);

        return {
            recommendations,
            tracking,
        };
    }

    async getAnalytics({ lookbackDays = 30 } = {}) {
        const days = Math.max(1, Math.min(365, Number(lookbackDays || 30)));
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        const apps = await CareerTwinApplication.find({ createdAt: { $gte: startDate } }).lean();

        const stageOrder = ['draft', 'applied', 'shortlisted', 'interview', 'offer'];
        const stageCounts = stageOrder.reduce((acc, stage) => {
            acc[stage] = 0;
            return acc;
        }, {});

        const fitBuckets = {
            strong_fit: { total: 0, shortlisted: 0, interview: 0, offer: 0 },
            moderate_fit: { total: 0, shortlisted: 0, interview: 0, offer: 0 },
            stretch: { total: 0, shortlisted: 0, interview: 0, offer: 0 },
        };

        apps.forEach((app) => {
            if (stageCounts[app.status] !== undefined) {
                stageCounts[app.status] += 1;
            }

            if (fitBuckets[app.fitCategory]) {
                fitBuckets[app.fitCategory].total += 1;
                if (app.status === 'shortlisted') fitBuckets[app.fitCategory].shortlisted += 1;
                if (app.status === 'interview') fitBuckets[app.fitCategory].interview += 1;
                if (app.status === 'offer') fitBuckets[app.fitCategory].offer += 1;
            }
        });

        const first = stageCounts[stageOrder[0]] || 0;
        const stages = stageOrder.map((stage, index) => {
            const current = stageCounts[stage] || 0;
            const prev = index === 0 ? current : stageCounts[stageOrder[index - 1]] || 0;
            return {
                stage,
                count: current,
                conversionFromStart: first > 0 ? Math.round((current / first) * 100) : 0,
                dropFromPrevious: prev > 0 ? Math.max(0, Math.round(((prev - current) / prev) * 100)) : 0,
            };
        });

        const fitCategoryConversion = Object.entries(fitBuckets).map(([fitCategory, value]) => ({
            fitCategory,
            total: value.total,
            shortlistRate: value.total ? Math.round((value.shortlisted / value.total) * 100) : 0,
            interviewRate: value.total ? Math.round((value.interview / value.total) * 100) : 0,
            offerRate: value.total ? Math.round((value.offer / value.total) * 100) : 0,
        }));

        const totals = {
            applications: apps.length,
            applied: apps.filter((x) => x.status === 'applied').length,
            shortlisted: apps.filter((x) => x.status === 'shortlisted').length,
            interviews: apps.filter((x) => x.status === 'interview').length,
            offers: apps.filter((x) => x.status === 'offer').length,
            rejected: apps.filter((x) => x.status === 'rejected').length,
        };

        return {
            lookbackDays: days,
            startDate,
            totals,
            stages,
            fitCategoryConversion,
        };
    }

    /**
     * Search jobs based on user's resume-extracted skills using JSearch RapidAPI.
     */
    async searchJobsForUser(userId) {
        const profile = await this.getOrCreateProfile(userId);
        if (!profile || !profile.skills || profile.skills.length === 0) {
            throw new Error('No skills found in profile. Please upload your resume first.');
        }

        const topSkills = profile.skills.slice(0, 5).map((s) => s.name);
        const queryText = topSkills.join(' ');
        const location = profile.summary?.preferredLocations?.[0] || '';

        try {
            const jobSourceAdapters = require('./providers/job-source-adapters');
            const jobs = await jobSourceAdapters.fetchJSearchJobs(queryText, location, 1, 2);

            if (jobs.length === 0) {
                throw new Error('No jobs found for your skills. Try adjusting your profile.');
            }

            const skillSet = new Set(topSkills.map((s) => s.toLowerCase()));
            const rankedJobs = jobs.map((job) => {
                const desc = `${job.title} ${job.description || ''}`.toLowerCase();
                const matchedSkills = [...skillSet].filter(
                    (skill) => desc.includes(skill) || job.requiredSkills.some((s) => String(s).toLowerCase().includes(skill))
                );
                const score = topSkills.length > 0 ? Math.round((matchedSkills.length / topSkills.length) * 100) : 0;
                return { ...job, fitScore: Math.min(100, score), matchedSkills };
            }).sort((a, b) => b.fitScore - a.fitScore);

            return {
                message: `Found ${rankedJobs.length} jobs ranked by Fit Score based on your skills: ${queryText}`,
                jobs: rankedJobs,
                userSkills: topSkills,
            };
        } catch (error) {
            console.error('[searchJobsForUser] Error:', error.message);
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERVIEW AGENT METHODS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start a new mock interview session — returns opening question.
     * @param {string} userId
     * @param {string} jobTitle
     * @returns {Promise<{ question: string, hint: string, resumeSkills: string[] }>}
     */
    async startInterviewSession(userId, jobTitle = 'Software Engineer') {
        const profile = await this.getOrCreateProfile(userId);
        const resumeSkills = (profile.skills || []).slice(0, 8).map((s) => s.name);
        const result = await interviewAgent.startSession({ jobTitle, skills: resumeSkills });
        return { ...result, resumeSkills };
    }

    /**
     * Multi-turn interview chat.
     * @param {object} params
     * @param {string} params.jobTitle
     * @param {Array<{role, message}>} params.history
     * @param {string} params.userMessage
     * @returns {Promise<{ interviewer: object, conversationHistory: Array }>}
     */
    async interviewChat({ jobTitle, history = [], userMessage }) {
        const result = await interviewAgent.chat({ jobTitle, history, userMessage });

        const updatedHistory = [
            ...history,
            { role: 'user', message: userMessage, timestamp: new Date() },
            { role: 'interviewer', message: result.text, timestamp: new Date() },
        ];

        return {
            interviewer: {
                text: result.text,
                jobTitle,
                turnCount: result.turnCount,
            },
            conversationHistory: updatedHistory,
        };
    }

    /**
     * Legacy single-turn method kept for backward compatibility.
     */
    async generateInterviewerResponse(userTextResponse, jobTitle = 'Developer') {
        const result = await interviewAgent.chat({
            jobTitle,
            history: [],
            userMessage: userTextResponse,
        });
        return {
            text: result.text,
            jobTitle,
            userResponse: userTextResponse,
            timestamp: new Date(),
            feedbackPoints: [
                'Clear communication of technical concepts',
                'Problem-solving approach',
                'Real-world application of knowledge',
            ],
        };
    }

    /**
     * Evaluate the full interview session and produce structured feedback.
     * @param {object} params
     * @param {string} params.jobTitle
     * @param {Array} params.history
     */
    async evaluateInterviewSession({ jobTitle, history }) {
        return interviewAgent.evaluate({ jobTitle, history });
    }

    /**
     * Transcribe audio using Gemini 1.5 Flash's native audio understanding.
     * Falls back gracefully if audio is empty or key is missing.
     */
    async processUserAudio(audioBuffer, mimeType = 'audio/webm') {
        return interviewAgent.transcribeAudio(audioBuffer, mimeType);
    }
}

module.exports = new CareerTwinOrchestratorService();
