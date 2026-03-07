'use client';

import { useState, useEffect, useRef } from 'react';
import { interviewService } from '@/services/interviewService';
import toast from 'react-hot-toast';
import {
    MessageSquare, Play, Award, Building2, ChevronRight, ChevronLeft,
    Loader2, CheckCircle, Clock, BarChart2, Trash2, X, Lightbulb,
    ThumbsUp, AlertCircle, Target, Zap, History, Plus, StopCircle,
    SkipForward, TrendingUp, Brain, Code, Users, Layers, Star,
    ShieldAlert, Shield
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EvaluatedQuestion {
    id: string;
    question: string;
    hint?: string;
    difficulty?: string;
    category?: string;
    answer?: string;
    score?: number;
    verdict?: string;
    strengths?: string[];
    improvements?: string[];
    idealAnswer?: string;
    followUpQuestion?: string;
    tip?: string;
    answeredAt?: string;
}

interface Session {
    _id: string;
    company: string;
    role: string;
    round: string;
    experienceLevel: string;
    status: 'in-progress' | 'completed' | 'abandoned';
    overallScore?: number;
    questions: EvaluatedQuestion[];
    durationSeconds?: number;
    createdAt: string;
}

type Phase = 'hub' | 'setup' | 'session' | 'results';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROUND_OPTIONS = [
    { value: 'technical', label: 'Technical', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { value: 'behavioral', label: 'Behavioral', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
    { value: 'system-design', label: 'System Design', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { value: 'hr', label: 'HR Round', icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
];

const EXPERIENCE_LEVELS = [
    { value: 'fresher', label: 'Fresher', desc: '0–1 yr' },
    { value: 'mid', label: 'Mid-Level', desc: '2–5 yr' },
    { value: 'senior', label: 'Senior', desc: '6+ yr' },
];

const POPULAR_COMPANIES = [
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix',
    'Uber', 'Flipkart', 'Infosys', 'TCS', 'Walmart', 'Goldman Sachs',
];

function verdictColor(verdict?: string) {
    if (!verdict) return 'text-gray-400';
    const v = verdict.toLowerCase();
    if (v.includes('excellent') || v.includes('strong')) return 'text-green-400';
    if (v.includes('good')) return 'text-cyan-400';
    if (v.includes('average') || v.includes('partial')) return 'text-yellow-400';
    return 'text-red-400';
}

function scoreColor(score?: number) {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
}

function scoreBarColor(score?: number) {
    if (!score) return 'bg-gray-600';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
}

// ─── Feedback Panel ────────────────────────────────────────────────────────────
function FeedbackPanel({ q, plagiarismFlag }: { q: EvaluatedQuestion; plagiarismFlag?: boolean }) {
    return (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-7 space-y-6">
            {/* Score header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold text-white/50 uppercase tracking-widest">AI Evaluation</span>
                    {plagiarismFlag && (
                        <span className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-base font-bold px-3 py-1 rounded-full">
                            <ShieldAlert className="w-4 h-4" /> Paste detected
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-5xl font-bold ${scoreColor(q.score)}`}>{q.score ?? '--'}</span>
                    <span className="text-white/40 text-xl">/100</span>
                    {q.verdict && <span className={`ml-2 text-xl font-bold ${verdictColor(q.verdict)}`}>{q.verdict}</span>}
                </div>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${scoreBarColor(q.score)}`} style={{ width: `${q.score ?? 0}%` }} />
            </div>

            {q.strengths && q.strengths.length > 0 && (
                <div>
                    <p className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2"><ThumbsUp className="w-5 h-5" /> Strengths</p>
                    <ul className="space-y-2">
                        {q.strengths.map((s, i) => <li key={i} className="text-[20px] leading-relaxed text-white/80 pl-4 border-l-2 border-green-500/40">{s}</li>)}
                    </ul>
                </div>
            )}

            {q.improvements && q.improvements.length > 0 && (
                <div>
                    <p className="text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Improvements</p>
                    <ul className="space-y-2">
                        {q.improvements.map((s, i) => <li key={i} className="text-[20px] leading-relaxed text-white/80 pl-4 border-l-2 border-yellow-500/40">{s}</li>)}
                    </ul>
                </div>
            )}

            {q.idealAnswer && (
                <details className="group">
                    <summary className="cursor-pointer text-xl font-bold text-cyan-400 flex items-center gap-2 select-none">
                        <Star className="w-5 h-5" /> Ideal Answer <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="mt-3 text-[20px] leading-relaxed text-white/70 whitespace-pre-wrap">{q.idealAnswer}</p>
                </details>
            )}

            {q.followUpQuestion && (
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-5 py-4">
                    <p className="text-xl font-bold text-cyan-400 mb-2">Follow-up Question</p>
                    <p className="text-[20px] leading-relaxed text-white/85">{q.followUpQuestion}</p>
                </div>
            )}

            {q.tip && (
                <div className="flex gap-3 text-[20px] text-white/70 bg-white/5 rounded-lg px-5 py-4 leading-relaxed">
                    <Lightbulb className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
                    <span>{q.tip}</span>
                </div>
            )}
        </div>
    );
}

// ─── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({ session, onNewSession }: { session: Session; onNewSession: () => void }) {
    const answered = session.questions.filter(q => q.score != null);
    const avg = answered.length ? Math.round(answered.reduce((s, q) => s + (q.score ?? 0), 0) / answered.length) : 0;
    const strong = answered.filter(q => (q.score ?? 0) >= 80).length;
    const good = answered.filter(q => (q.score ?? 0) >= 60 && (q.score ?? 0) < 80).length;
    const weak = answered.filter(q => (q.score ?? 0) < 60).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Session Results</h2>
                    <p className="text-white/50 text-sm mt-1">{session.company} · {session.role} · {session.round}</p>
                </div>
                <button onClick={onNewSession} className="flex items-center gap-2 bg-[#00D9FF] text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00b8d9] transition-colors">
                    <Plus className="w-4 h-4" /> New Session
                </button>
            </div>

            {/* Score hero */}
            <div className="rounded-2xl bg-gradient-to-br from-[#00D9FF]/10 to-purple-500/10 border border-white/10 p-8 flex flex-col items-center gap-2">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={avg >= 80 ? '#22c55e' : avg >= 60 ? '#eab308' : '#ef4444'} strokeWidth="8"
                            strokeDasharray={`${264 * avg / 100} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${scoreColor(avg)}`}>{avg}</span>
                        <span className="text-white/40 text-xs">/ 100</span>
                    </div>
                </div>
                <p className="text-white/60 text-sm">Overall Score</p>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Answered', val: answered.length, color: 'text-white' },
                    { label: 'Strong (≥80)', val: strong, color: 'text-green-400' },
                    { label: 'Good (60–79)', val: good, color: 'text-yellow-400' },
                    { label: 'Needs Work', val: weak, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-white/40 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Per-question breakdown */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 bg-white/5">
                    <p className="text-sm font-semibold text-white/70">Question Breakdown</p>
                </div>
                <div className="divide-y divide-white/5">
                    {session.questions.map((q, i) => (
                        <div key={i} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/80 line-clamp-2">{q.question}</p>
                                    {q.answer && <p className="text-xs text-white/40 mt-1 line-clamp-1">Your answer: {q.answer}</p>}
                                </div>
                                <div className="shrink-0 text-right">
                                    {q.score != null ? (
                                        <>
                                            <span className={`text-sm font-bold ${scoreColor(q.score)}`}>{q.score}/100</span>
                                            {q.verdict && <p className={`text-xs ${verdictColor(q.verdict)}`}>{q.verdict}</p>}
                                        </>
                                    ) : <span className="text-xs text-white/30">Skipped</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ sessions, onDelete, onNewSession, loading }: {
    sessions: Session[];
    onDelete: (id: string) => void;
    onNewSession: () => void;
    loading: boolean;
}) {
    if (loading) return (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00D9FF] animate-spin" /></div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Past Sessions</h2>
                <button onClick={onNewSession} className="flex items-center gap-2 bg-[#00D9FF] text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00b8d9] transition-colors">
                    <Plus className="w-4 h-4" /> New Session
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No sessions yet. Start practicing!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.map(s => (
                        <div key={s._id} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/8 transition-colors group">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="w-4 h-4 text-[#00D9FF]" />
                                        <span className="font-semibold text-white truncate">{s.company}</span>
                                    </div>
                                    <p className="text-sm text-white/50">{s.role}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{s.round}</span>
                                        <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{s.experienceLevel}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    {s.overallScore != null && (
                                        <span className={`text-xl font-bold ${scoreColor(s.overallScore)}`}>{s.overallScore}</span>
                                    )}
                                    <p className="text-xs text-white/30 mt-1">{new Date(s.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {s.overallScore != null && (
                                <div className="mt-3 w-full bg-white/10 rounded-full h-1">
                                    <div className={`h-1 rounded-full ${scoreBarColor(s.overallScore)}`} style={{ width: `${s.overallScore}%` }} />
                                </div>
                            )}
                            <button
                                onClick={() => onDelete(s._id)}
                                className="mt-3 flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InterviewPage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState<Phase>('hub');
    const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');

    // Setup
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [round, setRound] = useState('technical');
    const [experienceLevel, setExperienceLevel] = useState('mid');
    const [questionCount, setQuestionCount] = useState(5);

    // Session
    const [session, setSession] = useState<Session | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [sessionLoading, setSessionLoading] = useState(false);

    // Plagiarism tracking per question index
    const [pastedQuestions, setPastedQuestions] = useState<Set<number>>(new Set());
    const [typedCharsMap, setTypedCharsMap] = useState<Record<number, number>>({});
    const currentTypedChars = typedCharsMap[currentIndex] ?? 0;

    // AI plagiarism detection
    const [plagiarizedQuestions, setPlagiarizedQuestions] = useState<Set<number>>(new Set());
    const [plagiarismReasons, setPlagiarismReasons] = useState<Record<number, string>>({});
    const [plagiarismChecking, setPlagiarismChecking] = useState(false);
    const plagiarismDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // History
    const [sessions, setSessions] = useState<Session[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Timer
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'session') {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await interviewService.getSessions();
            // controller returns array directly via ApiResponse.success(res, sessions)
            setSessions(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
        finally { setHistoryLoading(false); }
    };

    useEffect(() => { loadHistory(); }, []);

    // Debounced AI plagiarism check whenever answer changes
    useEffect(() => {
        if (plagiarismDebounceRef.current) clearTimeout(plagiarismDebounceRef.current);
        // Skip if already pasted, already flagged, or answer too short
        if (pastedQuestions.has(currentIndex)) return;
        if (plagiarizedQuestions.has(currentIndex)) return;
        if (currentAnswer.trim().length < 60) return;
        if (!currentQ?.question) return;
        plagiarismDebounceRef.current = setTimeout(async () => {
            setPlagiarismChecking(true);
            try {
                const result = await interviewService.checkPlagiarism({
                    question: currentQ.question,
                    answer: currentAnswer,
                });
                if (result.isPlagiarized && (result.confidence === 'medium' || result.confidence === 'high')) {
                    setPlagiarizedQuestions(prev => new Set([...prev, currentIndex]));
                    setPlagiarismReasons(prev => ({ ...prev, [currentIndex]: result.reason }));
                }
            } catch { /* silent — don't break UX */ }
            finally { setPlagiarismChecking(false); }
        }, 1500);
        return () => { if (plagiarismDebounceRef.current) clearTimeout(plagiarismDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAnswer, currentIndex]);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const currentQ = session?.questions[currentIndex];
    const answeredCount = session?.questions.filter(q => q.score != null).length ?? 0;
    const avgScore = answeredCount
        ? Math.round((session?.questions ?? []).reduce((s, q) => s + (q.score ?? 0), 0) / answeredCount)
        : 0;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleStart = async () => {
        if (!company.trim() || !role.trim()) { toast.error('Enter company and role'); return; }
        setSessionLoading(true);
        try {
            // startSession controller returns session directly via ApiResponse.created(res, session)
            const sessionData = await interviewService.startSession({ company, role, round, experienceLevel, count: Math.floor(questionCount) });
            setSession(sessionData);
            setCurrentIndex(0);
            setCurrentAnswer('');
            setElapsed(0);
            setPhase('session');
        } catch (e: any) {
            const msg = e.response?.data?.message || 'Failed to start session';
            const details: any[] = e.response?.data?.errors || [];
            toast.error(details.length ? `${msg}: ${details.map((d: any) => d.message).join(', ')}` : msg);
        } finally { setSessionLoading(false); }
    };

    const handleEvaluate = async () => {
        if (!currentAnswer.trim() || currentAnswer.trim().length < 5) { toast.error('Answer is too short'); return; }
        if (!session || !currentQ) return;
        setEvaluating(true);
        try {
            // evaluateAnswer controller returns { evaluation, session }
            const data = await interviewService.evaluateAnswer({ sessionId: session._id, questionIndex: currentIndex, answer: currentAnswer });
            setSession(data.session);
            setCurrentAnswer('');
            setShowHint(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Evaluation failed');
        } finally { setEvaluating(false); }
    };

    const handleEndSession = async () => {
        if (!session) return;
        try {
            await interviewService.completeSession({ sessionId: session._id, durationSeconds: elapsed });
            // getSession controller returns session directly via ApiResponse.success(res, session)
            const refreshed = await interviewService.getSession(session._id);
            setSession(refreshed);
        } catch { /* use local */ }
        await loadHistory();
        setPhase('results');
    };

    const handleDeleteSession = async (id: string) => {
        try {
            await interviewService.deleteSession(id);
            setSessions(prev => prev.filter(s => s._id !== id));
            toast.success('Session deleted');
        } catch { toast.error('Delete failed'); }
    };

    const backToHub = () => {
        setPhase('hub'); setSession(null); setCurrentIndex(0); setCurrentAnswer('');
        setElapsed(0); setPastedQuestions(new Set()); setTypedCharsMap({});
        setPlagiarizedQuestions(new Set()); setPlagiarismReasons({});
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="text-white flex flex-col gap-6 min-h-[calc(100vh-6rem)]">

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {phase !== 'hub' && (
                        <button onClick={backToHub} aria-label="Back to hub" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Brain className="w-6 h-6 text-[#00D9FF]" /> Interview AI Lab
                        </h1>
                        {phase === 'session' && session && (
                            <p className="text-white/40 text-sm mt-0.5">{session.company} · {session.role} · {session.round}</p>
                        )}
                    </div>
                </div>

                {phase === 'session' && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm">
                            <Clock className="w-4 h-4 text-white/40" />
                            <span className="font-mono text-white/70">{fmtTime(elapsed)}</span>
                            <span className="text-white/30">|</span>
                            <BarChart2 className="w-4 h-4 text-white/40" />
                            <span className={`font-semibold ${scoreColor(avgScore)}`}>{avgScore > 0 ? avgScore : '--'}</span>
                            <span className="text-white/30">|</span>
                            <span className="text-white/50">{answeredCount}/{session?.questions.length ?? 0}</span>
                        </div>
                        <button
                            onClick={handleEndSession}
                            className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors"
                        >
                            <StopCircle className="w-4 h-4" /> End
                        </button>
                    </div>
                )}
            </div>

            {/* ── Hub Phase ── */}
            {phase === 'hub' && (
                <div className="space-y-6">
                    {/* Tab switcher */}
                    <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
                        {(['practice', 'history'] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${activeTab === t ? 'bg-[#00D9FF] text-black' : 'text-white/50 hover:text-white'}`}>
                                {t === 'history' ? <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" />{t}</span> : t}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'practice' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Stats */}
                            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: 'Sessions', val: sessions.length, icon: Play, color: 'text-blue-400' },
                                    { label: 'Completed', val: sessions.filter(s => s.status === 'completed').length, icon: CheckCircle, color: 'text-green-400' },
                                    { label: 'Avg Score', val: sessions.filter(s => s.overallScore != null).length ? Math.round(sessions.filter(s => s.overallScore != null).reduce((a, s) => a + (s.overallScore ?? 0), 0) / sessions.filter(s => s.overallScore != null).length) + '%' : '--', icon: Award, color: 'text-yellow-400' },
                                    { label: 'Top Round', val: sessions.length ? (sessions.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))[0]?.round ?? '--') : '--', icon: TrendingUp, color: 'text-purple-400' },
                                ].map(stat => (
                                    <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs">{stat.label}</p>
                                            <p className={`text-xl font-bold ${stat.color}`}>{stat.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA card */}
                            <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#00D9FF]/10 to-purple-600/10 border border-[#00D9FF]/20 p-8 flex flex-col justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Start New Practice Session</h2>
                                    <p className="text-white/50 text-sm">AI-powered questions tailored to your target company & role. Get instant feedback on every answer.</p>
                                </div>
                                <button
                                    onClick={() => setPhase('setup')}
                                    className="flex items-center justify-center gap-2 bg-[#00D9FF] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00b8d9] transition-colors w-fit"
                                >
                                    <Play className="w-5 h-5" /> Let's Practice
                                </button>
                            </div>

                            {/* Tips */}
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                                <h3 className="font-semibold text-white/70 text-sm uppercase tracking-wider">Pro Tips</h3>
                                {[
                                    { icon: Target, tip: 'Use STAR method for behavioral questions' },
                                    { icon: Zap, tip: 'Think aloud — interviewers value reasoning' },
                                    { icon: Lightbulb, tip: 'Read the hint if you feel stuck' },
                                    { icon: CheckCircle, tip: 'Complete sessions for accurate scoring' },
                                ].map((t, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-white/50">
                                        <t.icon className="w-4 h-4 text-[#00D9FF] shrink-0 mt-0.5" />
                                        {t.tip}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <HistoryTab sessions={sessions} onDelete={handleDeleteSession} onNewSession={() => setPhase('setup')} loading={historyLoading} />
                    )}
                </div>
            )}

            {/* ── Setup Phase ── */}
            {phase === 'setup' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: form (3 cols) */}
                    <div className="lg:col-span-3 space-y-5">
                        <h2 className="text-xl font-bold">Configure Your Session</h2>

                        {/* Company chips */}
                        <div>
                            <label className="text-sm font-semibold text-white/60 mb-2 block">Popular Companies</label>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_COMPANIES.map(c => (
                                    <button key={c} onClick={() => setCompany(c)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${company === c ? 'bg-[#00D9FF] text-black border-[#00D9FF]' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Company + Role inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Company <span className="text-red-400">*</span></label>
                                <input value={company} onChange={e => setCompany(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50 text-sm"
                                    placeholder="e.g. Google" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-white/60 mb-1.5 block">Role <span className="text-red-400">*</span></label>
                                <input value={role} onChange={e => setRole(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]/50 text-sm"
                                    placeholder="e.g. Software Engineer" />
                            </div>
                        </div>

                        {/* Round picker */}
                        <div>
                            <label className="text-sm font-semibold text-white/60 mb-2 block">Interview Round</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ROUND_OPTIONS.map(r => (
                                    <button key={r.value} onClick={() => setRound(r.value)}
                                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${round === r.value ? r.bg + ' ' + r.color : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>
                                        <r.icon className="w-5 h-5" />
                                        <span className="text-xs font-semibold">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="text-sm font-semibold text-white/60 mb-2 block">Experience Level</label>
                            <div className="flex gap-2">
                                {EXPERIENCE_LEVELS.map(l => (
                                    <button key={l.value} onClick={() => setExperienceLevel(l.value)}
                                        className={`flex flex-col items-center px-5 py-3 rounded-xl border text-sm transition-all flex-1 ${experienceLevel === l.value ? 'bg-[#00D9FF]/10 border-[#00D9FF]/40 text-[#00D9FF]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>
                                        <span className="font-semibold">{l.label}</span>
                                        <span className="text-xs opacity-60 mt-0.5">{l.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Count slider */}
                        <div>
                            <label className="text-sm font-semibold text-white/60 mb-2 block">
                                Number of Questions: <span className="text-white font-bold">{questionCount}</span>
                            </label>
                            <input type="range" min={3} max={15} value={questionCount} onChange={e => setQuestionCount(+e.target.value)}
                                aria-label="Number of questions"
                                className="w-full accent-[#00D9FF]" />
                            <div className="flex justify-between text-xs text-white/30 mt-1"><span>3</span><span>15</span></div>
                        </div>

                        <button onClick={handleStart} disabled={sessionLoading}
                            className="w-full flex items-center justify-center gap-2 bg-[#00D9FF] text-black py-3.5 rounded-xl font-bold hover:bg-[#00b8d9] transition-colors disabled:opacity-50 text-base">
                            {sessionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            {sessionLoading ? 'Generating Questions…' : 'Start Interview'}
                        </button>
                    </div>

                    {/* Right: info panel (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-2xl bg-gradient-to-br from-[#00D9FF]/10 to-purple-600/10 border border-[#00D9FF]/20 p-6">
                            <h3 className="font-bold text-white mb-1">What to expect</h3>
                            <p className="text-white/50 text-sm mb-4">AI generates questions tailored to your target company's known interview style. Every answer is evaluated instantly.</p>
                            <div className="space-y-3">
                                {[
                                    { icon: Brain, label: 'Company-specific questions', desc: 'Based on real interview patterns' },
                                    { icon: Zap, label: 'Instant AI feedback', desc: 'Score, strengths & improvements' },
                                    { icon: Lightbulb, label: 'Hints available', desc: 'Unstuck without spoilers' },
                                    { icon: BarChart2, label: 'Session history', desc: 'Track your progress over time' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center shrink-0">
                                            <item.icon className="w-4 h-4 text-[#00D9FF]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{item.label}</p>
                                            <p className="text-xs text-white/40">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Tips</p>
                            <ul className="space-y-2">
                                {[
                                    'Use STAR method for behavioral questions',
                                    'Think aloud — interviewers value reasoning',
                                    'Aim for 3–5 min answers with clear structure',
                                    'Complete all questions for full session score',
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                                        <CheckCircle className="w-3.5 h-3.5 text-[#00D9FF] shrink-0 mt-0.5" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Session Phase ── */}
            {phase === 'session' && session && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-6 gap-5 min-h-[calc(100vh-10rem)]">
                    {/* Left: question navigator */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl bg-white/5 border border-white/10 p-2 space-y-1 sticky top-4">
                            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider px-2 mb-2">Questions</p>
                            {session.questions.map((q, i) => (
                                <button key={i} onClick={() => { setCurrentIndex(i); setCurrentAnswer(''); setShowHint(false); }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${i === currentIndex ? 'bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF]' : q.score != null ? 'bg-green-500/5 text-green-400/70' : 'text-white/40 hover:bg-white/5'}`}>
                                    <span className="font-mono text-xs">Q{i + 1}</span>
                                    {q.score != null
                                        ? <span className={`text-xs font-bold ${scoreColor(q.score)}`}>{q.score}</span>
                                        : <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Center: question card */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-7 flex flex-col gap-6">
                            {/* Header row */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {currentQ?.category && <span className="text-lg bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full font-medium">{currentQ.category}</span>}
                                    {currentQ?.difficulty && <span className={`text-lg px-3 py-1.5 rounded-full font-medium ${currentQ.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' : currentQ.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{currentQ.difficulty}</span>}
                                </div>
                                <span className="text-lg text-white/40 font-medium">{currentIndex + 1} / {session.questions.length}</span>
                            </div>

                            {/* Question text */}
                            <p className="text-[23px] leading-[1.8] text-white font-medium">{currentQ?.question}</p>

                            {/* Hint */}
                            {currentQ?.hint && (
                                <div>
                                    {showHint
                                        ? <div className="flex gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-5 py-4 text-[20px] text-yellow-200/85 leading-relaxed">
                                            <Lightbulb className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />{currentQ.hint}
                                        </div>
                                        : <button onClick={() => setShowHint(true)} className="flex items-center gap-2 text-lg text-yellow-400/70 hover:text-yellow-400 transition-colors">
                                            <Lightbulb className="w-5 h-5" /> Show hint
                                        </button>}
                                </div>
                            )}

                            {/* Answer textarea or feedback */}
                            {currentQ?.score != null ? (
                                <FeedbackPanel q={currentQ} plagiarismFlag={pastedQuestions.has(currentIndex) || plagiarizedQuestions.has(currentIndex)} />
                            ) : (
                                <div className="flex flex-col flex-1 gap-3">
                                    {/* ── Plagiarism banners ── */}
                                    {(pastedQuestions.has(currentIndex) || plagiarizedQuestions.has(currentIndex)) && (
                                        <div className="flex items-start gap-3 bg-red-500/15 border-2 border-red-500/50 rounded-xl px-5 py-4 text-[18px] text-red-300 leading-relaxed">
                                            <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 text-red-400" />
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-red-400 text-[19px]">
                                                    {pastedQuestions.has(currentIndex) ? '⛔ Content Pasted' : '⛔ Possible Plagiarism Detected'}
                                                </span>
                                                <span className="text-red-300/80">
                                                    {pastedQuestions.has(currentIndex)
                                                        ? 'You pasted content into this answer. The evaluator will be notified.'
                                                        : plagiarismReasons[currentIndex] || 'This answer appears to match internet sources. Write in your own words.'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {!pastedQuestions.has(currentIndex) && !plagiarizedQuestions.has(currentIndex) && currentAnswer.length > 50 && currentTypedChars < currentAnswer.length * 0.4 && (
                                        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-5 py-3 text-[18px] text-yellow-300 leading-relaxed">
                                            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                                            <span>Low keystroke ratio detected — are you typing this yourself?</span>
                                        </div>
                                    )}
                                    {!pastedQuestions.has(currentIndex) && !plagiarizedQuestions.has(currentIndex) && currentAnswer.length > 20 && currentTypedChars >= currentAnswer.length * 0.4 && (
                                        <div className="flex items-center gap-2 text-lg text-green-400/60">
                                            <Shield className="w-5 h-5" /> Original typing detected
                                            {plagiarismChecking && <span className="ml-2 text-sm text-white/30 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking originality…</span>}
                                        </div>
                                    )}
                                    {plagiarismChecking && !pastedQuestions.has(currentIndex) && !plagiarizedQuestions.has(currentIndex) && currentAnswer.length <= 20 && (
                                        <div className="flex items-center gap-2 text-sm text-white/30">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking originality…
                                        </div>
                                    )}

                                    <textarea
                                        value={currentAnswer}
                                        onChange={e => {
                                            const prev = currentAnswer;
                                            const next = e.target.value;
                                            const delta = next.length - prev.length;
                                            if (delta > 0 && delta <= 3) {
                                                setTypedCharsMap(m => ({ ...m, [currentIndex]: (m[currentIndex] ?? 0) + delta }));
                                            }
                                            // If user cleared the answer, lift all plagiarism flags so they get a fresh start
                                            if (next.length < 10) {
                                                setPastedQuestions(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
                                                setPlagiarizedQuestions(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
                                                setTypedCharsMap(m => ({ ...m, [currentIndex]: 0 }));
                                            }
                                            setCurrentAnswer(next);
                                        }}
                                        onPaste={() => setPastedQuestions(prev => new Set([...prev, currentIndex]))}
                                        placeholder="Type your answer here…"
                                        className={`flex-1 w-full bg-white/5 rounded-xl px-5 py-4 text-[20px] leading-relaxed text-white placeholder:text-white/25 focus:outline-none resize-none min-h-[220px] border-2 transition-colors ${
                                            pastedQuestions.has(currentIndex) || plagiarizedQuestions.has(currentIndex)
                                                ? 'border-red-500/60 focus:border-red-500 bg-red-500/5'
                                                : 'border-white/10 focus:border-[#00D9FF]/50'
                                        }`}
                                    />
                                    <div className="flex gap-3 items-center">
                                        <button onClick={handleEvaluate} disabled={evaluating || !currentAnswer.trim()}
                                            className="flex items-center gap-2 bg-[#00D9FF] text-black px-7 py-3.5 rounded-xl font-bold text-xl hover:bg-[#00b8d9] disabled:opacity-50 transition-colors">
                                            {evaluating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                                            {evaluating ? 'Evaluating…' : 'Submit Answer'}
                                        </button>
                                        <button
                                            onClick={() => { setCurrentIndex(i => Math.min(i + 1, session.questions.length - 1)); setCurrentAnswer(''); setShowHint(false); }}
                                            className="flex items-center gap-2 text-lg text-white/40 hover:text-white/70 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
                                            <SkipForward className="w-5 h-5" /> Skip
                                        </button>
                                        <span className="ml-auto text-base text-white/25">{currentAnswer.length} chars</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Nav arrows */}
                        <div className="flex justify-between">
                            <button onClick={() => { setCurrentIndex(i => Math.max(i - 1, 0)); setCurrentAnswer(''); setShowHint(false); }}
                                disabled={currentIndex === 0}
                                className="flex items-center gap-2 text-lg text-white/40 hover:text-white/70 disabled:opacity-20 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                                <ChevronLeft className="w-5 h-5" /> Prev
                            </button>
                            <button onClick={() => { setCurrentIndex(i => Math.min(i + 1, session.questions.length - 1)); setCurrentAnswer(''); setShowHint(false); }}
                                disabled={currentIndex === session.questions.length - 1}
                                className="flex items-center gap-2 text-lg text-white/40 hover:text-white/70 disabled:opacity-20 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Results Phase ── */}
            {phase === 'results' && session && (
                <ResultsScreen session={session} onNewSession={() => setPhase('setup')} />
            )}
        </div>
    );
}

