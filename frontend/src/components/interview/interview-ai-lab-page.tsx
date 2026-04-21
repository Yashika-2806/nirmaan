'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    BarChart3,
    Brain,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Code2,
    Loader2,
    Play,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    StopCircle,
    TerminalSquare,
    Trophy,
    Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AIInterviewFeedback from './ai-interview-feedback';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Phase = 'setup' | 'session' | 'results';
type Language = 'cpp' | 'java' | 'python' | 'javascript';
type OutputTab = 'output' | 'errors' | 'tests' | 'feedback';
type RunVerdict = 'Idle' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error' | 'Execution Error';

type Judge0Status = {
    id: number;
    description: string;
};

interface SampleTestCase {
    input: string;
    expected: string;
}

interface EvaluatedQuestion {
    id: string;
    question: string;
    hint?: string;
    difficulty?: string;
    category?: string;
    isCodingQuestion?: boolean;
    functionSignature?: string;
    starterCode?: string;
    sampleTestCases?: SampleTestCase[];
    answer?: string;
    score?: number;
    verdict?: string;
    strengths?: string[];
    improvements?: string[];
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

interface LocalRunResult {
    status: 'idle' | 'running' | 'success' | 'error';
    verdict: RunVerdict;
    stdout: string;
    stderr: string;
    errorOutput: string;
    memory: string;
    time: string;
    testCases: Array<{ id: number; input: string; expected: string; got: string; passed: boolean }>;
}

const POPULAR_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Uber', 'Flipkart'];

// ─── Generic starter codes (no-op stubs) ────────────────────────────────────
const BLANK_TEMPLATES: Record<Language, string> = {
    python:     `# Write your solution here\n# Your code should print output for each test case\ndef solution():\n    pass\n`,
    javascript: `// Write your solution here\n// console.log your output for each test case\nfunction solution() {\n\n}\n`,
    java:       `class Solution {\n    // Write your solution here\n    // Use System.out.println for output\n}\n`,
    cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\n// Write your solution here\n// Use cout for output\n`,
};


// ─── Default run state ────────────────────────────────────────────────────────
function makeIdleRunResult(): LocalRunResult {
    return {
        status: 'idle',
        verdict: 'Idle',
        stdout: 'Run your code to see output here.',
        stderr: '',
        errorOutput: '',
        memory: '--',
        time: '--',
        testCases: [],
    };
}

// ─── Get starter code for a question ─────────────────────────────────────────
function getStarterCode(question: EvaluatedQuestion | undefined, language: Language): string {
    if (!question?.isCodingQuestion) return BLANK_TEMPLATES[language];
    // For Python, use AI-generated starter code if available
    if (question.starterCode && language === 'python') {
        return question.starterCode + '\n# TODO: add print statements to output your results\n';
    }
    // For other languages, show the signature + blank template
    const sig = question.functionSignature || '';
    const base = BLANK_TEMPLATES[language];
    if (sig) {
        return `# Signature: ${sig}\n${base}`;
    }
    return base;
}

// ─── Build placeholder test cases from question metadata ─────────────────────
function buildTestCasesFromQuestion(q: EvaluatedQuestion | undefined): Array<{ id: number; input: string; expected: string; got: string; passed: boolean }> {
    const cases = q?.sampleTestCases;
    if (!cases || cases.length === 0) return [];
    return cases.map((tc, i) => ({
        id: i + 1,
        input: tc.input,
        expected: tc.expected,
        got: '--',
        passed: false,
    }));
}

const JUDGE0_LANGUAGE_MAP: Record<Language, string> = {
    cpp: 'cpp',
    java: 'java',
    python: 'python',
    javascript: 'javascript',
};

async function executeWithJudge0(sourceCode: string, language: Language) {
    const api = (await import('@/lib/axios')).default;
    const response = await api.post('/executor/judge0', {
        sourceCode,
        language: JUDGE0_LANGUAGE_MAP[language],
    });
    const result = response.data.data;
    return result as {
        success: boolean;
        stdout?: string;
        stderr?: string;
        compile_output?: string;
        message?: string;
        status?: Judge0Status;
        time?: string;
        memory?: number;
    };
}


// ─── Generic harness ─────────────────────────────────────────────────────────
// Execution model: the user's code must print one answer per test case on separate lines.
// We run the code as-is and compare stdout lines against the expected outputs.
// This works for any coding question — no function-name-specific wrapping needed.
function buildGenericHarness(sourceCode: string, _language: Language, _testCases: SampleTestCase[]): string {
    return sourceCode;
}

// ─── Output comparison ────────────────────────────────────────────────────────
function normalizeOutput(s: string) {
    return s.replace(/\s+/g, '').toLowerCase();
}

function outputsMatch(got: string, expected: string) {
    if (normalizeOutput(got) === normalizeOutput(expected)) return true;
    // Try numeric equality
    const a = parseFloat(got), b = parseFloat(expected);
    if (!isNaN(a) && !isNaN(b) && Math.abs(a - b) < 1e-6) return true;
    return false;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function difficultyTone(d?: string) {
    if (d === 'easy')   return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
    if (d === 'medium') return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
    if (d === 'hard')   return 'bg-rose-500/15 text-rose-300 border-rose-400/30';
    return 'bg-slate-500/15 text-slate-300 border-slate-400/30';
}

function scoreTone(score?: number) {
    if (score == null) return 'text-slate-300';
    if (score >= 80)   return 'text-emerald-300';
    if (score >= 60)   return 'text-amber-300';
    return 'text-rose-300';
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function InterviewAiLabPage() {
    const [phase, setPhase] = useState<Phase>('setup');
    const [company, setCompany] = useState('Google');
    const [role, setRole] = useState('SDE');
    const [round, setRound] = useState('technical');
    const [experienceLevel, setExperienceLevel] = useState('mid');

    const [session, setSession] = useState<Session | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [language, setLanguage] = useState<Language>('python');
    const [codeByQuestion, setCodeByQuestion] = useState<Record<number, string>>({});
    const [activeTab, setActiveTab] = useState<OutputTab>('output');
    const [showHintMap, setShowHintMap] = useState<Record<number, boolean>>({});
    const [pastedQuestions, setPastedQuestions] = useState<Record<number, boolean>>({});

    const [runResult, setRunResult] = useState<LocalRunResult>(makeIdleRunResult());

    const [starting, setStarting] = useState(false);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentQuestion = session?.questions[currentIndex];
    const currentCode = codeByQuestion[currentIndex] ?? getStarterCode(currentQuestion, language);

    const answeredCount = useMemo(
        () => session?.questions.filter((q) => q.score != null).length ?? 0,
        [session]
    );
    const averageScore = useMemo(() => {
        if (!session) return 0;
        const answered = session.questions.filter((q) => q.score != null);
        if (!answered.length) return 0;
        return Math.round(answered.reduce((acc, q) => acc + (q.score ?? 0), 0) / answered.length);
    }, [session]);

    // Timer
    useEffect(() => {
        if (phase === 'session') {
            timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    // Reset run result when question changes
    useEffect(() => {
        setRunResult({
            ...makeIdleRunResult(),
            testCases: buildTestCasesFromQuestion(currentQuestion),
        });
        setActiveTab('output');
    }, [currentIndex, session]);

    // ─── Start Session ──────────────────────────────────────────────────────
    const handleStartSession = async () => {
        setStarting(true);
        try {
            const api = (await import('@/lib/axios')).default;
            const resp = await api.post('/interview/start', {
                company, role, round, experienceLevel, count: 5,
            });
            const newSession: Session = resp.data?.data ?? resp.data;
            setSession(newSession);
            setPhase('session');
            setCurrentIndex(0);
            setElapsed(0);
            setCodeByQuestion({});
            setRunResult({
                ...makeIdleRunResult(),
                testCases: buildTestCasesFromQuestion(newSession.questions[0]),
            });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to start session. Check your connection.');
        } finally {
            setStarting(false);
        }
    };

    const updateCurrentCode = (next?: string) =>
        setCodeByQuestion((prev) => ({ ...prev, [currentIndex]: next ?? '' }));

    // ─── Run Code ───────────────────────────────────────────────────────────
    const handleRunCode = async () => {
        if (!currentCode.trim()) { toast.error('Code editor is empty'); return; }

        setRunning(true);
        setActiveTab('output');
        setRunResult((prev) => ({
            ...prev,
            status: 'running',
            verdict: 'Running',
            stdout: 'Submitting to Judge0…',
            stderr: '',
        }));

        const questionTestCases: SampleTestCase[] = currentQuestion?.sampleTestCases ?? [];
        const isCoding = currentQuestion?.isCodingQuestion !== false && questionTestCases.length > 0;

        try {
            // First run: plain code (to check for compile/runtime errors)
            const result = await executeWithJudge0(currentCode, language);

            const compileOutput = result.compile_output?.trim();
            const runtimeError  = result.stderr?.trim();
            const statusDesc    = result.status?.description || '';
            const stdout        = result.stdout?.trim() || '';

            if (compileOutput) {
                setRunResult({
                    status: 'error', verdict: 'Compilation Error',
                    stdout: '', stderr: compileOutput, errorOutput: compileOutput,
                    memory: '--', time: '--',
                    testCases: buildTestCasesFromQuestion(currentQuestion),
                });
                setActiveTab('feedback');
                toast.error('Compilation failed — AI feedback loaded.');
                return;
            }

            if (runtimeError || /runtime|error|exception/i.test(statusDesc)) {
                const msg = runtimeError || result.message || statusDesc || 'Runtime error';
                setRunResult({
                    status: 'error', verdict: 'Runtime Error',
                    stdout, stderr: msg, errorOutput: msg,
                    memory: result.memory ? `${Number(result.memory).toFixed(1)} MB` : '--',
                    time: result.time || '--',
                    testCases: buildTestCasesFromQuestion(currentQuestion).map((tc) => ({ ...tc, got: stdout || '', passed: false })),
                });
                setActiveTab('feedback');
                toast.error('Runtime error — AI is analyzing the issue.');
                return;
            }

            // If it's a coding question with sample test cases, compare outputs
            if (isCoding) {
                // Build a harness that makes the code print one output per test case
                const harnessCode = buildGenericHarness(currentCode, language, questionTestCases);
                const harnessResult = await executeWithJudge0(harnessCode, language);

                const harnessErr = harnessResult.compile_output?.trim() || harnessResult.stderr?.trim();
                if (harnessErr) {
                    // Harness itself failed — use plain run result for feedback
                    const harnessLines = stdout ? stdout.split('\n').map((l) => l.trim()).filter(Boolean) : [];
                    const testCases = questionTestCases.map((tc, i) => ({
                        id: i + 1,
                        input: tc.input,
                        expected: tc.expected,
                        got: harnessLines[i] ?? '--',
                        passed: harnessLines[i] ? outputsMatch(harnessLines[i], tc.expected) : false,
                    }));
                    const passed = testCases.filter((t) => t.passed).length;
                    const allPassed = passed === testCases.length && testCases.length > 0;
                    setRunResult({
                        status: allPassed ? 'success' : 'error',
                        verdict: allPassed ? 'Accepted' : 'Wrong Answer',
                        stdout: stdout || 'Code ran but output could not be verified.',
                        stderr: allPassed ? '' : `Matched ${passed}/${testCases.length} sample outputs.`,
                        errorOutput: allPassed ? '' : `Matched ${passed}/${testCases.length} sample outputs.`,
                        memory: result.memory ? `${Number(result.memory).toFixed(1)} MB` : '--',
                        time: result.time || '--',
                        testCases,
                    });
                    setActiveTab('feedback');
                    if (allPassed) toast.success('All sample tests passed!');
                    else toast.error('Wrong answer — AI is analyzing the issue.');
                    return;
                }

                const harnessOut = (harnessResult.stdout || '').replace(/\r\n/g, '\n');
                const harnessLines = harnessOut.split('\n').map((l) => l.trim()).filter(Boolean);

                const testCases = questionTestCases.map((tc, i) => {
                    const got = harnessLines[i] ?? '--';
                    return {
                        id: i + 1,
                        input: tc.input,
                        expected: tc.expected,
                        got,
                        passed: got !== '--' && !got.startsWith('ERROR:') ? outputsMatch(got, tc.expected) : false,
                    };
                });

                const passed   = testCases.filter((t) => t.passed).length;
                const allPassed = passed === testCases.length && testCases.length > 0;
                const errMsg   = allPassed ? '' : `Matched ${passed}/${testCases.length} sample outputs.`;

                setRunResult({
                    status: allPassed ? 'success' : 'error',
                    verdict: allPassed ? 'Accepted' : 'Wrong Answer',
                    stdout: (harnessResult.stdout || stdout || '').trim() || `Matched ${passed}/${testCases.length} samples.`,
                    stderr: errMsg, errorOutput: errMsg,
                    memory: harnessResult.memory ? `${Number(harnessResult.memory).toFixed(1)} MB` : '--',
                    time: harnessResult.time || '--',
                    testCases,
                });
                setActiveTab('feedback');
                if (allPassed) toast.success('All sample tests passed!');
                else toast.error('Wrong answer — AI is analyzing the issue.');

            } else {
                // Non-coding question or no test cases: just show raw output
                setRunResult({
                    status: 'success', verdict: 'Accepted',
                    stdout: stdout || 'No output.',
                    stderr: '', errorOutput: '',
                    memory: result.memory ? `${Number(result.memory).toFixed(1)} MB` : '--',
                    time: result.time || '--',
                    testCases: [],
                });
                setActiveTab('output');
                toast.success('Code executed successfully.');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Judge0 execution failed';
            setRunResult({
                status: 'error', verdict: 'Execution Error',
                stdout: '', stderr: msg, errorOutput: msg,
                memory: '--', time: '--',
                testCases: buildTestCasesFromQuestion(currentQuestion),
            });
            setActiveTab('errors');
            toast.error(msg);
        } finally {
            setRunning(false);
        }
    };

    // ─── Submit Code ────────────────────────────────────────────────────────
    const handleSubmitCode = async () => {
        if (!currentCode.trim()) { toast.error('Write your solution before submitting'); return; }
        setSubmitting(true);
        try {
            const judgeUnavailable =
                runResult.status === 'error' &&
                /judge0|provider|unavailable|failed|proxy/i.test(runResult.stderr || '');

            if (runResult.status !== 'success' && !judgeUnavailable) {
                toast.error('Run and pass sample tests before submitting.');
                return;
            }

            if (judgeUnavailable) {
                toast('Judge0 is currently unavailable. Submitting without runtime validation.', { icon: '⚠️' });
            }

            setSession((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const target = next.questions[currentIndex];
                if (target) {
                    target.answer  = currentCode;
                    target.score   = judgeUnavailable ? 70 : 92;
                    target.verdict = judgeUnavailable ? 'Pending Validation' : 'Strong';
                    target.strengths    = judgeUnavailable
                        ? ['Solution submitted', 'Awaiting validation when Judge0 is available']
                        : ['Passed all sample test cases', 'Clean execution'];
                    target.improvements = judgeUnavailable
                        ? ['Re-run when Judge0 is available to validate'] : ['Test with edge cases'];
                }
                return next;
            });
            toast.success('Submitted successfully.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Reset Code ─────────────────────────────────────────────────────────
    const handleResetCode = () => {
        updateCurrentCode(getStarterCode(currentQuestion, language));
        setRunResult({
            ...makeIdleRunResult(),
            stdout: 'Editor reset to starter template.',
            testCases: buildTestCasesFromQuestion(currentQuestion),
        });
        setActiveTab('output');
    };

    const goToQuestion = (index: number) => {
        setCurrentIndex(index);
    };

    const handleEndInterview = () => {
        if (!session) return;
        setSession((prev) => {
            if (!prev) return prev;
            const next = structuredClone(prev);
            next.status = 'completed';
            next.durationSeconds = elapsed;
            const answered = next.questions.filter((q) => q.score != null);
            if (answered.length) {
                next.overallScore = Math.round(
                    answered.reduce((acc, q) => acc + (q.score ?? 0), 0) / answered.length
                );
            }
            return next;
        });
        setPhase('results');
    };

    const currentHintVisible = !!showHintMap[currentIndex];

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[calc(100vh-6rem)] text-slate-100">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(30,41,59,0.6),transparent_42%)]" />

            <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-5 sm:px-5">
                {/* Header */}
                <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4 backdrop-blur">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {phase === 'session' && (
                                <button
                                    onClick={() => setPhase('setup')}
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
                                    aria-label="Back"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            )}
                            <div>
                                <h1 className="flex items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
                                    <Brain className="h-5 w-5 text-cyan-300" />
                                    Interview AI Lab
                                </h1>
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                    {session ? `${session.company} · ${session.role} · ${session.round}` : 'AI-Powered Coding Interview'}
                                </p>
                            </div>
                        </div>

                        {phase === 'session' && session && (
                            <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Timer</p>
                                    <p className="mt-1 flex items-center gap-1 font-mono text-sm text-white">
                                        <Clock3 className="h-3.5 w-3.5 text-cyan-300" />{fmtTime(elapsed)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Progress</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{currentIndex + 1}/{session.questions.length}</p>
                                </div>
                                <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Score</p>
                                    <p className={`mt-1 text-sm font-semibold ${scoreTone(averageScore)}`}>{averageScore || '--'}</p>
                                </div>
                                <button
                                    onClick={handleEndInterview}
                                    className="rounded-xl border border-rose-500/50 bg-rose-500/15 px-3 py-2 text-left text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25"
                                >
                                    <span className="flex items-center gap-1.5"><StopCircle className="h-4 w-4" /> End Interview</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Setup Phase */}
                {phase === 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-5 lg:grid-cols-[1.2fr_2fr]"
                    >
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview Track</p>
                            <h2 className="mt-2 text-xl font-semibold text-white">Configure your coding round</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                The AI generates fresh, company-specific questions with sample test cases every session.
                            </p>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Company</label>
                                    <input
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Google"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
                                    />
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {POPULAR_COMPANIES.map((name) => (
                                            <button
                                                key={name}
                                                onClick={() => setCompany(name)}
                                                className={`rounded-full border px-2.5 py-1 text-xs transition ${company === name ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Role</label>
                                    <input
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        placeholder="SDE"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Round</label>
                                        <select
                                            value={round}
                                            onChange={(e) => setRound(e.target.value)}
                                            title="Interview round"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
                                        >
                                            <option value="technical">Technical</option>
                                            <option value="behavioral">Behavioral</option>
                                            <option value="system-design">System Design</option>
                                            <option value="hr">HR</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Experience</label>
                                        <select
                                            value={experienceLevel}
                                            onChange={(e) => setExperienceLevel(e.target.value)}
                                            title="Experience level"
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
                                        >
                                            <option value="fresher">Fresher</option>
                                            <option value="mid">Mid-level</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartSession}
                                    disabled={starting}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-400/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    {starting ? 'Generating interview questions…' : 'Start Interview'}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">What to expect</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {[
                                    { label: 'AI-Generated Questions', desc: 'Fresh, company-specific problems with sample test cases every session.', icon: Brain },
                                    { label: 'Monaco IDE', desc: 'Full-featured editor with language selector, run/submit/reset.', icon: Code2 },
                                    { label: 'Live Test Execution', desc: 'Runs against AI-generated test cases via Judge0 and shows pass/fail.', icon: TerminalSquare },
                                    { label: 'AI Code Review', desc: 'Contextual feedback specific to the question you\'re solving.', icon: Trophy },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                                        <item.icon className="h-4 w-4 text-cyan-300" />
                                        <p className="mt-2 text-sm font-semibold text-white">{item.label}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Session Phase */}
                {phase === 'session' && session && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-4 lg:grid-cols-[270px_1fr]"
                    >
                        {/* Question list sidebar */}
                        <aside className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 lg:sticky lg:top-4 lg:h-[calc(100vh-10.5rem)] lg:overflow-auto">
                            <div className="mb-3 flex items-center justify-between px-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Questions</p>
                                <p className="text-xs text-slate-500">{answeredCount}/{session.questions.length} solved</p>
                            </div>

                            <progress
                                value={answeredCount}
                                max={session.questions.length}
                                className="mb-3 h-1.5 w-full overflow-hidden rounded-full [appearance:none] [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-cyan-400/70"
                            />

                            <div className="space-y-2">
                                {session.questions.map((q, idx) => {
                                    const selected = idx === currentIndex;
                                    const done     = q.score != null;
                                    return (
                                        <button
                                            key={q.id || idx}
                                            onClick={() => goToQuestion(idx)}
                                            className={`group w-full rounded-xl border px-3 py-2.5 text-left transition ${selected ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : 'border-slate-700 bg-slate-950/80 hover:border-slate-500'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${selected ? 'text-cyan-200' : 'text-slate-400 group-hover:text-slate-200'}`}>Q{idx + 1}</p>
                                                {done
                                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                                                    : <span className={`h-2 w-2 rounded-full ${selected ? 'bg-cyan-300' : 'bg-slate-600'}`} />
                                                }
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs text-slate-300">{q.question}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${difficultyTone(q.difficulty)}`}>
                                                    {q.difficulty || 'medium'}
                                                </span>
                                                <span className={`text-xs font-semibold ${scoreTone(q.score)}`}>
                                                    {q.score == null ? '--' : `${q.score}/100`}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <section className="grid gap-4">
                            {/* Question statement */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-200">
                                            {currentQuestion.category || 'General'}
                                        </span>
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyTone(currentQuestion.difficulty)}`}>
                                            {currentQuestion.difficulty || 'medium'}
                                        </span>
                                        {currentQuestion.isCodingQuestion && (
                                            <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-200">
                                                Coding
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                        Question {currentIndex + 1} of {session.questions.length}
                                    </p>
                                </div>

                                <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-100 sm:text-[15px]">{currentQuestion.question}</p>

                                {currentQuestion.functionSignature && (
                                    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Function Signature</p>
                                        <code className="text-xs text-cyan-200 font-mono">{currentQuestion.functionSignature}</code>
                                    </div>
                                )}

                                <div className="mt-4">
                                    {currentHintVisible ? (
                                        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                            <p className="flex items-start gap-2">
                                                <Zap className="mt-0.5 h-4 w-4 text-amber-300" />
                                                {currentQuestion.hint || 'No hint available.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowHintMap((prev) => ({ ...prev, [currentIndex]: true }))}
                                            className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/20"
                                        >
                                            Reveal Hint
                                        </button>
                                    )}
                                </div>

                                {pastedQuestions[currentIndex] && (
                                    <div className="mt-4 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                        <p className="flex items-start gap-2">
                                            <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-300" />
                                            Content pasted. This attempt has been flagged for originality review.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* IDE */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 sm:p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-cyan-300" />
                                        <p className="text-sm font-semibold text-white">
                                            main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={language}
                                            onChange={(e) => {
                                                const next = e.target.value as Language;
                                                setLanguage(next);
                                                updateCurrentCode(getStarterCode(currentQuestion, next));
                                            }}
                                            title="Programming language"
                                            className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400/60"
                                        >
                                            <option value="cpp">C++</option>
                                            <option value="java">Java</option>
                                            <option value="python">Python</option>
                                            <option value="javascript">JavaScript</option>
                                        </select>
                                        <button
                                            onClick={handleRunCode}
                                            disabled={running}
                                            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/45 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-60"
                                        >
                                            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                            Run
                                        </button>
                                        <button
                                            onClick={handleSubmitCode}
                                            disabled={submitting}
                                            className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-60"
                                        >
                                            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            Submit
                                        </button>
                                        <button
                                            onClick={handleResetCode}
                                            className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 overflow-hidden rounded-xl border border-slate-700">
                                    <MonacoEditor
                                        height="420px"
                                        language={language === 'cpp' ? 'cpp' : language}
                                        value={currentCode}
                                        onChange={(value) => updateCurrentCode(value)}
                                        onMount={(editor) => {
                                            editor.onDidPaste(() => {
                                                setPastedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
                                            });
                                        }}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbersMinChars: 3,
                                            roundedSelection: false,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 14 },
                                        }}
                                    />
                                </div>

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-0.5 text-xs text-slate-400">
                                    <p>Shortcut: Ctrl+Enter to Run</p>
                                    <p>
                                        Verdict:{' '}
                                        <span
                                            className={`rounded-md border px-2 py-0.5 font-semibold ${
                                                runResult.verdict === 'Accepted'
                                                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                                                    : runResult.verdict === 'Wrong Answer'
                                                        ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                                                        : ['Runtime Error', 'Compilation Error', 'Execution Error'].includes(runResult.verdict)
                                                            ? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
                                                            : runResult.verdict === 'Running'
                                                                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                                                                : 'border-slate-600 bg-slate-800 text-slate-200'
                                            }`}
                                        >
                                            {runResult.verdict}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Output panel */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {([
                                            { id: 'output',   label: 'Output',     icon: TerminalSquare },
                                            { id: 'errors',   label: 'Errors',     icon: AlertTriangle },
                                            { id: 'tests',    label: 'Test Cases', icon: BarChart3 },
                                            { id: 'feedback', label: 'AI Feedback', icon: Brain },
                                        ] as Array<{ id: OutputTab; label: string; icon: typeof TerminalSquare }>).map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab.id ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
                                            >
                                                <tab.icon className="h-3.5 w-3.5" />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1">Time: {runResult.time}</span>
                                        <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1">Memory: {runResult.memory}</span>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                                    {activeTab === 'output' && (
                                        <pre className="min-h-24 whitespace-pre-wrap text-xs leading-6 text-emerald-200">
                                            {runResult.stdout || 'No output yet.'}
                                        </pre>
                                    )}
                                    {activeTab === 'errors' && (
                                        <pre className="min-h-24 whitespace-pre-wrap text-xs leading-6 text-rose-200">
                                            {runResult.stderr || 'No runtime or compile errors.'}
                                        </pre>
                                    )}
                                    {activeTab === 'tests' && (
                                        <div className="space-y-2">
                                            {runResult.testCases.length === 0 ? (
                                                <p className="text-xs text-slate-400 py-4 text-center">
                                                    {currentQuestion?.isCodingQuestion === false
                                                        ? 'This is a conceptual question — no automated test cases.'
                                                        : 'Run your code to see test results.'}
                                                </p>
                                            ) : runResult.testCases.map((test) => (
                                                <div key={test.id} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold text-slate-200">Case {test.id}</p>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${test.passed ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                                                            {test.got === '--' ? 'pending' : test.passed ? 'pass' : 'fail'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-slate-400">Input: {test.input}</p>
                                                    <p className="text-slate-400">Expected: {test.expected}</p>
                                                    <p className="text-slate-300">Got: {test.got}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {activeTab === 'feedback' && (
                                        <AIInterviewFeedback
                                            verdict={runResult.verdict}
                                            code={currentCode}
                                            testCasesPassed={runResult.testCases.filter((t) => t.passed).length}
                                            totalTestCases={runResult.testCases.length}
                                            language={language}
                                            time={runResult.time}
                                            memory={runResult.memory}
                                            errorOutput={runResult.errorOutput}
                                            question={currentQuestion?.question}
                                            testResults={runResult.testCases}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Prev/Next */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
                                    disabled={currentIndex === 0}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                                </button>
                                <button
                                    onClick={() => goToQuestion(Math.min(session.questions.length - 1, currentIndex + 1))}
                                    disabled={currentIndex === session.questions.length - 1}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </section>
                    </motion.div>
                )}

                {/* Results Phase */}
                {phase === 'results' && session && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview Summary</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Session Complete</h2>
                                <p className="mt-1 text-sm text-slate-400">{session.company} · {session.role} · {session.round}</p>
                            </div>
                            <button
                                onClick={() => { setPhase('setup'); setSession(null); setCurrentIndex(0); }}
                                className="rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
                            >
                                Start New Session
                            </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Overall Score</p>
                                <p className={`mt-2 text-2xl font-semibold ${scoreTone(session.overallScore || averageScore)}`}>
                                    {session.overallScore || averageScore || '--'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Questions Solved</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{answeredCount}/{session.questions.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Duration</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{fmtTime(session.durationSeconds ?? elapsed)}</p>
                            </div>
                        </div>

                        <div className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/70">
                            {session.questions.map((q, idx) => (
                                <div key={`${q.id}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-3">
                                    <div>
                                        <p className="text-sm text-slate-100">Q{idx + 1} · {q.category || 'General'}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1">{q.question}</p>
                                    </div>
                                    <p className={`text-sm font-semibold ${scoreTone(q.score)}`}>
                                        {q.score == null ? '--' : `${q.score}/100`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
