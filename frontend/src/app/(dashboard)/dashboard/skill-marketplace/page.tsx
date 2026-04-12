'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Sparkles, Calendar, MessageSquare, TrendingUp, Star, Bot, Coins, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { skillMarketplaceService } from '@/services/skillMarketplaceService';
import { useAuthStore } from '@/store/auth';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Match {
    userId: string;
    name: string;
    canTeachYou: string[];
    canLearnFromYou: string[];
    matchScore: number;
    availabilityMatched: boolean;
}

interface RequestItem {
    _id: string;
    skill: string;
    description: string;
    preferredTime: string;
    rewardType: 'skill-exchange' | 'points';
    status: 'open' | 'matched' | 'completed' | 'cancelled';
    userId?: { _id: string; name: string };
    helperId?: { _id: string; name: string } | null;
}

interface SessionItem {
    _id: string;
    mentorId: { _id: string; name: string };
    learnerId: { _id: string; name: string };
    skill: string;
    time: string;
    duration: number;
    meetingLink: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

interface ReviewItem {
    _id: string;
    rating: number;
    feedback: string;
    reviewerId?: { name: string };
    createdAt: string;
}

const TABS = [
    { key: 'profile', label: 'Skill Profile' },
    { key: 'requests', label: 'Request Board' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'mentor', label: 'AI Mentor Mode' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function SkillMarketplacePage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [activeTab, setActiveTab] = useState<TabKey>('profile');
    const [skillOffered, setSkillOffered] = useState('');
    const [skillWanted, setSkillWanted] = useState('');
    const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
    const [availabilityDay, setAvailabilityDay] = useState('saturday');
    const [availabilityStart, setAvailabilityStart] = useState('10:00');
    const [availabilityEnd, setAvailabilityEnd] = useState('12:00');
    const [githubUsername, setGithubUsername] = useState('');
    const [leetcodeUsername, setLeetcodeUsername] = useState('');
    const [codeforcesUsername, setCodeforcesUsername] = useState('');
    const [fetchedSummary, setFetchedSummary] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const [requestSkill, setRequestSkill] = useState('');
    const [requestDescription, setRequestDescription] = useState('');
    const [requestPreferredTime, setRequestPreferredTime] = useState('Weekends 10:00 - 12:00 IST');
    const [requestReward, setRequestReward] = useState<'skill-exchange' | 'points'>('skill-exchange');

    const [sessionMentorId, setSessionMentorId] = useState('');
    const [sessionLearnerId, setSessionLearnerId] = useState(user?._id || '');
    const [sessionSkill, setSessionSkill] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [sessionDuration, setSessionDuration] = useState(60);
    const [sessionLink, setSessionLink] = useState('https://meet.google.com/');

    const [reviewSessionId, setReviewSessionId] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewFeedback, setReviewFeedback] = useState('');

    const [aiSkill, setAiSkill] = useState('Graph Algorithms');
    const [aiLevel, setAiLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner');
    const [aiGoal, setAiGoal] = useState('Become interview ready in 4 weeks');
    const [aiQuestion, setAiQuestion] = useState('Explain graph traversal in simple words and how I should start learning it.');

    const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
    const [aiMentorPlan, setAiMentorPlan] = useState<{
        directAnswer: string;
        conceptBreakdown: string[];
        likelyUserQuestions: string[];
        aiFollowUpQuestions: string[];
        practiceTask: string;
        encouragement: string;
    } | null>(null);

    const [matches, setMatches] = useState<Match[]>([]);
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [pointsSummary, setPointsSummary] = useState<{ totalPoints: number; premiumUnlocked: boolean } | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [hasListing, setHasListing] = useState(false);

    const completedSessions = useMemo(
        () => sessions.filter((s) => s.status === 'completed'),
        [sessions]
    );

    const requireAuth = (actionLabel: string) => {
        if (isAuthenticated && user?._id) {
            return true;
        }

        toast.error(`${actionLabel} requires sign in`);
        router.push('/login');
        return false;
    };

    const loadAll = async () => {
        if (!isAuthenticated || !user?._id) {
            return;
        }

        try {
            const [profile, matchData, requestData, sessionData, reviewData, pointsData] = await Promise.all([
                skillMarketplaceService.getMyProfile(),
                skillMarketplaceService.getMatches(5),
                skillMarketplaceService.listRequests(),
                skillMarketplaceService.listSessions(),
                skillMarketplaceService.listMyReviews(),
                skillMarketplaceService.getPointsSummary(),
            ]);

            const teach = profile?.teachSkills?.[0]?.name || '';
            const learn = profile?.learnSkills?.[0]?.name || '';
            setSkillOffered(teach);
            setSkillWanted(learn);
            setHasListing(Boolean(teach && learn));
            setMatches(matchData?.matches || []);
            setRequests(requestData || []);
            setSessions(sessionData || []);
            setReviews(reviewData || []);
            setPointsSummary({ totalPoints: pointsData?.totalPoints || 0, premiumUnlocked: Boolean(pointsData?.premiumUnlocked) });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load marketplace data');
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            return;
        }

        loadAll();
    }, [isAuthenticated, user?._id]);

    useEffect(() => {
        if (user?._id) {
            setSessionLearnerId(user._id);
        }
    }, [user?._id]);

    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            return;
        }

        loadAll();
    }, [activeTab, isAuthenticated, user?._id]);

    const handleCreateListing = async () => {
        if (!requireAuth('Creating a listing')) {
            return;
        }

        if (!skillOffered.trim() || !skillWanted.trim()) {
            toast.error('Please fill in both skills');
            return;
        }

        setIsLoading(true);
        try {
            await skillMarketplaceService.upsertProfile({
                teachSkills: [{ name: skillOffered, experienceLevel }],
                learnSkills: [{ name: skillWanted, experienceLevel: 'beginner' }],
                experienceLevel,
                availability: [{
                    day: availabilityDay as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
                    startTime: availabilityStart,
                    endTime: availabilityEnd,
                    timezone: 'Asia/Kolkata',
                }],
            });
            setHasListing(true);
            toast.success('Listing created! Finding matches...');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create listing');
        } finally {
            setIsLoading(false);
        }
    };

    const findMatches = async () => {
        if (!requireAuth('Finding matches')) {
            return;
        }

        setIsLoading(true);
        try {
            const data = await skillMarketplaceService.getMatches(5);
            setMatches(data.matches || []);

            if ((data.matches || []).length === 0 && data.aiMentorRecommended) {
                toast('No human mentor found. Try AI Mentor Mode from backend endpoint.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to find matches');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAndDetectSkills = async () => {
        if (!requireAuth('Fetching profile details')) {
            return;
        }

        if (!githubUsername && !leetcodeUsername && !codeforcesUsername) {
            toast.error('Enter at least one profile username');
            return;
        }
        setIsFetching(true);
        try {
            const fetched = await skillMarketplaceService.fetchExternalProfiles(
                githubUsername || undefined,
                leetcodeUsername || undefined,
                codeforcesUsername || undefined,
            );
            setFetchedSummary(fetched.combinedSummary || null);

            const failedKeys = Object.keys(fetched.errors || {});
            if (failedKeys.length > 0) {
                const msgs = failedKeys.map((k) => `${k}: ${fetched.errors[k]}`).join(' | ');
                toast(`Some fetches failed: ${msgs}`, { icon: '⚠️' });
            }

            if (!fetched.combinedSummary && !Object.keys(fetched.profiles).length) {
                toast.error('No profiles could be retrieved');
                return;
            }

            const data = await skillMarketplaceService.detectSkills({
                githubData: fetched.profiles.github as Record<string, unknown> | undefined,
                codingProfiles: {
                    ...(fetched.profiles.leetcode ? { leetcode: fetched.profiles.leetcode } : {}),
                    ...(fetched.profiles.codeforces ? { codeforces: fetched.profiles.codeforces } : {}),
                } as Record<string, unknown>,
                autoSave: true,
            });
            setDetectedSkills(data.detectedSkills || []);
            toast.success(`Fetched profiles & detected ${(data.detectedSkills || []).length} skills!`);
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch profiles');
        } finally {
            setIsFetching(false);
        }
    };

    const runSkillDetection = fetchAndDetectSkills;

    const createRequest = async () => {
        if (!requireAuth('Posting a request')) {
            return;
        }

        const skill = requestSkill.trim();
        const description = requestDescription.trim();
        const preferredTime = requestPreferredTime.trim();

        if (!skill || !description) {
            toast.error('Skill and description are required');
            return;
        }

        if (skill.length < 2) {
            toast.error('Skill must be at least 2 characters');
            return;
        }

        if (description.length < 10) {
            toast.error('Description must be at least 10 characters');
            return;
        }

        if (!preferredTime || preferredTime.length < 2) {
            toast.error('Preferred time is required');
            return;
        }

        setIsLoading(true);
        try {
            await skillMarketplaceService.createRequest({
                skill,
                description,
                preferredTime,
                rewardType: requestReward,
            });
            setRequestSkill('');
            setRequestDescription('');
            setRequestReward('skill-exchange');
            toast.success('Skill request posted');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to post request');
        } finally {
            setIsLoading(false);
        }
    };

    const claimRequest = async (id: string) => {
        if (!requireAuth('Claiming a request')) {
            return;
        }

        try {
            await skillMarketplaceService.claimRequest(id);
            toast.success('Request claimed');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to claim request');
        }
    };

    const completeRequest = async (id: string) => {
        if (!requireAuth('Completing a request')) {
            return;
        }

        try {
            await skillMarketplaceService.completeRequest(id);
            toast.success('Request completed');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to complete request');
        }
    };

    const scheduleSession = async () => {
        if (!requireAuth('Scheduling a session')) {
            return;
        }

        if (!sessionMentorId || !sessionLearnerId || !sessionSkill || !sessionTime || !sessionLink) {
            toast.error('Fill all session fields');
            return;
        }

        setIsLoading(true);
        try {
            await skillMarketplaceService.scheduleSession({
                mentorId: sessionMentorId,
                learnerId: sessionLearnerId,
                skill: sessionSkill,
                time: new Date(sessionTime).toISOString(),
                duration: sessionDuration,
                meetingLink: sessionLink,
            });
            setSessionSkill('');
            setSessionTime('');
            setSessionDuration(60);
            toast.success('Session scheduled');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to schedule session');
        } finally {
            setIsLoading(false);
        }
    };

    const markSessionCompleted = async (id: string) => {
        if (!requireAuth('Completing a session')) {
            return;
        }

        try {
            await skillMarketplaceService.completeSession(id);
            toast.success('Session completed');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to complete session');
        }
    };

    const submitReview = async () => {
        if (!requireAuth('Submitting a review')) {
            return;
        }

        if (!reviewSessionId || !reviewFeedback.trim()) {
            toast.error('Select session and add feedback');
            return;
        }

        try {
            await skillMarketplaceService.leaveReview({
                sessionId: reviewSessionId,
                rating: reviewRating,
                feedback: reviewFeedback,
            });
            setReviewSessionId('');
            setReviewRating(5);
            setReviewFeedback('');
            toast.success('Review submitted');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        }
    };

    const generateAIMentorPlan = async () => {
        if (!requireAuth('Generating an AI mentor plan')) {
            return;
        }

        setIsLoading(true);
        try {
            const plan = await skillMarketplaceService.generateAIMentorPlan({
                learnSkill: aiSkill,
                currentLevel: aiLevel,
                goal: aiGoal,
                userQuestion: aiQuestion,
            });
            setAiMentorPlan({
                directAnswer: plan.directAnswer || '',
                conceptBreakdown: plan.conceptBreakdown || [],
                likelyUserQuestions: plan.likelyUserQuestions || [],
                aiFollowUpQuestions: plan.aiFollowUpQuestions || [],
                practiceTask: plan.practiceTask || '',
                encouragement: plan.encouragement || '',
            });
            toast.success('AI mentor response generated');
            await loadAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to generate AI mentor response');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = (match: Match) => {
        setSessionMentorId(match.userId);
        setSessionSkill(match.canTeachYou?.[0] || '');
        setActiveTab('sessions');
        toast.success(`Selected ${match.name} as mentor. Schedule a session now.`);
    };

    const handleScheduleFromRequest = (req: RequestItem) => {
        const isRequester = req.userId?._id === user?._id;
        if (isRequester) {
            // Current user posted the request — the helper becomes the mentor
            setSessionMentorId(req.helperId?._id || '');
        } else {
            // Current user claimed the request — they are the mentor
            setSessionMentorId(user?._id || '');
        }
        setSessionSkill(req.skill);
        setActiveTab('sessions');
        toast.success(`Scheduling session for "${req.skill}"`);
    };

    return (
        <div className="space-y-6">
            {!isAuthenticated && (
                <div className="card border border-amber-500/30 bg-amber-500/10">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Sign in required for Skill Marketplace</h2>
                            <p className="text-sm text-gray-300 mt-1">
                                Creating listings, fetching GitHub details, scheduling sessions, and reviews all require your account because these APIs are protected.
                            </p>
                        </div>
                        <Link href="/login" className="btn-primary text-center whitespace-nowrap">
                            Sign In
                        </Link>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary-600" />
                        Skill Swap Marketplace
                    </h1>
                    <p className="text-gray-600 mt-2">Exchange skills with peers. If no mentor is available, AI Mentor Mode fills the gap.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Listings</p>
                            <p className="text-2xl font-bold mt-1">{hasListing ? 1 : 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Matches</p>
                            <p className="text-2xl font-bold mt-1">{matches.length}</p>
                        </div>
                        <Sparkles className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Connections</p>
                            <p className="text-2xl font-bold mt-1">{sessions.length}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Success Rate</p>
                            <p className="text-2xl font-bold mt-1">{pointsSummary?.premiumUnlocked ? 'Pro' : 'Starter'}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Listing */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Your Skill Profile</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Skill You Can Teach
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., React Development, Python, UI Design"
                                    value={skillOffered}
                                    onChange={(e) => setSkillOffered(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Skill You Want to Learn
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Machine Learning, DevOps, System Design"
                                    value={skillWanted}
                                    onChange={(e) => setSkillWanted(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                                <select
                                    aria-label="Experience level"
                                    className="input"
                                    value={experienceLevel}
                                    onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert')}
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <select aria-label="Availability day" className="input" value={availabilityDay} onChange={(e) => setAvailabilityDay(e.target.value)}>
                                    <option value="monday">Mon</option>
                                    <option value="tuesday">Tue</option>
                                    <option value="wednesday">Wed</option>
                                    <option value="thursday">Thu</option>
                                    <option value="friday">Fri</option>
                                    <option value="saturday">Sat</option>
                                    <option value="sunday">Sun</option>
                                </select>
                                <input aria-label="Availability start time" type="time" className="input" value={availabilityStart} onChange={(e) => setAvailabilityStart(e.target.value)} />
                                <input aria-label="Availability end time" type="time" className="input" value={availabilityEnd} onChange={(e) => setAvailabilityEnd(e.target.value)} />
                            </div>

                            <button
                                onClick={handleCreateListing}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                {hasListing ? 'Update Listing' : 'Create Listing'}
                            </button>

                            {hasListing && (
                                <button
                                    onClick={findMatches}
                                    disabled={isLoading}
                                    className="btn-secondary w-full flex items-center justify-center gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    Find New Matches
                                </button>
                            )}

                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <p className="text-sm font-semibold text-gray-800">Auto-Detect Skills from Profiles</p>
                                <p className="text-xs text-gray-500">Enter your usernames — we&apos;ll fetch your public data and extract skills automatically.</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-24 shrink-0">GitHub</span>
                                    <input
                                        className="input flex-1"
                                        placeholder="e.g. torvalds"
                                        value={githubUsername}
                                        onChange={(e) => setGithubUsername(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-24 shrink-0">LeetCode</span>
                                    <input
                                        className="input flex-1"
                                        placeholder="e.g. neal_wu"
                                        value={leetcodeUsername}
                                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-24 shrink-0">Codeforces</span>
                                    <input
                                        className="input flex-1"
                                        placeholder="e.g. tourist"
                                        value={codeforcesUsername}
                                        onChange={(e) => setCodeforcesUsername(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={fetchAndDetectSkills}
                                    disabled={isFetching}
                                    className="btn-outline w-full flex items-center justify-center gap-2"
                                >
                                    {isFetching ? (
                                        <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Fetching profiles...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Fetch & Auto-Detect Skills</>
                                    )}
                                </button>
                                {fetchedSummary && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-line">
                                        <p className="font-semibold text-gray-700 mb-1">Fetched data:</p>
                                        {fetchedSummary}
                                    </div>
                                )}
                                {detectedSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {detectedSkills.map((skill) => (
                                            <span key={skill} className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">{skill}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-gradient-primary text-white">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            How It Works
                        </h3>
                        <ul className="space-y-2 text-sm text-primary-100">
                            <li>• List skills you can teach</li>
                            <li>• Specify skills you want to learn</li>
                            <li>• AI finds perfect matches</li>
                            <li>• Connect and start learning</li>
                            <li>• Build your network</li>
                        </ul>
                    </div>
                </div>

                {/* Matches */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Your Matches
                        </h2>

                        {matches.length > 0 ? (
                            <div className="space-y-4">
                                {matches.map((match, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                                                    {match.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{match.name}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {match.availabilityMatched ? 'Availability overlap found' : 'Availability differs'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                                                <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                                                <span className="text-sm font-bold text-yellow-700">
                                                    {match.matchScore}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Can Teach You</p>
                                                <p className="font-medium text-sm text-green-700">
                                                    {(match.canTeachYou || []).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Wants to Learn</p>
                                                <p className="font-medium text-sm text-blue-700">
                                                    {(match.canLearnFromYou || []).join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleConnect(match)}
                                                className="btn-primary flex-1 btn-sm flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                Connect & Schedule
                                            </button>
                                            <button onClick={() => { setSessionMentorId(match.userId); setSessionSkill(match.canTeachYou?.[0] || ''); setActiveTab('sessions'); }} className="btn-outline btn-sm flex items-center justify-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Schedule
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No Matches Yet
                                </h3>
                                <p className="text-gray-500">
                                    Create a listing to find people who want to exchange skills with you
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {activeTab === 'requests' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card space-y-3">
                        <h2 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary-600" /> Post Skill Request</h2>
                        <input className="input" placeholder="Skill e.g. Dynamic Programming" value={requestSkill} onChange={(e) => setRequestSkill(e.target.value)} />
                        <textarea className="input min-h-28" placeholder="Describe what help you need" value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} />
                        <input className="input" placeholder="Preferred time" value={requestPreferredTime} onChange={(e) => setRequestPreferredTime(e.target.value)} />
                        <select aria-label="Request reward type" className="input" value={requestReward} onChange={(e) => setRequestReward(e.target.value as 'skill-exchange' | 'points')}>
                            <option value="skill-exchange">Skill Exchange</option>
                            <option value="points">Points</option>
                        </select>
                        <button className="btn-primary w-full" onClick={createRequest}>Post Request</button>
                    </div>
                    <div className="lg:col-span-2 card">
                        <h2 className="text-xl font-semibold mb-4">Open Request Board</h2>
                        <div className="space-y-3">
                            {requests.length === 0 && <p className="text-gray-500">No requests yet.</p>}
                            {requests.map((req) => (
                                <div key={req._id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between gap-2 items-start">
                                        <div>
                                            <p className="font-semibold">{req.skill}</p>
                                            <p className="text-sm text-gray-600">{req.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">Preferred: {req.preferredTime} | Reward: {req.rewardType}</p>
                                            <p className="text-xs mt-1"><span className="font-medium">Status:</span> {req.status}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {req.status === 'open' && <button className="btn-outline btn-sm" onClick={() => claimRequest(req._id)}>Claim</button>}
                                            {req.status === 'matched' && (
                                                <button
                                                    className="btn-outline btn-sm flex items-center gap-1"
                                                    onClick={() => handleScheduleFromRequest(req)}
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    Schedule
                                                </button>
                                            )}
                                            {req.status !== 'completed' && <button className="btn-primary btn-sm" onClick={() => completeRequest(req._id)}>Complete</button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sessions' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card space-y-3">
                        <h2 className="text-xl font-semibold">Schedule Session</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                            {matches.length > 0 ? (
                                <select
                                    aria-label="Select mentor"
                                    className="input"
                                    value={sessionMentorId}
                                    onChange={(e) => setSessionMentorId(e.target.value)}
                                >
                                    <option value="">-- Select a mentor from matches --</option>
                                    {matches.map((m) => (
                                        <option key={m.userId} value={m.userId}>
                                            {m.name} ({m.matchScore}% match)
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="input"
                                    placeholder="Mentor ID (create a profile to see matches)"
                                    value={sessionMentorId}
                                    onChange={(e) => setSessionMentorId(e.target.value)}
                                />
                            )}
                            {sessionMentorId && !matches.some((m) => m.userId === sessionMentorId) && matches.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">Custom mentor ID pre-filled from request</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Learner</label>
                            <input
                                aria-label="Learner (you)"
                                className="input bg-gray-50 cursor-not-allowed text-gray-600"
                                readOnly
                                value={user?.name ? `${user.name} (you)` : 'You (current user)'}
                            />
                        </div>
                        <input className="input" placeholder="Skill" value={sessionSkill} onChange={(e) => setSessionSkill(e.target.value)} />
                        <input aria-label="Session date and time" type="datetime-local" className="input" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} />
                        <input aria-label="Session duration in minutes" type="number" min={15} max={240} className="input" value={sessionDuration} onChange={(e) => setSessionDuration(parseInt(e.target.value, 10) || 60)} />
                        <input className="input" placeholder="Meeting Link" value={sessionLink} onChange={(e) => setSessionLink(e.target.value)} />
                        <button className="btn-primary w-full" onClick={scheduleSession}>Schedule</button>
                    </div>
                    <div className="lg:col-span-2 card">
                        <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
                        <div className="space-y-3">
                            {sessions.length === 0 && <p className="text-gray-500">No sessions yet.</p>}
                            {sessions.map((session) => (
                                <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                                    <p className="font-semibold">{session.skill} ({session.duration} min)</p>
                                    <p className="text-sm text-gray-600">Mentor: {session.mentorId?.name} | Learner: {session.learnerId?.name}</p>
                                    <p className="text-sm text-gray-600">{new Date(session.time).toLocaleString()}</p>
                                    <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-primary-600">Join meeting</a>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-xs px-2 py-1 rounded bg-gray-100">{session.status}</span>
                                        {session.status !== 'completed' && (
                                            <button className="btn-outline btn-sm" onClick={() => markSessionCompleted(session._id)}>Mark Completed</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card space-y-3">
                        <h2 className="text-xl font-semibold">Leave Review</h2>
                        <select aria-label="Review session selection" className="input" value={reviewSessionId} onChange={(e) => setReviewSessionId(e.target.value)}>
                            <option value="">Select completed session</option>
                            {completedSessions.map((s) => (
                                <option key={s._id} value={s._id}>{s.skill} - {new Date(s.time).toLocaleDateString()}</option>
                            ))}
                        </select>
                        <input aria-label="Review rating" type="number" min={1} max={5} className="input" value={reviewRating} onChange={(e) => setReviewRating(parseInt(e.target.value, 10) || 5)} />
                        <textarea className="input min-h-24" placeholder="Feedback" value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} />
                        <button className="btn-primary w-full" onClick={submitReview}>Submit Review</button>
                    </div>
                    <div className="lg:col-span-2 card">
                        <h2 className="text-xl font-semibold mb-4">Reviews Received</h2>
                        <div className="space-y-3">
                            {reviews.length === 0 && <p className="text-gray-500">No reviews yet.</p>}
                            {reviews.map((review) => (
                                <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                                    <p className="font-semibold">{review.rating}/5</p>
                                    <p className="text-sm text-gray-600">{review.feedback}</p>
                                    <p className="text-xs text-gray-500 mt-1">By {review.reviewerId?.name || 'User'} on {new Date(review.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mentor' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card space-y-3">
                        <h2 className="text-xl font-semibold flex items-center gap-2"><Bot className="w-5 h-5 text-primary-600" /> AI Mentor Setup</h2>
                        <input className="input" value={aiSkill} onChange={(e) => setAiSkill(e.target.value)} placeholder="Skill to learn" />
                        <select aria-label="AI mentor level" className="input" value={aiLevel} onChange={(e) => setAiLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert')}>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                        </select>
                        <input className="input" value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} placeholder="Goal" />
                        <textarea
                            className="input min-h-28"
                            placeholder="Ask the AI tutor what you want to understand about this skill"
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                        />
                        <button className="btn-primary w-full" onClick={generateAIMentorPlan}>Ask AI Tutor</button>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <h3 className="font-semibold mb-3 flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-500" /> Points & Premium</h3>
                            <p className="text-lg font-bold">{pointsSummary?.totalPoints || 0} points</p>
                            <p className="text-sm text-gray-600">Status: {pointsSummary?.premiumUnlocked ? 'Premium unlocked' : 'Keep teaching to unlock premium'}</p>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold mb-3">AI Mentor Output</h3>
                            {!aiMentorPlan && <p className="text-sm text-gray-500">Ask a question to get a direct explanation, likely questions, AI follow-ups, and a short practice task.</p>}
                            {aiMentorPlan && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-semibold text-sm mb-2">Direct Explanation</p>
                                        <MarkdownRenderer content={aiMentorPlan.directAnswer} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-2">Concept Breakdown</p>
                                        <ul className="space-y-1 text-sm text-gray-700">
                                            {aiMentorPlan.conceptBreakdown.map((item, i) => <li key={i}>- {item}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-2">Questions You May Ask Next</p>
                                        <ul className="space-y-1 text-sm text-gray-700">
                                            {aiMentorPlan.likelyUserQuestions.map((item, i) => <li key={i}>- {item}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-2">AI Follow-Up Questions For You</p>
                                        <ul className="space-y-1 text-sm text-gray-700">
                                            {aiMentorPlan.aiFollowUpQuestions.map((item, i) => <li key={i}>- {item}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-2">Practice Task</p>
                                        <MarkdownRenderer content={aiMentorPlan.practiceTask} />
                                    </div>
                                    <div className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800">
                                        {aiMentorPlan.encouragement}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
