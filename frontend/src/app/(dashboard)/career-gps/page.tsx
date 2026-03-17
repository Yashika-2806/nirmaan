'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Navigation, Target, TrendingUp, CheckCircle2, Trophy, CalendarClock, Sparkles } from 'lucide-react';
import {
    CareerGoalOption,
    CareerRoadmapTask,
    CareerMissionData,
    CareerProbabilityData,
    SkillGapItem,
    careerGpsService,
} from '@/services/careerGpsService';

const GOALS: CareerGoalOption[] = [
    'Software Engineer',
    'Data Scientist',
    'Product Manager',
    'MBA Consultant',
    'Investment Analyst',
    'Marketing Manager',
    'Startup Founder',
];

export default function CareerGPSPage() {
    const { user, isAuthenticated } = useAuthStore();

    const [goal, setGoal] = useState<CareerGoalOption>('Software Engineer');
    const [goalNotes, setGoalNotes] = useState('');
    const [isSettingGoal, setIsSettingGoal] = useState(false);

    const [roadmap, setRoadmap] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);
    const [missions, setMissions] = useState<CareerMissionData | null>(null);
    const [probability, setProbability] = useState<CareerProbabilityData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const hasData = Boolean(roadmap);

    const loadDashboard = async () => {
        if (!user?._id) return;

        setIsLoading(true);
        try {
            const [roadmapData, probabilityData, missionsData] = await Promise.all([
                careerGpsService.getRoadmap(user._id),
                careerGpsService.getProbability(user._id),
                careerGpsService.getMissions(user._id),
            ]);

            setRoadmap(roadmapData.roadmap);
            setProgress(roadmapData.progress);
            setProbability(probabilityData.probability);
            setMissions(missionsData);
            setGoal(roadmapData.roadmap.targetRole);
        } catch (error: any) {
            const message = error?.response?.data?.message || '';
            if (!message.includes('Set a goal') && !message.includes('set a career goal')) {
                toast.error(message || 'Failed to load Career GPS dashboard');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?._id) {
            loadDashboard();
        }
    }, [isAuthenticated, user?._id]);

    const setCareerGoal = async () => {
        setIsSettingGoal(true);
        try {
            await careerGpsService.setGoal(goal, goalNotes);
            toast.success('Career goal saved and roadmap generated');
            await loadDashboard();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to set goal');
        } finally {
            setIsSettingGoal(false);
        }
    };

    const updateTask = async (task: CareerRoadmapTask) => {
        if (!roadmap?._id) return;

        try {
            await careerGpsService.updateProgress({
                roadmapId: roadmap._id,
                taskId: task._id,
                incrementBy: 1,
                markCompleted: task.currentCount + 1 >= task.targetCount,
            });
            await loadDashboard();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Task update failed');
        }
    };

    const updateMission = async (missionId: string) => {
        if (!roadmap?._id) return;
        try {
            await careerGpsService.updateProgress({
                roadmapId: roadmap._id,
                missionId,
                incrementBy: 1,
                markCompleted: true,
            });
            await loadDashboard();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Mission update failed');
        }
    };

    const groupedTasks = useMemo(() => {
        const grouped: Record<number, CareerRoadmapTask[]> = {};
        if (!roadmap?.tasks) return grouped;

        roadmap.tasks.forEach((task: CareerRoadmapTask) => {
            if (!grouped[task.weekNumber]) grouped[task.weekNumber] = [];
            grouped[task.weekNumber].push(task);
        });

        return grouped;
    }, [roadmap?.tasks]);

    if (!isAuthenticated) {
        return <div className="card text-gray-300">Please sign in to use Career GPS.</div>;
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-[#00D9FF]/30 bg-gradient-to-br from-[#0f172a] via-[#121826] to-[#090d16] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Navigation className="w-8 h-8 text-[#00D9FF]" />
                            Career GPS
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Navigation system for your target role powered by Career Twin signals.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-[#00D9FF]/40 bg-[#00D9FF]/10 text-[#7ce8ff]">
                        <Sparkles className="w-3 h-3" />
                        Live Adaptive Roadmap
                    </div>
                </div>
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-1">
                    <h2 className="text-lg font-semibold text-white mb-3">Goal Selection</h2>
                    <select
                        className="input"
                        title="Select your career target role"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value as CareerGoalOption)}
                    >
                        {GOALS.map((goalItem) => (
                            <option key={goalItem} value={goalItem}>{goalItem}</option>
                        ))}
                    </select>
                    <textarea
                        className="input mt-3 min-h-[100px]"
                        placeholder="Optional notes about your preferred domain, timeline, and constraints"
                        value={goalNotes}
                        onChange={(e) => setGoalNotes(e.target.value)}
                    />
                    <button
                        onClick={setCareerGoal}
                        disabled={isSettingGoal}
                        className="btn-primary w-full mt-3"
                    >
                        {isSettingGoal ? 'Generating...' : 'Set Goal and Build GPS'}
                    </button>
                </div>

                <div className="card lg:col-span-2">
                    <h2 className="text-lg font-semibold text-white mb-4">Career Readiness Score</h2>
                    {!hasData && !isLoading && <p className="text-gray-400">Set a goal to generate your first roadmap.</p>}
                    {isLoading && <p className="text-gray-400">Loading readiness data...</p>}
                    {hasData && (
                        <div>
                            <div className="flex items-end gap-3">
                                <p className="text-5xl font-extrabold text-[#00D9FF]">{roadmap.careerReadinessScore}</p>
                                <p className="text-gray-400 mb-1">/100</p>
                            </div>
                            <div className="mt-3 h-3 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
                                <progress
                                    className="w-full h-3 rounded-full overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-cyan-500 [&::-webkit-progress-value]:to-sky-300 [&::-moz-progress-bar]:bg-cyan-400"
                                    value={roadmap.careerReadinessScore}
                                    max={100}
                                />
                            </div>
                            <div className="mt-3 grid md:grid-cols-3 gap-3">
                                <MiniStat label="Progress" value={`${progress?.progressPercent || 0}%`} icon={<TrendingUp className="w-4 h-4" />} />
                                <MiniStat label="Completed Tasks" value={`${progress?.completedTasks || 0}/${progress?.totalTasks || 0}`} icon={<CheckCircle2 className="w-4 h-4" />} />
                                <MiniStat label="XP Earned" value={`${progress?.totalXpEarned || 0}`} icon={<Trophy className="w-4 h-4" />} />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {hasData && (
                <>
                    <section className="grid lg:grid-cols-2 gap-4">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-white mb-4">Skill Gap Analysis</h2>
                            <div className="space-y-4">
                                {(roadmap.gapAnalysis as SkillGapItem[]).map((item) => (
                                    <div key={item.skill}>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-200">{item.skill}</span>
                                            <span className="text-amber-300">Gap {item.gap}%</span>
                                        </div>
                                        <div className="mt-1 h-2 rounded bg-gray-800 overflow-hidden">
                                            <progress
                                                className="w-full h-2 rounded overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-cyan-500 [&::-moz-progress-bar]:bg-cyan-500"
                                                value={item.current}
                                                max={100}
                                            />
                                        </div>
                                        <div className="mt-1 h-2 rounded bg-gray-800 overflow-hidden">
                                            <progress
                                                className="w-full h-2 rounded overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500"
                                                value={item.required}
                                                max={100}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Current {item.current}%</span>
                                            <span>Required {item.required}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h2 className="text-lg font-semibold text-white mb-4">Placement Probability</h2>
                            {!probability && <p className="text-gray-400">Probability will appear after roadmap generation.</p>}
                            {probability && (
                                <div className="space-y-4">
                                    <ProbabilityBar label="Startup Company" value={probability.startupCompany} color="from-emerald-500 to-lime-300" />
                                    <ProbabilityBar label="Mid-size Tech Company" value={probability.midSizeTechCompany} color="from-cyan-500 to-sky-300" />
                                    <ProbabilityBar label="Top Tech Company" value={probability.topTechCompany} color="from-indigo-500 to-violet-300" />
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="card">
                        <h2 className="text-lg font-semibold text-white mb-4">Career Roadmap Timeline</h2>
                        <div className="grid lg:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3">Stages</h3>
                                <div className="space-y-3">
                                    {roadmap.timelineStages.map((stage: any) => (
                                        <div key={stage.key} className={`p-3 rounded-lg border ${stage.completed ? 'border-emerald-500/40 bg-emerald-500/10' : stage.unlocked ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-gray-700 bg-gray-900/40'}`}>
                                            <p className="font-semibold text-white">{stage.title}</p>
                                            <p className="text-sm text-gray-400">{stage.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3">Weekly Tasks</h3>
                                <div className="max-h-[420px] overflow-auto space-y-3 pr-1">
                                    {Object.keys(groupedTasks).sort((a, b) => Number(a) - Number(b)).map((week) => (
                                        <div key={week} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                            <p className="text-sm text-cyan-300 mb-2">Week {week}</p>
                                            <div className="space-y-2">
                                                {groupedTasks[Number(week)].map((task) => (
                                                    <button
                                                        key={task._id}
                                                        onClick={() => updateTask(task)}
                                                        className={`w-full text-left p-2 rounded border ${task.completed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-gray-700 hover:border-cyan-500/50'}`}
                                                    >
                                                        <p className="text-sm text-white">{task.title}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{task.currentCount}/{task.targetCount} complete • +{task.xpReward} XP</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid lg:grid-cols-2 gap-4">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-white mb-4">Career Missions (Daily)</h2>
                            <div className="space-y-3">
                                {missions?.items?.map((mission) => (
                                    <button
                                        key={mission._id}
                                        onClick={() => updateMission(mission._id)}
                                        className={`w-full text-left p-3 rounded-lg border ${mission.completed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-gray-700 hover:border-cyan-500/50'}`}
                                    >
                                        <p className="text-white font-medium">{mission.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {mission.currentCount}/{mission.targetCount} • +{mission.xpReward} XP • +{mission.readinessImpact} readiness impact
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h2 className="text-lg font-semibold text-white mb-4">Progress Tracker</h2>
                            <div className="space-y-4">
                                <Tracker label="Roadmap Completion" value={progress?.progressPercent || 0} />
                                <Tracker label="Task Completion" value={Math.round(((progress?.completedTasks || 0) / Math.max(1, progress?.totalTasks || 1)) * 100)} />
                                <Tracker label="Mission Completion" value={missions?.items?.length ? Math.round((missions.items.filter((m) => m.completed).length / missions.items.length) * 100) : 0} />
                            </div>
                            <div className="mt-4 p-3 rounded-lg border border-[#00D9FF]/30 bg-[#00D9FF]/10 text-sm text-[#8defff] flex items-center gap-2">
                                <CalendarClock className="w-4 h-4" />
                                Metrics update continuously through Career Twin signals.
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
            <div className="flex items-center justify-between text-gray-400 text-xs uppercase tracking-wide">
                <span>{label}</span>
                <span>{icon}</span>
            </div>
            <p className="text-xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-200">{label}</span>
                <span className="text-white font-semibold">{value}%</span>
            </div>
            <div className="h-3 rounded bg-gray-800 overflow-hidden border border-gray-700">
                <progress
                    className={`w-full h-3 rounded overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-gradient-to-r ${color} [&::-moz-progress-bar]:bg-cyan-400`}
                    value={value}
                    max={100}
                />
            </div>
        </div>
    );
}

function Tracker({ label, value }: { label: string; value: number }) {
    const safeValue = Math.max(0, Math.min(100, value));

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-200">{label}</span>
                <span className="text-cyan-300">{safeValue}%</span>
            </div>
            <div className="h-2 rounded bg-gray-800 overflow-hidden">
                <progress
                    className="w-full h-2 rounded overflow-hidden [appearance:none] [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-cyan-500 [&::-webkit-progress-value]:to-sky-300 [&::-moz-progress-bar]:bg-cyan-400"
                    value={safeValue}
                    max={100}
                />
            </div>
        </div>
    );
}
