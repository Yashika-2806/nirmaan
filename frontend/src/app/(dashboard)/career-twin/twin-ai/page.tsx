'use client';

/**
 * AI Twin — Mock Interview + Job Search
 *
 * Design: matches the dark glassmorphism system used in recommendations/page.tsx
 * and tracker/page.tsx (card, btn-primary, btn-outline, input, cyan accent tokens).
 *
 * Voice: Web Speech API (SpeechRecognition) runs in the browser — zero backend cost.
 * Falls back to Gemini audio STT via processUserAudio for recorded blobs.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
    Bot,
    Briefcase,
    CheckCircle,
    ChevronRight,
    Loader2,
    Mic,
    MicOff,
    RefreshCcw,
    Send,
    Sparkles,
    Star,
    TrendingUp,
    XCircle,
    BarChart2,
} from 'lucide-react';
import {
    careerTwinService,
    InterviewEvaluation,
    InterviewMessage,
} from '@/services/careerTwinService';

type TabType = 'jobs' | 'interview';

type BrowserSpeechRecognition = {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((event: any) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

// ─── Web Speech API type declarations ────────────────────────────────────────
declare global {
    interface Window {
        SpeechRecognition?: BrowserSpeechRecognitionCtor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
    }
}

// ─── Helper: get score colour ─────────────────────────────────────────────────
function scoreColour(score: number) {
    if (score >= 80) return 'text-emerald-300';
    if (score >= 60) return 'text-cyan-300';
    if (score >= 40) return 'text-amber-300';
    return 'text-rose-300';
}

// ─── Small badge component ────────────────────────────────────────────────────
function Chip({ label, tone }: { label: string; tone: 'good' | 'mid' | 'warn' | 'neutral' }) {
    const map = {
        good: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
        mid: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30',
        warn: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
        neutral: 'bg-gray-700/40 text-gray-300 border-gray-600/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${map[tone]}`}>
            {label}
        </span>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function AITwinPage() {
    const [activeTab, setActiveTab] = useState<TabType>('interview');

    // ── Jobs state ────────────────────────────────────────────────────────────
    const [jobsData, setJobsData] = useState<{
        message: string;
        jobs: any[];
        userSkills: string[];
    } | null>(null);
    const [jobsLoading, setJobsLoading] = useState(false);

    // ── Interview state ───────────────────────────────────────────────────────
    const [jobTitle, setJobTitle] = useState('Software Engineer');
    const [sessionActive, setSessionActive] = useState(false);
    const [conversation, setConversation] = useState<InterviewMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
    const [evaluating, setEvaluating] = useState(false);
    const [resumeSkills, setResumeSkills] = useState<string[]>([]);

    // ── Voice state ───────────────────────────────────────────────────────────
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // ── Web Speech API setup ──────────────────────────────────────────────────
    const isSpeechSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const startListening = useCallback(() => {
        if (!isSpeechSupported) {
            toast.error('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            toast.error('Speech recognition is not available in this browser session.');
            return;
        }
        const recognition = new SR();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            // Append to existing input
            setUserInput((prev) => {
                const base = prev.trim();
                return base ? `${base} ${transcript}` : transcript;
            });
        };

        recognition.onerror = () => {
            setListening(false);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setListening(true);
    }, [isSpeechSupported]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setListening(false);
    }, []);

    const toggleMic = useCallback(() => {
        if (listening) {
            stopListening();
        } else {
            startListening();
        }
    }, [listening, startListening, stopListening]);

    // ── Jobs handlers ─────────────────────────────────────────────────────────
    const handleSearchJobs = async () => {
        setJobsLoading(true);
        try {
            const result = await careerTwinService.searchJobsForMe();
            setJobsData(result);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to search jobs. Upload your resume first.');
        } finally {
            setJobsLoading(false);
        }
    };

    // ── Interview handlers ────────────────────────────────────────────────────
    const handleStartInterview = async () => {
        if (!jobTitle.trim()) {
            toast.error('Please enter a job title first');
            return;
        }

        setChatLoading(true);
        setEvaluation(null);
        setConversation([]);
        setUserInput('');

        try {
            const result = await careerTwinService.startInterviewSession(jobTitle);
            setResumeSkills(result.resumeSkills || []);
            setConversation([{ role: 'interviewer', message: result.question }]);
            setSessionActive(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to start interview session');
        } finally {
            setChatLoading(false);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userInput.trim() || chatLoading) return;

        const myMessage = userInput.trim();
        setUserInput('');
        stopListening();

        // Optimistically add user message
        const nextHistory: InterviewMessage[] = [
            ...conversation,
            { role: 'user', message: myMessage },
        ];
        setConversation(nextHistory);
        setChatLoading(true);

        try {
            const result = await careerTwinService.interviewChat(myMessage, jobTitle, conversation);
            setConversation(result.conversationHistory);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to get interviewer response');
            // Rollback optimistic update
            setConversation(conversation);
        } finally {
            setChatLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (conversation.filter((m) => m.role === 'user').length === 0) {
            toast.error('Answer at least one question before ending the session');
            return;
        }

        setEvaluating(true);
        try {
            const result = await careerTwinService.evaluateInterviewSession(jobTitle, conversation);
            setEvaluation(result);
            setSessionActive(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Evaluation failed — try again');
        } finally {
            setEvaluating(false);
        }
    };

    const handleResetInterview = () => {
        setSessionActive(false);
        setConversation([]);
        setEvaluation(null);
        setUserInput('');
        setListening(false);
        recognitionRef.current?.stop();
    };

    const userTurns = conversation.filter((m) => m.role === 'user').length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* ── Page Header ── */}
            <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-[#081827] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Bot className="w-6 h-6 text-cyan-300" />
                            AI Twin — Interview Coach
                        </h1>
                        <p className="text-sm text-gray-400 mt-1.5">
                            Voice-powered mock interviews with real-time AI feedback &amp; job search based on your resume skills.
                        </p>
                    </div>
                    {resumeSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {resumeSkills.slice(0, 5).map((skill) => (
                                <Chip key={skill} label={skill} tone="mid" />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Tab Bar ── */}
            <div className="flex gap-2">
                {(['interview', 'jobs'] as TabType[]).map((tab) => {
                    const labels = { interview: 'Mock Interview', jobs: 'Find Jobs' };
                    const icons = {
                        interview: <Mic className="w-4 h-4" />,
                        jobs: <Briefcase className="w-4 h-4" />,
                    };
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                activeTab === tab
                                    ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 shadow-[0_0_18px_-8px_#00D9FF]'
                                    : 'text-gray-400 border-gray-800 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {icons[tab]}
                            {labels[tab]}
                        </button>
                    );
                })}
            </div>

            {/* ════════════════════ INTERVIEW TAB ════════════════════ */}
            {activeTab === 'interview' && (
                <div className="space-y-5">
                    {/* ── Setup Panel (shown when no active session and no evaluation) ── */}
                    {!sessionActive && !evaluation && (
                        <div className="card">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-cyan-300" />
                                Start a Mock Interview
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                AI interviewer Alex will adapt questions to your role. Use your mic or type your answers.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1.5">
                                        Target Role
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="e.g. Senior Backend Engineer"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStartInterview()}
                                        disabled={chatLoading}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    {['Software Engineer', 'Frontend Developer', 'Data Scientist', 'Product Manager'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setJobTitle(role)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                                                jobTitle === role
                                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                                                    : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                                            }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleStartInterview}
                                    disabled={chatLoading || !jobTitle.trim()}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    {chatLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" />Starting session...</>
                                    ) : (
                                        <><Mic className="w-4 h-4" />Begin Interview</>
                                    )}
                                </button>
                            </div>

                            {/* Voice support note */}
                            {isSpeechSupported && (
                                <p className="mt-4 text-xs text-gray-600 flex items-center gap-1.5">
                                    <Mic className="w-3 h-3" />
                                    Microphone available — click the mic button to answer with your voice.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Evaluation Results ── */}
                    {evaluation && !sessionActive && (
                        <div className="space-y-4">
                            {/* Score Card */}
                            <div className="card border border-cyan-500/20">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Interview Score</p>
                                        <p className={`text-5xl font-bold mt-1 ${scoreColour(evaluation.overallScore)}`}>
                                            {evaluation.overallScore}
                                            <span className="text-2xl text-gray-500">/100</span>
                                        </p>
                                        <p className="text-lg font-semibold text-white mt-1">{evaluation.verdict}</p>
                                    </div>
                                    <div className="text-right space-y-1.5">
                                        <Chip
                                            label={jobTitle}
                                            tone={evaluation.overallScore >= 70 ? 'good' : evaluation.overallScore >= 50 ? 'mid' : 'warn'}
                                        />
                                        <p className="text-xs text-gray-500">{userTurns} answers evaluated</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Strengths */}
                                <div className="card">
                                    <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5 mb-3">
                                        <CheckCircle className="w-4 h-4" /> Strengths
                                    </h3>
                                    <ul className="space-y-2">
                                        {evaluation.strengths.map((s, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex gap-2">
                                                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div className="card">
                                    <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-1.5 mb-3">
                                        <TrendingUp className="w-4 h-4" /> Areas to Improve
                                    </h3>
                                    <ul className="space-y-2">
                                        {evaluation.improvements.map((s, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex gap-2">
                                                <span className="text-amber-500 shrink-0 mt-0.5">→</span>{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Star Moments */}
                            {evaluation.starMoments.length > 0 && (
                                <div className="card border border-violet-500/20">
                                    <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-1.5 mb-3">
                                        <Star className="w-4 h-4" /> Star Moments
                                    </h3>
                                    {evaluation.starMoments.map((s, i) => (
                                        <p key={i} className="text-sm text-gray-300">{s}</p>
                                    ))}
                                </div>
                            )}

                            {/* Next Steps */}
                            {evaluation.nextSteps.length > 0 && (
                                <div className="card">
                                    <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-1.5 mb-3">
                                        <ChevronRight className="w-4 h-4" /> Next Steps
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {evaluation.nextSteps.map((s, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex gap-2">
                                                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleResetInterview}
                                className="btn-outline inline-flex items-center gap-2"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Practice Again
                            </button>
                        </div>
                    )}

                    {/* ── Active Chat Session ── */}
                    {sessionActive && (
                        <div className="space-y-4">
                            {/* Chat window */}
                            <div className="card p-0 overflow-hidden">
                                {/* Chat header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-sm font-semibold text-white">Alex — {jobTitle} Interview</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Chip label={`${userTurns} answered`} tone="neutral" />
                                        <button
                                            onClick={handleEndSession}
                                            disabled={evaluating || userTurns === 0}
                                            className="btn-outline btn-sm inline-flex items-center gap-1.5"
                                        >
                                            {evaluating
                                                ? <><Loader2 className="w-3 h-3 animate-spin" />Evaluating...</>
                                                : <><BarChart2 className="w-3 h-3" />End &amp; Evaluate</>
                                            }
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-950/30">
                                    {conversation.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                                    msg.role === 'user'
                                                        ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/30 rounded-br-sm'
                                                        : 'bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-bl-sm'
                                                }`}
                                            >
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))}

                                    {chatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
                                                <div className="flex gap-1">
                                                    {[0, 1, 2].map((i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce ${
                                                                i === 1 ? 'stagger-2' : i === 2 ? 'stagger-3' : 'stagger-1'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {/* Input area */}
                            <form onSubmit={handleSend} className="card flex gap-3 items-end p-3">
                                <textarea
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={
                                        listening
                                            ? '🎙 Listening... speak your answer'
                                            : 'Type your answer or click the mic... (Enter to send)'
                                    }
                                    rows={3}
                                    className="input flex-1 resize-none"
                                    disabled={chatLoading}
                                />
                                <div className="flex flex-col gap-2 shrink-0">
                                    {/* Mic button */}
                                    {isSpeechSupported && (
                                        <button
                                            type="button"
                                            onClick={toggleMic}
                                            className={`p-2.5 rounded-xl border transition-all ${
                                                listening
                                                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse'
                                                    : 'border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-300'
                                            }`}
                                            title={listening ? 'Stop listening' : 'Start voice input'}
                                        >
                                            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {/* Send button */}
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !userInput.trim()}
                                        className="btn-primary p-2.5 rounded-xl"
                                        title="Send response (Enter)"
                                    >
                                        {chatLoading
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />
                                        }
                                    </button>
                                </div>
                            </form>

                            {/* Reset link */}
                            <button
                                onClick={handleResetInterview}
                                className="text-xs text-gray-600 hover:text-gray-400 transition inline-flex items-center gap-1"
                            >
                                <XCircle className="w-3 h-3" /> Cancel session
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════ JOBS TAB ════════════════════ */}
            {activeTab === 'jobs' && (
                <div className="space-y-5">
                    <div className="card">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-cyan-300" />
                            AI-Powered Job Search
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Our AI analyses your resume and finds the best matching jobs for you across LinkedIn, Indeed, and other boards.
                        </p>

                        <button
                            onClick={handleSearchJobs}
                            disabled={jobsLoading}
                            className="btn-primary inline-flex items-center gap-2 mt-4"
                        >
                            {jobsLoading
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</>
                                : <><Briefcase className="w-4 h-4" />Search Jobs Based on My Skills</>
                            }
                        </button>
                    </div>

                    {jobsData && (
                        <div className="space-y-4">
                            {/* Skills used */}
                            <div className="card py-3">
                                <p className="text-xs text-gray-500 mb-2">{jobsData.message}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {jobsData.userSkills?.map((skill) => (
                                        <Chip key={skill} label={skill} tone="mid" />
                                    ))}
                                </div>
                            </div>

                            {/* Job cards */}
                            {jobsData.jobs?.map((job: any, idx: number) => (
                                <article
                                    key={idx}
                                    className="card border border-gray-800/80 hover:border-cyan-400/30 transition-colors"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">{job.title}</h3>
                                            <p className="text-sm text-gray-400">
                                                {job.company} &bull; {job.location} &bull;{' '}
                                                {job.workMode === 'remote' ? '🏠 Remote' : job.workMode}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-3xl font-bold ${scoreColour(job.fitScore)}`}>
                                                {job.fitScore}%
                                            </p>
                                            <p className="text-xs text-gray-500">Fit Score</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                                        {job.description?.substring(0, 200)}...
                                    </p>

                                    {job.matchedSkills?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {job.matchedSkills.map((skill: string) => (
                                                <span
                                                    key={skill}
                                                    className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 text-xs border border-emerald-500/20"
                                                >
                                                    ✓ {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        {job.applyUrl && (
                                            <a
                                                href={job.applyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-primary btn-sm inline-flex items-center gap-1.5"
                                            >
                                                Apply Now <ChevronRight className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
