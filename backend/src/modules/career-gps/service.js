const geminiService = require('../../core/ai/gemini-service');
const cache = require('../gamification/cache');
const { AppError } = require('../../core/middleware/error');
const { ERROR_CODES } = require('../../config/constants');

const { CareerGoal } = require('./career-goal-model');
const CareerRoadmap = require('./career-roadmap-model');
const CareerMission = require('./career-mission-model');
const CareerProgress = require('./career-progress-model');
const CareerProbability = require('./career-probability-model');
const { buildSkillGapPrompt, buildRoadmapPrompt, buildMissionsPrompt } = require('./prompts');

const Resume = require('../resume/model');
const DSAProblem = require('../dsa/model');
const InterviewSession = require('../interview/model');
const SkillProfile = require('../skill-marketplace/skill-profile-model');
const SkillSession = require('../skill-marketplace/session-model');
const UserGamification = require('../gamification/user-gamification-model');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const REQUIRED_PROFILES_BY_ROLE = {
    'Software Engineer': {
        'DSA Skill': 80,
        Projects: 75,
        'Interview Skill': 70,
        Communication: 65,
    },
    'Data Scientist': {
        'DSA Skill': 65,
        Projects: 80,
        'Interview Skill': 70,
        Communication: 65,
    },
    'Product Manager': {
        'DSA Skill': 35,
        Projects: 60,
        'Interview Skill': 80,
        Communication: 85,
    },
    'MBA Consultant': {
        'DSA Skill': 20,
        Projects: 55,
        'Interview Skill': 75,
        Communication: 90,
    },
    'Investment Analyst': {
        'DSA Skill': 45,
        Projects: 65,
        'Interview Skill': 75,
        Communication: 80,
    },
    'Marketing Manager': {
        'DSA Skill': 20,
        Projects: 65,
        'Interview Skill': 75,
        Communication: 90,
    },
    'Startup Founder': {
        'DSA Skill': 45,
        Projects: 80,
        'Interview Skill': 70,
        Communication: 85,
    },
};

class CareerGPSService {
    normalizeProfileMap(profileMap) {
        return Object.entries(profileMap).map(([skill, value]) => ({
            skill,
            value: clamp(Math.round(Number(value) || 0), 0, 100),
        }));
    }

    async buildCareerTwinSnapshot(userId) {
        const [latestResume, dsaStats, interviewStats, skillProfile, completedSkillSessions, gamification] = await Promise.all([
            Resume.findOne({ userId, isActive: true }).sort({ updatedAt: -1 }).lean(),
            DSAProblem.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        totalSolved: { $sum: { $cond: ['$solved', 1, 0] } },
                        totalProblems: { $sum: 1 },
                    },
                },
            ]),
            InterviewSession.aggregate([
                { $match: { userId, status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        avgOverallScore: { $avg: '$overallScore' },
                        totalCompleted: { $sum: 1 },
                    },
                },
            ]),
            SkillProfile.findOne({ userId }).lean(),
            SkillSession.countDocuments({
                status: 'completed',
                $or: [{ mentorId: userId }, { learnerId: userId }],
            }),
            UserGamification.findOne({ userId }).lean(),
        ]);

        const resumeQualityScore = clamp(Math.round(latestResume?.analysis?.atsScore || 0), 0, 100);

        const solved = Number(dsaStats?.[0]?.totalSolved || 0);
        const totalProblems = Number(dsaStats?.[0]?.totalProblems || 0);
        const dsaSolveRate = totalProblems > 0 ? solved / totalProblems : 0;
        const dsaScore = clamp(Math.round((solved * 4) + (dsaSolveRate * 60)), 0, 100);

        const avgInterviewScore = clamp(Math.round(interviewStats?.[0]?.avgOverallScore || 0), 0, 100);
        const totalInterviews = Number(interviewStats?.[0]?.totalCompleted || 0);

        const projectCount = Number(latestResume?.content?.projects?.length || 0);
        const githubLinked = Boolean(latestResume?.content?.personal?.github);
        const projectsScore = clamp((projectCount * 15) + (githubLinked ? 15 : 0), 0, 100);

        const skillMarketplaceSkills = Number(skillProfile?.teachSkills?.length || 0) + Number(skillProfile?.learnSkills?.length || 0);
        const skillMarketplaceScore = clamp(
            Math.round((skillMarketplaceSkills * 8) + (Number(skillProfile?.ratingAverage || 0) * 12) + (completedSkillSessions * 4)),
            0,
            100
        );

        const streak = Number(gamification?.streakCurrent || 0);
        const platformActivityScore = clamp(Math.round((Number(gamification?.totalXp || 0) / 60) + (streak * 2)), 0, 100);

        const communicationScore = clamp(Math.round((avgInterviewScore * 0.6) + (skillMarketplaceScore * 0.4)), 0, 100);

        const weightedReadiness = Math.round(
            (resumeQualityScore * 0.2) +
            (dsaScore * 0.25) +
            (avgInterviewScore * 0.2) +
            (projectsScore * 0.15) +
            (skillMarketplaceScore * 0.1) +
            (platformActivityScore * 0.1)
        );

        return {
            readinessScore: clamp(weightedReadiness, 0, 100),
            inputSignals: {
                resumeQualityScore,
                dsaScore,
                avgInterviewScore,
                projectsScore,
                skillMarketplaceScore,
                platformActivityScore,
            },
            currentSkillProfile: {
                'DSA Skill': dsaScore,
                Projects: projectsScore,
                'Interview Skill': avgInterviewScore,
                Communication: communicationScore,
            },
            sourceFacts: {
                solvedDsaProblems: solved,
                dsaAttemptedProblems: totalProblems,
                interviewSessions: totalInterviews,
                projectsCount: projectCount,
                skillMarketplaceSkills,
                currentStreak: streak,
            },
        };
    }

    async setGoal(userId, { targetRole, notes = '' }) {
        await CareerGoal.updateMany({ userId, status: 'active' }, { $set: { status: 'archived' } });

        const goal = await CareerGoal.create({
            userId,
            targetRole,
            notes,
            status: 'active',
            source: 'manual',
        });

        await this.generateOrRefreshRoadmap(userId, { forceRefresh: true, targetRoleOverride: targetRole, goalId: goal._id });
        return goal;
    }

    getRequiredProfile(targetRole) {
        return REQUIRED_PROFILES_BY_ROLE[targetRole] || REQUIRED_PROFILES_BY_ROLE['Software Engineer'];
    }

    buildGapAnalysis(currentProfileMap, requiredProfileMap) {
        return Object.keys(requiredProfileMap).map((skill) => {
            const current = clamp(Math.round(currentProfileMap[skill] || 0), 0, 100);
            const required = clamp(Math.round(requiredProfileMap[skill] || 0), 0, 100);
            return {
                skill,
                current,
                required,
                gap: clamp(required - current, 0, 100),
            };
        });
    }

    getFallbackRoadmapFromGaps(gaps) {
        const sorted = [...gaps].sort((a, b) => b.gap - a.gap);
        const primary = sorted[0]?.skill || 'DSA Skill';

        return {
            timelineStages: [
                { key: 'foundation', title: 'Foundation Sprint', description: `Strengthen ${primary}`, requiredTaskCompletions: 2, order: 1 },
                { key: 'build', title: 'Build & Ship', description: 'Build portfolio-grade project outcomes', requiredTaskCompletions: 2, order: 2 },
                { key: 'simulate', title: 'Interview Simulation', description: 'Practice and benchmark interview performance', requiredTaskCompletions: 2, order: 3 },
                { key: 'launch', title: 'Application Launch', description: 'Resume optimization and targeted applications', requiredTaskCompletions: 2, order: 4 },
            ],
            tasks: [
                { weekNumber: 1, title: 'Solve 10 DSA fundamentals', description: 'Focus on arrays and strings', category: 'dsa', targetCount: 10, xpReward: 30, linkedStageKey: 'foundation' },
                { weekNumber: 2, title: 'Build one backend API project', description: 'Ship one deployable REST API', category: 'project', targetCount: 1, xpReward: 40, linkedStageKey: 'build' },
                { weekNumber: 3, title: 'Complete 3 mock interviews', description: 'Practice technical + behavioral rounds', category: 'interview', targetCount: 3, xpReward: 35, linkedStageKey: 'simulate' },
                { weekNumber: 4, title: 'Improve resume with quantified bullets', description: 'Update measurable impact statements', category: 'resume', targetCount: 1, xpReward: 25, linkedStageKey: 'launch' },
            ],
        };
    }

    async generateOrRefreshRoadmap(userId, { forceRefresh = false, targetRoleOverride = null, goalId = null } = {}) {
        const activeGoal = goalId
            ? await CareerGoal.findOne({ _id: goalId, userId }).lean()
            : await CareerGoal.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 }).lean();

        if (!activeGoal) {
            throw new AppError('Please set a career goal first', 400, ERROR_CODES.VALIDATION_ERROR);
        }

        const cacheKey = `career-gps:roadmap:${userId}:${activeGoal.targetRole}`;
        if (!forceRefresh) {
            const cached = cache.get(cacheKey);
            if (cached) return cached;
        }

        const existingRoadmap = await CareerRoadmap.findOne({
            userId,
            goalId: activeGoal._id,
            status: 'active',
            cacheExpiresAt: { $gt: new Date() },
        }).sort({ updatedAt: -1 });

        if (existingRoadmap && !forceRefresh) {
            cache.set(cacheKey, existingRoadmap, 1000 * 60 * 10);
            return existingRoadmap;
        }

        const targetRole = targetRoleOverride || activeGoal.targetRole;
        const twinSnapshot = await this.buildCareerTwinSnapshot(userId);
        const requiredProfileMap = this.getRequiredProfile(targetRole);

        let gapAnalysis = this.buildGapAnalysis(twinSnapshot.currentSkillProfile, requiredProfileMap);
        let requiredSkillProfile = this.normalizeProfileMap(requiredProfileMap);
        let timelineStages = [];
        let tasks = [];
        let recommendations = [];

        const skillGapPrompt = buildSkillGapPrompt({
            targetRole,
            readinessScore: twinSnapshot.readinessScore,
            currentSkillProfile: twinSnapshot.currentSkillProfile,
            requiredSkillProfile: requiredProfileMap,
            context: twinSnapshot.sourceFacts,
        });

        const roadmapPrompt = buildRoadmapPrompt({
            targetRole,
            gapAnalysis,
            readinessScore: twinSnapshot.readinessScore,
        });

        const aiPack = await geminiService.generateCareerGPSPlan({
            skillGapPrompt,
            roadmapPrompt,
        });

        if (aiPack && !aiPack.error) {
            requiredSkillProfile = Array.isArray(aiPack.requiredSkillProfile) && aiPack.requiredSkillProfile.length > 0
                ? aiPack.requiredSkillProfile.map((x) => ({ skill: x.skill, value: clamp(Number(x.value || 0), 0, 100) }))
                : requiredSkillProfile;

            if (Array.isArray(aiPack.gapAnalysis) && aiPack.gapAnalysis.length > 0) {
                gapAnalysis = aiPack.gapAnalysis.map((x) => ({
                    skill: x.skill,
                    current: clamp(Number(x.current || 0), 0, 100),
                    required: clamp(Number(x.required || 0), 0, 100),
                    gap: clamp(Number(x.gap || 0), 0, 100),
                }));
            }

            timelineStages = Array.isArray(aiPack.timelineStages) ? aiPack.timelineStages : [];
            tasks = Array.isArray(aiPack.tasks) ? aiPack.tasks : [];
            recommendations = Array.isArray(aiPack.recommendations) ? aiPack.recommendations : [];
        }

        if (!timelineStages.length || !tasks.length) {
            const fallback = this.getFallbackRoadmapFromGaps(gapAnalysis);
            timelineStages = fallback.timelineStages;
            tasks = fallback.tasks;
            if (!recommendations.length) {
                recommendations = [
                    'Focus on top two skill gaps with measurable weekly outputs.',
                    'Track consistency daily and review readiness score every week.',
                    'Pair project delivery with mock interview practice for compounding impact.',
                ];
            }
        }

        const currentSkillProfile = this.normalizeProfileMap(twinSnapshot.currentSkillProfile);

        const normalizedStages = timelineStages
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((stage, idx) => ({
                key: String(stage.key || `stage_${idx + 1}`),
                title: String(stage.title || `Stage ${idx + 1}`),
                description: String(stage.description || ''),
                requiredTaskCompletions: clamp(Number(stage.requiredTaskCompletions || 1), 1, 20),
                order: idx + 1,
                unlocked: idx === 0,
                unlockedAt: idx === 0 ? new Date() : null,
                completed: false,
                completedAt: null,
            }));

        const validStageKeys = new Set(normalizedStages.map((s) => s.key));

        const normalizedTasks = tasks.map((task, idx) => {
            const stageKey = validStageKeys.has(task.linkedStageKey)
                ? task.linkedStageKey
                : normalizedStages[Math.min(idx, normalizedStages.length - 1)]?.key || 'foundation';

            return {
                weekNumber: clamp(Number(task.weekNumber || idx + 1), 1, 26),
                title: String(task.title || `Week ${idx + 1} task`),
                description: String(task.description || ''),
                category: String(task.category || 'dsa'),
                targetCount: clamp(Number(task.targetCount || 1), 1, 100),
                currentCount: 0,
                completed: false,
                completedAt: null,
                xpReward: clamp(Number(task.xpReward || 20), 5, 200),
                linkedStageKey: stageKey,
            };
        });

        await CareerRoadmap.updateMany({ userId, status: 'active' }, { $set: { status: 'archived' } });

        const roadmap = await CareerRoadmap.create({
            userId,
            goalId: activeGoal._id,
            targetRole,
            careerReadinessScore: twinSnapshot.readinessScore,
            currentSkillProfile,
            requiredSkillProfile,
            gapAnalysis,
            timelineStages: normalizedStages,
            tasks: normalizedTasks,
            recommendations,
            status: 'active',
            cacheExpiresAt: new Date(Date.now() + (1000 * 60 * 60 * 12)),
        });

        await CareerProgress.findOneAndUpdate(
            { userId },
            {
                $set: {
                    roadmapId: roadmap._id,
                    totalTasks: normalizedTasks.length,
                    completedTasks: 0,
                    progressPercent: 0,
                },
                $push: {
                    readinessHistory: {
                        score: twinSnapshot.readinessScore,
                        source: 'career-twin',
                        at: new Date(),
                    },
                    timelineEvents: {
                        type: 'stage_unlocked',
                        title: normalizedStages[0]?.title || 'Foundation stage unlocked',
                        metadata: { stageKey: normalizedStages[0]?.key || 'foundation' },
                        at: new Date(),
                    },
                },
            },
            { upsert: true, new: true }
        );

        await this.recomputeProbability(userId, roadmap, twinSnapshot.readinessScore);

        cache.set(cacheKey, roadmap, 1000 * 60 * 10);
        return roadmap;
    }

    async ensureDailyMissions(userId, roadmap) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await CareerMission.findOne({ userId, missionDate: today }).sort({ createdAt: -1 });
        if (existing) return existing;

        const missionPrompt = buildMissionsPrompt({
            targetRole: roadmap.targetRole,
            gapAnalysis: roadmap.gapAnalysis || [],
        });

        const aiMissions = await geminiService.generateCareerGPSMissions({ missionPrompt });
        let items = [];
        let source = 'ai';

        if (!aiMissions.error && Array.isArray(aiMissions.missions) && aiMissions.missions.length > 0) {
            items = aiMissions.missions.slice(0, 3).map((mission) => ({
                title: String(mission.title || 'Daily mission'),
                category: String(mission.category || 'dsa'),
                targetCount: clamp(Number(mission.targetCount || 1), 1, 10),
                currentCount: 0,
                completed: false,
                xpReward: clamp(Number(mission.xpReward || 15), 5, 80),
                readinessImpact: clamp(Number(mission.readinessImpact || 2), 1, 10),
            }));
        } else {
            source = 'fallback';
            items = [
                { title: 'Solve 2 DSA problems', category: 'dsa', targetCount: 2, currentCount: 0, completed: false, xpReward: 15, readinessImpact: 2 },
                { title: 'Practice 1 interview answer', category: 'interview', targetCount: 1, currentCount: 0, completed: false, xpReward: 15, readinessImpact: 2 },
                { title: 'Improve one resume bullet with impact', category: 'resume', targetCount: 1, currentCount: 0, completed: false, xpReward: 10, readinessImpact: 1 },
            ];
        }

        return CareerMission.create({
            userId,
            roadmapId: roadmap._id,
            missionDate: today,
            items,
            source,
            status: 'active',
        });
    }

    async getRoadmap(userId) {
        const roadmap = await this.generateOrRefreshRoadmap(userId, { forceRefresh: false });
        const progress = await CareerProgress.findOne({ userId }).lean();

        return {
            roadmap,
            progress,
        };
    }

    async updateProgress(userId, payload) {
        const roadmap = await CareerRoadmap.findOne({ _id: payload.roadmapId, userId, status: 'active' });
        if (!roadmap) throw new AppError('Active career roadmap not found', 404, ERROR_CODES.NOT_FOUND);

        const incrementBy = clamp(Number(payload.incrementBy || 1), 1, 50);
        let eventTitle = '';
        let xpDelta = 0;

        if (payload.taskId) {
            const task = roadmap.tasks.id(payload.taskId);
            if (!task) throw new AppError('Roadmap task not found', 404, ERROR_CODES.NOT_FOUND);

            task.currentCount = clamp(task.currentCount + incrementBy, 0, task.targetCount);

            if (!task.completed && (payload.markCompleted || task.currentCount >= task.targetCount)) {
                task.completed = true;
                task.completedAt = new Date();
                xpDelta += task.xpReward;
                eventTitle = `Completed task: ${task.title}`;
            }
        }

        if (payload.missionId) {
            const mission = await CareerMission.findOne({ userId, missionDate: { $lte: new Date() } }).sort({ missionDate: -1 });
            if (!mission) throw new AppError('No mission found for update', 404, ERROR_CODES.NOT_FOUND);

            const missionItem = mission.items.id(payload.missionId);
            if (!missionItem) throw new AppError('Mission item not found', 404, ERROR_CODES.NOT_FOUND);

            missionItem.currentCount = clamp(missionItem.currentCount + incrementBy, 0, missionItem.targetCount);
            if (!missionItem.completed && (payload.markCompleted || missionItem.currentCount >= missionItem.targetCount)) {
                missionItem.completed = true;
                missionItem.completedAt = new Date();
                xpDelta += missionItem.xpReward;
                eventTitle = eventTitle || `Completed mission: ${missionItem.title}`;
            }

            const allDone = mission.items.every((item) => item.completed);
            mission.status = allDone ? 'completed' : 'active';
            await mission.save();
        }

        const stageCompletionCounts = {};
        roadmap.tasks.forEach((task) => {
            if (!stageCompletionCounts[task.linkedStageKey]) stageCompletionCounts[task.linkedStageKey] = 0;
            if (task.completed) stageCompletionCounts[task.linkedStageKey] += 1;
        });

        roadmap.timelineStages = roadmap.timelineStages.map((stage, index) => {
            const completedInStage = stageCompletionCounts[stage.key] || 0;
            const shouldComplete = completedInStage >= stage.requiredTaskCompletions;

            if (!stage.completed && shouldComplete) {
                stage.completed = true;
                stage.completedAt = new Date();
            }

            const nextStage = roadmap.timelineStages[index + 1];
            if (stage.completed && nextStage && !nextStage.unlocked) {
                nextStage.unlocked = true;
                nextStage.unlockedAt = new Date();
            }

            return stage;
        });

        await roadmap.save();

        const totalTasks = roadmap.tasks.length;
        const completedTasks = roadmap.tasks.filter((task) => task.completed).length;
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const latestReadiness = clamp(
            Math.round((roadmap.careerReadinessScore || 0) + (progressPercent * 0.2) + (xpDelta * 0.03)),
            0,
            100
        );

        await CareerProgress.findOneAndUpdate(
            { userId },
            {
                $set: {
                    roadmapId: roadmap._id,
                    totalTasks,
                    completedTasks,
                    progressPercent,
                },
                $inc: { totalXpEarned: xpDelta },
                ...(eventTitle
                    ? {
                        $push: {
                            timelineEvents: {
                                type: payload.taskId ? 'task_completed' : 'mission_completed',
                                title: eventTitle,
                                metadata: { roadmapId: String(roadmap._id) },
                                at: new Date(),
                            },
                            readinessHistory: {
                                score: latestReadiness,
                                source: 'career-gps-progress',
                                at: new Date(),
                            },
                        },
                    }
                    : {
                        $push: {
                            readinessHistory: {
                                score: latestReadiness,
                                source: 'career-gps-progress',
                                at: new Date(),
                            },
                        },
                    }),
            },
            { upsert: true, new: true }
        );

        setImmediate(async () => {
            try {
                await this.recomputeProbability(userId, roadmap, latestReadiness);
            } catch (error) {
                console.error('[CareerGPS] Failed async probability recomputation:', error.message);
            }
        });

        return {
            roadmapId: roadmap._id,
            progressPercent,
            completedTasks,
            totalTasks,
            xpDelta,
            readinessScore: latestReadiness,
        };
    }

    async recomputeProbability(userId, roadmap, readinessScore) {
        const progress = await CareerProgress.findOne({ userId }).lean();
        const completionScore = Number(progress?.progressPercent || 0);

        const dsaGap = Number((roadmap.gapAnalysis || []).find((g) => g.skill === 'DSA Skill')?.gap || 0);
        const interviewGap = Number((roadmap.gapAnalysis || []).find((g) => g.skill === 'Interview Skill')?.gap || 0);

        const startupCompany = clamp(Math.round((readinessScore * 0.55) + (completionScore * 0.35) + 10), 1, 95);
        const midSizeTechCompany = clamp(Math.round((readinessScore * 0.48) + (completionScore * 0.28) - (interviewGap * 0.12) + 5), 1, 90);
        const topTechCompany = clamp(Math.round((readinessScore * 0.34) + (completionScore * 0.22) - (dsaGap * 0.2) - (interviewGap * 0.16)), 1, 85);

        const factors = [
            { label: 'Career Readiness', score: clamp(readinessScore, 0, 100), weight: 0.5 },
            { label: 'Roadmap Completion', score: clamp(completionScore, 0, 100), weight: 0.3 },
            { label: 'Interview Gap Penalty', score: clamp(100 - interviewGap, 0, 100), weight: 0.1 },
            { label: 'DSA Gap Penalty', score: clamp(100 - dsaGap, 0, 100), weight: 0.1 },
        ];

        return CareerProbability.findOneAndUpdate(
            { userId },
            {
                $set: {
                    goalId: roadmap.goalId,
                    roadmapId: roadmap._id,
                    startupCompany,
                    midSizeTechCompany,
                    topTechCompany,
                    factors,
                    lastComputedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );
    }

    async getProbability(userId) {
        const roadmap = await CareerRoadmap.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 });
        if (!roadmap) {
            throw new AppError('Career roadmap not found. Set a goal first.', 404, ERROR_CODES.NOT_FOUND);
        }

        const progress = await CareerProgress.findOne({ userId }).lean();
        const readinessScore = Number(progress?.readinessHistory?.slice(-1)?.[0]?.score || roadmap.careerReadinessScore || 0);

        const probability = await this.recomputeProbability(userId, roadmap, readinessScore);
        return {
            readinessScore,
            probability,
        };
    }

    async getMissions(userId) {
        const roadmap = await CareerRoadmap.findOne({ userId, status: 'active' }).sort({ updatedAt: -1 });
        if (!roadmap) {
            throw new AppError('Career roadmap not found. Set a goal first.', 404, ERROR_CODES.NOT_FOUND);
        }

        return this.ensureDailyMissions(userId, roadmap);
    }
}

module.exports = new CareerGPSService();
