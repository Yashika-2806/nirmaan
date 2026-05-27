'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Maximize2, ShieldAlert, X, Zap } from 'lucide-react';
import type { ViolationCounts } from '@/hooks/useProctor';

interface ViolationOverlayProps {
    warnings:            string[];
    violationCounts:     ViolationCounts;
    isFullscreen:        boolean;
    onDismiss:           () => void;
    onReEnterFullscreen: () => void;
}

export default function ViolationOverlay({
    warnings,
    violationCounts,
    isFullscreen,
    onDismiss,
    onReEnterFullscreen,
}: ViolationOverlayProps) {
    const latestWarning   = warnings[warnings.length - 1];
    const totalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);
    const isCritical      = totalViolations >= 5;

    return (
        <>
            {/* ── Fullscreen exit top banner ───────────────────────────── */}
            <AnimatePresence>
                {!isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0, y: -70 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -70 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-between gap-3 border-b border-rose-600/60 bg-rose-950/98 px-5 py-3 backdrop-blur-md shadow-lg shadow-rose-950/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20">
                                <AlertTriangle className="h-4 w-4 animate-pulse text-rose-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-rose-100">Fullscreen Violation Detected</p>
                                <p className="text-xs text-rose-400">You exited fullscreen. This has been logged. Re-enter immediately.</p>
                            </div>
                        </div>
                        <button
                            onClick={onReEnterFullscreen}
                            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/35 active:scale-95"
                        >
                            <Maximize2 className="h-3.5 w-3.5" />
                            Re-enter Fullscreen
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Critical violation modal (≥5 violations) ─────────────── */}
            <AnimatePresence>
                {isCritical && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9997] flex items-center justify-center bg-rose-950/30 backdrop-blur-sm"
                        onClick={onDismiss}
                    >
                        <motion.div
                            initial={{ scale: 0.88, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.88 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-rose-600/50 bg-slate-950 shadow-2xl shadow-rose-950/60"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Red gradient header */}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-rose-900/80 to-rose-950/80 px-5 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/30">
                                    <ShieldAlert className="h-6 w-6 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-white">Critical: Multiple Violations</p>
                                    <p className="text-xs text-rose-400">{totalViolations} integrity events recorded in this session</p>
                                </div>
                            </div>

                            <div className="p-5">
                                <p className="text-sm leading-relaxed text-slate-300">
                                    Your session has been flagged for multiple integrity violations. The proctor report has been updated. 
                                    Further violations may result in automatic session termination and score disqualification.
                                </p>

                                {/* Violation breakdown */}
                                <ViolationBreakdown counts={violationCounts} />

                                {/* Score impact estimate */}
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-950/25 px-3 py-2.5">
                                    <Zap className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                    <p className="text-xs text-amber-200">
                                        Estimated integrity penalty: <strong className="text-rose-300">−{Math.min(20, totalViolations * 2)} points</strong> from final score
                                    </p>
                                </div>

                                <button
                                    onClick={onDismiss}
                                    className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 active:scale-95"
                                >
                                    I understand — Continue interview
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Toast-style violation notification ───────────────────── */}
            <AnimatePresence mode="wait">
                {latestWarning && !isCritical && (
                    <motion.div
                        key={latestWarning + totalViolations}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed bottom-6 right-4 z-[9997] flex max-w-xs items-start gap-3 overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950/98 p-4 shadow-2xl backdrop-blur"
                    >
                        {/* Left accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-rose-500" />

                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-amber-200 leading-snug">{latestWarning}</p>
                            <p className="mt-1 text-xs text-slate-500">Violations: {totalViolations} total logged</p>
                        </div>
                        <button onClick={onDismiss} className="mt-0.5 text-slate-500 hover:text-white transition flex-shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ViolationBreakdown({ counts }: { counts: ViolationCounts }) {
    const items = [
        { label: 'Tab Switches',     value: counts.tabSwitches,     severity: 'high' },
        { label: 'Window Blur',      value: counts.windowBlurs,     severity: 'medium' },
        { label: 'Fullscreen Exit',  value: counts.fullscreenExits, severity: 'high' },
        { label: 'Copy / Paste',     value: counts.copyPastes,      severity: 'high' },
        { label: 'Rapid Paste',      value: counts.rapidPastes,     severity: 'critical' },
    ].filter(i => i.value > 0);

    if (items.length === 0) return null;

    const dot: Record<string, string> = {
        critical: 'bg-rose-500',
        high:     'bg-rose-400',
        medium:   'bg-amber-400',
    };

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            {items.map((item, i) => (
                <div key={item.label} className={`flex items-center gap-3 px-4 py-2.5 ${i < items.length - 1 ? 'border-b border-slate-800' : ''}`}>
                    <span className={`h-2 w-2 rounded-full ${dot[item.severity]}`} />
                    <span className="flex-1 text-xs text-slate-400">{item.label}</span>
                    <span className="text-sm font-bold text-rose-300">{item.value}×</span>
                </div>
            ))}
        </div>
    );
}
