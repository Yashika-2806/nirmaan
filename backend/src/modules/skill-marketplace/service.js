const mongoose = require('mongoose');
const geminiService = require('../../core/ai/gemini-service');
const SkillProfile = require('./skill-profile-model');
const SkillRequest = require('./skill-request-model');
const SkillSession = require('./session-model');
const SkillReview = require('./review-model');
const SkillPointsLedger = require('./points-ledger-model');
const User = require('../../core/auth/model');

const EXPERIENCE_SCORE = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
};

const POINT_RULES = {
    'teaching-session': 50,
    'helping-others': 30,
    'request-completed': 20,
    'review-given': 5,
};

class SkillMarketplaceService {
    normalizeSkillName(skill) {
        return String(skill || '').trim().toLowerCase();
    }

    mapSkills(skills = []) {
        return skills
            .filter(Boolean)
            .map((skill) => ({
                name: String(skill.name || '').trim(),
                experienceLevel: skill.experienceLevel || 'beginner',
            }))
            .filter((skill) => Boolean(skill.name));
    }

    toMinutes(time) {
        const [hour, minute] = String(time || '00:00').split(':').map(Number);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
        return (hour * 60) + minute;
    }

    hasAvailabilityOverlap(slotsA = [], slotsB = []) {
        if (!slotsA.length || !slotsB.length) return false;

        for (const a of slotsA) {
            const aStart = this.toMinutes(a.startTime);
            const aEnd = this.toMinutes(a.endTime);
            if (aStart === null || aEnd === null || aStart >= aEnd) continue;

            for (const b of slotsB) {
                if (a.day !== b.day) continue;
                const bStart = this.toMinutes(b.startTime);
                const bEnd = this.toMinutes(b.endTime);
                if (bStart === null || bEnd === null || bStart >= bEnd) continue;

                const start = Math.max(aStart, bStart);
                const end = Math.min(aEnd, bEnd);
                if (start < end) return true;
            }
        }

        return false;
    }

    async getOrCreateProfile(userId) {
        let profile = await SkillProfile.findOne({ userId });
        if (!profile) {
            try {
                profile = await SkillProfile.create({ userId });
            } catch (error) {
                // Concurrent requests may both try to create the same unique user profile.
                if (error?.code === 11000) {
                    profile = await SkillProfile.findOne({ userId });
                } else {
                    throw error;
                }
            }
        }
        return profile;
    }

    async upsertProfile(userId, payload) {
        const profile = await this.getOrCreateProfile(userId);

        if (payload.teachSkills) profile.teachSkills = this.mapSkills(payload.teachSkills);
        if (payload.learnSkills) profile.learnSkills = this.mapSkills(payload.learnSkills);
        if (payload.experienceLevel) profile.experienceLevel = payload.experienceLevel;
        if (payload.availability) profile.availability = payload.availability;

        await profile.save();
        return profile;
    }

    async getProfileByUserId(userId) {
        const profile = await this.getOrCreateProfile(userId);
        const user = await User.findById(userId).select('name email profile.avatar');

        return {
            ...profile.toObject(),
            user,
        };
    }

    extractRawSkillsText({ githubData, codingProfiles, resumeData }) {
        const chunks = [];

        if (githubData) chunks.push(`GitHub data: ${JSON.stringify(githubData).substring(0, 12000)}`);
        if (codingProfiles) chunks.push(`Coding profile data: ${JSON.stringify(codingProfiles).substring(0, 10000)}`);
        if (resumeData) chunks.push(`Resume data: ${JSON.stringify(resumeData).substring(0, 10000)}`);

        return chunks.join('\n\n');
    }

    fallbackSkillExtraction(rawText) {
        const dictionary = [
            'javascript', 'typescript', 'node.js', 'express', 'react', 'next.js', 'mongo',
            'mongodb', 'python', 'java', 'c++', 'sql', 'postgresql', 'docker', 'kubernetes',
            'redis', 'graphql', 'rest api', 'system design', 'dynamic programming', 'algorithms',
            'data structures', 'machine learning', 'deep learning', 'aws', 'azure', 'gcp',
        ];

        const haystack = String(rawText || '').toLowerCase();
        return dictionary
            .filter((term) => haystack.includes(term))
            .slice(0, 20)
            .map((term) => term.replace(/\b\w/g, ch => ch.toUpperCase()));
    }

    async detectSkills(userId, payload) {
        const rawText = this.extractRawSkillsText(payload);
        let detectedSkills = [];

        const aiResult = await geminiService.detectSkillsForMarketplace(rawText);
        if (Array.isArray(aiResult?.skills) && aiResult.skills.length > 0) {
            detectedSkills = aiResult.skills;
        } else {
            detectedSkills = this.fallbackSkillExtraction(rawText);
        }

        const uniqueSkills = [...new Set(detectedSkills.map((s) => String(s).trim()).filter(Boolean))];

        if (payload.autoSave) {
            const profile = await this.getOrCreateProfile(userId);
            profile.aiDetectedSkills = uniqueSkills;

            // Also merge AI skills into teachSkills if missing, as beginner by default.
            const existingTeach = new Set(profile.teachSkills.map((s) => this.normalizeSkillName(s.name)));
            uniqueSkills.forEach((skill) => {
                if (!existingTeach.has(this.normalizeSkillName(skill))) {
                    profile.teachSkills.push({ name: skill, experienceLevel: 'beginner' });
                }
            });

            await profile.save();
        }

        return {
            detectedSkills: uniqueSkills,
            source: aiResult?.error ? 'fallback' : 'ai',
        };
    }

    computeMatchScore(userProfile, candidateProfile) {
        const userLearn = new Set(userProfile.learnSkills.map((s) => this.normalizeSkillName(s.name)));
        const userTeach = new Set(userProfile.teachSkills.map((s) => this.normalizeSkillName(s.name)));
        const candidateLearn = new Set(candidateProfile.learnSkills.map((s) => this.normalizeSkillName(s.name)));
        const candidateTeach = new Set(candidateProfile.teachSkills.map((s) => this.normalizeSkillName(s.name)));

        const directMatches = [...userLearn].filter((skill) => candidateTeach.has(skill));
        const reverseMatches = [...userTeach].filter((skill) => candidateLearn.has(skill));

        if (directMatches.length === 0) {
            return null;
        }

        const overlapBonus = reverseMatches.length > 0 ? 15 : 0;

        const userExp = EXPERIENCE_SCORE[userProfile.experienceLevel] || 1;
        const candidateExp = EXPERIENCE_SCORE[candidateProfile.experienceLevel] || 1;
        const experienceGap = Math.abs(userExp - candidateExp);
        const experienceScore = Math.max(0, 20 - (experienceGap * 5));

        const ratingScore = Math.round((candidateProfile.ratingAverage || 0) * 8); // max 40
        const availabilityScore = this.hasAvailabilityOverlap(userProfile.availability, candidateProfile.availability) ? 15 : 0;

        const skillScore = Math.min(30, directMatches.length * 12);
        const totalScore = Math.min(100, skillScore + overlapBonus + experienceScore + ratingScore + availabilityScore);

        return {
            totalScore,
            directMatches,
            reverseMatches,
            hasAvailabilityOverlap: availabilityScore > 0,
        };
    }

    async getTopMatches(userId, limit = 5) {
        const userProfile = await this.getOrCreateProfile(userId);

        const candidateProfiles = await SkillProfile.find({ userId: { $ne: userId } })
            .populate('userId', 'name profile.avatar')
            .limit(200);

        const scored = candidateProfiles
            .map((candidate) => {
                const score = this.computeMatchScore(userProfile, candidate);
                if (!score) return null;

                return {
                    userId: candidate.userId?._id,
                    name: candidate.userId?.name || 'User',
                    avatar: candidate.userId?.profile?.avatar || '',
                    matchScore: score.totalScore,
                    canTeachYou: score.directMatches,
                    canLearnFromYou: score.reverseMatches,
                    rating: candidate.ratingAverage || 0,
                    availabilityMatched: score.hasAvailabilityOverlap,
                    profileId: candidate._id,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);

        return scored;
    }

    async createRequest(userId, payload) {
        return SkillRequest.create({
            userId,
            skill: payload.skill,
            description: payload.description,
            preferredTime: payload.preferredTime,
            rewardType: payload.rewardType,
        });
    }

    async listRequests(filters = {}) {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.skill) query.skill = new RegExp(filters.skill, 'i');

        return SkillRequest.find(query)
            .populate('userId', 'name profile.avatar')
            .populate('helperId', 'name profile.avatar')
            .sort({ createdAt: -1 })
            .limit(100);
    }

    async claimRequest(requestId, helperId) {
        const request = await SkillRequest.findById(requestId);
        if (!request) throw new Error('Request not found');
        if (request.status !== 'open') throw new Error('Only open requests can be claimed');

        request.status = 'matched';
        request.helperId = helperId;
        await request.save();

        await this.awardPoints({
            userId: helperId,
            reason: 'helping-others',
            referenceType: 'request',
            referenceId: request._id,
            metadata: { skill: request.skill },
        });

        return request;
    }

    async completeRequest(requestId, userId) {
        const request = await SkillRequest.findById(requestId);
        if (!request) throw new Error('Request not found');

        const isOwner = String(request.userId) === String(userId);
        const isHelper = request.helperId && String(request.helperId) === String(userId);
        if (!isOwner && !isHelper) throw new Error('You are not allowed to complete this request');

        request.status = 'completed';
        await request.save();

        if (request.helperId) {
            await this.awardPoints({
                userId: request.helperId,
                reason: 'request-completed',
                referenceType: 'request',
                referenceId: request._id,
                metadata: { completedBy: userId },
            });
        }

        return request;
    }

    async scheduleSession(payload) {
        return SkillSession.create({
            mentorId: payload.mentorId,
            learnerId: payload.learnerId,
            skill: payload.skill,
            time: payload.time,
            duration: payload.duration,
            meetingLink: payload.meetingLink,
            requestId: payload.requestId || null,
            isAIMentorSession: Boolean(payload.isAIMentorSession),
        });
    }

    async listSessions(userId) {
        return SkillSession.find({
            $or: [{ mentorId: userId }, { learnerId: userId }],
        })
            .populate('mentorId', 'name profile.avatar')
            .populate('learnerId', 'name profile.avatar')
            .sort({ time: -1 })
            .limit(100);
    }

    async completeSession(sessionId, userId) {
        const session = await SkillSession.findById(sessionId);
        if (!session) throw new Error('Session not found');

        const isParticipant = String(session.mentorId) === String(userId) || String(session.learnerId) === String(userId);
        if (!isParticipant) throw new Error('You are not allowed to update this session');

        session.status = 'completed';
        await session.save();

        await this.awardPoints({
            userId: session.mentorId,
            reason: 'teaching-session',
            referenceType: 'session',
            referenceId: session._id,
            metadata: { skill: session.skill },
        });

        return session;
    }

    async leaveReview(userId, payload) {
        const session = await SkillSession.findById(payload.sessionId);
        if (!session) throw new Error('Session not found');
        if (session.status !== 'completed') throw new Error('You can review only completed sessions');

        const isMentor = String(session.mentorId) === String(userId);
        const isLearner = String(session.learnerId) === String(userId);
        if (!isMentor && !isLearner) throw new Error('You are not part of this session');

        const revieweeId = isMentor ? session.learnerId : session.mentorId;

        const review = await SkillReview.create({
            sessionId: payload.sessionId,
            reviewerId: userId,
            revieweeId,
            rating: payload.rating,
            feedback: payload.feedback,
        });

        await this.recalculateRating(revieweeId);

        await this.awardPoints({
            userId,
            reason: 'review-given',
            referenceType: 'review',
            referenceId: review._id,
            metadata: { sessionId: payload.sessionId },
        });

        return review;
    }

    async listReviewsForUser(userId) {
        return SkillReview.find({ revieweeId: userId })
            .populate('reviewerId', 'name profile.avatar')
            .sort({ createdAt: -1 })
            .limit(100);
    }

    async recalculateRating(userId) {
        const [stats] = await SkillReview.aggregate([
            { $match: { revieweeId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$revieweeId',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const profile = await this.getOrCreateProfile(userId);
        profile.ratingAverage = stats ? Number(stats.avgRating.toFixed(2)) : 0;
        profile.ratingCount = stats ? stats.count : 0;
        await profile.save();
    }

    async awardPoints({ userId, reason, referenceType, referenceId, metadata = {} }) {
        const existing = await SkillPointsLedger.findOne({ userId, reason, referenceType, referenceId });
        if (existing) return existing;

        const points = POINT_RULES[reason] || 0;

        const entry = await SkillPointsLedger.create({
            userId,
            points,
            reason,
            referenceType,
            referenceId,
            metadata,
        });

        const profile = await this.getOrCreateProfile(userId);
        profile.points += points;

        // Unlock premium marketplace features after threshold.
        if (profile.points >= 500) {
            profile.premiumUnlocked = true;
        }

        await profile.save();
        return entry;
    }

    async getPointsSummary(userId) {
        const profile = await this.getOrCreateProfile(userId);
        const history = await SkillPointsLedger.find({ userId }).sort({ createdAt: -1 }).limit(50);

        return {
            totalPoints: profile.points,
            premiumUnlocked: profile.premiumUnlocked,
            history,
        };
    }

    async generateAIMentorResponse(payload) {
        const aiResponse = await geminiService.generateAIMentorResponse({
            learnSkill: payload.learnSkill,
            currentLevel: payload.currentLevel,
            goal: payload.goal,
            userQuestion: payload.userQuestion,
        });

        if (aiResponse.error) {
            return {
                mentorType: 'ai',
                unavailableReason: aiResponse.error,
                directAnswer: `Start with the core definition of ${payload.learnSkill}, then study one example and one counter-example before solving problems.`,
                conceptBreakdown: [
                    `Define what ${payload.learnSkill} is and when it is used.`,
                    'Understand one simple example before moving to harder cases.',
                    'Practice by explaining the concept in your own words.',
                ],
                likelyUserQuestions: [
                    `What is ${payload.learnSkill} in simple words?`,
                    `When should I use ${payload.learnSkill}?`,
                    `Can you show me one easy example of ${payload.learnSkill}?`,
                ],
                aiFollowUpQuestions: [
                    'What part feels confusing right now: definition, intuition, or implementation?',
                    'Do you want an analogy first or a coding example first?',
                    'Can you explain the main idea back to me in one sentence?',
                ],
                practiceTask: `Write a short explanation of ${payload.learnSkill} and solve one beginner-level problem on it.`,
                encouragement: 'Learn one concept, test it with one example, then explain it back. That is enough for steady progress.',
            };
        }

        return aiResponse;
    }

    async generateAIMentorPlan(payload) {
        return this.generateAIMentorResponse(payload);
    }

    async fetchExternalProfiles(githubUsername, leetcodeUsername, codeforcesUsername) {
        const axios = require('axios');
        const results = {};
        const errors = {};

        if (githubUsername) {
            try {
                const [userRes, reposRes] = await Promise.all([
                    axios.get(`https://api.github.com/users/${encodeURIComponent(githubUsername)}`, {
                        headers: { 'User-Agent': 'Nirmaan-App', Accept: 'application/vnd.github.v3+json' },
                        timeout: 8000,
                    }),
                    axios.get(`https://api.github.com/users/${encodeURIComponent(githubUsername)}/repos?sort=updated&per_page=20`, {
                        headers: { 'User-Agent': 'Nirmaan-App', Accept: 'application/vnd.github.v3+json' },
                        timeout: 8000,
                    }),
                ]);
                const user = userRes.data;
                const repos = reposRes.data;
                const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];
                const topics = [...new Set(repos.flatMap((r) => r.topics || []))];
                results.github = {
                    username: user.login,
                    name: user.name,
                    bio: user.bio,
                    publicRepos: user.public_repos,
                    followers: user.followers,
                    languages,
                    topics,
                    topRepos: repos.slice(0, 5).map((r) => ({
                        name: r.name,
                        language: r.language,
                        stars: r.stargazers_count,
                        description: r.description,
                    })),
                    summary: `GitHub: ${user.login} | Bio: ${user.bio || 'N/A'} | ${user.public_repos} public repos | Languages: ${languages.join(', ')} | Topics: ${topics.slice(0, 12).join(', ')}`,
                };
            } catch (e) {
                errors.github = e.response?.data?.message || e.message;
            }
        }

        if (leetcodeUsername) {
            try {
                const query = `query getUserProfile($username: String!) {
                    matchedUser(username: $username) {
                        username
                        profile { ranking }
                        submitStats {
                            acSubmissionNum { difficulty count }
                        }
                        tagProblemCounts {
                            advanced { tagName problemsSolved }
                            intermediate { tagName problemsSolved }
                        }
                    }
                }`;
                const res = await axios.post(
                    'https://leetcode.com/graphql',
                    { query, variables: { username: leetcodeUsername } },
                    { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' }, timeout: 10000 }
                );
                const matched = res.data?.data?.matchedUser;
                if (matched) {
                    const stats = matched.submitStats?.acSubmissionNum || [];
                    const easy = stats.find((s) => s.difficulty === 'Easy')?.count || 0;
                    const medium = stats.find((s) => s.difficulty === 'Medium')?.count || 0;
                    const hard = stats.find((s) => s.difficulty === 'Hard')?.count || 0;
                    const total = stats.find((s) => s.difficulty === 'All')?.count || 0;
                    const topTags = [
                        ...(matched.tagProblemCounts?.advanced || []),
                        ...(matched.tagProblemCounts?.intermediate || []),
                    ].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 10);
                    results.leetcode = {
                        username: matched.username,
                        ranking: matched.profile?.ranking,
                        totalSolved: total,
                        easySolved: easy,
                        mediumSolved: medium,
                        hardSolved: hard,
                        topTags: topTags.map((t) => t.tagName),
                        summary: `LeetCode: ${matched.username} | Ranking: ${matched.profile?.ranking || 'N/A'} | Solved: ${total} (Easy: ${easy}, Medium: ${medium}, Hard: ${hard}) | Top tags: ${topTags.map((t) => t.tagName).join(', ')}`,
                    };
                } else {
                    errors.leetcode = 'User not found on LeetCode';
                }
            } catch (e) {
                errors.leetcode = e.response?.data?.message || e.message;
            }
        }

        if (codeforcesUsername) {
            try {
                const [userRes, ratingRes] = await Promise.allSettled([
                    axios.get(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(codeforcesUsername)}`, { timeout: 8000 }),
                    axios.get(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(codeforcesUsername)}`, { timeout: 8000 }),
                ]);
                if (userRes.status === 'fulfilled') {
                    const cfUser = userRes.value.data?.result?.[0];
                    if (cfUser) {
                        results.codeforces = {
                            username: cfUser.handle,
                            rating: cfUser.rating,
                            maxRating: cfUser.maxRating,
                            rank: cfUser.rank,
                            maxRank: cfUser.maxRank,
                            summary: `Codeforces: ${cfUser.handle} | Rank: ${cfUser.rank} | Rating: ${cfUser.rating || 'unrated'} | Max Rating: ${cfUser.maxRating || 'N/A'}`,
                        };
                    } else {
                        errors.codeforces = 'User not found on Codeforces';
                    }
                } else {
                    errors.codeforces = userRes.reason?.response?.data?.comment || userRes.reason?.message;
                }
            } catch (e) {
                errors.codeforces = e.message;
            }
        }

        const combinedSummary = Object.values(results)
            .map((r) => r.summary)
            .filter(Boolean)
            .join('\n');

        return { profiles: results, errors, combinedSummary };
    }
}

module.exports = new SkillMarketplaceService();
