'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Clock, Cpu, ChevronDown, ChevronRight,
    AlertTriangle, Terminal, Trophy, Eye, EyeOff, Zap,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TestCaseResult {
    id:       number;
    input:    string;
    expected: string;
    output:   string;   // actual output
    got?:     string;   // alias
    passed:   boolean;
    error?:   string;
    time?:    number | string;
    memory?:  number | string;
    verdict?: string;
    hidden?:  boolean;  // true = backend redacted input/expected
    status?:  'pending' | 'running' | 'pass' | 'fail' | 'error' | 'tle';
}

export interface ExecutionSummary {
    verdict:     string;
    totalTests:  number;
    passedTests: number;
    failedTests: number;
    passRate?:   number;
}

interface TestCasesPanelProps {
    testCases:  TestCaseResult[];
    summary:    ExecutionSummary | null;
    isRunning?: boolean;
    isSubmit?:  boolean;
}

// ─── Verdict helpers ──────────────────────────────────────────────────────────

const VERDICT_META: Record<string, { color: string; bg: string; border: string; abbr: string }> = {
    'Accepted':             { color: 'text-emerald-200', bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', abbr: 'AC' },
    'Wrong Answer':         { color: 'text-rose-200',    bg: 'bg-rose-500/15',    border: 'border-rose-400/40',    abbr: 'WA' },
    'Runtime Error':        { color: 'text-rose-200',    bg: 'bg-rose-500/15',    border: 'border-rose-400/40',    abbr: 'RE' },
    'Compilation Error':    { color: 'text-rose-200',    bg: 'bg-rose-500/15',    border: 'border-rose-400/40',    abbr: 'CE' },
    'Time Limit Exceeded':  { color: 'text-amber-200',   bg: 'bg-amber-500/15',   border: 'border-amber-400/40',   abbr: 'TLE' },
    'Memory Limit Exceeded':{ color: 'text-amber-200',   bg: 'bg-amber-500/15',   border: 'border-amber-400/40',   abbr: 'MLE' },
    'Execution Error':      { color: 'text-slate-300',   bg: 'bg-slate-700/30',   border: 'border-slate-600',      abbr: 'EE' },
};

function getVerdictMeta(verdict: string, passed: boolean) {
    if (passed) return VERDICT_META['Accepted'];
    return VERDICT_META[verdict] || VERDICT_META['Wrong Answer'];
}

const VerdictBadge = ({ verdict, passed }: { verdict?: string; passed: boolean }) => {
    const v = verdict || (passed ? 'Accepted' : 'Wrong Answer');
    const meta = getVerdictMeta(v, passed);
    return (
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.color} ${meta.bg} ${meta.border}`}>
            {passed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
            {meta.abbr}
        </span>
    );
};

// Removed SummaryTableRow as we are using horizontal tabs now

// ─── Expanded detail card ─────────────────────────────────────────────────────

function TestCaseDetail({ tc }: { tc: TestCaseResult }) {
    const actualOutput = tc.output || tc.got || '';

    if (tc.hidden) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                <EyeOff className="h-4 w-4 text-slate-500" />
                <div>
                    <p className="font-semibold text-slate-300">Hidden Test Case</p>
                    <p className="mt-0.5 text-slate-500">Input and expected output are not revealed. Result: {tc.passed ? '✅ Correct' : '❌ Wrong'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
            {/* Input */}
            <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Input</p>
                <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                    {tc.input || '(empty)'}
                </pre>
            </div>

            {/* Expected vs Got */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Expected</p>
                    <pre className="overflow-x-auto rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
                        {tc.expected || '(empty)'}
                    </pre>
                </div>
                <div>
                    <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${tc.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Your Output {tc.passed ? '✓' : '✗'}
                    </p>
                    <pre className={`overflow-x-auto rounded-lg border px-3 py-2 text-xs ${
                        tc.passed
                            ? 'border-emerald-800/40 bg-emerald-950/30 text-emerald-200'
                            : 'border-rose-800/40 bg-rose-950/30 text-rose-200'
                    }`}>
                        {actualOutput || '(no output)'}
                    </pre>
                </div>
            </div>

            {/* Error output */}
            {tc.error && tc.error !== '[error]' && (
                <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-rose-500">Error / Stderr</p>
                    <pre className="overflow-x-auto rounded-lg border border-rose-800/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
                        {tc.error}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Verdict banner ───────────────────────────────────────────────────────────

function VerdictBanner({ summary, isSubmit }: { summary: ExecutionSummary; isSubmit?: boolean }) {
    const pct = summary.passRate ?? (
        summary.totalTests > 0
            ? Math.round((summary.passedTests / summary.totalTests) * 100)
            : 0
    );
    const allPassed = summary.passedTests === summary.totalTests;

    const banner = (VERDICT_META[summary.verdict] || VERDICT_META['Wrong Answer']);
    const bannerClass = allPassed
        ? 'border-emerald-500/50 bg-emerald-950/50'
        : pct >= 50
            ? 'border-amber-500/50 bg-amber-950/50'
            : 'border-rose-500/50 bg-rose-950/50';

    return (
        <div className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${bannerClass}`}>
            <div className="flex items-center gap-3">
                {allPassed
                    ? <Trophy className="h-5 w-5 text-emerald-300" />
                    : <AlertTriangle className="h-5 w-5 text-rose-300" />}
                <div>
                    <p className={`text-sm font-bold ${banner.color}`}>{summary.verdict}</p>
                    <p className="text-xs text-slate-400">
                        {isSubmit
                            ? `${summary.passedTests}/${summary.totalTests} test cases passed`
                            : `${summary.passedTests}/${summary.totalTests} sample tests passed`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-28 overflow-hidden rounded-full bg-white/10 h-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${allPassed ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    />
                </div>
                <span className={`text-sm font-bold ${banner.color}`}>{pct}%</span>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TestCasesPanel({
    testCases,
    summary,
    isRunning,
    isSubmit,
}: TestCasesPanelProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const activeId = selectedId ?? testCases[0]?.id ?? null;

    if (isRunning) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                <Terminal className="h-8 w-8 animate-pulse text-cyan-400" />
                <p className="text-sm">Running test cases…</p>
                <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                        <div key={i}
                            className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (testCases.length === 0) {
        return (
            <div className="py-8 text-center">
                <Terminal className="mx-auto h-7 w-7 text-slate-600" />
                <p className="mt-3 text-sm text-slate-400">Run your code to see test case results</p>
                <p className="mt-1 text-xs text-slate-500">Results appear here after execution</p>
            </div>
        );
    }

    const selectedCase = testCases.find(tc => tc.id === activeId);

    return (
        <div className="space-y-4">
            {summary && <VerdictBanner summary={summary} isSubmit={isSubmit} />}

            {/* Horizontal Tabs for Test Cases */}
            <div className="flex flex-wrap gap-2">
                {testCases.map((tc, i) => {
                    const isActive = activeId === tc.id;
                    return (
                        <button
                            key={tc.id}
                            onClick={() => setSelectedId(tc.id)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                isActive
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            {tc.passed ? (
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            ) : (tc.got !== '--' && tc.got) ? (
                                <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            ) : null}
                            Case {i + 1}
                        </button>
                    );
                })}
            </div>

            {/* Expanded detail */}
            <AnimatePresence mode="wait">
                {selectedCase && (
                    <motion.div
                        key={selectedCase.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4"
                    >
                        <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <Zap className="h-3.5 w-3.5 text-cyan-400" />
                            Test Case #{selectedCase.id} Details
                        </div>
                        <TestCaseDetail tc={selectedCase} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden tests summary */}
            {testCases.some(tc => tc.hidden) && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
                    <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                        {testCases.filter(tc => tc.hidden).length} hidden test cases — input and expected output are not shown.
                        {' '}{testCases.filter(tc => tc.hidden && tc.passed).length} of {testCases.filter(tc => tc.hidden).length} hidden tests passed.
                    </span>
                </div>
            )}
        </div>
    );
}
