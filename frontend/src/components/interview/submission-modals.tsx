'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, AlertTriangle, Loader2, X, Trophy, Star,
    TrendingUp, Shield, Clock, Code2, Award, ChevronRight,
    ThumbsUp, ThumbsDown, BarChart3,
} from 'lucide-react';
import type { ProctorScoring, ViolationCounts } from '@/hooks/useProctor';

// ─── Submission Confirm Modal ─────────────────────────────────────────────────

interface SubmissionConfirmProps {
    open:            boolean;
    onConfirm:       () => void;
    onCancel:        () => void;
    isSubmitting:    boolean;
    violationCounts: ViolationCounts;
    passedTests:     number;
    totalTests:      number;
}

export default function SubmissionConfirm({
    open, onConfirm, onCancel, isSubmitting, violationCounts, passedTests, totalTests,
}: SubmissionConfirmProps) {
    const totalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);
    const pct = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    const pctColor = pct === 100 ? 'text-emerald-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300';

    return (
        <AnimatePresence>
            {open && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
                >
                    <motion.div initial={{ scale: 0.90, opacity: 0, y: 24 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.90, opacity: 0, y: 24 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl"
                    >
                        {/* Glow bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500" />

                        <div className="p-6">
                            <button onClick={onCancel} className="absolute right-4 top-4 text-slate-500 hover:text-white transition">
                                <X className="h-4 w-4" />
                            </button>

                            <div className="mb-5 text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Submit Your Solution?</h2>
                                <p className="mt-1 text-sm text-slate-400">This finalizes your session and generates your interview report.</p>
                            </div>

                            {/* Stats */}
                            <div className="mb-5 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 text-center">
                                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Tests Passed</p>
                                    <p className={`text-3xl font-black ${pctColor}`}>{passedTests}<span className="text-lg text-slate-500">/{totalTests}</span></p>
                                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.2 }}
                                            className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 text-center">
                                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Violations</p>
                                    <p className={`text-3xl font-black ${totalViolations === 0 ? 'text-emerald-300' : totalViolations < 5 ? 'text-amber-300' : 'text-rose-300'}`}>
                                        {totalViolations}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">{totalViolations === 0 ? 'Clean session ✓' : 'flags recorded'}</p>
                                </div>
                            </div>

                            {totalViolations > 0 && (
                                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                                    {totalViolations} integrity violation{totalViolations > 1 ? 's' : ''} will be included in the proctor report sent to HR.
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={onCancel} disabled={isSubmitting}
                                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 transition disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={onConfirm} disabled={isSubmitting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition disabled:opacity-60">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><CheckCircle2 className="h-4 w-4" />Confirm Submit</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Final Score Modal — Cinematic Reveal ─────────────────────────────────────

interface FinalScoreModalProps {
    open:    boolean;
    scoring: ProctorScoring | null;
    onClose: () => void;
}

const GRADE_META: Record<string, { label: string; color: string; glow: string; emoji: string; msg: string }> = {
    'A+': { label: 'A+', color: 'from-emerald-400 to-cyan-400', glow: 'shadow-emerald-500/40', emoji: '🏆', msg: 'Outstanding! You nailed it.' },
    'A':  { label: 'A',  color: 'from-emerald-400 to-teal-400', glow: 'shadow-emerald-500/30', emoji: '⭐', msg: 'Excellent performance.' },
    'B':  { label: 'B',  color: 'from-cyan-400 to-blue-400',    glow: 'shadow-cyan-500/30',    emoji: '👍', msg: 'Strong showing.' },
    'C':  { label: 'C',  color: 'from-amber-400 to-yellow-400', glow: 'shadow-amber-500/30',   emoji: '📈', msg: 'Good effort. Room to grow.' },
    'D':  { label: 'D',  color: 'from-orange-400 to-rose-400',  glow: 'shadow-orange-500/30',  emoji: '💪', msg: 'Keep practicing.' },
    'F':  { label: 'F',  color: 'from-rose-500 to-red-600',     glow: 'shadow-rose-500/30',    emoji: '📚', msg: 'Don\'t give up. Try again.' },
};

function CountUp({ target, duration = 1800 }: { target: number; duration?: number }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        const raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return <>{val}</>;
}

export function FinalScoreModal({ open, scoring, onClose }: FinalScoreModalProps) {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => setRevealed(true), 400);
            return () => clearTimeout(t);
        } else {
            setRevealed(false);
        }
    }, [open]);

    if (!scoring) return null;

    const grade = scoring.grade || 'C';
    const meta  = GRADE_META[grade] || GRADE_META['C'];
    const score = scoring.finalScore ?? 0;
    const recommendation = score >= 80 ? 'Strong Hire' : score >= 60 ? 'Consider' : 'No Hire';
    const recColor = score >= 80 ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40'
                   : score >= 60 ? 'text-amber-300 bg-amber-500/15 border-amber-400/40'
                   : 'text-rose-300 bg-rose-500/15 border-rose-400/40';

    const scoreRows = [
        { label: 'Test Cases',     weight: '70%', icon: CheckCircle2, value: scoring.testCaseScore,    color: 'text-cyan-300' },
        { label: 'Code Quality',   weight: '10%', icon: Code2,        value: scoring.codeQualityScore, color: 'text-violet-300' },
        { label: 'Time Efficiency',weight: '10%', icon: Clock,        value: scoring.timeScore,        color: 'text-emerald-300' },
        { label: 'Violations',     weight: '−10%',icon: Shield,       value: -scoring.violationPenalty,color: 'text-rose-300', red: true },
    ];

    return (
        <AnimatePresence>
            {open && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9991] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
                >
                    <motion.div initial={{ scale: 0.85, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl"
                    >
                        {/* Animated gradient top bar */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${meta.color}`} />

                        {/* Particle burst (CSS only) */}
                        {score >= 70 && revealed && (
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <motion.div key={i}
                                        initial={{ opacity: 1, x: '50%', y: '30%', scale: 0 }}
                                        animate={{ opacity: 0, x: `${50 + (Math.random() - 0.5) * 120}%`, y: `${30 + (Math.random() - 0.5) * 100}%`, scale: 1 }}
                                        transition={{ duration: 1.2, delay: i * 0.06, ease: 'easeOut' }}
                                        className="absolute h-2 w-2 rounded-full bg-cyan-400"
                                        style={{ left: 0, top: 0 }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="p-7 text-center">
                            <p className="mb-1 text-[11px] uppercase tracking-[0.3em] text-slate-500">Interview Complete</p>

                            {/* Score ring */}
                            <div className="relative mx-auto my-6 flex h-36 w-36 items-center justify-center">
                                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    <motion.circle cx="60" cy="60" r="50" fill="none"
                                        stroke="url(#scoreGrad)" strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 50}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score / 100) }}
                                        transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                                    />
                                    <defs>
                                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#22d3ee" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div>
                                    <p className="text-5xl font-black text-white">
                                        {revealed ? <CountUp target={score} /> : 0}
                                    </p>
                                    <p className="text-xs text-slate-500">/ 100</p>
                                </div>
                            </div>

                            {/* Grade + emoji */}
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-3xl">{meta.emoji}</span>
                                <p className={`text-4xl font-black bg-gradient-to-r ${meta.color} bg-clip-text text-transparent`}>
                                    Grade {meta.label}
                                </p>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">{meta.msg}</p>

                            {/* Hiring recommendation */}
                            <div className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${recColor}`}>
                                {score >= 80 ? <ThumbsUp className="h-3.5 w-3.5" /> : score >= 60 ? <BarChart3 className="h-3.5 w-3.5" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                                {recommendation}
                            </div>

                            {/* Score breakdown */}
                            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                                {scoreRows.map((row, i) => (
                                    <div key={row.label} className={`flex items-center gap-3 px-4 py-2.5 ${i < scoreRows.length - 1 ? 'border-b border-slate-800' : ''}`}>
                                        <row.icon className={`h-3.5 w-3.5 flex-shrink-0 ${row.color}`} />
                                        <span className="flex-1 text-left text-xs text-slate-400">{row.label} <span className="text-slate-600">({row.weight})</span></span>
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.15 + 0.5 }}
                                            className={`text-sm font-bold ${row.color}`}
                                        >
                                            {row.value > 0 && !row.red ? '+' : ''}{row.value}
                                        </motion.span>
                                        <div className="w-16 overflow-hidden rounded-full bg-slate-800 h-1.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(0, Math.min(100, Math.abs(row.value || 0)))}%` }}
                                                transition={{ delay: i * 0.15 + 0.6, duration: 0.5 }}
                                                className={`h-full rounded-full ${row.red ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={onClose}
                                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-cyan-500/30">
                                <Award className="h-4 w-4" />
                                View Full Interview Report
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
