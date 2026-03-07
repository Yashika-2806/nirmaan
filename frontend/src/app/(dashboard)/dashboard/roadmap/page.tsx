'use client';

import { useState, useEffect } from 'react';
import {
    Map, Target, Calendar, Zap, Loader2, ChevronLeft, Plus, Trash2,
    CheckCircle, Circle, BookOpen, Code, FileText, Layers, Star,
    TrendingUp, Brain, X, ChevronRight, Clock, Award, Lightbulb,
    ExternalLink, BarChart2
} from 'lucide-react';
import { roadmapService, Roadmap } from '@/services/roadmapService';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resourceIcon = (type: string) => {
    switch (type) {
        case 'course': return <Layers className="w-4 h-4 text-purple-400" />;
        case 'book': return <BookOpen className="w-4 h-4 text-blue-400" />;
        case 'project': return <Code className="w-4 h-4 text-green-400" />;
        case 'practice': return <Target className="w-4 h-4 text-yellow-400" />;
        default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
};

const progressColor = (pct: number) =>
    pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-[#00D9FF]' : pct >= 25 ? 'bg-yellow-500' : 'bg-gray-600';

// ─── Skill chip input ─────────────────────────────────────────────────────────
function SkillInput({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
    const [input, setInput] = useState('');
    const add = () => {
        const v = input.trim();
        if (v && !skills.includes(v) && skills.length < 20) {
            onChange([...skills, v]);
            setInput('');
        }
    };
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder="Type a skill and press Enter…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50"
                />
                <button onClick={add} className="px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-white/70 transition-colors">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                        <span key={s} className="flex items-center gap-1.5 bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] text-sm px-3 py-1 rounded-full">
                            {s}
                            <button onClick={() => onChange(skills.filter(x => x !== s))} className="hover:text-white transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Milestone card ───────────────────────────────────────────────────────────
function MilestoneCard({
    milestone, index, total, onToggle, isToggling
}: {
    milestone: Roadmap['milestones'][0]; index: number; total: number;
    onToggle: () => void; isToggling: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`relative flex gap-5 ${index < total - 1 ? 'pb-6' : ''}`}>
            {/* Vertical line */}
            {index < total - 1 && (
                <div className="absolute left-[22px] top-12 bottom-0 w-0.5 bg-white/10" />
            )}

            {/* Step circle */}
            <div className="shrink-0 flex flex-col items-center">
                <button
                    onClick={onToggle}
                    disabled={isToggling}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                        milestone.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-[#0a0a0a] border-white/20 text-white/40 hover:border-[#00D9FF]/60'
                    }`}
                >
                    {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        milestone.completed ? <CheckCircle className="w-5 h-5" /> :
                            <span className="text-sm font-bold">{index + 1}</span>}
                </button>
            </div>

            {/* Card */}
            <div className={`flex-1 rounded-xl border transition-all ${
                milestone.completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="w-full flex items-start justify-between p-5 text-left"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className={`text-[18px] font-bold ${milestone.completed ? 'text-green-400' : 'text-white'}`}>
                                {milestone.title}
                            </h3>
                            {milestone.completed && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Completed</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/40">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{milestone.duration}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{milestone.weeklyHours}h/week</span>
                            <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5" />{milestone.skills.length} skills</span>
                        </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-white/30 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>

                {expanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                        {milestone.description && (
                            <p className="text-[16px] text-white/70 leading-relaxed">{milestone.description}</p>
                        )}

                        {/* Skills */}
                        <div>
                            <p className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {milestone.skills.map((s, i) => (
                                    <span key={i} className="text-sm bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] px-3 py-1 rounded-full">{s}</span>
                                ))}
                            </div>
                        </div>

                        {/* Deliverable */}
                        {milestone.deliverable && (
                            <div className="flex gap-3 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-3">
                                <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-purple-400 mb-0.5">Deliverable</p>
                                    <p className="text-[15px] text-white/80">{milestone.deliverable}</p>
                                </div>
                            </div>
                        )}

                        {/* Resources */}
                        {milestone.resources && milestone.resources.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Resources</p>
                                <div className="space-y-2">
                                    {milestone.resources.map((r, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5">
                                            {resourceIcon(r.type)}
                                            <span className="flex-1 text-[15px] text-white/80">{r.title}</span>
                                            {r.url && (
                                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-[#00D9FF]/60 hover:text-[#00D9FF] transition-colors"
                                                    onClick={e => e.stopPropagation()}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Roadmap Detail View ──────────────────────────────────────────────────────
function RoadmapDetail({
    roadmap, onBack, onUpdate, onDelete
}: {
    roadmap: Roadmap; onBack: () => void;
    onUpdate: (r: Roadmap) => void; onDelete: (id: string) => void;
}) {
    const [togglingIndex, setTogglingIndex] = useState<number | null>(null);
    const completed = roadmap.milestones.filter(m => m.completed).length;
    const total = roadmap.milestones.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const handleToggle = async (index: number) => {
        setTogglingIndex(index);
        try {
            const updated = await roadmapService.toggleMilestone(roadmap._id, index);
            onUpdate(updated);
            toast.success(updated.milestones[index].completed ? '✅ Milestone completed!' : 'Milestone unmarked');
        } catch { toast.error('Failed to update milestone'); }
        finally { setTogglingIndex(null); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this roadmap?')) return;
        try {
            await roadmapService.delete(roadmap._id);
            toast.success('Roadmap deleted');
            onDelete(roadmap._id);
        } catch { toast.error('Delete failed'); }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Top bar */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white truncate">{roadmap.title}</h1>
                    <p className="text-base text-white/50">{roadmap.currentRole} → {roadmap.targetGoal}</p>
                </div>
                <button onClick={handleDelete} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: milestones */}
                <div className="lg:col-span-2 space-y-4">
                    {roadmap.summary && (
                        <div className="rounded-xl bg-white/5 border border-white/10 px-6 py-4">
                            <p className="text-[17px] text-white/75 leading-relaxed">{roadmap.summary}</p>
                        </div>
                    )}

                    <div className="rounded-xl bg-white/5 border border-white/10 p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Milestones</h2>
                        <div>
                            {roadmap.milestones.map((m, i) => (
                                <MilestoneCard
                                    key={i} milestone={m} index={i} total={roadmap.milestones.length}
                                    onToggle={() => handleToggle(i)}
                                    isToggling={togglingIndex === i}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: stats sidebar */}
                <div className="space-y-5">
                    {/* Progress */}
                    <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
                        <h3 className="text-lg font-bold text-white">Progress</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-5xl font-bold text-white">{pct}%</span>
                            <span className="text-white/40 text-base mb-1">{completed}/{total} done</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                            <div className={`h-3 rounded-full transition-all ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-xl font-bold text-white">{roadmap.timelineMonths}m</div>
                                <div className="text-xs text-white/40">Timeline</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-xl font-bold text-white">{total}</div>
                                <div className="text-xs text-white/40">Milestones</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                                <div className="text-xl font-bold text-white">{roadmap.totalSkills.length}</div>
                                <div className="text-xs text-white/40">Skills</div>
                            </div>
                        </div>
                    </div>

                    {/* Key Insights */}
                    {roadmap.keyInsights && roadmap.keyInsights.length > 0 && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-400" /> Key Insights
                            </h3>
                            <ul className="space-y-2.5">
                                {roadmap.keyInsights.map((tip, i) => (
                                    <li key={i} className="flex gap-2.5 text-[15px] text-white/70 leading-relaxed">
                                        <Star className="w-4 h-4 text-yellow-400/60 shrink-0 mt-0.5" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Total Skills */}
                    {roadmap.totalSkills && roadmap.totalSkills.length > 0 && (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Brain className="w-5 h-5 text-[#00D9FF]" /> All Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {roadmap.totalSkills.map((s, i) => (
                                    <span key={i} className="text-sm bg-white/5 border border-white/10 text-white/60 px-3 py-1 rounded-full">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Phase = 'hub' | 'setup' | 'generating' | 'detail';

export default function RoadmapPage() {
    const [phase, setPhase] = useState<Phase>('hub');
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [currentRole, setCurrentRole] = useState('');
    const [targetGoal, setTargetGoal] = useState('');
    const [timelineMonths, setTimelineMonths] = useState<number>(6);
    const [currentSkills, setCurrentSkills] = useState<string[]>([]);
    const [experienceNotes, setExperienceNotes] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadRoadmaps();
    }, []);

    const loadRoadmaps = async () => {
        setLoading(true);
        try {
            const data = await roadmapService.getAll();
            setRoadmaps(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!currentRole.trim() || !targetGoal.trim()) {
            toast.error('Please fill in current role and target goal');
            return;
        }
        setGenerating(true);
        setPhase('generating');
        try {
            const roadmap = await roadmapService.generate({
                currentRole, targetGoal, timelineMonths, currentSkills, experienceNotes
            });
            setRoadmaps(prev => [roadmap, ...prev]);
            setActiveRoadmap(roadmap);
            setPhase('detail');
            toast.success('Roadmap generated!');
            // Reset form
            setCurrentRole(''); setTargetGoal(''); setCurrentSkills([]); setExperienceNotes('');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to generate roadmap');
            setPhase('setup');
        } finally { setGenerating(false); }
    };

    const handleUpdateRoadmap = (updated: Roadmap) => {
        setRoadmaps(prev => prev.map(r => r._id === updated._id ? updated : r));
        setActiveRoadmap(updated);
    };

    const handleDeleteRoadmap = (id: string) => {
        setRoadmaps(prev => prev.filter(r => r._id !== id));
        setPhase('hub');
        setActiveRoadmap(null);
    };

    const openRoadmap = async (r: Roadmap) => {
        try {
            const fresh = await roadmapService.getOne(r._id);
            setActiveRoadmap(fresh);
        } catch { setActiveRoadmap(r); }
        setPhase('detail');
    };

    return (
        <div className="text-white flex flex-col gap-6 min-h-[calc(100vh-6rem)]">

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {(phase === 'setup' || phase === 'detail') && (
                        <button onClick={() => { setPhase('hub'); setActiveRoadmap(null); }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Map className="w-6 h-6 text-[#00D9FF]" /> Career Roadmap
                        </h1>
                        <p className="text-sm text-white/40">AI-powered personalised learning paths</p>
                    </div>
                </div>
                {phase === 'hub' && (
                    <button onClick={() => setPhase('setup')}
                        className="flex items-center gap-2 bg-[#00D9FF] text-black px-5 py-2.5 rounded-xl font-bold text-base hover:bg-[#00b8d9] transition-colors">
                        <Plus className="w-5 h-5" /> New Roadmap
                    </button>
                )}
            </div>

            {/* ── Hub ── */}
            {phase === 'hub' && (
                <div className="flex flex-col gap-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-[#00D9FF]" />
                        </div>
                    ) : roadmaps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                            <div className="p-6 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                                <Map className="w-12 h-12 text-[#00D9FF]" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">No roadmaps yet</h2>
                                <p className="text-white/50 text-lg">Generate your first AI career roadmap to get started</p>
                            </div>
                            <button onClick={() => setPhase('setup')}
                                className="flex items-center gap-2 bg-[#00D9FF] text-black px-6 py-3 rounded-xl font-bold text-lg hover:bg-[#00b8d9] transition-colors">
                                <Zap className="w-5 h-5" /> Generate Your Roadmap
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {roadmaps.map(r => {
                                const done = r.milestones.filter(m => m.completed).length;
                                const total = r.milestones.length;
                                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                return (
                                    <button key={r._id} onClick={() => openRoadmap(r)}
                                        className="text-left rounded-xl bg-white/5 border border-white/10 p-5 hover:border-[#00D9FF]/30 hover:bg-white/10 transition-all group space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="p-2.5 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                                                <Map className="w-5 h-5 text-[#00D9FF]" />
                                            </div>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-[#00D9FF]/10 text-[#00D9FF]'}`}>
                                                {r.status === 'completed' ? 'Completed' : 'Active'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-[17px] font-bold text-white group-hover:text-[#00D9FF] transition-colors mb-1 line-clamp-2">{r.title}</h3>
                                            <p className="text-sm text-white/50">{r.currentRole} → {r.targetGoal}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-white/40">
                                                <span>{done}/{total} milestones</span>
                                                <span className="font-semibold text-white/60">{pct}%</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/30">
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.timelineMonths}m</span>
                                            <span className="flex items-center gap-1"><Brain className="w-3.5 h-3.5" />{r.totalSkills?.length ?? 0} skills</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Setup Form ── */}
            {phase === 'setup' && (
                <div className="max-w-3xl mx-auto w-full">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-[#00D9FF] mb-4">
                                <Zap className="w-6 h-6" />
                                <span className="text-xl font-bold">Generate AI Roadmap</span>
                            </div>
                            <p className="text-white/50 text-base">Tell us where you are and where you want to go</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-base font-semibold text-white/80">Current Role <span className="text-red-400">*</span></label>
                                <input value={currentRole} onChange={e => setCurrentRole(e.target.value)}
                                    placeholder="e.g., Junior Developer, Student, Career Switcher"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-base font-semibold text-white/80">Target Goal <span className="text-red-400">*</span></label>
                                <input value={targetGoal} onChange={e => setTargetGoal(e.target.value)}
                                    placeholder="e.g., Senior SWE at FAANG, ML Engineer, CTO"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-base font-semibold text-white/80">Timeline</label>
                            <div className="grid grid-cols-4 gap-3">
                                {[3, 6, 12, 24].map(m => (
                                    <button key={m} onClick={() => setTimelineMonths(m)}
                                        className={`py-3 rounded-xl text-base font-semibold border transition-all ${
                                            timelineMonths === m
                                                ? 'bg-[#00D9FF]/20 border-[#00D9FF]/50 text-[#00D9FF]'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                                        }`}>
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-base font-semibold text-white/80">Current Skills <span className="text-white/40 font-normal">(optional)</span></label>
                            <SkillInput skills={currentSkills} onChange={setCurrentSkills} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-base font-semibold text-white/80">Experience Notes <span className="text-white/40 font-normal">(optional)</span></label>
                            <textarea value={experienceNotes} onChange={e => setExperienceNotes(e.target.value)}
                                placeholder="Any other context — background, constraints, specific areas to focus on..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50 resize-none" />
                        </div>

                        <button onClick={handleGenerate} disabled={generating || !currentRole.trim() || !targetGoal.trim()}
                            className="w-full flex items-center justify-center gap-3 bg-[#00D9FF] text-black py-4 rounded-xl font-bold text-xl hover:bg-[#00b8d9] disabled:opacity-50 transition-colors">
                            <Zap className="w-6 h-6" />
                            Generate My Roadmap
                        </button>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {[
                            { icon: <Target className="w-6 h-6 text-[#00D9FF]" />, title: 'Personalised', desc: 'Tailored to your exact background and goals' },
                            { icon: <TrendingUp className="w-6 h-6 text-green-400" />, title: 'Step-by-step', desc: 'Concrete milestones with deliverables' },
                            { icon: <Brain className="w-6 h-6 text-purple-400" />, title: 'AI-Powered', desc: 'Industry-current, market-relevant skills' },
                        ].map(card => (
                            <div key={card.title} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center space-y-2">
                                <div className="flex justify-center">{card.icon}</div>
                                <p className="text-base font-semibold text-white">{card.title}</p>
                                <p className="text-sm text-white/50">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Generating ── */}
            {phase === 'generating' && (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-[#00D9FF]/20 border-t-[#00D9FF] animate-spin" />
                        <Brain className="w-8 h-8 text-[#00D9FF] absolute inset-0 m-auto" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">Crafting your roadmap…</h2>
                        <p className="text-white/50 text-lg">AI is generating a personalised {timelineMonths}-month plan for you</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/30">
                        <BarChart2 className="w-4 h-4" /> Analysing role requirements, tech stack trends and learning paths
                    </div>
                </div>
            )}

            {/* ── Detail ── */}
            {phase === 'detail' && activeRoadmap && (
                <RoadmapDetail
                    roadmap={activeRoadmap}
                    onBack={() => { setPhase('hub'); setActiveRoadmap(null); }}
                    onUpdate={handleUpdateRoadmap}
                    onDelete={handleDeleteRoadmap}
                />
            )}
        </div>
    );
}
