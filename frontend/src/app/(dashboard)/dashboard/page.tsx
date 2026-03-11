'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Code, FileText, MessageSquare, Target, Sparkles, Brain, Trophy, ArrowRight, Zap, BookOpen, Users, Flame, Medal, Crown, Coins } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { GamificationProfile, LeaderboardResponse, gamificationService } from '@/services/gamificationService';

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
    const [leaderboardScope, setLeaderboardScope] = useState<'global' | 'college'>('global');
    const [leaderboardMetric, setLeaderboardMetric] = useState<'xp' | 'dsa' | 'skill'>('xp');
    const [isGamificationLoading, setIsGamificationLoading] = useState(false);
    const [isClaimingQuestReward, setIsClaimingQuestReward] = useState(false);

    const loadGamificationData = async () => {
        if (!user?._id) {
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
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load gamification data');
        } finally {
            setIsGamificationLoading(false);
        }
    };

    useEffect(() => {
        loadGamificationData();
    }, [user?._id, leaderboardScope, leaderboardMetric]);

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

    // If not authenticated, show the public dashboard with login CTA
    if (!isAuthenticated) {
        return (
            <div className="space-y-8">
                {/* Hero Section - Public view */}
                <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-[#00D9FF]/20 p-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                            <span className="text-sm font-medium text-[#00D9FF] uppercase tracking-wider">Career OS</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-3">
                            <span className="text-white">Transform Your </span>
                            <span className="text-[#00D9FF]">Career Journey</span> 🚀
                        </h1>
                        <p className="text-gray-400 text-lg mb-6">Explore our AI-powered tools designed to help you master DSA, ace interviews, build amazing resumes, and accelerate your career growth.</p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D9FF]/10 hover:bg-[#00D9FF]/20 border border-[#00D9FF]/50 hover:border-[#00D9FF] text-[#00D9FF] rounded-lg font-semibold transition-all"
                        >
                            Sign In to Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Section - Authenticated view */}
            <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-[#00D9FF]/20 p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                        <span className="text-sm font-medium text-[#00D9FF] uppercase tracking-wider">Career OS</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <span className="text-white">Welcome back, </span>
                        <span className="text-[#00D9FF]">{user?.name}!</span> 👋
                    </h1>
                    <p className="text-gray-400 text-lg">Here's your career progress overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Code className="w-6 h-6 text-[#00D9FF]" />}
                    label="DSA Problems Solved"
                    value="0"
                />
                <StatCard
                    icon={<MessageSquare className="w-6 h-6 text-[#00D9FF]" />}
                    label="Interview Sessions"
                    value="0"
                />
                <StatCard
                    icon={<FileText className="w-6 h-6 text-[#00D9FF]" />}
                    label="Resume Versions"
                    value="0"
                />
                <StatCard
                    icon={<Target className="w-6 h-6 text-[#00D9FF]" />}
                    label="Weekly Goal"
                    value={`${user?.preferences?.weeklyGoal || 5} hrs`}
                    subtext="On track"
                />
            </div>

            {/* Quick Actions & Features Grid */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-[#00D9FF]" />
                    <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Practice DSA */}
                    <ActionCard
                        href="/dashboard/dsa"
                        icon={<Code className="w-8 h-8 text-[#00D9FF]" />}
                        title="Practice DSA"
                        description="Solve problems with AI guidance"
                    />

                    {/* Mock Interview */}
                    <ActionCard
                        href="/dashboard/interview"
                        icon={<MessageSquare className="w-8 h-8 text-[#00D9FF]" />}
                        title="Mock Interview"
                        description="Prepare for your next interview"
                    />

                    {/* Build Resume */}
                    <ActionCard
                        href="/dashboard/resume"
                        icon={<FileText className="w-8 h-8 text-[#00D9FF]" />}
                        title="Build Resume"
                        description="Create ATS-optimized resume"
                    />

                    {/* Career Roadmap */}
                    <ActionCard
                        href="/dashboard/roadmap"
                        icon={<Target className="w-8 h-8 text-[#00D9FF]" />}
                        title="Career Roadmap"
                        description="Personalized learning path"
                    />

                    {/* Research Assistant */}
                    <ActionCard
                        href="/research"
                        icon={<Brain className="w-8 h-8 text-[#00D9FF]" />}
                        title="Research Assistant"
                        description="AI-powered research help"
                    />

                    {/* PDF Learning */}
                    <ActionCard
                        href="/dashboard/pdf"
                        icon={<BookOpen className="w-8 h-8 text-[#00D9FF]" />}
                        title="PDF Learning"
                        description="Extract insights from PDFs"
                    />

                    {/* Skill Marketplace */}
                    <ActionCard
                        href="/dashboard/skill-marketplace"
                        icon={<Users className="w-8 h-8 text-[#00D9FF]" />}
                        title="Skill Marketplace"
                        description="Exchange skills with peers"
                    />

                    {/* Career Twin */}
                    <ActionCard
                        href="/dashboard/career-twin"
                        icon={<Sparkles className="w-8 h-8 text-[#00D9FF]" />}
                        title="Career Twin"
                        description="AI career companion"
                    />

                    {/* View All */}
                    <ActionCard
                        href="/dashboard"
                        icon={<Trophy className="w-8 h-8 text-[#00D9FF]" />}
                        title="View All"
                        description="Explore more features"
                    />
                </div>
            </div>

            {/* Career Progress Dashboard */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Crown className="w-5 h-5 text-[#00D9FF]" />
                    <h2 className="text-2xl font-bold text-white">Career Progress Dashboard</h2>
                </div>

                {isGamificationLoading && !gamificationProfile ? (
                    <div className="rounded-xl bg-[#111111] border border-gray-800 p-6 text-gray-400">Loading progress dashboard...</div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-5">
                                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Career Level</p>
                                <p className="text-3xl font-bold text-white">L{gamificationProfile?.level || 1}</p>
                                <p className="text-sm text-[#00D9FF] mt-1">{gamificationProfile?.levelTitle || 'Beginner'}</p>
                            </div>

                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-5">
                                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Current Streak</p>
                                <p className="text-3xl font-bold text-white flex items-center gap-2">
                                    <Flame className="w-6 h-6 text-orange-400" />
                                    {gamificationProfile?.streakCurrent || 0}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">Longest: {gamificationProfile?.streakLongest || 0} days</p>
                            </div>

                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-5">
                                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Career Credits</p>
                                <p className="text-3xl font-bold text-white flex items-center gap-2">
                                    <Coins className="w-6 h-6 text-yellow-400" />
                                    {gamificationProfile?.credits?.balance || 0}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">Lifetime earned: {gamificationProfile?.credits?.lifetimeEarned || 0}</p>
                            </div>

                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-5">
                                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Badges Earned</p>
                                <p className="text-3xl font-bold text-white flex items-center gap-2">
                                    <Medal className="w-6 h-6 text-emerald-400" />
                                    {gamificationProfile?.badgesEarnedCount || 0}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">Readiness score: {gamificationProfile?.readinessScore || 0}/100</p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">XP Progress</h3>
                                <p className="text-sm text-gray-400">{gamificationProfile?.xpInCurrentLevel || 0}/{gamificationProfile?.xpForNextLevel || 100} XP</p>
                            </div>
                            <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden">
                                <progress
                                    className="w-full h-3 rounded-full overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-[#00D9FF] [&::-moz-progress-bar]:bg-[#00D9FF]"
                                    value={gamificationProfile?.xpProgressPercentage || 0}
                                    max={100}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Total XP: {gamificationProfile?.totalXp || 0}</p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Weekly Quest Tracker</h3>
                                {!gamificationProfile?.currentQuest ? (
                                    <p className="text-sm text-gray-500">No active quest this week.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {gamificationProfile.currentQuest.tasks.map((task) => {
                                            const percentage = Math.min(100, Math.round((task.current / task.target) * 100));
                                            return (
                                                <div key={task.key}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-300">{task.label}</span>
                                                        <span className="text-gray-400">{task.current}/{task.target}</span>
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

                                        <div className="pt-3 border-t border-gray-800">
                                            <p className="text-sm text-gray-300">
                                                Reward: +{gamificationProfile.currentQuest.reward.xp} XP, +{gamificationProfile.currentQuest.reward.credits} credits
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Status: {gamificationProfile.currentQuest.status}</p>
                                            {gamificationProfile.currentQuest.status === 'completed' && (
                                                <button
                                                    onClick={handleClaimQuestReward}
                                                    disabled={isClaimingQuestReward}
                                                    className="mt-3 btn-primary"
                                                >
                                                    {isClaimingQuestReward ? 'Claiming...' : 'Claim Reward'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Earned Badges</h3>
                                {!gamificationProfile?.badges?.length ? (
                                    <p className="text-sm text-gray-500">No badges yet. Complete quests and activities to unlock your first badge.</p>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {gamificationProfile.badges.slice(0, 6).map((badge) => (
                                            <div key={badge._id} className="rounded-lg border border-gray-800 p-3 bg-gray-900/30">
                                                <p className="text-sm font-semibold text-white">{badge.title}</p>
                                                <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                                                <p className="text-[11px] text-gray-500 mt-2">{badge.milestone}</p>
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
        </div>
    );
}

function StatCard({ icon, label, value, subtext = "+0%" }: any) {
    return (
        <div className="group relative overflow-hidden rounded-xl bg-[#111111] border border-gray-800 p-6 hover:border-[#00D9FF]/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-xs text-green-400 font-medium">{subtext}</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );
}

function ActionCard({ href, icon, title, description }: any) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const handleClick = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            router.push('/login');
            return;
        }
        router.push(href);
    };

    return (
        <div 
            onClick={handleClick}
            className="group relative overflow-hidden rounded-xl bg-[#111111] border border-gray-800 p-6 hover:border-[#00D9FF]/50 hover:bg-[#111111] transition-all duration-300 cursor-pointer h-full"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9FF]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#00D9FF]/20 transition-colors">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                <p className="text-sm text-gray-400 mb-4">{description}</p>
                <div className="flex items-center gap-2 text-[#00D9FF] text-sm font-medium">
                    <span>Get started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}
