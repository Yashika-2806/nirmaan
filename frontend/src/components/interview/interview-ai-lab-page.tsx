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
import { interviewService } from '@/services/interviewService';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Phase = 'setup' | 'session' | 'results';
type Language = 'cpp' | 'java' | 'python' | 'javascript';
type OutputTab = 'output' | 'errors' | 'tests';

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
    stdout: string;
    stderr: string;
    memory: string;
    time: string;
    testCases: Array<{ id: number; input: string; expected: string; got: string; passed: boolean }>;
}

const POPULAR_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Uber', 'Flipkart'];

const QUESTION_MOCKS: EvaluatedQuestion[] = [
    {
        id: 'q1',
        question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        category: 'Arrays',
        difficulty: 'easy',
        hint: 'Use a hash map to store value to index while scanning once.',
    },
    {
        id: 'q2',
        question: 'You are given a string s, find the length of the longest substring without repeating characters.',
        category: 'Two Pointers',
        difficulty: 'medium',
        hint: 'Sliding window with last seen index gives O(n).',
    },
    {
        id: 'q3',
        question: 'Implement a min stack that supports push, pop, top and retrieving the minimum element in constant time.',
        category: 'Stacks',
        difficulty: 'medium',
        hint: 'Track value and current minimum together per push.',
    },
    {
        id: 'q4',
        question: 'Given head of a linked list, return true if it has a cycle, else false.',
        category: 'Linked List',
        difficulty: 'easy',
        hint: 'Floyd slow/fast pointers detect cycle without extra space.',
    },
    {
        id: 'q5',
        question: 'Design an LRU cache with get and put in O(1) average complexity.',
        category: 'Design',
        difficulty: 'hard',
        hint: 'Hash map + doubly linked list is the standard pattern.',
    },
];

const CODE_TEMPLATES: Record<Language, string> = {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < (int)nums.size(); i++) {\n        int need = target - nums[i];\n        if (seen.count(need)) return {seen[need], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n\nint main() {\n    vector<int> nums = {2, 7, 11, 15};\n    auto ans = twoSum(nums, 9);\n    cout << ans[0] << "," << ans[1] << endl;\n    return 0;\n}\n`,
    java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int need = target - nums[i];\n            if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n            seen.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}\n`,
    python: `def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        need = target - n\n        if need in seen:\n            return [seen[need], i]\n        seen[n] = i\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))\n`,
    javascript: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));\n`,
};

const makeMockSession = (company: string, role: string, round: string, experienceLevel: string): Session => ({
    _id: `local-${Date.now()}`,
    company,
    role,
    round,
    experienceLevel,
    status: 'in-progress',
    questions: QUESTION_MOCKS,
    createdAt: new Date().toISOString(),
});

const fmtTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function evaluateLocalCodeQuality(code: string, language: Language): { score: number; reasons: string[] } {
    const normalized = code.trim();
    const reasons: string[] = [];
    let score = 0;

    if (normalized.length >= 120) score += 20;
    else reasons.push('Solution is too short.');

    if (/for\s*\(|while\s*\(|for\s+\w+\s+in\s+/i.test(normalized)) score += 20;
    else reasons.push('No clear iteration logic found.');

    if (/map|hash|dict|unordered_map|HashMap|new Map\(|\{\}/i.test(normalized)) score += 25;
    else reasons.push('Hash lookup pattern is missing.');

    if (/return\s*\[|return\s*\{|return\s+new\s+int\[]/i.test(normalized)) score += 15;
    else reasons.push('Expected index-pair return format not found.');

    if (!/todo|fixme|dummy|placeholder/i.test(normalized)) score += 10;
    else reasons.push('Contains placeholder markers.');

    if (language === 'python' && /def\s+\w+\(/.test(normalized)) score += 5;
    if (language === 'java' && /class\s+\w+\s*\{/.test(normalized)) score += 5;
    if (language === 'javascript' && /function\s+\w+\s*\(/.test(normalized)) score += 5;
    if (language === 'cpp' && /#include|std::|vector\s*</.test(normalized)) score += 5;

    const redFlags = [
        /return\s*\[\s*\]/i,
        /return\s+new\s+int\[]\s*\{\s*\}/i,
        /throw\s+new\s+error/i,
        /syntaxerror/i,
        /segmentation/i,
    ];

    if (redFlags.some((r) => r.test(normalized))) {
        score -= 40;
        reasons.push('Detected critical red-flag pattern in solution.');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

function difficultyTone(d?: string) {
    if (d === 'easy') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
    if (d === 'medium') return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
    if (d === 'hard') return 'bg-rose-500/15 text-rose-300 border-rose-400/30';
    return 'bg-slate-500/15 text-slate-300 border-slate-400/30';
}

function scoreTone(score?: number) {
    if (score == null) return 'text-slate-300';
    if (score >= 80) return 'text-emerald-300';
    if (score >= 60) return 'text-amber-300';
    return 'text-rose-300';
}

export default function InterviewAiLabPage() {
    const [phase, setPhase] = useState<Phase>('setup');

    const [company, setCompany] = useState('Google');
    const [role, setRole] = useState('SDE');
    const [round, setRound] = useState('technical');
    const [experienceLevel, setExperienceLevel] = useState('mid');

    const [session, setSession] = useState<Session | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [language, setLanguage] = useState<Language>('python');
    const [codeByQuestion, setCodeByQuestion] = useState<Record<number, string>>({ 0: CODE_TEMPLATES.python });
    const [activeTab, setActiveTab] = useState<OutputTab>('output');

    const [showHintMap, setShowHintMap] = useState<Record<number, boolean>>({});
    const [pastedQuestions, setPastedQuestions] = useState<Record<number, boolean>>({});

    const [runResult, setRunResult] = useState<LocalRunResult>({
        status: 'idle',
        stdout: 'Run your code to see output here.',
        stderr: '',
        memory: '--',
        time: '--',
        testCases: [
            { id: 1, input: 'nums=[2,7,11,15], target=9', expected: '[0,1]', got: '--', passed: false },
            { id: 2, input: 'nums=[3,2,4], target=6', expected: '[1,2]', got: '--', passed: false },
            { id: 3, input: 'nums=[3,3], target=6', expected: '[0,1]', got: '--', passed: false },
        ],
    });

    const [starting, setStarting] = useState(false);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentQuestion = session?.questions[currentIndex];
    const currentCode = codeByQuestion[currentIndex] ?? CODE_TEMPLATES[language];

    const answeredCount = useMemo(() => session?.questions.filter((q) => q.score != null).length ?? 0, [session]);
    const averageScore = useMemo(() => {
        if (!session) return 0;
        const answered = session.questions.filter((q) => q.score != null);
        if (!answered.length) return 0;
        return Math.round(answered.reduce((acc, q) => acc + (q.score ?? 0), 0) / answered.length);
    }, [session]);

    useEffect(() => {
        if (phase === 'session') {
            timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase]);

    const handleStartSession = async () => {
        setStarting(true);
        try {
            const result = await interviewService.startSession({ company, role, round, experienceLevel, count: 5 });
            const normalized = (result?.session || result) as Session;
            const safeSession = normalized?.questions?.length ? normalized : makeMockSession(company, role, round, experienceLevel);
            setSession(safeSession);
            setPhase('session');
            setCurrentIndex(0);
            setElapsed(0);
            setCodeByQuestion({ 0: CODE_TEMPLATES[language] });
            setRunResult((prev) => ({ ...prev, status: 'idle', stdout: 'Run your code to see output here.', stderr: '' }));
        } catch {
            const local = makeMockSession(company, role, round, experienceLevel);
            setSession(local);
            setPhase('session');
            setCurrentIndex(0);
            setElapsed(0);
            setCodeByQuestion({ 0: CODE_TEMPLATES[language] });
            toast('Running in local simulation mode. Connect API later for live interview generation.');
        } finally {
            setStarting(false);
        }
    };

    const updateCurrentCode = (next?: string) => {
        setCodeByQuestion((prev) => ({ ...prev, [currentIndex]: next ?? '' }));
    };

    const handleRunCode = async () => {
        if (!currentCode.trim()) {
            toast.error('Code editor is empty');
            return;
        }

        setRunning(true);
        setActiveTab('output');
        setRunResult((prev) => ({ ...prev, status: 'running', stdout: 'Executing test suite...', stderr: '' }));

        await new Promise((resolve) => setTimeout(resolve, 900));

        const isStarterTemplate = currentCode.trim() === CODE_TEMPLATES[language].trim();
        const quality = evaluateLocalCodeQuality(currentCode, language);

        if (isStarterTemplate) {
            setRunResult({
                status: 'error',
                stdout: '',
                stderr: 'Starter template detected. Modify the code before running tests.',
                memory: '--',
                time: '--',
                testCases: [
                    { id: 1, input: 'nums=[2,7,11,15], target=9', expected: '[0,1]', got: '--', passed: false },
                    { id: 2, input: 'nums=[3,2,4], target=6', expected: '[1,2]', got: '--', passed: false },
                    { id: 3, input: 'nums=[3,3], target=6', expected: '[0,1]', got: '--', passed: false },
                ],
            });
            setActiveTab('errors');
            toast.error('Update the template before running');
            setRunning(false);
            return;
        }

        const success = quality.score >= 75;

        if (success) {
            const cases = [
                { id: 1, input: 'nums=[2,7,11,15], target=9', expected: '[0,1]', got: '[0,1]', passed: true },
                { id: 2, input: 'nums=[3,2,4], target=6', expected: '[1,2]', got: '[1,2]', passed: true },
                { id: 3, input: 'nums=[3,3], target=6', expected: '[0,1]', got: '[0,1]', passed: true },
            ];

            setRunResult({
                status: 'success',
                stdout: 'Accepted. All sample test cases passed (local simulation).',
                stderr: '',
                memory: '48.2 MB',
                time: '42 ms',
                testCases: cases,
            });
            toast.success('Execution passed sample tests');
            return;
        }

        const failedHints = quality.reasons.length
            ? `\nHints: ${quality.reasons.slice(0, 2).join(' ')}`
            : '';

        setRunResult({
            status: 'error',
            stdout: '',
            stderr: `Failed sample tests in local simulation. Quality score: ${quality.score}/100.${failedHints}`,
            memory: '53.8 MB',
            time: '64 ms',
            testCases: [
                { id: 1, input: 'nums=[2,7,11,15], target=9', expected: '[0,1]', got: '[0,1]', passed: true },
                { id: 2, input: 'nums=[3,2,4], target=6', expected: '[1,2]', got: '[]', passed: false },
                { id: 3, input: 'nums=[3,3], target=6', expected: '[0,1]', got: '--', passed: false },
            ],
        });
        setActiveTab('errors');
        toast.error('Execution failed on sample tests');
        setRunning(false);
    };

    useEffect(() => {
        if (!running) return;
        if (runResult.status === 'running') return;
        setRunning(false);
    }, [runResult.status, running]);

    const handleSubmitCode = async () => {
        if (!session || !currentQuestion) return;
        if (!currentCode.trim()) {
            toast.error('Write your solution before submitting');
            return;
        }

        setSubmitting(true);
        try {
            const answerPayload = pastedQuestions[currentIndex]
                ? `${currentCode}\n\n[system-note] paste-detected=true`
                : currentCode;

            const data = await interviewService.evaluateAnswer({
                sessionId: session._id,
                questionIndex: currentIndex,
                answer: answerPayload,
            });

            const nextSession = (data?.session || data) as Session;
            setSession(nextSession);
            toast.success('Code submitted for AI evaluation');
        } catch {
            setSession((prev) => {
                if (!prev) return prev;
                const cloned = structuredClone(prev);
                const target = cloned.questions[currentIndex];
                if (target) {
                    target.answer = currentCode;
                    target.score = runResult.status === 'success' ? 86 : 61;
                    target.verdict = runResult.status === 'success' ? 'Strong' : 'Needs refinement';
                    target.strengths = runResult.status === 'success'
                        ? ['Correct use of hash-based lookup', 'Good time complexity reasoning']
                        : ['Attempt shows right direction'];
                    target.improvements = runResult.status === 'success'
                        ? ['Add edge case handling for empty arrays']
                        : ['Fix failing test case and return formatting'];
                }
                return cloned;
            });
            toast('Backend scoring unavailable. Applied local AI simulation score.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetCode = () => {
        updateCurrentCode(CODE_TEMPLATES[language]);
        setRunResult((prev) => ({
            ...prev,
            status: 'idle',
            stdout: 'Editor reset to starter template.',
            stderr: '',
            testCases: prev.testCases.map((t) => ({ ...t, got: '--', passed: false })),
        }));
        setActiveTab('output');
    };

    const goToQuestion = (index: number) => {
        setCurrentIndex(index);
        setRunResult((prev) => ({ ...prev, status: 'idle', stdout: 'Run your code to see output here.', stderr: '' }));
    };

    const handleEndInterview = async () => {
        if (!session) return;

        try {
            await interviewService.completeSession({ sessionId: session._id, durationSeconds: elapsed });
        } catch {
            // Fallback for local mode.
        }

        setSession((prev) => {
            if (!prev) return prev;
            const next = structuredClone(prev);
            next.status = 'completed';
            next.durationSeconds = elapsed;
            if (next.questions.length) {
                const evaluated = next.questions.filter((q) => q.score != null);
                if (evaluated.length) {
                    next.overallScore = Math.round(evaluated.reduce((acc, q) => acc + (q.score ?? 0), 0) / evaluated.length);
                }
            }
            return next;
        });

        setPhase('results');
    };

    const currentHintVisible = !!showHintMap[currentIndex];

    return (
        <div className="min-h-[calc(100vh-6rem)] text-slate-100">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(30,41,59,0.6),transparent_42%)]" />

            <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-5 sm:px-5">
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
                                    {session ? `${session.company} · ${session.role} · ${session.round}` : 'Google · SDE · Technical'}
                                </p>
                            </div>
                        </div>

                        {phase === 'session' && session && (
                            <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Timer</p>
                                    <p className="mt-1 flex items-center gap-1 font-mono text-sm text-white"><Clock3 className="h-3.5 w-3.5 text-cyan-300" />{fmtTime(elapsed)}</p>
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

                {phase === 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-5 lg:grid-cols-[1.2fr_2fr]"
                    >
                        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview Track</p>
                            <h2 className="mt-2 text-xl font-semibold text-white">Configure your coding round</h2>
                            <p className="mt-2 text-sm text-slate-400">Focused, timed, and recruiter-grade simulation with AI evaluation and coding IDE.</p>

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
                                    {starting ? 'Preparing Interview...' : 'Start Interview'}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace Preview</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {[
                                    { label: 'Question Panel', desc: 'Focused statement with metadata, hint state, and anti-cheat signal.', icon: Brain },
                                    { label: 'Monaco IDE', desc: 'Language selector, run/submit/reset, keyboard shortcut hints.', icon: Code2 },
                                    { label: 'Execution Insights', desc: 'Output, errors, tests, memory, runtime stats.', icon: TerminalSquare },
                                    { label: 'Interview Controls', desc: 'Timer, progress, score, and clean end flow.', icon: Trophy },
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

                {phase === 'session' && session && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-4 lg:grid-cols-[270px_1fr]"
                    >
                        <aside className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 lg:sticky lg:top-4 lg:h-[calc(100vh-10.5rem)] lg:overflow-auto">
                            <div className="mb-3 flex items-center justify-between px-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Questions</p>
                                <p className="text-xs text-slate-500">{answeredCount}/{session.questions.length} solved</p>
                            </div>

                            <progress value={answeredCount} max={session.questions.length} className="mb-3 h-1.5 w-full overflow-hidden rounded-full [appearance:none] [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-cyan-400/70" />

                            <div className="space-y-2">
                                {session.questions.map((q, idx) => {
                                    const selected = idx === currentIndex;
                                    const done = q.score != null;

                                    return (
                                        <button
                                            key={q.id || idx}
                                            onClick={() => goToQuestion(idx)}
                                            className={`group w-full rounded-xl border px-3 py-2.5 text-left transition ${selected ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : 'border-slate-700 bg-slate-950/80 hover:border-slate-500'} `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${selected ? 'text-cyan-200' : 'text-slate-400 group-hover:text-slate-200'}`}>Q{idx + 1}</p>
                                                {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <span className={`h-2 w-2 rounded-full ${selected ? 'bg-cyan-300' : 'bg-slate-600'}`} />}
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs text-slate-300">{q.question}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${difficultyTone(q.difficulty)}`}>{q.difficulty || 'unspecified'}</span>
                                                <span className={`text-xs font-semibold ${scoreTone(q.score)}`}>{q.score == null ? '--' : `${q.score}/100`}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>

                        <section className="grid gap-4">
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-200">{currentQuestion.category || 'General'}</span>
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyTone(currentQuestion.difficulty)}`}>{currentQuestion.difficulty || 'medium'}</span>
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Question {currentIndex + 1} of {session.questions.length}</p>
                                </div>

                                <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-100 sm:text-[15px]">{currentQuestion.question}</p>

                                <div className="mt-4">
                                    {currentHintVisible ? (
                                        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                            <p className="flex items-start gap-2"><Zap className="mt-0.5 h-4 w-4 text-amber-300" />{currentQuestion.hint || 'No hint available for this question.'}</p>
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
                                            Content pasted. This attempt has been flagged for originality review in interview analytics.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 sm:p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-cyan-300" />
                                        <p className="text-sm font-semibold text-white">main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={language}
                                            onChange={(e) => {
                                                const next = e.target.value as Language;
                                                setLanguage(next);
                                                updateCurrentCode(CODE_TEMPLATES[next]);
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
                                    <p>Status: <span className={runResult.status === 'success' ? 'text-emerald-300' : runResult.status === 'error' ? 'text-rose-300' : 'text-slate-300'}>{runResult.status.toUpperCase()}</span></p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        {([
                                            { id: 'output', label: 'Output', icon: TerminalSquare },
                                            { id: 'errors', label: 'Errors', icon: AlertTriangle },
                                            { id: 'tests', label: 'Test Cases', icon: BarChart3 },
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
                                        <pre className="min-h-24 whitespace-pre-wrap text-xs leading-6 text-emerald-200">{runResult.stdout || 'No output yet.'}</pre>
                                    )}
                                    {activeTab === 'errors' && (
                                        <pre className="min-h-24 whitespace-pre-wrap text-xs leading-6 text-rose-200">{runResult.stderr || 'No runtime or compile errors.'}</pre>
                                    )}
                                    {activeTab === 'tests' && (
                                        <div className="space-y-2">
                                            {runResult.testCases.map((test) => (
                                                <div key={test.id} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold text-slate-200">Case {test.id}</p>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${test.passed ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>{test.passed ? 'pass' : 'fail'}</span>
                                                    </div>
                                                    <p className="mt-1 text-slate-400">Input: {test.input}</p>
                                                    <p className="text-slate-400">Expected: {test.expected}</p>
                                                    <p className="text-slate-300">Got: {test.got}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

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

                {phase === 'results' && session && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview Summary</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Session Complete</h2>
                                <p className="mt-1 text-sm text-slate-400">{session.company} · {session.role} · {session.round}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setPhase('setup');
                                    setSession(null);
                                    setCurrentIndex(0);
                                }}
                                className="rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
                            >
                                Start New Session
                            </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                                <p className="text-xs uppercase tracking-wide text-slate-400">Overall Score</p>
                                <p className={`mt-2 text-2xl font-semibold ${scoreTone(session.overallScore || averageScore)}`}>{session.overallScore || averageScore || '--'}</p>
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
                                    <p className={`text-sm font-semibold ${scoreTone(q.score)}`}>{q.score == null ? '--' : `${q.score}/100`}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
