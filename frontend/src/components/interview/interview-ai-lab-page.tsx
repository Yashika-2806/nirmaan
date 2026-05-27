'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import TestCasesPanel, { type TestCaseResult } from './test-cases-panel';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
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
    testCases: TestCaseResult[];
}

interface InterviewAiLabPageProps {
    proctorActive?:          boolean;
    onPasteDetected?:        (chars: number) => void;
    onRequestSubmitConfirm?: () => void;
    onSessionCreated?:       (sessionId: string, company: string, role: string) => void;
    onStatsUpdate?:          (testCasePct: number, aiCodeScore: number) => void;
    /** Called after each question is submitted with the raw code for plagiarism analysis. */
    onCodeSubmitted?:        (questionId: string, rawCode: string) => void;
    /** Called after Run to update pass/total counts in submission confirm dialog. */
    onTestResults?:          (passed: number, total: number) => void;
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

    // Python: use the AI-provided starter as-is — it already has function stub +
    // 3 print() test calls, so it's immediately runnable and produces 3 output lines.
    if (question.starterCode && language === 'python') {
        return question.starterCode;
    }

    // Other languages: build a template with test cases listed as comments
    const sig = question.functionSignature || '';
    const cases = question.sampleTestCases ?? [];
    const casesComment = cases.length > 0
        ? cases.map((tc, i) =>
            language === 'java'
                ? `    // Test ${i + 1}: ${tc.input}  →  expected: ${tc.expected}`
                : `// Test ${i + 1}: ${tc.input}  →  expected: ${tc.expected}`
          ).join('\n')
        : '';

    if (language === 'javascript') {
        const sigComment = sig ? `// Signature: ${sig}\n` : '';
        return `${sigComment}${casesComment ? casesComment + '\n\n' : ''}// Write your solution and console.log each test case output\nfunction solution() {\n\n}\n`;
    }
    if (language === 'java') {
        const sigComment = sig ? `    // Signature: ${sig}\n` : '';
        return `class Solution {\n${sigComment}${casesComment ? casesComment + '\n' : ''}\n    // Write your solution here\n    // Use System.out.println() for output\n}\n`;
    }
    if (language === 'cpp') {
        const sigComment = sig ? `// Signature: ${sig}\n` : '';
        return `#include <bits/stdc++.h>\nusing namespace std;\n\n${sigComment}${casesComment ? casesComment + '\n\n' : ''}// Write your solution here\n// Use cout << ... << endl; for each test case output\n`;
    }
    return BLANK_TEMPLATES[language];
}

// ─── Build placeholder test cases from question metadata ─────────────────────
function buildTestCasesFromQuestion(q: EvaluatedQuestion | undefined): TestCaseResult[] {
    const cases = q?.sampleTestCases;
    if (!cases || cases.length === 0) return [];
    return cases.map((tc, i) => ({
        id:       i + 1,
        input:    tc.input,
        expected: tc.expected,
        output:   '--',
        got:      '--',
        passed:   false,
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
export default function InterviewAiLabPage({
    proctorActive          = false,
    onPasteDetected,
    onRequestSubmitConfirm,
    onSessionCreated,
    onStatsUpdate,
    onCodeSubmitted,
    onTestResults,
}: InterviewAiLabPageProps = {}) {
    const [phase, setPhase] = useState<Phase>('setup');
    const [company, setCompany] = useState('Google');
    const [role, setRole] = useState('SDE');
    const [round, setRound] = useState('technical');
    const [experienceLevel, setExperienceLevel] = useState('mid');

    const [session, setSession] = useState<Session | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [language, setLanguage] = useState<Language>('python');
    const [codeByQuestion, setCodeByQuestion] = useState<Record<number, string>>({});
    const [activeTab, setActiveTab] = useState<OutputTab>('tests');
    const [showHintMap, setShowHintMap] = useState<Record<number, boolean>>({});
    const [pastedQuestions, setPastedQuestions] = useState<Record<number, boolean>>({});
    const [violationCount, setViolationCount] = useState(0);
    const [showViolationOverlay, setShowViolationOverlay] = useState(false);

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

    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Apply stream to video element
    useEffect(() => {
        if (phase === 'session' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [phase]);

    // Proctoring and Tab Switching Prevention
    useEffect(() => {
        if (phase === 'session') {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    setViolationCount((c) => c + 1);
                    setShowViolationOverlay(true);
                    setPastedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
                    onPasteDetected?.(0);
                }
            };
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                    setViolationCount((c) => c + 1);
                    setShowViolationOverlay(true);
                    setPastedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
                    document.documentElement.requestFullscreen?.().catch(() => {});
                }
            };
            // Block keyboard shortcuts for tab switching
            const handleKeyDown = (e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'Tab' || e.key === 't' || e.key === 'w' || e.key === 'n')) {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.error('🚨 Keyboard shortcuts are disabled during the interview!');
                }
                if (e.key === 'F11' || (e.altKey && e.key === 'Tab') || (e.altKey && e.key === 'F4')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            // Block right-click
            const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('keydown', handleKeyDown, true);
            document.addEventListener('contextmenu', handleContextMenu);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
                document.removeEventListener('keydown', handleKeyDown, true);
                document.removeEventListener('contextmenu', handleContextMenu);
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }
            };
        }
    }, [phase]);

    // Reset run result when question changes
    useEffect(() => {
        setRunResult({
            ...makeIdleRunResult(),
            testCases: buildTestCasesFromQuestion(currentQuestion),
        });
        setActiveTab('tests');
    }, [currentIndex, session]);

    // ─── Start Session ──────────────────────────────────────────────────────
    const { isAuthenticated } = useAuthStore();

    const handleStartSession = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to start an interview');
            return;
        }

        if (!company.trim() || !role.trim()) {
            toast.error('Please fill in Company and Role');
            return;
        }

        // 1. Request Fullscreen synchronously
        if (document.documentElement.requestFullscreen) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (err) {
                console.warn('Fullscreen request blocked', err);
            }
        }

        // 2. Request Camera & Mic synchronously
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } else {
                toast.error('Camera/Mic not supported on this browser. Proceeding without proctoring.', { duration: 5000 });
            }
        } catch (err) {
            console.error('Proctoring error:', err);
            toast.error('Camera/Mic access denied or unavailable. Proceeding without strict proctoring.', { duration: 5000, icon: '⚠️' });
            // Let them proceed for testing purposes even if proctoring fails
        }

        setStarting(true);
        try {
            const api = (await import('@/lib/axios')).default;

            const resp = await api.post('/interview/start', {
                company: company.trim(),
                role: role.trim(),
                round,
                experienceLevel,
                count: 5,
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
            // Notify parent shell so ProctorSession is linked to this InterviewSession
            onSessionCreated?.(newSession._id, newSession.company, newSession.role);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to start session. Check your connection.';
            console.error('[InterviewAiLab] Start session error:', { error: err, message: errorMsg });
            toast.error(errorMsg);
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
        // Treat as coding question unless explicitly flagged as non-coding (system design, behavioral, hr)
        const isExplicitlyNonCoding = currentQuestion?.isCodingQuestion === false;
        const hasTestCases = questionTestCases.length > 0;
        const isCodingRun = !isExplicitlyNonCoding;

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
                    memory: result.memory ? `${(Number(result.memory) / 1024).toFixed(1)} MB` : '--',
                    time: result.time || '--',
                    testCases: buildTestCasesFromQuestion(currentQuestion).map((tc) => ({ ...tc, output: stdout || '', got: stdout || '', passed: false })),
                });
                setActiveTab('feedback');
                toast.error('Runtime error — AI is analyzing the issue.');
                return;
            }

            if (isCodingRun && hasTestCases) {
                // Has AI-generated test cases → compare stdout lines against expected outputs
                const stdoutLines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
                const testCases = questionTestCases.map((tc, i) => {
                    const got = stdoutLines[i] ?? '--';
                    return {
                        id:       i + 1,
                        input:    tc.input,
                        expected: tc.expected,
                        output:   got,
                        got,
                        passed: got !== '--' && !got.startsWith('ERROR:') ? outputsMatch(got, tc.expected) : false,
                    };
                });
                const passed    = testCases.filter((t) => t.passed).length;
                const allPassed = passed === testCases.length && testCases.length > 0;
                const errMsg    = allPassed ? '' : `Matched ${passed}/${testCases.length} sample outputs.`;

                setRunResult({
                    status: allPassed ? 'success' : 'error',
                    verdict: allPassed ? 'Accepted' : 'Wrong Answer',
                    stdout: stdout || `Ran. Matched ${passed}/${testCases.length} samples.`,
                    stderr: errMsg, errorOutput: errMsg,
                    memory: result.memory ? `${(Number(result.memory) / 1024).toFixed(1)} MB` : '--',
                    time: result.time || '--',
                    testCases,
                });
                setActiveTab(allPassed ? 'tests' : 'feedback');
                onTestResults?.(passed, testCases.length);
                if (allPassed) toast.success('All sample tests passed!');
                else toast.error('Wrong answer — AI is analyzing the issue.');

            } else if (isCodingRun && !hasTestCases) {
                // Coding question but no test cases yet (session generated without them)
                // Show code output and let AI feedback analyze it
                setRunResult({
                    status: 'success', verdict: 'Accepted',
                    stdout: stdout || 'Code ran with no output.',
                    stderr: '', errorOutput: '',
                    memory: result.memory ? `${(Number(result.memory) / 1024).toFixed(1)} MB` : '--',
                    time: result.time || '--',
                    testCases: [], // empty — no test cases from this session
                });
                setActiveTab('feedback');
                toast.success('Code ran — AI is reviewing your solution.');

            } else {
                // Explicitly non-coding question (system design, behavioral, hr)
                setRunResult({
                    status: 'success', verdict: 'Accepted',
                    stdout: stdout || 'No output.',
                    stderr: '', errorOutput: '',
                    memory: result.memory ? `${(Number(result.memory) / 1024).toFixed(1)} MB` : '--',
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
        if (!session) { toast.error('No active session'); return; }
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

            const api = (await import('@/lib/axios')).default;

            // ── Step 1: AI code evaluation ──────────────────────────────────
            let evalData: any = null;
            try {
                const evalResp = await api.post('/interview/evaluate-code', {
                    code: currentCode,
                    language: JUDGE0_LANGUAGE_MAP[language],
                    verdict: runResult.verdict,
                    errorOutput: runResult.errorOutput || '',
                    question: currentQuestion?.question || '',
                    testResults: runResult.testCases.map(tc => ({
                        id: tc.id,
                        input: tc.input,
                        expected: tc.expected,
                        got: tc.output,
                        passed: tc.passed,
                    })),
                    executionTime: runResult.time,
                    memory: runResult.memory,
                });
                evalData = evalResp.data?.data;
            } catch {
                // Non-critical — proceed with run-result based score
            }

            const aiScore: number = evalData?.score ?? (judgeUnavailable ? 60 : (runResult.verdict === 'Accepted' ? 80 : 40));
            const aiVerdict: string = evalData?.verdict || runResult.verdict;
            const aiStrengths: string[] = evalData?.strengths || (runResult.verdict === 'Accepted' ? ['Passed sample tests'] : ['Code submitted']);
            const aiImprovements: string[] = evalData?.improvements || ['Review test edge cases'];

            // ── Step 2: Persist answer via /interview/evaluate ──────────────
            try {
                await api.post('/interview/evaluate', {
                    sessionId: session._id,
                    questionIndex: currentIndex,
                    answer: currentCode,
                });
            } catch {
                // Non-critical if evaluation endpoint fails — update local state anyway
            }

            // ── Step 3: Update local session state ──────────────────────────
            setSession((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const target = next.questions[currentIndex];
                if (target) {
                    target.answer       = currentCode;
                    target.score        = aiScore;
                    target.verdict      = aiVerdict;
                    target.strengths    = aiStrengths;
                    target.improvements = aiImprovements;
                }
                return next;
            });

            // Switch to feedback tab if we have AI data
            if (evalData) setActiveTab('feedback');
            // Report real scoring to parent proctor shell
            const passedCount = runResult.testCases.filter(tc => tc.passed).length;
            const totalCount  = runResult.testCases.length || 1;
            onStatsUpdate?.(Math.round((passedCount / totalCount) * 100), aiScore);
            // Pass raw code for plagiarism detection (use question ID or index as key)
            const qId = currentQuestion?.id || String(currentIndex);
            onCodeSubmitted?.(qId, currentCode);
            toast.success(`Submitted! Score: ${aiScore}/100`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Submission failed');
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

    const handleEndInterview = async () => {
        if (!session) return;
        try {
            const api = (await import('@/lib/axios')).default;
            // Persist session completion to backend
            await api.post('/interview/complete', {
                sessionId: session._id,
                durationSeconds: elapsed,
            }).catch(() => { /* non-critical */ });
        } catch { /* ignore network errors */ }

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
        <div className={`${phase === 'session' ? 'h-screen flex flex-col' : 'min-h-[calc(100vh-6rem)]'} text-slate-100`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(30,41,59,0.6),transparent_42%)]" />

            <div className={`relative mx-auto flex w-full ${phase === 'session' ? 'h-full max-w-none flex-col px-0 py-0' : 'max-w-[1600px] flex-col gap-5 px-3 py-5 sm:px-5'}`}>
                {phase === 'session' && (
                    <div className="fixed top-20 right-6 z-[9999] overflow-hidden rounded-xl border border-rose-500/40 bg-slate-900 shadow-2xl shadow-black">
                        <div className="flex items-center justify-between bg-rose-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                                Proctoring Active
                            </span>
                        </div>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-32 w-48 object-cover bg-black"
                        />
                    </div>
                )}
                {/* ── Immersive Interview Header ─────────────────────────── */}
                <div className={`overflow-hidden border backdrop-blur-md transition-colors ${phase === 'session' ? 'rounded-none' : 'rounded-2xl'} ${
                    phase === 'session' && elapsed > 0 && (3600 - elapsed) < 300
                        ? 'border-rose-500/50 bg-rose-950/30'   // <5 min warning
                        : 'border-slate-700/70 bg-slate-950/80'
                }`}>
                    <div className={`flex flex-wrap items-center justify-between gap-3 ${phase === 'session' ? 'px-4 py-2' : 'px-4 py-3'}`}>
                        {/* Left: brand + session info */}
                        <div className="flex items-center gap-3">
                            {phase === 'session' && (
                                <button onClick={() => setPhase('setup')} aria-label="Back"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 transition hover:border-slate-500 hover:text-white">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
                                    <Brain className="h-4 w-4 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-tight">
                                        {session ? `${session.company} — ${session.role}` : 'Interview AI Lab'}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">
                                        {session ? `${session.round} · ${session.experienceLevel}` : 'AI-Powered Coding Interview'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Center: question dots + progress (session only) */}
                        {phase === 'session' && session && (
                            <div className="hidden items-center gap-2 md:flex">
                                {session.questions.map((q, i) => (
                                    <button key={i} onClick={() => goToQuestion(i)} title={`Q${i + 1}`}
                                        className={`h-2 rounded-full transition-all ${
                                            i === currentIndex ? 'w-6 bg-cyan-400'
                                            : q.score != null ? 'w-2 bg-emerald-400/70'
                                            : 'w-2 bg-slate-600 hover:bg-slate-500'
                                        }`}
                                    />
                                ))}
                                <span className="ml-2 text-xs text-slate-500">
                                    {answeredCount}/{session.questions.length} solved
                                </span>
                            </div>
                        )}

                        {/* Right: timer + score + end button */}
                        {phase === 'session' && session && (
                            <div className="flex items-center gap-3">
                                {/* Live timer */}
                                <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold transition-colors ${
                                    (3600 - elapsed) < 300
                                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                        : (3600 - elapsed) < 600
                                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                        : 'border-slate-700 bg-slate-900 text-white'
                                }`}>
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {fmtTime(elapsed)}
                                </div>

                                {/* Score badge */}
                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5">
                                    <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                                    <span className={`text-sm font-bold ${scoreTone(averageScore)}`}>
                                        {averageScore ?? '--'}
                                    </span>
                                </div>

                                {/* End interview */}
                                <button onClick={handleEndInterview}
                                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 active:scale-95">
                                    <StopCircle className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">End Interview</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Progress bar (session only) */}
                    {phase === 'session' && session && (
                        <div className="h-0.5 w-full bg-slate-800">
                            <motion.div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                animate={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    )}
                </div>

                {/* ── Setup Phase ───────────────────────────────────────── */}
                {phase === 'setup' && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid gap-5 lg:grid-cols-[420px_1fr]"
                    >
                        {/* Left: Config panel */}
                        <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70">
                            <div className="border-b border-slate-700/60 bg-gradient-to-r from-cyan-500/8 to-blue-500/8 px-5 py-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Configure Interview</p>
                                <h2 className="mt-1 text-xl font-bold text-white">Set up your session</h2>
                                <p className="mt-1 text-xs text-slate-400">AI generates fresh, company-specific questions every session.</p>
                            </div>

                            <div className="space-y-4 p-5">
                                {/* Company */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Company</label>
                                    <input
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="e.g. Google"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20"
                                    />
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {POPULAR_COMPANIES.map((name) => (
                                            <button key={name} onClick={() => setCompany(name)}
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                                    company === name
                                                        ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                                                        : 'border-slate-700 bg-slate-900/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                                }`}
                                            >{name}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Role</label>
                                    <input
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        placeholder="e.g. Software Engineer II"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20"
                                    />
                                </div>

                                {/* Round + Experience */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Round</label>
                                        <select value={round} onChange={(e) => setRound(e.target.value)}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60">
                                            <option value="technical">Technical</option>
                                            <option value="behavioral">Behavioral</option>
                                            <option value="system-design">System Design</option>
                                            <option value="hr">HR</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Experience</label>
                                        <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60">
                                            <option value="fresher">Fresher</option>
                                            <option value="mid">Mid-level</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Start button */}
                                <button
                                    onClick={handleStartSession}
                                    disabled={starting || !company.trim() || !role.trim()}
                                    className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                                >
                                    {/* Shimmer */}
                                    {!starting && <div className="absolute inset-0 -skew-x-12 translate-x-[-110%] bg-white/10 transition-transform duration-500 group-hover:translate-x-[110%]" />}
                                    {starting
                                        ? <><Loader2 className="h-4 w-4 animate-spin" />Generating questions with AI…</>
                                        : <><Sparkles className="h-4 w-4" />Generate Interview &amp; Start<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                                    }
                                </button>
                                {(!company.trim() || !role.trim()) && (
                                    <p className="text-center text-xs text-slate-600">Fill in Company and Role to begin</p>
                                )}
                            </div>
                        </div>

                        {/* Right: What to expect */}
                        <div className="space-y-4">
                            {/* Feature cards */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { icon: Brain,          gradient: 'from-cyan-500 to-blue-600',    title: 'AI-Generated Questions',   desc: 'Fresh, company-specific DSA and system design problems tailored to your role.' },
                                    { icon: Code2,          gradient: 'from-violet-500 to-purple-600', title: 'Monaco IDE',               desc: 'Full IDE with syntax highlighting, autocomplete, and Ctrl+Enter to run.' },
                                    { icon: TerminalSquare, gradient: 'from-emerald-500 to-teal-600', title: 'Real Test Execution',       desc: 'Runs against hidden test cases via Docker sandbox. See per-case verdicts.' },
                                    { icon: Trophy,         gradient: 'from-amber-500 to-orange-600', title: 'AI Code Review',           desc: 'Contextual feedback on correctness, time complexity, and style.' },
                                ].map((item) => (
                                    <motion.div key={item.title}
                                        whileHover={{ y: -2 }}
                                        className="group rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 transition-colors hover:border-slate-600"
                                    >
                                        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient}`}>
                                            <item.icon className="h-4 w-4 text-white" />
                                        </div>
                                        <p className="text-sm font-semibold text-white">{item.title}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Interview flow steps */}
                            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Interview Flow</p>
                                <div className="space-y-3">
                                    {[
                                        { step: '01', label: 'AI generates questions',     desc: 'Company-specific, difficulty-matched coding problems' },
                                        { step: '02', label: 'Proctoring activates',       desc: 'Camera, mic, fullscreen — your integrity is tracked' },
                                        { step: '03', label: 'Code in the IDE',            desc: 'Run against sample tests, iterate, then submit' },
                                        { step: '04', label: 'AI reviews your solution',   desc: 'Correctness, complexity, style, and edge cases' },
                                        { step: '05', label: 'Final report generated',     desc: 'Score, grade, hiring recommendation, and detailed feedback' },
                                    ].map((s, i) => (
                                        <div key={s.step} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-black text-cyan-400">{s.step}</div>
                                                {i < 4 && <div className="mt-1 w-px flex-1 bg-slate-800" />}
                                            </div>
                                            <div className="pb-3">
                                                <p className="text-sm font-semibold text-white">{s.label}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* Session Phase */}
                {phase === 'session' && session && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`grid gap-0 ${phase === 'session' ? 'h-full lg:grid-cols-[270px_1fr]' : 'gap-4 lg:grid-cols-[270px_1fr]'}`}
                    >
                        {/* Question list sidebar */}
                        <aside className={`rounded-2xl border border-slate-700 bg-slate-900/70 p-3 lg:sticky lg:top-0 ${phase === 'session' ? 'lg:h-[calc(100vh-64px)] lg:overflow-y-auto lg:rounded-none' : 'lg:top-4 lg:h-[calc(100vh-10.5rem)]'}`}>
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

                        <section className="h-[calc(100vh-64px)] grid grid-cols-[1fr_1fr] gap-0 overflow-hidden relative">
                            {/* ── Left Panel: Question ─────────────────────── */}
                            <div className="flex flex-col h-full overflow-hidden border-r border-slate-700/60">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* ── Question Statement ───────────────────────────── */}
                            <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 sm:p-6">
                                {/* Subtle background gradient */}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50" />

                                <div className="relative">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-lg border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
                                                {currentQuestion.category || 'General'}
                                            </span>
                                            <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${difficultyTone(currentQuestion.difficulty)}`}>
                                                {currentQuestion.difficulty || 'medium'}
                                            </span>
                                            {currentQuestion.isCodingQuestion && (
                                                <span className="rounded-lg border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-violet-300">
                                                    Coding
                                                </span>
                                            )}
                                        </div>
                                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                            Q{currentIndex + 1} of {session.questions.length}
                                        </p>
                                    </div>

                                    <div className="mt-5 text-sm leading-[1.8] text-slate-200 sm:text-[15px]">
                                        {/* Simple formatting for question text (e.g. bolding Example:, Input:, Output:) */}
                                        {currentQuestion.question.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2 min-h-[1em] whitespace-pre-wrap">
                                                {line.replace(/(Example \d+:|Input:|Output:|Explanation:|Constraints:)/g, '**$1**').split('**').map((part, j) =>
                                                    j % 2 === 1 ? <strong key={j} className="text-cyan-100">{part}</strong> : part
                                                )}
                                            </p>
                                        ))}
                                    </div>

                                    {currentQuestion.functionSignature && (
                                        <div className="mt-5 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/50">
                                            <div className="border-b border-slate-800 bg-slate-900 px-3 py-1.5">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Function Signature</p>
                                            </div>
                                            <div className="px-4 py-3">
                                                <code className="font-mono text-sm text-cyan-300">{currentQuestion.functionSignature}</code>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5">
                                        {currentHintVisible ? (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10">
                                                <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
                                                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Hint</p>
                                                </div>
                                                <div className="px-4 py-3">
                                                    <p className="text-sm text-amber-100/90 leading-relaxed">{currentQuestion.hint || 'No hint available for this question.'}</p>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <button
                                                onClick={() => setShowHintMap((prev) => ({ ...prev, [currentIndex]: true }))}
                                                className="group flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 hover:text-amber-300 active:scale-95"
                                            >
                                                <Zap className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                                                Reveal Hint
                                            </button>
                                        )}
                                    </div>

                                    {pastedQuestions[currentIndex] && (
                                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                                            <div>
                                                <p className="text-sm font-bold text-rose-300">Integrity Warning</p>
                                                <p className="mt-0.5 text-xs text-rose-200/70">Content paste detected. This attempt has been flagged for originality review.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prev / Next */}
                            <div className="flex items-center justify-between">
                                <button onClick={() => goToQuestion(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"><ChevronLeft className="h-3.5 w-3.5" /> Previous</button>
                                <button onClick={() => goToQuestion(Math.min(session.questions.length - 1, currentIndex + 1))} disabled={currentIndex === session.questions.length - 1} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50">Next <ChevronRight className="h-3.5 w-3.5" /></button>
                            </div>
                                </div>{/* close scrollable */}
                            </div>{/* close left panel */}

                            {/* ── Right Panel: IDE + Tests ────────────────── */}
                            <div className="flex flex-col h-full overflow-hidden">
                            {/* IDE */}
                            <div className="flex-1 min-h-0 flex flex-col p-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-cyan-300" />
                                        <p className="text-sm font-semibold text-white">
                                            main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : 'cpp'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                         {/* Language selector */}
                                         <select
                                             value={language}
                                             onChange={(e) => {
                                                 const next = e.target.value as Language;
                                                 setLanguage(next);
                                                 updateCurrentCode(getStarterCode(currentQuestion, next));
                                             }}
                                             title="Programming language"
                                             className="rounded-lg border border-slate-600/80 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition focus:border-cyan-400/60 hover:border-slate-500"
                                         >
                                             <option value="cpp">C++</option>
                                             <option value="java">Java</option>
                                             <option value="python">Python</option>
                                             <option value="javascript">JavaScript</option>
                                         </select>
                                         <div className="mx-1 h-4 w-px bg-slate-700" />
                                         <button
                                             onClick={handleRunCode}
                                             disabled={running}
                                             title="Run code (Ctrl+Enter)"
                                             className="group flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/12 px-3.5 py-1.5 text-xs font-bold text-cyan-300 transition hover:border-cyan-400/70 hover:bg-cyan-500/20 disabled:opacity-60 active:scale-95"
                                         >
                                             {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                             Run
                                             <kbd className="ml-0.5 hidden rounded bg-slate-700 px-1 py-0.5 text-[9px] text-slate-400 group-hover:text-slate-300 sm:inline">⌘↵</kbd>
                                         </button>
                                         <button
                                             onClick={onRequestSubmitConfirm ? onRequestSubmitConfirm : handleSubmitCode}
                                             disabled={submitting}
                                             title="Submit solution"
                                             className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/12 px-3.5 py-1.5 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/70 hover:bg-emerald-500/20 disabled:opacity-60 active:scale-95"
                                         >
                                             {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                             Submit
                                         </button>
                                         <button
                                             onClick={handleResetCode}
                                             title="Reset to starter code"
                                             className="flex items-center gap-1.5 rounded-lg border border-slate-600/70 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-200 active:scale-95"
                                         >
                                             <RotateCcw className="h-3.5 w-3.5" />
                                             Reset
                                         </button>
                                     </div>
                                </div>

                                <div className="flex-1 min-h-0 mt-2 overflow-hidden rounded-xl border border-slate-700/80 shadow-inner shadow-black/30">
                                    <MonacoEditor
                                        height="100%"
                                        language={language === 'cpp' ? 'cpp' : language}
                                        value={currentCode}
                                        onChange={(value) => updateCurrentCode(value)}
                                        onMount={(editor, monaco) => {
                                            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRunCode());
                                            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                                                () => onRequestSubmitConfirm ? onRequestSubmitConfirm() : handleSubmitCode());
                                            editor.onDidPaste((e: any) => {
                                                setPastedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
                                                const charCount = e?.range ? (e.range.endColumn - e.range.startColumn) : 100;
                                                onPasteDetected?.(charCount);
                                            });
                                            editor.focus();
                                        }}
                                        theme="vs-dark"
                                        options={{
                                            minimap:                    { enabled: false },
                                            fontSize:                   15,
                                            fontFamily:                 "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                            fontLigatures:              true,
                                            lineNumbersMinChars:        3,
                                            roundedSelection:           true,
                                            scrollBeyondLastLine:       false,
                                            automaticLayout:            true,
                                            padding:                    { top: 16, bottom: 16 },
                                            tabSize:                    4,
                                            insertSpaces:               true,
                                            renderLineHighlight:        'gutter',
                                            cursorBlinking:             'smooth',
                                            cursorSmoothCaretAnimation: 'on',
                                            smoothScrolling:            true,
                                            suggestOnTriggerCharacters: true,
                                            quickSuggestions:           { other: true, comments: false, strings: false },
                                            bracketPairColorization:    { enabled: true },
                                            guides:                     { bracketPairs: true, indentation: true },
                                            wordWrap:                   'off',
                                            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
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
                            <div className="shrink-0 h-[240px] border-t border-slate-700 bg-slate-900/70 p-3 flex flex-col overflow-hidden">
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

                                <div className="flex-1 min-h-0 mt-2 rounded-xl border border-slate-700 bg-slate-950 p-3 overflow-y-auto">
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
                                        <TestCasesPanel
                                            testCases={runResult.testCases}
                                            summary={runResult.status !== 'idle' && runResult.testCases.length > 0 ? {
                                                verdict:     runResult.verdict,
                                                totalTests:  runResult.testCases.length,
                                                passedTests: runResult.testCases.filter(t => t.passed).length,
                                                failedTests: runResult.testCases.filter(t => !t.passed).length,
                                            } : null}
                                            isRunning={runResult.status === 'running'}
                                        />
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

                            </div>{/* close right panel */}

                            {/* ── Violation Overlay ──────────────────────── */}
                            {showViolationOverlay && (
                                <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                                    <div className="rounded-2xl border border-rose-500/50 bg-slate-900 p-8 text-center max-w-md">
                                        <ShieldAlert className="mx-auto h-16 w-16 text-rose-400 mb-4" />
                                        <h2 className="text-xl font-bold text-rose-300">⚠️ Integrity Violation #{violationCount}</h2>
                                        <p className="mt-2 text-sm text-slate-300">You left the interview window. This has been recorded.</p>
                                        <p className="mt-1 text-xs text-slate-500">All violations are logged and visible to the interviewer.</p>
                                        <button
                                            onClick={() => { setShowViolationOverlay(false); document.documentElement.requestFullscreen?.().catch(() => {}); }}
                                            className="mt-6 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-6 py-2.5 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/30"
                                        >
                                            Return to Interview
                                        </button>
                                    </div>
                                </div>
                            )}
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
