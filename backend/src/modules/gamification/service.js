const mongoose = require('mongoose');
const User = require('../../core/auth/model');
const UserGamification = require('./user-gamification-model');
const XPHistory = require('./xp-history-model');
const CareerBadge = require('./career-badge-model');
const CareerQuest = require('./career-quest-model');
const Leaderboard = require('./leaderboard-model');
const UserCredits = require('./user-credits-model');
const GamificationWorker = require('./worker');
const cache = require('./cache');
const {
    ACTIVITY_RULES,
    BADGE_DEFINITIONS,
    WEEKLY_QUEST_TEMPLATE,
    QUEST_ACTIVITY_PROGRESS,
    calculateLevel,
    getLevelTitle,
} = require('./rules-engine');

const STREAK_DAILY_BONUS_CREDITS = 10;

function toObjectId(id) {
    return new mongoose.Types.ObjectId(id);
}

function startOfUtcDay(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function getDayDiff(fromDate, toDate) {
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Math.floor((startOfUtcDay(toDate) - startOfUtcDay(fromDate)) / oneDayMs);
}

function getCurrentWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getUTCDay();
    const mondayOffset = day === 0 ? -6 : (1 - day);
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    return { weekStart, weekEnd };
}

class GamificationService {
    constructor() {
        this.worker = new GamificationWorker(this.processActivityNow.bind(this));
    }

    async getOrCreateGamification(userId) {
        let profile = await UserGamification.findOne({ userId });
        if (!profile) {
            profile = await UserGamification.create({ userId });
        }
        return profile;
    }

    async getOrCreateCredits(userId) {
        let credits = await UserCredits.findOne({ userId });
        if (!credits) {
            credits = await UserCredits.create({ userId });
        }
        return credits;
    }

    applyStreak(profile, rule, now) {
        if (!rule.meaningful) {
            return { streakDelta: 0, streakBonusCredits: 0 };
        }

        const previousStreak = profile.streakCurrent;
        let streakBonusCredits = 0;

        if (!profile.lastActiveDate) {
            profile.streakCurrent = 1;
            profile.streakLongest = Math.max(profile.streakLongest, 1);
            profile.lastActiveDate = now;
            streakBonusCredits = STREAK_DAILY_BONUS_CREDITS;
            return { streakDelta: profile.streakCurrent - previousStreak, streakBonusCredits };
        }

        const dayDiff = getDayDiff(profile.lastActiveDate, now);

        if (dayDiff === 0) {
            return { streakDelta: 0, streakBonusCredits: 0 };
        }

        if (dayDiff === 1) {
            profile.streakCurrent += 1;
        } else {
            profile.streakCurrent = 1;
        }

        profile.streakLongest = Math.max(profile.streakLongest, profile.streakCurrent);
        profile.lastActiveDate = now;
        streakBonusCredits = STREAK_DAILY_BONUS_CREDITS;

        return { streakDelta: profile.streakCurrent - previousStreak, streakBonusCredits };
    }

    applyStats(profile, statsDelta) {
        for (const [key, value] of Object.entries(statsDelta || {})) {
            const prev = Number(profile.stats[key] || 0);
            profile.stats[key] = prev + Number(value || 0);
        }
    }

    async ensureWeeklyQuest(userId, now = new Date()) {
        const { weekStart, weekEnd } = getCurrentWeekRange(now);

        await CareerQuest.updateMany(
            {
                userId,
                status: 'active',
                weekEnd: { $lte: now },
            },
            {
                $set: { status: 'expired' },
            }
        );

        let quest = await CareerQuest.findOne({ userId, weekStart });
        if (quest) return quest;

        quest = await CareerQuest.create({
            userId,
            weekStart,
            weekEnd,
            status: 'active',
            tasks: WEEKLY_QUEST_TEMPLATE.tasks.map((task) => ({
                key: task.key,
                label: task.label,
                target: task.target,
                current: 0,
                completed: false,
            })),
            reward: { ...WEEKLY_QUEST_TEMPLATE.reward },
        });

        return quest;
    }

    incrementQuestProgress(quest, activityType) {
        const progressRule = QUEST_ACTIVITY_PROGRESS[activityType];
        if (!progressRule) return false;
        if (!quest || !Array.isArray(quest.tasks)) return false;
        if (!['active', 'completed'].includes(quest.status)) return false;

        const task = quest.tasks.find((item) => item.key === progressRule.taskKey);
        if (!task || task.completed) return false;

        task.current += progressRule.increment;
        if (task.current >= task.target) {
            task.current = task.target;
            task.completed = true;
        }

        const allDone = quest.tasks.every((item) => item.completed);
        if (allDone && quest.status === 'active') {
            quest.status = 'completed';
            quest.completedAt = new Date();
        }

        return true;
    }

    async unlockEligibleBadges(userId, profile) {
        const existing = await CareerBadge.find({ userId }).select('badgeKey');
        const existingKeys = new Set(existing.map((item) => item.badgeKey));

        const unlocked = [];

        for (const badge of BADGE_DEFINITIONS) {
            if (!existingKeys.has(badge.key) && badge.check(profile)) {
                unlocked.push({
                    userId,
                    badgeKey: badge.key,
                    title: badge.title,
                    description: badge.description,
                    milestone: badge.milestone,
                    icon: badge.icon,
                    color: badge.color,
                    earnedAt: new Date(),
                });
            }
        }

        if (unlocked.length > 0) {
            await CareerBadge.insertMany(unlocked, { ordered: false });
            profile.badgesEarnedCount += unlocked.length;
        }

        return unlocked;
    }

    async unlockSpecificBadge(userId, badgeKey, badgeTitle, fallbackDescription = '') {
        const existing = await CareerBadge.findOne({ userId, badgeKey });
        if (existing) return null;

        const created = await CareerBadge.create({
            userId,
            badgeKey,
            title: badgeTitle,
            description: fallbackDescription || `${badgeTitle} unlocked by completing weekly quest`,
            milestone: 'Weekly quest completion',
            icon: 'award',
            color: '#f59e0b',
            earnedAt: new Date(),
        });

        return created;
    }

    async updateCareerTwinReadiness(userId, profile) {
        const stats = profile.stats || {};
        const base = Math.floor(profile.totalXp / 40);
        const interviews = Number(stats.mockInterviewsCompleted || 0) * 2;
        const dsa = Number(stats.dsaProblemsSolved || 0) * 0.4;
        const resumes = Number(stats.resumesImproved || 0) * 3;
        const mentoring = Number(stats.skillSessionsTaught || 0) * 2;
        const streakBonus = Math.min(20, Number(profile.streakCurrent || 0) * 0.5);

        const readinessScore = Math.max(0, Math.min(100, Math.round(base + interviews + dsa + resumes + mentoring + streakBonus)));

        profile.readinessScore = readinessScore;

        await User.updateOne(
            { _id: userId },
            { $set: { 'profile.readinessScore': readinessScore } }
        );

        return readinessScore;
    }

    invalidateUserCaches(userId) {
        cache.invalidate(`gamification:profile:${userId}`);
        cache.invalidate('gamification:leaderboard:');
    }

    async processActivityNow(job) {
        const { userId, activityType, metadata = {} } = job;
        const rule = ACTIVITY_RULES[activityType];

        if (!rule) {
            throw new Error(`Unsupported activity type: ${activityType}`);
        }

        const now = new Date();
        const profile = await this.getOrCreateGamification(userId);
        const credits = await this.getOrCreateCredits(userId);
        const weeklyQuest = await this.ensureWeeklyQuest(userId, now);

        const { streakDelta, streakBonusCredits } = this.applyStreak(profile, rule, now);

        const xpDelta = Number(rule.xp || 0);
        const creditsDelta = Number(rule.credits || 0) + streakBonusCredits;

        this.applyStats(profile, rule.stats || {});
        profile.totalXp += xpDelta;

        const levelState = calculateLevel(profile.totalXp);
        profile.level = levelState.level;
        profile.levelTitle = getLevelTitle(levelState.level);
        profile.xpInCurrentLevel = levelState.xpInCurrentLevel;
        profile.xpForNextLevel = levelState.xpForNextLevel;

        this.incrementQuestProgress(weeklyQuest, activityType);

        credits.balance += creditsDelta;
        credits.lifetimeEarned += Math.max(0, creditsDelta);
        credits.lastUpdatedAt = now;

        await this.unlockEligibleBadges(userId, profile);
        await this.updateCareerTwinReadiness(userId, profile);

        await Promise.all([
            profile.save(),
            credits.save(),
            weeklyQuest.save(),
            XPHistory.create({
                userId,
                activityType,
                sourceModule: rule.sourceModule,
                xpDelta,
                creditsDelta,
                streakDelta,
                totalXpAfter: profile.totalXp,
                levelAfter: profile.level,
                statsDelta: { ...(rule.stats || {}) },
                metadata,
            }),
        ]);

        this.invalidateUserCaches(userId);

        return {
            processed: true,
            activityType,
            xpDelta,
            creditsDelta,
            level: profile.level,
            levelTitle: profile.levelTitle,
            totalXp: profile.totalXp,
            streakCurrent: profile.streakCurrent,
            readinessScore: profile.readinessScore,
        };
    }

    async recordActivity(userId, payload, options = {}) {
        const asyncProcess = options.asyncProcess !== false;
        const job = {
            userId,
            activityType: payload.activityType,
            metadata: payload.metadata || {},
        };

        if (asyncProcess) {
            return {
                accepted: true,
                ...this.worker.enqueue(job),
            };
        }

        const result = await this.processActivityNow(job);
        return { accepted: true, processedImmediately: true, result };
    }

    async claimWeeklyQuestReward(userId, questId) {
        const now = new Date();
        const { weekStart } = getCurrentWeekRange(now);

        let quest;
        if (questId) {
            quest = await CareerQuest.findOne({ _id: questId, userId });
        } else {
            quest = await CareerQuest.findOne({ userId, weekStart });
        }

        if (!quest) {
            throw new Error('Quest not found');
        }

        if (quest.status === 'claimed') {
            throw new Error('Quest reward already claimed');
        }

        if (quest.status !== 'completed') {
            throw new Error('Quest is not completed yet');
        }

        const profile = await this.getOrCreateGamification(userId);
        const credits = await this.getOrCreateCredits(userId);

        const xpDelta = Number(quest.reward?.xp || 0);
        const creditsDelta = Number(quest.reward?.credits || 0);

        profile.totalXp += xpDelta;
        this.applyStats(profile, { questsCompleted: 1 });

        const levelState = calculateLevel(profile.totalXp);
        profile.level = levelState.level;
        profile.levelTitle = getLevelTitle(levelState.level);
        profile.xpInCurrentLevel = levelState.xpInCurrentLevel;
        profile.xpForNextLevel = levelState.xpForNextLevel;

        credits.balance += creditsDelta;
        credits.lifetimeEarned += Math.max(0, creditsDelta);
        credits.lastUpdatedAt = now;

        quest.status = 'claimed';
        quest.claimedAt = now;

        let questBadge = null;
        if (quest.reward?.badgeKey && quest.reward?.badgeTitle) {
            questBadge = await this.unlockSpecificBadge(
                userId,
                quest.reward.badgeKey,
                quest.reward.badgeTitle,
                `${quest.reward.badgeTitle} unlocked for finishing all weekly quest tasks`
            );
            if (questBadge) {
                profile.badgesEarnedCount += 1;
            }
        }

        await this.unlockEligibleBadges(userId, profile);
        await this.updateCareerTwinReadiness(userId, profile);

        await Promise.all([
            profile.save(),
            credits.save(),
            quest.save(),
            XPHistory.create({
                userId,
                activityType: 'quest_reward_claimed',
                sourceModule: 'gamification',
                xpDelta,
                creditsDelta,
                streakDelta: 0,
                totalXpAfter: profile.totalXp,
                levelAfter: profile.level,
                statsDelta: { questsCompleted: 1 },
                metadata: {
                    questId: quest._id,
                    weekStart: quest.weekStart,
                    reward: quest.reward,
                },
            }),
        ]);

        this.invalidateUserCaches(userId);

        return {
            questId: quest._id,
            xpDelta,
            creditsDelta,
            totalXp: profile.totalXp,
            level: profile.level,
            levelTitle: profile.levelTitle,
            creditsBalance: credits.balance,
            badgeUnlocked: questBadge ? questBadge.title : null,
        };
    }

    async getWeeklyLeaderboard(userId, { scope = 'global', metric = 'xp', limit = 20 } = {}) {
        const boundedLimit = Math.max(1, Math.min(50, Number(limit) || 20));
        const { weekStart, weekEnd } = getCurrentWeekRange(new Date());

        const requestingUser = await User.findById(userId).select('profile.education.institution name').lean();
        const requesterInstitution = String(requestingUser?.profile?.education?.institution || '').trim();
        const normalizedInstitution = requesterInstitution.toLowerCase();
        const contextKey = scope === 'college' ? (normalizedInstitution || 'unknown-college') : 'all';

        const cacheKey = `gamification:leaderboard:${weekStart.toISOString()}:${scope}:${metric}:${contextKey}:${boundedLimit}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const aggregation = await XPHistory.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: weekStart,
                        $lt: weekEnd,
                    },
                },
            },
            {
                $group: {
                    _id: '$userId',
                    xpEarned: { $sum: '$xpDelta' },
                    dsaSolved: { $sum: { $ifNull: ['$statsDelta.dsaProblemsSolved', 0] } },
                    skillContributions: { $sum: { $ifNull: ['$statsDelta.skillMarketplaceContributions', 0] } },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    userId: '$user._id',
                    name: '$user.name',
                    institution: { $ifNull: ['$user.profile.education.institution', ''] },
                    xpEarned: 1,
                    dsaSolved: 1,
                    skillContributions: 1,
                },
            },
        ]);

        let rows = aggregation;

        if (scope === 'college') {
            if (!normalizedInstitution) {
                rows = [];
            } else {
                rows = rows.filter((row) => String(row.institution || '').trim().toLowerCase() === normalizedInstitution);
            }
        }

        rows = rows
            .map((row) => {
                const score = metric === 'dsa'
                    ? Number(row.dsaSolved || 0)
                    : metric === 'skill'
                        ? Number(row.skillContributions || 0)
                        : Number(row.xpEarned || 0);

                return {
                    ...row,
                    score,
                };
            })
            .filter((row) => row.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, boundedLimit)
            .map((row, index) => ({
                rank: index + 1,
                userId: row.userId,
                name: row.name,
                institution: row.institution || '',
                score: row.score,
                xpEarned: Number(row.xpEarned || 0),
                dsaSolved: Number(row.dsaSolved || 0),
                skillContributions: Number(row.skillContributions || 0),
            }));

        await Leaderboard.findOneAndUpdate(
            {
                weekStart,
                scope,
                metric,
                contextKey,
            },
            {
                weekStart,
                weekEnd,
                scope,
                metric,
                contextKey,
                entries: rows,
                generatedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const payload = {
            scope,
            metric,
            weekStart,
            weekEnd,
            context: {
                institution: scope === 'college' ? requesterInstitution : null,
            },
            entries: rows,
        };

        cache.set(cacheKey, payload, 60 * 1000);
        return payload;
    }

    getUnlockedFeatures(profile, credits) {
        const features = [];

        if (profile.level >= 5) {
            features.push('extra-ai-interview-simulation');
        }
        if (profile.level >= 10 || credits.balance >= 300) {
            features.push('advanced-resume-analysis');
        }
        if (profile.level >= 20 || credits.balance >= 500) {
            features.push('career-simulator-runs');
        }
        if (profile.level >= 50 || credits.balance >= 1000) {
            features.push('premium-ai-insights');
        }

        return features;
    }

    async getProfile(userId) {
        const cacheKey = `gamification:profile:${userId}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const [profile, credits, badges, currentQuest] = await Promise.all([
            this.getOrCreateGamification(userId),
            this.getOrCreateCredits(userId),
            CareerBadge.find({ userId }).sort({ earnedAt: -1 }).lean(),
            this.ensureWeeklyQuest(userId),
        ]);

        const [globalLeaderboard, collegeLeaderboard] = await Promise.all([
            this.getWeeklyLeaderboard(userId, { scope: 'global', metric: 'xp', limit: 100 }),
            this.getWeeklyLeaderboard(userId, { scope: 'college', metric: 'xp', limit: 100 }),
        ]);

        const globalRank = globalLeaderboard.entries.find((row) => String(row.userId) === String(userId))?.rank || null;
        const collegeRank = collegeLeaderboard.entries.find((row) => String(row.userId) === String(userId))?.rank || null;

        const xpProgressPercentage = profile.xpForNextLevel > 0
            ? Math.min(100, Math.round((profile.xpInCurrentLevel / profile.xpForNextLevel) * 100))
            : 0;

        const payload = {
            userId,
            level: profile.level,
            levelTitle: profile.levelTitle,
            totalXp: profile.totalXp,
            xpInCurrentLevel: profile.xpInCurrentLevel,
            xpForNextLevel: profile.xpForNextLevel,
            xpProgressPercentage,
            streakCurrent: profile.streakCurrent,
            streakLongest: profile.streakLongest,
            readinessScore: profile.readinessScore,
            stats: profile.stats,
            badgesEarnedCount: profile.badgesEarnedCount,
            badges,
            credits: {
                balance: credits.balance,
                lifetimeEarned: credits.lifetimeEarned,
                lifetimeSpent: credits.lifetimeSpent,
            },
            rankings: {
                global: globalRank,
                college: collegeRank,
            },
            currentQuest,
            unlockedFeatures: this.getUnlockedFeatures(profile, credits),
        };

        cache.set(cacheKey, payload, 30 * 1000);
        return payload;
    }

    async listQuests(userId) {
        await this.ensureWeeklyQuest(userId);

        const quests = await CareerQuest.find({ userId })
            .sort({ weekStart: -1 })
            .limit(8)
            .lean();

        return quests;
    }

    getSupportedActivities() {
        return Object.keys(ACTIVITY_RULES);
    }
}

module.exports = new GamificationService();
