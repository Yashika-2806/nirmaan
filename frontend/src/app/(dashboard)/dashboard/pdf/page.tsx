'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
    FileText, Upload, Brain, CheckCircle, XCircle,
    Loader2, ChevronRight, RotateCcw, Star, AlertCircle,
    PenLine, Send, Trophy, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pdfService, QuizQuestion, MarkedQuestion, GradingResult, AssertionReasonQuestion } from '@/services/pdfService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './page.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'upload' | 'mode-select' | 'quiz' | 'marked-questions' | 'assertion-reason';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

interface QuizAnswer {
    selected: string | null;
    submitted: boolean;
}

interface StudentAnswer {
    text: string;
    result: GradingResult | null;
    loading: boolean;
}

interface QuizConfig {
    numQuestions: number;
    difficulty: Difficulty;
}

interface MarkedConfig {
    numQuestions: number;
    difficulty: Difficulty;
    markDistribution: { '2': number; '3': number; '5': number; '8': number; '10': number };
}

interface AssertionReasonConfig {
    numQuestions: number;
    difficulty: Difficulty;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const verdictColor: Record<string, string> = {
    Excellent: 'text-green-600 bg-green-50 border-green-200',
    Good: 'text-blue-600 bg-blue-50 border-blue-200',
    Partial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Poor: 'text-orange-600 bg-orange-50 border-orange-200',
    'No Attempt': 'text-gray-500 bg-gray-50 border-gray-200',
};

const difficultyOptions: Difficulty[] = ['easy', 'medium', 'hard', 'mixed'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PDFPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload state
    const [phase, setPhase] = useState<Phase>('upload');
    const [isUploading, setIsUploading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [docInfo, setDocInfo] = useState<{ name: string; pages: number; words: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
    const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizComplete, setQuizComplete] = useState(false);
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({ numQuestions: 10, difficulty: 'mixed' });

    // Assertion-Reason state
    const [arQuestions, setArQuestions] = useState<AssertionReasonQuestion[]>([]);
    const [arAnswers, setArAnswers] = useState<QuizAnswer[]>([]);
    const [currentArIdx, setCurrentArIdx] = useState(0);
    const [arLoading, setArLoading] = useState(false);
    const [arComplete, setArComplete] = useState(false);
    const [arConfig, setArConfig] = useState<AssertionReasonConfig>({ numQuestions: 8, difficulty: 'mixed' });

    // Marked questions state
    const [markedQuestions, setMarkedQuestions] = useState<MarkedQuestion[]>([]);
    const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
    const [markedLoading, setMarkedLoading] = useState(false);
    const [markedConfig, setMarkedConfig] = useState<MarkedConfig>({
        numQuestions: 6,
        difficulty: 'mixed',
        markDistribution: { '2': 2, '3': 1, '5': 2, '8': 1, '10': 0 },
    });

    // ── Upload Handler ────────────────────────────────────────────────────────
    const handleFile = async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            toast.error('Please select a valid PDF file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10 MB');
            return;
        }

        setIsUploading(true);
        try {
            const result = await pdfService.upload(file);
            setSessionId(result.sessionId);
            setDocInfo({ name: result.originalName, pages: result.pageCount, words: result.wordCount });
            setPhase('mode-select');
            toast.success('PDF uploaded and processed!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to upload PDF');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    // ── Quiz Handlers ─────────────────────────────────────────────────────────
    const startQuiz = async () => {
        setQuizLoading(true);
        setQuizComplete(false);
        setCurrentQuizIdx(0);
        setQuizAnswers([]);
        try {
            const data = await pdfService.generateQuiz(sessionId, {
                numQuestions: quizConfig.numQuestions,
                difficulty: quizConfig.difficulty,
            });
            setQuizQuestions(data.questions);
            setQuizAnswers(data.questions.map(() => ({ selected: null, submitted: false })));
            setPhase('quiz');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setQuizLoading(false);
        }
    };

    const selectQuizOption = (optKey: string) => {
        if (quizAnswers[currentQuizIdx]?.submitted) return;
        setQuizAnswers(prev => prev.map((a, i) =>
            i === currentQuizIdx ? { ...a, selected: optKey } : a
        ));
    };

    const submitQuizAnswer = () => {
        if (!quizAnswers[currentQuizIdx]?.selected) {
            toast.error('Please select an answer first');
            return;
        }
        setQuizAnswers(prev => prev.map((a, i) =>
            i === currentQuizIdx ? { ...a, submitted: true } : a
        ));
    };

    const nextQuizQuestion = () => {
        if (currentQuizIdx < quizQuestions.length - 1) {
            setCurrentQuizIdx(i => i + 1);
        } else {
            setQuizComplete(true);
        }
    };

    const getQuizScore = () => {
        return quizAnswers.reduce(
            (acc, answer, idx) => {
                if (!answer.submitted) return acc;
                acc.total += 1;
                if (answer.selected === quizQuestions[idx]?.correctAnswer) {
                    acc.correct += 1;
                }
                return acc;
            },
            { correct: 0, total: 0 }
        );
    };

    const getOptionReason = (question: QuizQuestion, optionKey: string): string => {
        const aiReason = question.optionReasons?.[optionKey as 'A' | 'B' | 'C' | 'D'];
        if (aiReason && aiReason.trim()) return aiReason;
        if (optionKey === question.correctAnswer) {
            return 'This option is correct because it aligns with the core concept tested in this question and matches the document evidence.';
        }
        return `This option is incorrect because it reflects a misconception about the concept being tested. Option ${question.correctAnswer} better satisfies the question requirement based on the document.`;
    };

    const getAROptionReason = (question: AssertionReasonQuestion, optionKey: string): string => {
        const aiReason = question.optionReasons?.[optionKey as 'A' | 'B' | 'C' | 'D'];
        if (aiReason && aiReason.trim()) return aiReason;
        if (optionKey === question.correctAnswer) {
            return `Option ${optionKey} is correct because the truth-values and explanation relation match this assertion-reason pair.`;
        }
        return `Option ${optionKey} is not correct for this pair because the truth-values/explanation logic do not match this case.`;
    };

    const startAssertionReason = async () => {
        setArLoading(true);
        setArComplete(false);
        setCurrentArIdx(0);
        setArAnswers([]);
        try {
            const data = await pdfService.generateAssertionReasonQuestions(sessionId, {
                numQuestions: arConfig.numQuestions,
                difficulty: arConfig.difficulty,
            });
            setArQuestions(data.questions);
            setArAnswers(data.questions.map(() => ({ selected: null, submitted: false })));
            setPhase('assertion-reason');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate assertion-reason questions');
        } finally {
            setArLoading(false);
        }
    };

    const selectAROption = (optKey: string) => {
        if (arAnswers[currentArIdx]?.submitted) return;
        setArAnswers(prev => prev.map((a, i) => (i === currentArIdx ? { ...a, selected: optKey } : a)));
    };

    const submitARAnswer = () => {
        if (!arAnswers[currentArIdx]?.selected) {
            toast.error('Please select an option first');
            return;
        }
        setArAnswers(prev => prev.map((a, i) => (i === currentArIdx ? { ...a, submitted: true } : a)));
    };

    const nextARQuestion = () => {
        if (currentArIdx < arQuestions.length - 1) setCurrentArIdx(i => i + 1);
        else setArComplete(true);
    };

    const getARScore = () => {
        return arAnswers.reduce(
            (acc, answer, idx) => {
                if (!answer.submitted) return acc;
                acc.total += 1;
                if (answer.selected === arQuestions[idx]?.correctAnswer) {
                    acc.correct += 1;
                }
                return acc;
            },
            { correct: 0, total: 0 }
        );
    };

    // ── Marked Questions Handlers ─────────────────────────────────────────────
    const startMarkedQuestions = async () => {
        const distributionTotal = Object.values(markedConfig.markDistribution).reduce((sum, n) => sum + n, 0);
        if (distributionTotal !== markedConfig.numQuestions) {
            toast.error(`Mark distribution must total ${markedConfig.numQuestions} questions`);
            return;
        }

        setMarkedLoading(true);
        try {
            const data = await pdfService.generateMarkedQuestions(sessionId, {
                numQuestions: markedConfig.numQuestions,
                difficulty: markedConfig.difficulty,
                markDistribution: markedConfig.markDistribution,
            });
            setMarkedQuestions(data.questions);
            setStudentAnswers(data.questions.map(() => ({ text: '', result: null, loading: false })));
            setPhase('marked-questions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate questions');
        } finally {
            setMarkedLoading(false);
        }
    };

    const updateStudentAnswer = (idx: number, text: string) => {
        setStudentAnswers(prev => prev.map((a, i) => i === idx ? { ...a, text } : a));
    };

    const gradeAnswer = async (idx: number) => {
        const q = markedQuestions[idx];
        const answer = studentAnswers[idx];
        if (!answer.text.trim()) { toast.error('Please write your answer first'); return; }

        setStudentAnswers(prev => prev.map((a, i) => i === idx ? { ...a, loading: true } : a));
        try {
            const result = await pdfService.gradeAnswer({
                question: q.question,
                marks: q.marks,
                expectedAnswer: q.expectedAnswer,
                studentAnswer: answer.text,
            });
            setStudentAnswers(prev => prev.map((a, i) => i === idx ? { ...a, result, loading: false } : a));
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to grade answer');
            setStudentAnswers(prev => prev.map((a, i) => i === idx ? { ...a, loading: false } : a));
        }
    };

    const getTotalMarkedScore = () => {
        return studentAnswers.reduce(
            (acc, answer, idx) => {
                if (!answer.result) return acc;
                acc.earned += answer.result.score;
                acc.max += markedQuestions[idx]?.marks || 0;
                acc.graded += 1;
                return acc;
            },
            { earned: 0, max: 0, graded: 0, total: markedQuestions.length }
        );
    };

    const getFocusPoints = (q: MarkedQuestion): string[] => {
        // Show only hint-style guidance; never expose model-answer content in focus hints.
        const aiHints = (q.focusPoints || [])
            .map(point => point.trim())
            .filter(Boolean)
            .map(point => {
                const startsWithVerb = /^(define|explain|mention|contrast|relate|give|outline|state|describe)\b/i.test(point);
                return startsWithVerb ? point : `Explain ${point.toLowerCase()}`;
            })
            .slice(0, 6);

        if (aiHints.length > 0) return aiHints;

        const hints = [
            'Define the concept clearly in your own words',
            `Explain the main idea related to ${q.topic || 'this topic'}`,
            'Mention one practical example or application from the document context',
        ];

        if (q.marks >= 5) {
            hints.push('Add a brief comparison, cause-effect, or process flow');
        }

        if (q.marks >= 8) {
            hints.push('Include deeper reasoning, trade-offs, or implications to justify full marks');
        }

        return hints;
    };

    const reset = () => {
        setPhase('upload');
        setSessionId('');
        setDocInfo(null);
        setQuizQuestions([]);
        setQuizAnswers([]);
        setMarkedQuestions([]);
        setStudentAnswers([]);
        setArQuestions([]);
        setArAnswers([]);
        setArComplete(false);
        setCurrentArIdx(0);
        setQuizComplete(false);
        setCurrentQuizIdx(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ── RENDER: Upload ────────────────────────────────────────────────────────
    if (phase === 'upload') {
        return (
            <div className={`${styles.pdfFontBoost} space-y-6 min-h-[calc(100vh-140px)] flex flex-col`}>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary-600" />
                        PDF Study Assistant
                    </h1>
                    <p className="text-gray-600 mt-2">Upload a PDF to generate quizzes and exam questions powered by AI</p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div
                        className={`card text-center py-16 border-2 border-dashed transition-colors cursor-pointer
                            ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            title="Choose PDF file"
                            aria-label="Choose PDF file"
                            onChange={handleFileInput}
                        />
                        {isUploading ? (
                            <>
                                <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
                                <p className="text-lg font-semibold text-primary-600">Processing PDF...</p>
                                <p className="text-gray-500 text-sm mt-1">Extracting text, please wait</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">Drop your PDF here or click to browse</h2>
                                <p className="text-gray-500 text-sm">Supports text-based PDFs up to 10 MB</p>
                                <button className="btn-primary mt-6 inline-flex items-center gap-2" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                    <Upload className="w-4 h-4" />
                                    Choose PDF File
                                </button>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="card text-center">
                            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">MCQ Quiz</h3>
                            <p className="text-sm text-gray-600">10 multiple-choice questions with instant AI feedback</p>
                        </div>
                        <div className="card text-center">
                            <PenLine className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Exam Mode</h3>
                            <p className="text-sm text-gray-600">Marked questions (2–10 marks) with AI grading</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── RENDER: Mode Select ────────────────────────────────────────────────────
    if (phase === 'mode-select') {
        return (
            <div className={`${styles.pdfFontBoost} space-y-6`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary-600" />
                            PDF Study Assistant
                        </h1>
                        <p className="text-gray-600 mt-1">Document loaded — choose your study mode</p>
                    </div>
                    <button onClick={reset} className="btn-outline flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> New PDF
                    </button>
                </div>

                {/* Doc info */}
                {docInfo && (
                    <div className="card bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-blue-900">{docInfo.name}</p>
                                <p className="text-sm text-blue-700">{docInfo.pages} pages · {docInfo.words.toLocaleString()} words</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full flex-1 auto-rows-fr min-h-[calc(100vh-300px)]">
                    {/* MCQ Quiz card */}
                    <div className="card hover:shadow-xl transition-shadow border-2 border-cyan-400/70 hover:border-cyan-300 h-full">
                        <div className="flex flex-col items-center text-center p-10 h-full justify-between">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-5">
                                <Brain className="w-10 h-10 text-purple-600" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2 text-white">MCQ Quiz</h2>
                            <p className="text-gray-300 text-lg mb-6 max-w-xl">
                                Generate custom MCQs from your PDF with difficulty control and flip-card answer reveals.
                            </p>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full mb-5 text-left">
                                <label className="text-base font-semibold text-gray-200">
                                    Number of questions
                                    <input
                                        type="number"
                                        min={3}
                                        max={15}
                                        title="Quiz number of questions"
                                        aria-label="Quiz number of questions"
                                        value={quizConfig.numQuestions}
                                        onChange={(e) => setQuizConfig(prev => ({
                                            ...prev,
                                            numQuestions: Math.max(3, Math.min(15, parseInt(e.target.value || '10', 10))),
                                        }))}
                                        className="input mt-1"
                                    />
                                </label>
                                <label className="text-base font-semibold text-gray-200">
                                    Difficulty
                                    <select
                                        value={quizConfig.difficulty}
                                        onChange={(e) => setQuizConfig(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                                        className="input mt-1"
                                    >
                                        {difficultyOptions.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <ul className="text-base text-left w-full space-y-2 text-gray-200 mb-8">
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Custom count from 3 to 15</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Instant correct/wrong feedback</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Flip cards + AI explanation per question</li>
                            </ul>
                            <button onClick={startQuiz} disabled={quizLoading} className="btn-primary w-full flex items-center justify-center gap-2 text-xl py-4">
                                {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                {quizLoading ? 'Generating...' : 'Start MCQ Quiz'}
                            </button>
                        </div>
                    </div>

                    {/* Marked Questions card */}
                    <div className="card hover:shadow-xl transition-shadow border-2 border-cyan-400/70 hover:border-cyan-300 h-full">
                        <div className="flex flex-col items-center text-center p-10 h-full justify-between">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-5">
                                <PenLine className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2 text-white">Exam Mode</h2>
                            <p className="text-gray-300 text-lg mb-6 max-w-xl">
                                Build your own exam set by selecting count, difficulty, and mark distribution.
                            </p>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full mb-4 text-left">
                                <label className="text-base font-semibold text-gray-200">
                                    Number of questions
                                    <input
                                        type="number"
                                        min={3}
                                        max={10}
                                        title="Exam number of questions"
                                        aria-label="Exam number of questions"
                                        value={markedConfig.numQuestions}
                                        onChange={(e) => setMarkedConfig(prev => ({
                                            ...prev,
                                            numQuestions: Math.max(3, Math.min(10, parseInt(e.target.value || '6', 10))),
                                        }))}
                                        className="input mt-1"
                                    />
                                </label>
                                <label className="text-base font-semibold text-gray-200">
                                    Difficulty
                                    <select
                                        value={markedConfig.difficulty}
                                        onChange={(e) => setMarkedConfig(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                                        className="input mt-1"
                                    >
                                        {difficultyOptions.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="w-full mb-5 text-left">
                                <p className="text-base font-semibold text-gray-200 mb-2">Mark Distribution</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {(['2', '3', '5', '8', '10'] as const).map(mark => (
                                        <label key={mark} className="text-sm text-gray-200">
                                            {mark}m
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                title={`${mark}-mark question count`}
                                                aria-label={`${mark}-mark question count`}
                                                value={markedConfig.markDistribution[mark]}
                                                onChange={(e) => {
                                                    const value = Math.max(0, Math.min(10, parseInt(e.target.value || '0', 10)));
                                                    setMarkedConfig(prev => ({
                                                        ...prev,
                                                        markDistribution: { ...prev.markDistribution, [mark]: value },
                                                    }));
                                                }}
                                                className="input mt-1"
                                            />
                                        </label>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-300 mt-1">
                                    Total selected: {Object.values(markedConfig.markDistribution).reduce((sum, n) => sum + n, 0)} / {markedConfig.numQuestions}
                                </p>
                            </div>
                            <ul className="text-base text-left w-full space-y-2 text-gray-200 mb-8">
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Fully customizable paper pattern</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Write long-form answers</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Focus points shown for every answer question</li>
                            </ul>
                            <button onClick={startMarkedQuestions} disabled={markedLoading} className="btn-primary w-full flex items-center justify-center gap-2 text-xl py-4">
                                {markedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                                {markedLoading ? 'Generating...' : 'Start Exam Mode'}
                            </button>
                        </div>
                    </div>

                    {/* Assertion-Reason card */}
                    <div className="card hover:shadow-xl transition-shadow border-2 border-cyan-400/70 hover:border-cyan-300 h-full">
                        <div className="flex flex-col items-center text-center p-10 h-full justify-between">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-5">
                                <Info className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2 text-white">Assertion-Reason</h2>
                            <p className="text-gray-300 text-lg mb-6 max-w-xl">
                                Practice assertion-reason exam questions generated from your PDF concepts.
                            </p>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full mb-5 text-left">
                                <label className="text-base font-semibold text-gray-200">
                                    Number of questions
                                    <input
                                        type="number"
                                        min={3}
                                        max={12}
                                        title="Assertion-reason number of questions"
                                        aria-label="Assertion-reason number of questions"
                                        value={arConfig.numQuestions}
                                        onChange={(e) => setArConfig(prev => ({
                                            ...prev,
                                            numQuestions: Math.max(3, Math.min(12, parseInt(e.target.value || '8', 10))),
                                        }))}
                                        className="input mt-1"
                                    />
                                </label>
                                <label className="text-base font-semibold text-gray-200">
                                    Difficulty
                                    <select
                                        value={arConfig.difficulty}
                                        onChange={(e) => setArConfig(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                                        className="input mt-1"
                                    >
                                        {difficultyOptions.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <ul className="text-base text-left w-full space-y-2 text-gray-200 mb-8">
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> A-R based exam practice</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Conceptual truth/explanation logic</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Detailed reason per option</li>
                            </ul>
                            <button onClick={startAssertionReason} disabled={arLoading} className="btn-primary w-full flex items-center justify-center gap-2 text-xl py-4">
                                {arLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                                {arLoading ? 'Generating...' : 'Start Assertion-Reason'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── RENDER: MCQ Quiz ───────────────────────────────────────────────────────
    if (phase === 'quiz') {
        const currentQ = quizQuestions[currentQuizIdx];
        const currentA = quizAnswers[currentQuizIdx];
        const score = getQuizScore();

        if (quizComplete) {
            const percentage = Math.round((score.correct / quizQuestions.length) * 100);
            return (
                <div className={`${styles.pdfFontBoost} space-y-6 w-full min-h-[calc(100vh-140px)]`}>
                    <div className="card text-center py-8">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
                        <div className="text-5xl font-bold text-primary-600 mb-2">{score.correct}/{quizQuestions.length}</div>
                        <p className="text-gray-600 mb-2">{percentage}% correct</p>
                        <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold mb-6 ${
                            percentage >= 80 ? 'bg-green-100 text-green-700' :
                            percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good effort!' : '📚 Keep studying!'}
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={startQuiz} className="btn-primary flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Retake Quiz
                            </button>
                            <button onClick={() => setPhase('mode-select')} className="btn-outline flex items-center gap-2">
                                <ChevronRight className="w-4 h-4" /> Back to Modes
                            </button>
                        </div>
                    </div>

                    {/* Answer review */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Answer Review</h3>
                        {quizQuestions.map((q, i) => {
                            const a = quizAnswers[i];
                            const isCorrect = a.selected === q.correctAnswer;
                            return (
                                <div key={i} className={`card border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <p className="font-medium text-sm mb-1">Q{i + 1}. {q.question}</p>
                                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                                        <span className={`px-2 py-0.5 rounded-full ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Your answer: {a.selected} — {q.options[a.selected as keyof typeof q.options]}
                                        </span>
                                        {!isCorrect && (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                Correct: {q.correctAnswer} — {q.options[q.correctAnswer]}
                                            </span>
                                        )}
                                    </div>
                                    <MarkdownRenderer content={q.feedback} className="text-xs italic" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (!currentQ) return null;

        return (
            <div className={`${styles.pdfFontBoost} space-y-5 w-full min-h-[calc(100vh-140px)]`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold flex items-center gap-2">
                            <Brain className="w-7 h-7 text-purple-600" /> MCQ Quiz
                        </h2>
                        <p className="text-base text-gray-400">{docInfo?.name} · {quizConfig.difficulty} · {quizQuestions.length} questions</p>
                    </div>
                    <button onClick={() => setPhase('mode-select')} className="btn-outline btn-sm">Exit</button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                    <progress
                        className="flex-1 h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-primary-600 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-primary-600"
                        max={quizQuestions.length}
                        value={currentQuizIdx + 1}
                        aria-label="Quiz progress"
                    />
                    <span className="text-base font-semibold text-gray-300">{currentQuizIdx + 1}/{quizQuestions.length}</span>
                    <span className="text-base font-semibold text-green-500">✓ {score.correct}</span>
                </div>

                {/* Question card */}
                <div className="card min-h-[70vh] border-2 border-cyan-400/70">
                    <p className="text-sm font-semibold text-gray-400 uppercase mb-2">Question {currentQuizIdx + 1}</p>
                    <p className="text-2xl font-semibold mb-6 text-white">{currentQ.question}</p>

                    <div className="space-y-4">
                        {(Object.entries(currentQ.options) as [string, string][]).map(([key, val]) => {
                            const isSelected = currentA.selected === key;
                            const isCorrect = key === currentQ.correctAnswer;
                            const statusClass = !currentA.submitted
                                ? (isSelected ? 'border-primary-500 bg-primary-50 text-gray-900' : 'border-gray-200 hover:border-gray-300 text-white')
                                : (isCorrect ? 'border-green-500 bg-green-50 text-gray-900' : isSelected ? 'border-red-500 bg-red-50 text-gray-900' : 'border-gray-200 text-white');

                            return (
                                <div key={key} className={`${styles.flipCard} ${currentA.submitted ? styles.flipped : ''}`} onClick={() => selectQuizOption(key)}>
                                    <div className={styles.flipInner}>
                                        <div className={`${styles.flipFace} ${styles.flipFront} ${statusClass}`}>
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                                ${!currentA.submitted && isSelected ? 'bg-primary-600 text-white' :
                                                currentA.submitted && isCorrect ? 'bg-green-600 text-white' :
                                                currentA.submitted && isSelected ? 'bg-red-600 text-white' :
                                                'bg-gray-100 text-gray-600'}`}>
                                                {key}
                                            </span>
                                            <span className="text-lg pt-0.5 font-semibold leading-snug">{val}</span>
                                        </div>
                                        <div className={`${styles.flipFace} ${styles.flipBack} ${statusClass}`}>
                                            <div className="flex items-center gap-2">
                                                {isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                                <span className="font-semibold text-base">{isCorrect ? 'Correct Option' : 'Not Correct'}</span>
                                            </div>
                                            <p className="text-base text-gray-700 mt-1 font-semibold">{key}. {val}</p>
                                            <p className="text-base text-gray-700 mt-1 leading-snug">
                                                {getOptionReason(currentQ, key)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* AI Feedback after submit */}
                    {currentA.submitted && (
                        <div className={`mt-4 p-4 rounded-lg border ${
                            currentA.selected === currentQ.correctAnswer
                                ? 'bg-green-50 border-green-200'
                                : 'bg-orange-50 border-orange-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-1">
                                {currentA.selected === currentQ.correctAnswer
                                    ? <><CheckCircle className="w-4 h-4 text-green-600" /><span className="font-semibold text-green-700 text-sm">Correct!</span></>
                                    : <><XCircle className="w-4 h-4 text-red-600" /><span className="font-semibold text-red-700 text-sm">Incorrect</span></>
                                }
                            </div>
                            <MarkdownRenderer content={currentQ.feedback} className="text-sm" />
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                    {!currentA.submitted ? (
                        <button
                            onClick={submitQuizAnswer}
                            disabled={!currentA.selected}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Submit Answer
                        </button>
                    ) : (
                        <button onClick={nextQuizQuestion} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {currentQuizIdx < quizQuestions.length - 1
                                ? <><ChevronRight className="w-4 h-4" /> Next Question</>
                                : <><Trophy className="w-4 h-4" /> See Results</>
                            }
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── RENDER: Assertion-Reason ──────────────────────────────────────────────
    if (phase === 'assertion-reason') {
        const currentQ = arQuestions[currentArIdx];
        const currentA = arAnswers[currentArIdx];
        const score = getARScore();

        const arOptions = {
            A: 'Both Assertion and Reason are true, and Reason correctly explains Assertion.',
            B: 'Both Assertion and Reason are true, but Reason does not correctly explain Assertion.',
            C: 'Assertion is true, but Reason is false.',
            D: 'Assertion is false, but Reason is true.',
        };

        if (!currentQ) return null;

        if (arComplete) {
            const percentage = Math.round((score.correct / arQuestions.length) * 100);
            return (
                <div className={`${styles.pdfFontBoost} space-y-6 w-full min-h-[calc(100vh-140px)]`}>
                    <div className="card text-center py-8">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Assertion-Reason Complete!</h2>
                        <div className="text-5xl font-bold text-primary-600 mb-2">{score.correct}/{arQuestions.length}</div>
                        <p className="text-gray-600 mb-2">{percentage}% correct</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={startAssertionReason} className="btn-primary flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Retake
                            </button>
                            <button onClick={() => setPhase('mode-select')} className="btn-outline flex items-center gap-2">
                                <ChevronRight className="w-4 h-4" /> Back to Modes
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`${styles.pdfFontBoost} space-y-5 w-full min-h-[calc(100vh-140px)]`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold flex items-center gap-2 text-white">
                            <Info className="w-7 h-7 text-indigo-400" /> Assertion-Reason
                        </h2>
                        <p className="text-base text-gray-400">{docInfo?.name} · {arConfig.difficulty} · {arQuestions.length} questions</p>
                    </div>
                    <button onClick={() => setPhase('mode-select')} className="btn-outline btn-sm">Exit</button>
                </div>

                <div className="flex items-center gap-3">
                    <progress
                        className="flex-1 h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-indigo-600 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-indigo-600"
                        max={arQuestions.length}
                        value={currentArIdx + 1}
                        aria-label="Assertion-reason progress"
                    />
                    <span className="text-base font-semibold text-gray-300">{currentArIdx + 1}/{arQuestions.length}</span>
                    <span className="text-base font-semibold text-green-500">✓ {score.correct}</span>
                </div>

                <div className="card min-h-[70vh] border-2 border-indigo-400/70">
                    <p className="text-sm font-semibold text-gray-400 uppercase mb-2">Question {currentArIdx + 1}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-lg border border-indigo-300 bg-indigo-50">
                            <p className="text-xs font-semibold uppercase text-indigo-700 mb-1">Assertion</p>
                            <p className="text-base font-medium text-gray-900">{currentQ.assertion}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-purple-300 bg-purple-50">
                            <p className="text-xs font-semibold uppercase text-purple-700 mb-1">Reason</p>
                            <p className="text-base font-medium text-gray-900">{currentQ.reason}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {(Object.entries(arOptions) as [string, string][]).map(([key, val]) => {
                            const isSelected = currentA.selected === key;
                            const isCorrect = key === currentQ.correctAnswer;
                            const statusClass = !currentA.submitted
                                ? (isSelected ? 'border-primary-500 bg-primary-50 text-gray-900' : 'border-gray-200 hover:border-gray-300 text-white')
                                : (isCorrect ? 'border-green-500 bg-green-50 text-gray-900' : isSelected ? 'border-red-500 bg-red-50 text-gray-900' : 'border-gray-200 text-white');

                            return (
                                <div key={key} className={`${styles.flipCard} ${currentA.submitted ? styles.flipped : ''}`} onClick={() => selectAROption(key)}>
                                    <div className={styles.flipInner}>
                                        <div className={`${styles.flipFace} ${styles.flipFront} ${statusClass}`}>
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                                ${!currentA.submitted && isSelected ? 'bg-primary-600 text-white' :
                                                  currentA.submitted && isCorrect ? 'bg-green-600 text-white' :
                                                  currentA.submitted && isSelected ? 'bg-red-600 text-white' :
                                                  'bg-gray-100 text-gray-600'}`}>
                                                {key}
                                            </span>
                                            <span className="text-lg pt-0.5 font-semibold leading-snug">{val}</span>
                                        </div>
                                        <div className={`${styles.flipFace} ${styles.flipBack} ${statusClass}`}>
                                            <div className="flex items-center gap-2">
                                                {isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                                <span className="font-semibold text-base">{isCorrect ? 'Correct Option' : 'Not Correct'}</span>
                                            </div>
                                            <p className="text-base text-gray-700 mt-1 font-semibold">{key}. {val}</p>
                                            <p className="text-base text-gray-700 mt-1 leading-snug">{getAROptionReason(currentQ, key)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {currentA.submitted && (
                        <div className={`mt-4 p-4 rounded-lg border ${
                            currentA.selected === currentQ.correctAnswer
                                ? 'bg-green-50 border-green-200'
                                : 'bg-orange-50 border-orange-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-1">
                                {currentA.selected === currentQ.correctAnswer
                                    ? <><CheckCircle className="w-4 h-4 text-green-600" /><span className="font-semibold text-green-700 text-sm">Correct!</span></>
                                    : <><XCircle className="w-4 h-4 text-red-600" /><span className="font-semibold text-red-700 text-sm">Incorrect</span></>
                                }
                            </div>
                            <MarkdownRenderer content={currentQ.feedback} className="text-sm" />
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    {!currentA.submitted ? (
                        <button
                            onClick={submitARAnswer}
                            disabled={!currentA.selected}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Submit Answer
                        </button>
                    ) : (
                        <button onClick={nextARQuestion} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {currentArIdx < arQuestions.length - 1
                                ? <><ChevronRight className="w-4 h-4" /> Next Question</>
                                : <><Trophy className="w-4 h-4" /> See Results</>
                            }
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── RENDER: Marked Questions ───────────────────────────────────────────────
    if (phase === 'marked-questions') {
        const scoreInfo = getTotalMarkedScore();
        const allGraded = scoreInfo.graded === markedQuestions.length && markedQuestions.length > 0;

        return (
            <div className={`${styles.pdfFontBoost} space-y-6`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <PenLine className="w-6 h-6 text-blue-600" /> Exam Mode
                        </h2>
                        <p className="text-sm text-gray-500">{docInfo?.name} · {markedQuestions.length} questions</p>
                    </div>
                    <div className="flex gap-2">
                        {scoreInfo.graded > 0 && (
                            <div className="card !p-3 text-center bg-blue-50 border border-blue-200">
                                <p className="text-xs text-blue-600 font-medium">Score</p>
                                <p className="text-lg font-bold text-blue-800">{scoreInfo.earned}/{scoreInfo.max}</p>
                            </div>
                        )}
                        <button onClick={() => setPhase('mode-select')} className="btn-outline flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" /> Back
                        </button>
                    </div>
                </div>

                {/* All graded summary */}
                {allGraded && (
                    <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <div className="flex items-center gap-4">
                            <Trophy className="w-10 h-10 text-yellow-300 shrink-0" />
                            <div>
                                <p className="font-bold text-lg">Exam Complete!</p>
                                <p className="text-blue-100">
                                    You scored {scoreInfo.earned} out of {scoreInfo.max} marks
                                    ({Math.round((scoreInfo.earned / scoreInfo.max) * 100)}%)
                                </p>
                            </div>
                            <button onClick={startMarkedQuestions} className="btn-outline ml-auto !text-white !border-white hover:!bg-white/20">
                                <RotateCcw className="w-4 h-4 mr-1" /> Regenerate
                            </button>
                        </div>
                    </div>
                )}

                {/* Questions */}
                <div className="space-y-6">
                    {markedQuestions.map((q, idx) => {
                        const sa = studentAnswers[idx];
                        const hasResult = sa?.result !== null;

                        return (
                            <div key={q.id} className="card">
                                {/* Question header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="bg-blue-600 text-white text-sm font-bold px-2 py-0.5 rounded-md shrink-0">
                                            Q{idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-semibold">{q.question}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{q.topic} {q.difficulty ? `· ${q.difficulty}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <span className="inline-block bg-orange-100 text-orange-700 text-sm font-bold px-2 py-0.5 rounded-md">
                                            [{q.marks} marks]
                                        </span>
                                        {hasResult && sa.result && (
                                            <p className="text-sm font-bold mt-1 text-blue-700">
                                                {sa.result.score}/{q.marks}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Focus points */}
                                <div className="mb-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase mb-1">Focus Hints (What to Cover)</p>
                                    <ul className="space-y-1">
                                        {getFocusPoints(q).map((point, i) => (
                                            <li key={i} className="text-sm text-indigo-900">• {point}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Answer textarea */}
                                <textarea
                                    className="input min-h-[120px] resize-y text-sm"
                                    placeholder={`Write your answer here (aim for ${q.marks <= 3 ? '2-4 sentences' : q.marks <= 5 ? 'a short paragraph' : 'detailed explanation'})`}
                                    value={sa?.text || ''}
                                    onChange={(e) => updateStudentAnswer(idx, e.target.value)}
                                    disabled={hasResult}
                                />

                                {/* Submit button */}
                                {!hasResult && (
                                    <button
                                        onClick={() => gradeAnswer(idx)}
                                        disabled={sa?.loading || !sa?.text?.trim()}
                                        className="btn-primary mt-3 flex items-center gap-2"
                                    >
                                        {sa?.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {sa?.loading ? 'Grading...' : `Submit for Grading`}
                                    </button>
                                )}

                                {/* Grading result */}
                                {hasResult && sa.result && (
                                    <div className="mt-4 space-y-3">
                                        {/* Score banner */}
                                        <div className={`flex items-center justify-between p-3 rounded-lg border ${verdictColor[sa.result.verdict] || 'bg-gray-50 border-gray-200'}`}>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-5 h-5" />
                                                <span className="font-bold">{sa.result.verdict}</span>
                                            </div>
                                            <span className="text-2xl font-bold">{sa.result.score}<span className="text-sm font-normal">/{q.marks}</span></span>
                                        </div>

                                        {/* AI Feedback */}
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                                <Brain className="w-3 h-3" /> AI Feedback
                                            </p>
                                            <MarkdownRenderer content={sa.result.feedback} className="text-sm" />
                                        </div>

                                        {/* Key points */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {sa.result.keyPointsCovered.length > 0 && (
                                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                                    <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Points Covered
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {sa.result.keyPointsCovered.map((pt, i) => (
                                                            <li key={i} className="text-xs text-green-800">• {pt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {sa.result.keyPointsMissed.length > 0 && (
                                                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                    <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Points Missed
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {sa.result.keyPointsMissed.map((pt, i) => (
                                                            <li key={i} className="text-xs text-red-800">• {pt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Model answer (collapsed by default) */}
                                        <details className="group">
                                            <summary className="cursor-pointer text-sm font-medium text-blue-600 flex items-center gap-1 select-none">
                                                <Info className="w-4 h-4" /> View Model Answer
                                            </summary>
                                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
                                                {q.expectedAnswer}
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}
