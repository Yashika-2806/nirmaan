'use client';

import { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    Brain,
    CheckCircle2,
    ChevronRight,
    Clock,
    Code2,
    Lightbulb,
    Loader2,
    MessageSquare,
    RefreshCw,
    TrendingUp,
    Wrench,
    XCircle,
    Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InterviewFeedbackProps {
    verdict: string;
    code: string;
    testCasesPassed: number;
    totalTestCases: number;
    language: string;
    time?: string;
    memory?: string;
    errorOutput?: string;
    question?: string;
    testResults?: Array<{ id: number; input: string; expected: string; got: string; passed: boolean }>;
}

interface AIFeedback {
    verdict: string;
    overallAssessment: string;
    errorAnalysis: string | null;
    fix: string | null;
    strengths: string[];
    improvements: string[];
    timeComplexity: string;
    spaceComplexity: string;
    optimalApproach: string;
    interviewerFollowUp: string;
    score: number;
}

function ScoreRing({ score }: { score: number }) {
    const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const dash = (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle
                    cx="40" cy="40" r={radius} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                />
            </svg>
            <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
        </div>
    );
}

function VerdictBadge({ verdict }: { verdict: string }) {
    const cfg: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
        'Accepted':          { bg: 'bg-emerald-500/15 border-emerald-400/40', text: 'text-emerald-300', icon: <CheckCircle2 className="h-4 w-4" /> },
        'Wrong Answer':      { bg: 'bg-amber-500/15 border-amber-400/40',    text: 'text-amber-300',   icon: <AlertCircle className="h-4 w-4" /> },
        'Runtime Error':     { bg: 'bg-rose-500/15 border-rose-400/40',      text: 'text-rose-300',    icon: <XCircle className="h-4 w-4" /> },
        'Compilation Error': { bg: 'bg-rose-500/15 border-rose-400/40',      text: 'text-rose-300',    icon: <XCircle className="h-4 w-4" /> },
    };
    const c = cfg[verdict] ?? { bg: 'bg-slate-500/15 border-slate-400/40', text: 'text-slate-300', icon: <AlertCircle className="h-4 w-4" /> };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
            {c.icon}{verdict}
        </span>
    );
}

export default function AIInterviewFeedback({
    verdict,
    code,
    testCasesPassed,
    totalTestCases,
    language,
    time,
    memory,
    errorOutput,
    question,
    testResults,
}: InterviewFeedbackProps) {
    const [feedback, setFeedback] = useState<AIFeedback | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track what we've already fetched to avoid redundant calls
    const fetchedKey = useRef<string | null>(null);

    const fetchKey = `${verdict}|${code.length}|${errorOutput || ''}`;

    useEffect(() => {
        // Don't re-fetch for same state
        if (fetchedKey.current === fetchKey) return;
        // Don't fetch for idle/running states
        if (verdict === 'Idle' || verdict === 'Running') return;

        let cancelled = false;

        const fetchFeedback = async () => {
            setLoading(true);
            setError(null);
            setFeedback(null);
            fetchedKey.current = fetchKey;

            try {
                const api = (await import('@/lib/axios')).default;
                const response = await api.post('/interview/evaluate-code', {
                    code,
                    language,
                    verdict,
                    errorOutput: errorOutput || '',
                    question: question || '',
                    testResults: testResults || [],
                    executionTime: time || '--',
                    memory: memory || '--',
                });

                if (!cancelled) {
                    setFeedback(response.data?.data ?? null);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.response?.data?.message || err?.message || 'Failed to load AI feedback');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchFeedback();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchKey]);

    const handleRetry = () => {
        fetchedKey.current = null;
        setFeedback(null);
        setError(null);
        // Trigger re-render to restart effect
        setLoading(false);
    };

    // Trigger re-fetch after retry
    useEffect(() => {
        if (!loading && !feedback && !error && verdict !== 'Idle' && verdict !== 'Running' && fetchedKey.current === null) {
            fetchedKey.current = undefined as any; // Force effect to run
        }
    }, [loading, feedback, error, verdict]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                    <Brain className="absolute inset-0 m-auto h-5 w-5 text-violet-400" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-200">Analyzing your code…</p>
                    <p className="mt-1 text-xs text-slate-400">AI is reviewing your solution, complexity &amp; errors</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
                <XCircle className="mx-auto h-8 w-8 text-rose-400" />
                <p className="mt-2 text-sm font-semibold text-rose-200">AI Feedback Unavailable</p>
                <p className="mt-1 text-xs text-slate-400">{error}</p>
                <button
                    onClick={handleRetry}
                    className="mt-3 flex items-center gap-1.5 mx-auto rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
                >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                </button>
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                <Brain className="mx-auto h-8 w-8 mb-2 opacity-40" />
                Run your code first to get AI feedback.
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={fetchKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
            >
                {/* Header row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <ScoreRing score={feedback.score} />
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">AI Review Score</p>
                            <VerdictBadge verdict={feedback.verdict} />
                        </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                            ⏱ {feedback.timeComplexity}
                        </span>
                        <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-violet-300">
                            📦 {feedback.spaceComplexity}
                        </span>
                    </div>
                </div>

                {/* Overall Assessment */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-cyan-500/8 p-4"
                >
                    <div className="flex items-start gap-2">
                        <Brain className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-1">AI Interviewer Assessment</p>
                            <p className="text-sm leading-relaxed text-slate-200">{feedback.overallAssessment}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Error Analysis (only when there's an error) */}
                {feedback.errorAnalysis && feedback.errorAnalysis !== 'null — code is correct' && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"
                    >
                        <div className="flex items-start gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">Error Analysis</p>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{feedback.errorAnalysis}</p>
                    </motion.div>
                )}

                {/* Fix suggestion */}
                {feedback.fix && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
                    >
                        <div className="flex items-start gap-2 mb-2">
                            <Wrench className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Suggested Fix</p>
                        </div>
                        <pre className="text-xs leading-6 text-amber-100 whitespace-pre-wrap font-mono bg-slate-950/60 rounded-lg p-3 overflow-x-auto">
                            {feedback.fix}
                        </pre>
                    </motion.div>
                )}

                {/* Strengths + Improvements */}
                <div className="grid gap-3 sm:grid-cols-2">
                    {feedback.strengths.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Strengths</p>
                            </div>
                            <ul className="space-y-1.5">
                                {feedback.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300 leading-relaxed">
                                        <ChevronRight className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                    {feedback.improvements.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-amber-400" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Improvements</p>
                            </div>
                            <ul className="space-y-1.5">
                                {feedback.improvements.map((s, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300 leading-relaxed">
                                        <ChevronRight className="h-3 w-3 text-amber-400 mt-0.5 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>

                {/* Optimal Approach */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-xl border border-cyan-500/25 bg-cyan-500/8 p-4"
                >
                    <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300 mb-1">Optimal Approach</p>
                            <p className="text-sm leading-relaxed text-slate-200">{feedback.optimalApproach}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Interviewer Follow-Up */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="rounded-xl border border-slate-600/50 bg-slate-900/60 p-4"
                >
                    <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Interviewer Follow-Up</p>
                            <p className="text-sm leading-relaxed text-slate-200 italic">&ldquo;{feedback.interviewerFollowUp}&rdquo;</p>
                        </div>
                    </div>
                </motion.div>

                {/* Complexity row */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                    className="grid grid-cols-2 gap-3"
                >
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Time</p>
                            <p className="text-xs font-semibold text-white">{feedback.timeComplexity}</p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 flex items-center gap-2">
                        <Code2 className="h-3.5 w-3.5 text-violet-400" />
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-slate-400">Space</p>
                            <p className="text-xs font-semibold text-white">{feedback.spaceComplexity}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
