'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import TestCasesPanel, { type TestCaseResult } from './test-cases-panel';
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
import InterviewExecutionService, { ExecutionResult, JobStatus } from '@/services/interviewExecutionService';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Phase = 'setup' | 'session' | 'results';
type Language = 'cpp' | 'java' | 'python' | 'javascript';
type OutputTab = 'output' | 'errors' | 'tests' | 'feedback';
type RunVerdict = 'Idle' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error' | 'Execution Error' | 'Time Limit Exceeded';

interface SampleTestCase {
    input: string;
    expected: string;
}

interface EvaluatedQuestion {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    functionSignature?: string;
    starterCode?: Record<Language, string>;
    isCodingQuestion?: boolean;
    examples?: Array<{ input: string; output: string }>;
}

interface LocalRunResult {
    status: 'idle' | 'running' | 'success' | 'error';
    verdict: RunVerdict;
    stdout: string;
    stderr: string;
    testCases: TestCaseResult[];
    summary?: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
    } | null;
    executionId?: string;
    jobId?: string;
}

interface InterviewAiLabPageProps {
    questionId?: string;
    question?: EvaluatedQuestion;
    sessionId?: string;
    proctorActive?: boolean;
    mediaStream?: MediaStream | null;
    onPasteDetected?: (chars: number) => void;
    onRequestSubmitConfirm?: () => void;
}

const BLANK_TEMPLATES: Record<Language, string> = {
    python: `# Write your solution here\ndef solution():\n    pass\n`,
    javascript: `// Write your solution here\nfunction solution() {\n\n}\n`,
    java: `class Solution {\n    // Write your solution here\n}\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
};

export default function InterviewAiLabPage({
    questionId: initialQuestionId,
    question: initialQuestion,
    sessionId,
    proctorActive = false,
    mediaStream,
    onPasteDetected,
    onRequestSubmitConfirm,
}: InterviewAiLabPageProps) {
    // ─── State ──────────────────────────────────────────────────────────────

    const [phase, setPhase] = useState<Phase>('session');
    const [language, setLanguage] = useState<Language>('python');
    const [code, setCode] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState<EvaluatedQuestion | null>(
        initialQuestion || null
    );
    const [questionId, setQuestionId] = useState<string>(initialQuestionId || '');
    
    // Execution state
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<OutputTab>('tests');
    
    // Initialize test cases from examples if available
    const initialTestCases = useMemo(() => {
        if (!initialQuestion?.examples) return [];
        return initialQuestion.examples.map((ex, i) => ({
            id: i + 1,
            input: ex.input,
            expected: ex.output,
            output: '',
            passed: false,
        }));
    }, [initialQuestion]);

    const [runResult, setRunResult] = useState<LocalRunResult>({
        status: 'idle',
        verdict: 'Idle',
        stdout: '',
        stderr: '',
        testCases: initialTestCases,
        summary: null,
    });
    
    // Job polling
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Effects ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (initialQuestion) {
            setCurrentQuestion(initialQuestion);
            const starterCode = initialQuestion.starterCode?.[language];
            setCode(starterCode || BLANK_TEMPLATES[language]);
        }
    }, [language, initialQuestion]);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Apply media stream and handle tab switching
    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                toast.error('🚨 Tab switching is strictly prohibited!', { duration: 5000 });
                if (onPasteDetected) onPasteDetected(1); // Flag as suspicious
            }
        };
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                toast.error('🚨 Exiting fullscreen is prohibited!', { duration: 5000 });
                if (onPasteDetected) onPasteDetected(1); // Flag as suspicious
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [mediaStream, onPasteDetected]);

    // ─── Execution Handlers ──────────────────────────────────────────────────

    const handleRunCode = async () => {
        if (!code.trim()) {
            toast.error('Code editor is empty');
            return;
        }

        if (!questionId) {
            toast.error('No question selected');
            return;
        }

        setRunning(true);
        setActiveTab('output');
        setRunResult({
            status: 'running',
            verdict: 'Running',
            stdout: 'Submitting code to execution engine...',
            stderr: '',
            testCases: [],
        });

        try {
            const result = await InterviewExecutionService.runCode(
                code,
                language,
                questionId,
                false // sync execution
            ) as ExecutionResult;

            setRunResult({
                status: result.verdict === 'Accepted' ? 'success' : 'error',
                verdict: result.verdict as RunVerdict,
                stdout: result.testCases
                    .map((tc) => `Input: ${tc.input}\nExpected: ${tc.expected}\nGot: ${tc.output || 'N/A'}\n`)
                    .join('\n'),
                stderr: result.testCases.filter((tc) => !tc.passed).map((tc) => tc.error || '').join('\n'),
                testCases: result.testCases.map((tc) => ({
                    id: tc.id || 0,
                    input: tc.input,
                    expected: tc.expected,
                    output: tc.output || '',
                    passed: tc.passed || false,
                })),
                summary: result.summary || null,
                executionId: result.executionId,
            });

            setActiveTab(result.verdict === 'Accepted' ? 'tests' : 'errors');
            if (result.verdict === 'Accepted') {
                toast.success('✅ All sample tests passed!');
            } else {
                toast.error(`❌ ${result.verdict}`);
            }
        } catch (error: any) {
            const message = error?.message || 'Execution failed';
            setRunResult({
                status: 'error',
                verdict: 'Execution Error',
                stdout: '',
                stderr: message,
                testCases: [],
                summary: null,
            });
            setActiveTab('errors');
            toast.error(message);
        } finally {
            setRunning(false);
        }
    };

    const handleSubmitCode = async () => {
        if (!code.trim()) {
            toast.error('Code editor is empty');
            return;
        }

        if (!questionId) {
            toast.error('No question selected');
            return;
        }

        setSubmitting(true);
        setActiveTab('output');
        setRunResult({
            status: 'running',
            verdict: 'Running',
            stdout: 'Submitting code against all test cases...',
            stderr: '',
            testCases: [],
            summary: null,
        });

        try {
            const result = await InterviewExecutionService.submitCode(
                code,
                language,
                questionId,
                sessionId,
                false // sync execution
            ) as ExecutionResult;

            setRunResult({
                status: result.verdict === 'Accepted' ? 'success' : 'error',
                verdict: result.verdict as RunVerdict,
                stdout: result.summary
                    ? `Passed: ${result.summary.passedTests}/${result.summary.totalTests} test cases`
                    : '',
                stderr: result.testCases.filter((tc) => !tc.passed).length > 0
                    ? `Failed: ${result.testCases.filter((tc) => !tc.passed).length} test cases`
                    : '',
                testCases: result.testCases.map((tc) => ({
                    id: tc.id || 0,
                    input: tc.input,
                    expected: tc.expected,
                    output: tc.output || '',
                    passed: tc.passed || false,
                })),
                summary: result.summary || null,
                executionId: result.executionId,
            });

            setActiveTab('tests');
            if (result.verdict === 'Accepted') {
                toast.success('🎉 All test cases passed!');
            } else {
                toast.error(`Result: ${result.verdict}`);
            }
        } catch (error: any) {
            const message = error?.message || 'Submission failed';
            setRunResult({
                status: 'error',
                verdict: 'Execution Error',
                stdout: '',
                stderr: message,
                testCases: [],
                summary: null,
            });
            setActiveTab('errors');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setCode(BLANK_TEMPLATES[language]);
        setRunResult({
            status: 'idle',
            verdict: 'Idle',
            stdout: '',
            stderr: '',
            testCases: initialTestCases,
            summary: null,
        });
        setActiveTab('tests');
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
            {/* Proctoring Video Widget */}
            {mediaStream && (
                <div className="fixed top-20 right-6 z-[9999] overflow-hidden rounded-xl border border-rose-500/40 bg-slate-900 shadow-2xl shadow-black pointer-events-none">
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

            {/* Editor Section */}
            <div className="flex-1 flex flex-col border-r border-slate-700">
                {/* Header */}
                <div className="border-b border-slate-700 bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">
                                {currentQuestion?.title || 'Code Editor'}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {currentQuestion?.difficulty && (
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        currentQuestion.difficulty === 'Easy' ? 'bg-green-900 text-green-200' :
                                        currentQuestion.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                                        'bg-red-900 text-red-200'
                                    }`}>
                                        {currentQuestion.difficulty}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Language Selector */}
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            disabled={running || submitting}
                            className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white hover:border-slate-500 disabled:opacity-50"
                        >
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden">
                    <MonacoEditor
                        height="100%"
                        language={language === 'cpp' ? 'cpp' : language}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: 'Fira Code, monospace',
                            wordWrap: 'on',
                            formatOnPaste: true,
                            lineNumbers: 'on',
                        }}
                    />
                </div>

                {/* Control Buttons */}
                <div className="border-t border-slate-700 bg-slate-900/80 p-4 flex gap-3">
                    <button
                        onClick={handleRunCode}
                        disabled={running || submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded font-semibold transition"
                    >
                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {running ? 'Running...' : 'Run Code'}
                    </button>

                    <button
                        onClick={onRequestSubmitConfirm || handleSubmitCode}
                        disabled={running || submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-semibold transition"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={running || submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded font-semibold transition"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Output Section */}
            <div className="w-96 flex flex-col border-l border-slate-700">
                {/* Tabs */}
                <div className="border-b border-slate-700 bg-slate-900/80 flex">
                    {(['output', 'errors', 'tests', 'feedback'] as OutputTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                                activeTab === tab
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto p-4">
                    {activeTab === 'output' && (
                        <div>
                            <p className="text-xs text-slate-400 mb-2">Output:</p>
                            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
                                {runResult.stdout || '(No output)'}
                            </pre>
                        </div>
                    )}

                    {activeTab === 'errors' && (
                        <div>
                            <p className="text-xs text-slate-400 mb-2">Errors:</p>
                            <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap break-words">
                                {runResult.stderr || '(No errors)'}
                            </pre>
                        </div>
                    )}

                    {activeTab === 'tests' && (
                        <TestCasesPanel 
                            testCases={runResult.testCases} 
                            summary={
                                runResult.summary 
                                    ? { ...runResult.summary, verdict: runResult.verdict } 
                                    : null
                            } 
                        />
                    )}

                    {activeTab === 'feedback' && (
                        <AIInterviewFeedback 
                            verdict={runResult.verdict} 
                            code={code} 
                            testCasesPassed={runResult.summary?.passedTests || 0}
                            totalTestCases={runResult.summary?.totalTests || 0}
                            language={language}
                            testResults={runResult.testCases}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
