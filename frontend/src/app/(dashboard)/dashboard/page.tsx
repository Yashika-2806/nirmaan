'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import {
    ArrowRight,
    BookOpen,
    Brain,
    Code,
    Coins,
    Crown,
    FileText,
    Flame,
    Medal,
    MessageSquare,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { GamificationProfile, LeaderboardResponse, gamificationService } from '@/services/gamificationService';
import { trackEvent } from '@/lib/analytics';
import { OnboardingData, OnboardingGate } from '@/components/growth/OnboardingGate';
import { PaywallModal } from '@/components/growth/PaywallModal';
import { TimedNudgeCard } from '@/components/growth/TimedNudgeCard';
import { roadmapService } from '@/services/roadmapService';
import { interviewService } from '@/services/interviewService';

type SprintTask = {
    id: string;
    title: string;
    minutes: number;
    xp: number;
    key: 'resume' | 'dsa' | 'interview' | 'applications';
    done: boolean;
};

type InterviewSessionLite = {
    _id: string;
    company: string;
    role: string;
    status: 'in-progress' | 'completed' | 'abandoned';
    completedAt?: string | null;
};

type RecentActivityItem = {
    id: string;
    type: 'dsa' | 'interview' | 'roadmap';
    title: string;
    meta: string;
    completedAt?: string;
};

export default function DashboardPage() {
    const { user, isAuthenticated, accessToken, updateProfile } = useAuthStore();
    const router = useRouter();
    const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
    const [leaderboardScope, setLeaderboardScope] = useState<'global' | 'college'>('global');
    const [leaderboardMetric, setLeaderboardMetric] = useState<'xp' | 'dsa' | 'skill'>('xp');
    const [isGamificationLoading, setIsGamificationLoading] = useState(false);
    const [isClaimingQuestReward, setIsClaimingQuestReward] = useState(false);
    const [showOnboardingGate, setShowOnboardingGate] = useState(false);
    const [paywallOpen, setPaywallOpen] = useState(false);
    const [paywallFeatureName, setPaywallFeatureName] = useState('AI Mentor Check-In');
    const [paywallSource, setPaywallSource] = useState('dashboard');
    const [roadmaps, setRoadmaps] = useState<any[]>([]);
    const [interviewSessions, setInterviewSessions] = useState<InterviewSessionLite[]>([]);
    const lastGamificationErrorRef = useRef<string | null>(null);
    const gamificationRetryCountRef = useRef(0);

    const isPaidUser = (user?.subscription?.tier || '').toLowerCase() !== 'free';

    const sprintTasks: SprintTask[] = [
        {
            id: 'resume-upgrade',
            title: 'Upgrade 2 project bullets with impact metrics',
            minutes: 15,
            xp: 30,
            key: 'resume',
            done: (gamificationProfile?.stats?.resume_improved || 0) > 0,
        },
        {
            id: 'dsa-run',
            title: 'Solve 2 medium DSA questions',
            minutes: 20,
            xp: 40,
            key: 'dsa',
            done: (gamificationProfile?.stats?.dsa_problem_solved || 0) >= 2,
        },
        {
            id: 'interview-rep',
            title: 'Practice one HR answer in Interview Gym',
            minutes: 10,
            xp: 20,
            key: 'interview',
            done: (gamificationProfile?.stats?.mock_interview_completed || 0) > 0,
        },
    ];

    const completedSprintTasks = sprintTasks.filter((task) => task.done).length;
    const sprintProgress = Math.round((completedSprintTasks / sprintTasks.length) * 100);

    const loadCompletionData = useCallback(async () => {
        try {
            const [roadmapData, sessionsData] = await Promise.all([
                roadmapService.getAll(),
                interviewService.getSessions(),
            ]);

            setRoadmaps(Array.isArray(roadmapData) ? roadmapData : []);
            setInterviewSessions(Array.isArray(sessionsData) ? sessionsData : []);
        } catch {
            // Keep dashboard usable even if one source fails.
        }
    }, []);

    const loadGamificationData = useCallback(async () => {
        if (!isAuthenticated || !accessToken || !user?._id) {
            return;
        }

        setIsGamificationLoading(true);
        try {
            const [profileData, leaderboardData] = await Promise.all([
                gamificationService.getProfile(user._id),
                gamificationService.getLeaderboard({
                    scope: leaderboardScope,
                    metric: leaderboardMetric,
                    limit: 10,
                }),
            ]);

            setGamificationProfile(profileData);
            setLeaderboard(leaderboardData);
            lastGamificationErrorRef.current = null;
            gamificationRetryCountRef.current = 0;
        } catch (error: any) {
            const isNetworkError = !error?.response;
            if (isNetworkError && gamificationRetryCountRef.current < 2) {
                gamificationRetryCountRef.current += 1;

                if (!gamificationProfile && gamificationRetryCountRef.current === 1) {
                    toast.error('Unable to reach server. Retrying...');
                }

                setTimeout(() => {
                    loadGamificationData();
                }, 800 * gamificationRetryCountRef.current);

                return;
            }

            const message =
                error?.response?.data?.message ||
                (isNetworkError ? 'Unable to reach server.' : error?.message) ||
                'Failed to load gamification data';

            if (lastGamificationErrorRef.current !== message) {
                lastGamificationErrorRef.current = message;
                toast.error(message);
            }
        } finally {
            setIsGamificationLoading(false);
        }
    }, [accessToken, isAuthenticated, leaderboardMetric, leaderboardScope, user?._id, gamificationProfile]);

    useEffect(() => {
        loadGamificationData();
    }, [loadGamificationData]);

    useEffect(() => {
        if (isAuthenticated) {
            loadCompletionData();
        }
    }, [isAuthenticated, loadCompletionData]);

    useEffect(() => {
        const routesToPrefetch = [
            '/dashboard/dsa',
            '/dashboard/interview',
            '/dashboard/resume',
            '/dashboard/roadmap',
            '/research',
            '/dashboard/pdf',
            '/dashboard/skill-marketplace',
            '/dashboard/career-twin',
        ];

        routesToPrefetch.forEach((route) => router.prefetch(route));
    }, [router]);

    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            return;
        }

        trackEvent('dashboard_viewed', {
            userId: user._id,
            subscriptionTier: user?.subscription?.tier || 'free',
        });

        const onboardingKey = `nirmaan:onboarding:${user._id}`;
        const hasOnboarded = window.localStorage.getItem(onboardingKey);
        setShowOnboardingGate(!hasOnboarded);
    }, [isAuthenticated, user?._id, user?.subscription?.tier]);

    const handleClaimQuestReward = async () => {
        if (!gamificationProfile?.currentQuest?._id) return;

        setIsClaimingQuestReward(true);
        try {
            await gamificationService.claimReward(gamificationProfile.currentQuest._id);
            toast.success('Quest reward claimed');
            await loadGamificationData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to claim quest reward');
        } finally {
            setIsClaimingQuestReward(false);
        }
    };

    const openPaywall = (featureName: string, source: string) => {
        setPaywallFeatureName(featureName);
        setPaywallSource(source);
        setPaywallOpen(true);
        trackEvent('paywall_opened', {
            source,
            featureName,
        });
    };

    const handleOnboardingComplete = async (data: OnboardingData) => {
        if (user?._id) {
            const onboardingKey = `nirmaan:onboarding:${user._id}`;
            window.localStorage.setItem(onboardingKey, JSON.stringify(data));
        }

        try {
            await updateProfile({
                preferences: {
                    onboarding: {
                        year: data.year,
                        targetRole: data.targetRole,
                        prepLevel: data.prepLevel,
                        completedAt: new Date().toISOString(),
                    },
                },
            });
            trackEvent('onboarding_persisted_backend', {
                userId: user?._id || 'anonymous',
            });
        } catch {
            trackEvent('onboarding_persist_failed', {
                userId: user?._id || 'anonymous',
            });
            toast.error('Plan saved locally. Sync will retry later.');
        }

        setShowOnboardingGate(false);
        toast.success('Your sprint plan is ready.');
    };

    const dsaSolvedCount = gamificationProfile?.stats?.dsa_problem_solved || 0;
    const interviewCompletedCount = useMemo(
        () => interviewSessions.filter((s) => s.status === 'completed').length,
        [interviewSessions]
    );
    const roadmapMilestonesCompleted = useMemo(
        () => roadmaps.reduce((sum, roadmap) => sum + (roadmap.milestones || []).filter((m: any) => m.completed).length, 0),
        [roadmaps]
    );
    const roadmapCompletedCount = useMemo(
        () => roadmaps.filter((roadmap) => roadmap.status === 'completed').length,
        [roadmaps]
    );

    const recentActivities = useMemo<RecentActivityItem[]>(() => {
        const interviewItems: RecentActivityItem[] = interviewSessions
            .filter((session) => session.status === 'completed' && session.completedAt)
            .map((session) => ({
                id: `interview-${session._id}`,
                type: 'interview',
                title: `Completed ${session.company} ${session.role} interview`,
                meta: 'Interview Prep',
                completedAt: session.completedAt || undefined,
            }));

        const roadmapItems: RecentActivityItem[] = roadmaps.flatMap((roadmap) =>
            (roadmap.milestones || [])
                .filter((milestone: any) => milestone.completed && milestone.completedAt)
                .map((milestone: any, index: number) => ({
                    id: `roadmap-${roadmap._id}-${index}`,
                    type: 'roadmap',
                    title: `Completed roadmap milestone: ${milestone.title}`,
                    meta: roadmap.title,
                    completedAt: milestone.completedAt,
                }))
        );

        const dsaItem: RecentActivityItem[] = dsaSolvedCount > 0
            ? [{
                id: 'dsa-summary',
                type: 'dsa',
                title: `Solved ${dsaSolvedCount} DSA problems`,
                meta: 'DSA Practice',
            }]
            : [];

        return [...interviewItems, ...roadmapItems, ...dsaItem]
            .sort((a, b) => {
                const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                return bTime - aTime;
            })
            .slice(0, 6);
    }, [interviewSessions, roadmaps, dsaSolvedCount]);

    // If not authenticated, show the public dashboard with login CTA
    if (!isAuthenticated) {
        return (
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0e162d] p-6">
                    <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
                    <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
                    <div className="relative z-10 max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
                            <Sparkles className="h-4 w-4" />
                            Placement Acceleration Platform
                        </div>
                        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                            Crack placements with focused daily prep.
                        </h1>
                        <p className="mt-3 text-base text-slate-300">
                            Sign in to view readiness score, task plan, and AI mentor checkpoints.
                        </p>
                        <Link
                            href="/login?src=dashboard_public"
                            onClick={() => trackEvent('cta_clicked', { source: 'dashboard_public_hero', cta: 'sign_in_start_sprint' })}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-cyan-200"
                        >
                            Sign In to Start Today&#39;s Sprint
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                <div className="grid gap-5 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
                        <p className="text-sm text-slate-300">Daily Focus</p>
                        <p className="mt-2 text-2xl font-bold text-white">Resume + DSA + Interview</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
                        <p className="text-sm text-slate-300">Outcomes</p>
                        <p className="mt-2 text-2xl font-bold text-white">Higher shortlist odds</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
                        <p className="text-sm text-slate-300">Consistency Layer</p>
                        <p className="mt-2 text-2xl font-bold text-white">Streak + progress loop</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0e162d] p-6">
                <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
                <div className="relative z-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
                            <Sparkles className="h-4 w-4" />
                            Placement Sprint Control Center
                        </div>
                        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                            Welcome back, {user?.name}. Let&#39;s improve your shortlist odds.
                        </h1>
                        <p className="mt-3 text-base text-slate-300">
                            Your edge is consistency. Complete today&#39;s sprint to keep momentum.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/dashboard/interview"
                                onClick={() => trackEvent('cta_clicked', { source: 'dashboard_hero', cta: 'start_todays_sprint' })}
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-cyan-200"
                            >
                                Start Today&#39;s Sprint
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/dashboard/resume"
                                onClick={() => trackEvent('cta_clicked', { source: 'dashboard_hero', cta: 'boost_resume_score' })}
                                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10"
                            >
                                Boost Resume Score
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Readiness Snapshot</p>
                        <p className="mt-2 text-4xl font-bold text-cyan-100">{gamificationProfile?.readinessScore || 0}/100</p>
                        <p className="mt-2 text-sm text-slate-300">On this pace, you can hit interview-ready range in 4-6 weeks.</p>
                        <div className="mt-4 h-3 rounded-full bg-slate-800">
                            <progress
                                title="Readiness score progress"
                                className="h-3 w-full rounded-full [appearance:none] [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-cyan-300 [&::-webkit-progress-value]:to-emerald-300 [&::-moz-progress-bar]:bg-cyan-300"
                                value={gamificationProfile?.readinessScore || 0}
                                max={100}
                            />
                        </div>
                        <p className="mt-4 text-xs text-cyan-100">Pro insight: Resume uplift is your highest ROI action today.</p>
                    </div>
                </div>
            </section>

            <TimedNudgeCard
                userId={user?._id}
                createdAt={user?.createdAt}
                isPaidUser={isPaidUser}
            />

            <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-white">Today&#39;s Placement Sprint</h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
                            <Flame className="h-4 w-4" />
                            {gamificationProfile?.streakCurrent || 0} day streak
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                        Complete all tasks to lock your streak and claim a bonus XP burst.
                    </p>

                    <div className="mt-4">
                        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Sprint Completion</label>
                        <progress
                            title="Sprint completion"
                            className="h-3 w-full rounded-full [appearance:none] [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-emerald-300 [&::-webkit-progress-value]:to-cyan-300 [&::-moz-progress-bar]:bg-emerald-300"
                            value={sprintProgress}
                            max={100}
                        />
                        <p className="mt-2 text-sm text-emerald-200">
                            {completedSprintTasks}/{sprintTasks.length} tasks completed
                        </p>
                    </div>

                    <div className="mt-5 space-y-3">
                        {sprintTasks.map((task) => (
                            <button
                                key={task.id}
                                onClick={() => {
                                    trackEvent('sprint_task_clicked', {
                                        source: 'dashboard_sprint_panel',
                                        taskKey: task.key,
                                        completed: task.done,
                                    });
                                    if (task.key === 'resume') {
                                        router.push('/dashboard/resume');
                                        return;
                                    }
                                    if (task.key === 'dsa') {
                                        router.push('/dashboard/dsa');
                                        return;
                                    }
                                    if (task.key === 'interview') {
                                        router.push('/dashboard/interview');
                                        return;
                                    }
                                    router.push('/dashboard');
                                }}
                                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
                            >
                                <div>
                                    <p className="font-semibold text-white">{task.title}</p>
                                    <p className="mt-1 text-xs text-slate-300">
                                        {task.minutes} min focus block and +{task.xp} XP
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        task.done ? 'bg-emerald-300/20 text-emerald-200' : 'bg-slate-700 text-slate-200'
                                    }`}
                                >
                                    {task.done ? 'Done' : 'Pending'}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-5 rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm text-cyan-100">
                        AI Mentor: You are strongest in DSA this week. Resume bullet optimization is your highest conversion action now.
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Upgrade Trigger</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">You are at {gamificationProfile?.readinessScore || 0}/100 readiness.</h3>
                        <p className="mt-2 text-sm text-amber-50/95">
                            Pro unlocks company-specific prep plans, deeper mock analysis, and daily mentor optimization.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                if (isPaidUser) {
                                    trackEvent('cta_clicked', { source: 'upgrade_trigger_card', cta: 'open_ai_mentor' });
                                    router.push('/dashboard/career-twin');
                                    return;
                                }
                                openPaywall('AI Mentor Check-In', 'upgrade_trigger_card');
                            }}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-200"
                        >
                            Unlock Pro-Level Guidance
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#111a33] p-4">
                        <h3 className="text-base font-semibold text-white">Weekly Momentum</h3>
                        <div className="mt-4 grid gap-3">
                            <MomentumItem icon={<Crown className="h-4 w-4 text-cyan-200" />} label="Career Level" value={`L${gamificationProfile?.level || 1}`} />
                            <MomentumItem icon={<Coins className="h-4 w-4 text-yellow-300" />} label="Credits" value={`${gamificationProfile?.credits?.balance || 0}`} />
                            <MomentumItem icon={<Medal className="h-4 w-4 text-emerald-300" />} label="Badges" value={`${gamificationProfile?.badgesEarnedCount || 0}`} />
                            <MomentumItem icon={<TrendingUp className="h-4 w-4 text-cyan-300" />} label="XP" value={`${gamificationProfile?.totalXp || 0}`} />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Code className="w-6 h-6 text-[#00D9FF]" />}
                    label="DSA Problems Solved"
                    value={`${dsaSolvedCount}`}
                />
                <StatCard
                    icon={<MessageSquare className="w-6 h-6 text-[#00D9FF]" />}
                    label="Interview Sessions"
                    value={`${interviewCompletedCount}`}
                />
                <StatCard
                    icon={<FileText className="w-6 h-6 text-[#00D9FF]" />}
                    label="Resume Versions"
                    value={`${gamificationProfile?.stats?.resume_improved || 0}`}
                />
                <StatCard
                    icon={<Target className="w-6 h-6 text-[#00D9FF]" />}
                    label="Weekly Goal"
                    value={`${user?.preferences?.weeklyGoal || 5} hrs`}
                    subtext="On track"
                />
            </div>

            <section className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-white">Progress Across Modules</h2>
                    <span className="text-xs text-slate-300 uppercase tracking-[0.2em]">Live Completion Feed</span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <ProgressMiniCard
                        icon={<Code className="w-4 h-4 text-cyan-200" />}
                        title="Questions Solved"
                        value={`${dsaSolvedCount}`}
                    />
                    <ProgressMiniCard
                        icon={<MessageSquare className="w-4 h-4 text-emerald-200" />}
                        title="Interviews Completed"
                        value={`${interviewCompletedCount}`}
                    />
                    <ProgressMiniCard
                        icon={<Target className="w-4 h-4 text-violet-200" />}
                        title="Roadmap Milestones"
                        value={`${roadmapMilestonesCompleted}`}
                    />
                    <ProgressMiniCard
                        icon={<Trophy className="w-4 h-4 text-amber-200" />}
                        title="Roadmaps Completed"
                        value={`${roadmapCompletedCount}`}
                    />
                </div>

                <div className="mt-6 space-y-3">
                    {recentActivities.length === 0 ? (
                        <p className="text-sm text-slate-400">No completion events yet. Start with DSA, interview prep, or roadmap tasks to see progress here.</p>
                    ) : (
                        recentActivities.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                                    <p className="text-xs text-slate-400">{item.meta}</p>
                                </div>
                                <span className="text-xs text-slate-400 shrink-0 ml-3">
                                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'Updated'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-[#00D9FF]" />
                    <h2 className="text-xl font-bold text-white">Action Hubs</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ActionCard
                        href="/dashboard/dsa"
                        icon={<Code className="w-8 h-8 text-[#00D9FF]" />}
                        title="DSA Momentum"
                        description="Build coding consistency with guided sets"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/dashboard/interview"
                        icon={<MessageSquare className="w-8 h-8 text-[#00D9FF]" />}
                        title="Interview Gym"
                        description="Sharpen technical and HR confidence"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/dashboard/resume"
                        icon={<FileText className="w-8 h-8 text-[#00D9FF]" />}
                        title="Resume Lift Studio"
                        description="Lift ATS score with impact-based bullets"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/dashboard/roadmap"
                        icon={<Target className="w-8 h-8 text-[#00D9FF]" />}
                        title="OfferPath Roadmap"
                        description="Personalized weekly placement plan"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/research"
                        icon={<Brain className="w-8 h-8 text-[#00D9FF]" />}
                        title="Research Copilot"
                        description="Research smarter for projects and interviews"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/dashboard/pdf"
                        icon={<BookOpen className="w-8 h-8 text-[#00D9FF]" />}
                        title="PDF Smart Notes"
                        description="Turn documents into revision-ready insights"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/dashboard/skill-marketplace"
                        icon={<Users className="w-8 h-8 text-[#00D9FF]" />}
                        title="Skill Exchange"
                        description="Trade strengths and climb the peer board"
                        analyticsSource="action_hub"
                    />

                    <ActionCard
                        href="/dashboard/career-twin"
                        icon={<Sparkles className="w-8 h-8 text-[#00D9FF]" />}
                        title="AI Mentor Check-In"
                        description="Daily guidance tuned to your progress"
                        analyticsSource="action_hub"
                        premiumLocked={!isPaidUser}
                        onPremiumLocked={() => openPaywall('AI Mentor Check-In', 'action_hub_ai_mentor')}
                    />

                    <ActionCard
                        href="/dashboard"
                        icon={<Trophy className="w-8 h-8 text-[#00D9FF]" />}
                        title="Growth Dashboard"
                        description="Track momentum, rank, and readiness"
                        analyticsSource="action_hub"
                    />
                </div>
            </div>

            <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-[#00D9FF]" />
                        <h2 className="text-xl font-bold text-white">Performance and Leaderboard</h2>
                    </div>
                    <div className="px-3 py-1 rounded-full border border-[#00D9FF]/40 bg-[#00D9FF]/10 text-xs font-semibold text-[#00D9FF] tracking-wide">
                        SEASON LIVE
                    </div>
                </div>

                {isGamificationLoading && !gamificationProfile ? (
                    <div className="rounded-xl bg-[#111111] border border-gray-800 p-6 text-gray-400">Loading progress dashboard...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-[#00D9FF]/30 bg-gradient-to-br from-[#00D9FF]/10 via-[#0b0f19] to-[#111111] p-1">
                            <div className="rounded-2xl bg-[#0b0f16] border border-gray-900 p-5 md:p-6">
                                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="rounded-xl bg-[#111111] border border-[#00D9FF]/30 p-5 shadow-[0_0_30px_-20px_#00D9FF]">
                                        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Career Level</p>
                                        <p className="text-3xl font-extrabold text-white">L{gamificationProfile?.level || 1}</p>
                                        <p className="text-sm text-[#00D9FF] mt-1 font-semibold">{gamificationProfile?.levelTitle || 'Beginner'}</p>
                                    </div>

                                    <div className="rounded-xl bg-[#111111] border border-orange-500/30 p-5 shadow-[0_0_30px_-20px_#fb923c]">
                                        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Current Streak</p>
                                        <p className="text-3xl font-extrabold text-white flex items-center gap-2">
                                            <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                                            {gamificationProfile?.streakCurrent || 0}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">Longest: {gamificationProfile?.streakLongest || 0} days</p>
                                    </div>

                                    <div className="rounded-xl bg-[#111111] border border-yellow-500/30 p-5 shadow-[0_0_30px_-20px_#facc15]">
                                        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Career Credits</p>
                                        <p className="text-3xl font-extrabold text-white flex items-center gap-2">
                                            <Coins className="w-6 h-6 text-yellow-400" />
                                            {gamificationProfile?.credits?.balance || 0}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">Lifetime earned: {gamificationProfile?.credits?.lifetimeEarned || 0}</p>
                                    </div>

                                    <div className="rounded-xl bg-[#111111] border border-emerald-500/30 p-5 shadow-[0_0_30px_-20px_#34d399]">
                                        <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-1">Badges Earned</p>
                                        <p className="text-3xl font-extrabold text-white flex items-center gap-2">
                                            <Medal className="w-6 h-6 text-emerald-400" />
                                            {gamificationProfile?.badgesEarnedCount || 0}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">Readiness: {gamificationProfile?.readinessScore || 0}/100</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#111111] border border-gray-800 p-6 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#00D9FF]/10 blur-3xl"></div>
                            <div className="relative z-10 flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">XP Progress</h3>
                                <p className="text-sm text-gray-300 font-semibold">{gamificationProfile?.xpInCurrentLevel || 0}/{gamificationProfile?.xpForNextLevel || 100} XP</p>
                            </div>
                            <div className="w-full h-4 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
                                <progress
                                    className="w-full h-4 rounded-full overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-[#00D9FF] [&::-webkit-progress-value]:to-cyan-300 [&::-moz-progress-bar]:bg-[#00D9FF]"
                                    value={gamificationProfile?.xpProgressPercentage || 0}
                                    max={100}
                                />
                            </div>
                            <div className="flex flex-wrap justify-between mt-3 text-xs">
                                <p className="text-gray-400">Total XP: <span className="text-white font-semibold">{gamificationProfile?.totalXp || 0}</span></p>
                                <p className="text-[#00D9FF] font-semibold">Next level in {Math.max(0, (gamificationProfile?.xpForNextLevel || 100) - (gamificationProfile?.xpInCurrentLevel || 0))} XP</p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                                <h3 className="text-lg font-semibold text-white mb-1">Weekly Quest Tracker</h3>
                                <p className="text-xs text-gray-500 mb-4">Complete all missions to claim reward pack.</p>
                                {!gamificationProfile?.currentQuest ? (
                                    <p className="text-sm text-gray-500">No active quest this week.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {gamificationProfile.currentQuest.tasks.map((task) => {
                                            const percentage = Math.min(100, Math.round((task.current / task.target) * 100));
                                            return (
                                                <div key={task.key} className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-gray-200 font-medium">{task.label}</span>
                                                        <span className="text-[#00D9FF] font-semibold">{task.current}/{task.target}</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                                                        <progress
                                                            className="w-full h-2 rounded-full overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-[#00D9FF] [&::-moz-progress-bar]:bg-[#00D9FF]"
                                                            value={percentage}
                                                            max={100}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="pt-3 border-t border-gray-800 rounded-lg bg-[#0f172a]/40 px-3 py-3">
                                            <p className="text-sm text-gray-200">
                                                Reward Pack: <span className="text-[#00D9FF] font-semibold">+{gamificationProfile.currentQuest.reward.xp} XP</span> and <span className="text-yellow-300 font-semibold">+{gamificationProfile.currentQuest.reward.credits} credits</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Status: {gamificationProfile.currentQuest.status}</p>
                                            {gamificationProfile.currentQuest.status === 'completed' && (
                                                <button
                                                    onClick={handleClaimQuestReward}
                                                    disabled={isClaimingQuestReward}
                                                    className="mt-3 w-full rounded-lg bg-cyan-300 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isClaimingQuestReward ? 'Claiming Reward...' : 'Claim Epic Reward'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Earned Badges</h3>
                                {!gamificationProfile?.badges?.length ? (
                                    <p className="text-sm text-gray-500">No badges yet. Complete quests and activities to unlock your first legendary badge.</p>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {gamificationProfile.badges.slice(0, 6).map((badge, index) => (
                                            <div key={badge._id} className={`rounded-lg border p-3 ${index % 3 === 0 ? 'border-[#00D9FF]/40 bg-[#00D9FF]/10' : index % 3 === 1 ? 'border-yellow-400/40 bg-yellow-400/10' : 'border-emerald-400/40 bg-emerald-400/10'}`}>
                                                <p className="text-sm font-semibold text-white">{badge.title}</p>
                                                <p className="text-xs text-gray-300 mt-1">{badge.description}</p>
                                                <p className="text-[11px] text-gray-400 mt-2">{badge.milestone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Weekly Leaderboard</h3>
                                <div className="flex gap-2">
                                    <select
                                        aria-label="Leaderboard scope"
                                        className="input w-32"
                                        value={leaderboardScope}
                                        onChange={(e) => setLeaderboardScope(e.target.value as 'global' | 'college')}
                                    >
                                        <option value="global">Global</option>
                                        <option value="college">College</option>
                                    </select>
                                    <select
                                        aria-label="Leaderboard metric"
                                        className="input w-36"
                                        value={leaderboardMetric}
                                        onChange={(e) => setLeaderboardMetric(e.target.value as 'xp' | 'dsa' | 'skill')}
                                    >
                                        <option value="xp">XP</option>
                                        <option value="dsa">DSA Solved</option>
                                        <option value="skill">Skill Helps</option>
                                    </select>
                                </div>
                            </div>

                            {(leaderboard?.entries || []).length > 0 && (
                                <div className="grid md:grid-cols-3 gap-3 mb-4">
                                    {(leaderboard?.entries || []).slice(0, 3).map((entry) => (
                                        <div key={`top-${entry.userId}-${entry.rank}`} className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">#{entry.rank}</p>
                                            <p className="text-sm text-white font-semibold mt-1">{entry.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{entry.institution || 'No institution'}</p>
                                            <p className="text-sm text-[#00D9FF] font-bold mt-2">Score: {entry.score}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-800">
                                            <th className="py-2 pr-4">Rank</th>
                                            <th className="py-2 pr-4">User</th>
                                            <th className="py-2 pr-4">Institution</th>
                                            <th className="py-2 pr-4">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(leaderboard?.entries || []).length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-gray-500">No leaderboard entries yet this week.</td>
                                            </tr>
                                        )}
                                        {(leaderboard?.entries || []).map((entry) => (
                                            <tr key={`${entry.userId}-${entry.rank}`} className="border-b border-gray-900">
                                                <td className="py-2 pr-4 text-white">#{entry.rank}</td>
                                                <td className="py-2 pr-4 text-gray-200">{entry.name}</td>
                                                <td className="py-2 pr-4 text-gray-400">{entry.institution || '-'}</td>
                                                <td className="py-2 pr-4 text-[#00D9FF] font-semibold">{entry.score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <OnboardingGate
                open={showOnboardingGate}
                userId={user?._id}
                userName={user?.name}
                onComplete={handleOnboardingComplete}
            />

            <PaywallModal
                open={paywallOpen}
                onClose={() => setPaywallOpen(false)}
                featureName={paywallFeatureName}
                source={paywallSource}
            />
        </div>
    );
}

function ProgressMiniCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{title}</span>
                <span>{icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function StatCard({ icon, label, value, subtext = '+0%' }: { icon: React.ReactNode; label: string; value: string; subtext?: string }) {
    return (
        <div className="group relative overflow-hidden rounded-xl bg-[#111111] border border-gray-800 p-5 hover:border-[#00D9FF]/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-xs text-green-400 font-medium">{subtext}</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function MomentumItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-slate-300">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-sm font-semibold text-white">{value}</span>
        </div>
    );
}

function ActionCard({
    href,
    icon,
    title,
    description,
    analyticsSource,
    premiumLocked = false,
    onPremiumLocked,
}: {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    analyticsSource: string;
    premiumLocked?: boolean;
    onPremiumLocked?: () => void;
}) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const prefetchTarget = () => {
        if (!premiumLocked) {
            router.prefetch(href);
        }
    };

    useEffect(() => {
        prefetchTarget();
        // Intentionally run once for this card's destination.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const analyticsPayload = {
            source: analyticsSource,
            hub: title,
            destination: href,
            premiumLocked,
        };

        if (!isAuthenticated) {
            e.preventDefault();
            router.push('/login?src=action_hub');
            setTimeout(() => trackEvent('action_hub_clicked', analyticsPayload), 0);
            return;
        }

        if (premiumLocked) {
            onPremiumLocked?.();
            setTimeout(() => trackEvent('action_hub_clicked', analyticsPayload), 0);
            return;
        }

        router.push(href);
        setTimeout(() => trackEvent('action_hub_clicked', analyticsPayload), 0);
    };

    return (
        <div 
            onClick={handleClick}
            onMouseEnter={prefetchTarget}
            onFocus={prefetchTarget}
            className="group relative overflow-hidden rounded-xl bg-[#111111] border border-gray-800 p-5 hover:border-[#00D9FF]/50 hover:bg-[#111111] transition-all duration-300 cursor-pointer h-full"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9FF]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#00D9FF]/20 transition-colors">
                    {icon}
                </div>
                <h3 className="text-base font-semibold mb-2 text-white">{title}</h3>
                <p className="text-sm text-gray-400 mb-4">{description}</p>
                <div className="flex items-center gap-2 text-[#00D9FF] text-sm font-medium">
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}
