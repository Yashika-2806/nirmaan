'use client';

import { useState, useRef } from 'react';
import {
    FileText, Upload, Brain, BookOpen, CheckCircle, XCircle,
    Loader2, ChevronRight, RotateCcw, Star, AlertCircle,
    PenLine, Send, Trophy, Target, TrendingUp, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pdfService, QuizQuestion, MarkedQuestion, GradingResult } from '@/services/pdfService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'upload' | 'mode-select' | 'quiz' | 'marked-questions';

interface QuizAnswer {
    selected: string | null;
    submitted: boolean;
}

interface StudentAnswer {
    text: string;
    result: GradingResult | null;
    loading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const verdictColor: Record<string, string> = {
    Excellent: 'text-green-600 bg-green-50 border-green-200',
    Good: 'text-blue-600 bg-blue-50 border-blue-200',
    Partial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Poor: 'text-orange-600 bg-orange-50 border-orange-200',
    'No Attempt': 'text-gray-500 bg-gray-50 border-gray-200',
};

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

    // Marked questions state
    const [markedQuestions, setMarkedQuestions] = useState<MarkedQuestion[]>([]);
    const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
    const [markedLoading, setMarkedLoading] = useState(false);
    const [markedComplete, setMarkedComplete] = useState(false);

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

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
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
            const data = await pdfService.generateQuiz(sessionId, 10);
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
        const answered = quizAnswers.filter(a => a.submitted);
        const correct = answered.filter((a, i) => a.selected === quizQuestions[i]?.correctAnswer);
        return { correct: correct.length, total: answered.length };
    };

    // ── Marked Questions Handlers ─────────────────────────────────────────────
    const startMarkedQuestions = async () => {
        setMarkedLoading(true);
        setMarkedComplete(false);
        try {
            const data = await pdfService.generateMarkedQuestions(sessionId, 6);
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
        const graded = studentAnswers.filter(a => a.result !== null);
        const totalEarned = graded.reduce((sum, a) => sum + (a.result?.score || 0), 0);
        const totalMax = graded.reduce((sum, _, i) => sum + markedQuestions[i]?.marks || 0, 0);
        return { earned: totalEarned, max: totalMax, graded: graded.length, total: markedQuestions.length };
    };

    const reset = () => {
        setPhase('upload');
        setSessionId('');
        setDocInfo(null);
        setQuizQuestions([]);
        setQuizAnswers([]);
        setMarkedQuestions([]);
        setStudentAnswers([]);
        setQuizComplete(false);
        setMarkedComplete(false);
        setCurrentQuizIdx(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ── RENDER: Upload ────────────────────────────────────────────────────────
    if (phase === 'upload') {
        return (
            <div className="space-y-6">
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
            <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                    {/* MCQ Quiz card */}
                    <div className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300"
                        onClick={startQuiz}>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Brain className="w-8 h-8 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">MCQ Quiz</h2>
                            <p className="text-gray-600 text-sm mb-4">
                                10 multiple-choice questions generated from your PDF. Get instant feedback on each answer.
                            </p>
                            <ul className="text-sm text-left w-full space-y-1 text-gray-600 mb-6">
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 10 questions, 4 options each</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Instant correct/wrong feedback</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI explanation for each answer</li>
                            </ul>
                            <button disabled={quizLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                                {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                {quizLoading ? 'Generating...' : 'Start MCQ Quiz'}
                            </button>
                        </div>
                    </div>

                    {/* Marked Questions card */}
                    <div className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
                        onClick={startMarkedQuestions}>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <PenLine className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Exam Mode</h2>
                            <p className="text-gray-600 text-sm mb-4">
                                Structured exam questions with marks. Write your answer and get AI-powered grading.
                            </p>
                            <ul className="text-sm text-left w-full space-y-1 text-gray-600 mb-6">
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 6 questions with 2–10 marks each</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Write long-form answers</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI grades & gives detailed feedback</li>
                            </ul>
                            <button disabled={markedLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                                {markedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                                {markedLoading ? 'Generating...' : 'Start Exam Mode'}
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
                <div className="space-y-6 max-w-2xl mx-auto">
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
                                    <p className="text-xs text-gray-600 italic">{q.feedback}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (!currentQ) return null;

        return (
            <div className="space-y-4 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" /> MCQ Quiz
                        </h2>
                        <p className="text-sm text-gray-500">{docInfo?.name}</p>
                    </div>
                    <button onClick={() => setPhase('mode-select')} className="btn-outline btn-sm">Exit</button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${((currentQuizIdx + 1) / quizQuestions.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{currentQuizIdx + 1}/{quizQuestions.length}</span>
                    <span className="text-sm font-medium text-green-600">✓ {score.correct}</span>
                </div>

                {/* Question card */}
                <div className="card">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Question {currentQuizIdx + 1}</p>
                    <p className="text-lg font-semibold mb-5">{currentQ.question}</p>

                    <div className="space-y-2">
                        {(Object.entries(currentQ.options) as [string, string][]).map(([key, val]) => {
                            const isSelected = currentA.selected === key;
                            const isCorrect = key === currentQ.correctAnswer;
                            let cls = 'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ';

                            if (!currentA.submitted) {
                                cls += isSelected
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300';
                            } else {
                                if (isCorrect) cls += 'border-green-500 bg-green-50';
                                else if (isSelected) cls += 'border-red-500 bg-red-50';
                                else cls += 'border-gray-200';
                            }

                            return (
                                <div key={key} className={cls} onClick={() => selectQuizOption(key)}>
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                        ${!currentA.submitted && isSelected ? 'bg-primary-600 text-white' :
                                          currentA.submitted && isCorrect ? 'bg-green-600 text-white' :
                                          currentA.submitted && isSelected ? 'bg-red-600 text-white' :
                                          'bg-gray-100 text-gray-600'}`}>
                                        {key}
                                    </span>
                                    <span className="text-sm pt-0.5">{val}</span>
                                    {currentA.submitted && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 ml-auto shrink-0" />}
                                    {currentA.submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 ml-auto shrink-0" />}
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
                            <p className="text-sm text-gray-700">{currentQ.feedback}</p>
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

    // ── RENDER: Marked Questions ───────────────────────────────────────────────
    if (phase === 'marked-questions') {
        const scoreInfo = getTotalMarkedScore();
        const allGraded = scoreInfo.graded === markedQuestions.length && markedQuestions.length > 0;

        return (
            <div className="space-y-6">
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
                                            <p className="text-xs text-gray-500 mt-0.5">{q.topic}</p>
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
                                            <p className="text-sm text-gray-700">{sa.result.feedback}</p>
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

export default function PDFPage() {
    const [fileName, setFileName] = useState('');
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [quiz, setQuiz] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUploaded, setHasUploaded] = useState(false);

    const handleUpload = async () => {
        toast.info('File upload feature coming soon!');
        // Simulating upload for demo
        setFileName('sample-document.pdf');
        setHasUploaded(true);
    };

    const handleQuery = async () => {
        if (!query.trim()) {
            toast.error('Please enter a question');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/pdf/query', {
                fileName,
                query
            });
            setAnswer(response.data.data.answer);
            toast.success('Question answered!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to answer question');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/pdf/quiz', {
                fileName
            });
            setQuiz(response.data.data.questions);
            toast.success('Quiz generated!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary-600" />
                        PDF Intelligence
                    </h1>
                    <p className="text-gray-600 mt-2">Chat with PDFs, generate quizzes, and extract insights</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Documents</p>
                            <p className="text-2xl font-bold mt-1">{hasUploaded ? 1 : 0}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Questions</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Quizzes</p>
                            <p className="text-2xl font-bold mt-1">{quiz.length > 0 ? 1 : 0}</p>
                        </div>
                        <Brain className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Study Time</p>
                            <p className="text-2xl font-bold mt-1">0h</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {!hasUploaded ? (
                /* Upload Section */
                <div className="max-w-2xl mx-auto">
                    <div className="card text-center py-12">
                        <Upload className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">Upload Your PDF</h2>
                        <p className="text-gray-600 mb-6">
                            Upload a PDF document to start chatting, generating quizzes, and extracting insights
                        </p>
                        <button
                            onClick={handleUpload}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Upload className="w-5 h-5" />
                            Choose PDF File
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="card text-center">
                            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Ask Questions</h3>
                            <p className="text-sm text-gray-600">Chat with your PDF using AI</p>
                        </div>
                        <div className="card text-center">
                            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Generate Quizzes</h3>
                            <p className="text-sm text-gray-600">Auto-create practice questions</p>
                        </div>
                        <div className="card text-center">
                            <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Concept Maps</h3>
                            <p className="text-sm text-gray-600">Visualize key concepts</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Chat & Quiz Section */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    {fileName}
                                </h2>
                                <button className="btn-outline btn-sm flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ask a Question
                                    </label>
                                    <textarea
                                        className="input min-h-[100px]"
                                        placeholder="What is the main topic of this document?"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleQuery}
                                    disabled={isLoading}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Ask Question
                                </button>

                                {answer && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-blue-600" />
                                            AI Answer
                                        </h3>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{answer}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {quiz.length > 0 && (
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    Practice Quiz
                                </h2>
                                <div className="space-y-4">
                                    {quiz.map((q, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                            <p className="font-medium mb-3">
                                                {index + 1}. {q.question}
                                            </p>
                                            <div className="space-y-2">
                                                {q.options.map((option: string, optIndex: number) => (
                                                    <label
                                                        key={optIndex}
                                                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                                                    >
                                                        <input type="radio" name={`q${index}`} />
                                                        <span className="text-sm">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="font-semibold mb-4">Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={handleGenerateQuiz}
                                    disabled={isLoading}
                                    className="btn-secondary w-full flex items-center justify-center gap-2"
                                >
                                    <Brain className="w-4 h-4" />
                                    Generate Quiz
                                </button>
                                <button className="btn-outline w-full flex items-center justify-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Concept Map
                                </button>
                                <button
                                    onClick={() => {
                                        setHasUploaded(false);
                                        setFileName('');
                                        setQuery('');
                                        setAnswer('');
                                        setQuiz([]);
                                    }}
                                    className="btn-outline w-full flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    New Document
                                </button>
                            </div>
                        </div>

                        <div className="card bg-gradient-secondary text-white">
                            <h3 className="font-semibold mb-2">Study Tips</h3>
                            <ul className="space-y-2 text-sm text-secondary-100">
                                <li>• Ask specific questions for better answers</li>
                                <li>• Use quizzes to test understanding</li>
                                <li>• Review concept maps regularly</li>
                                <li>• Take notes while reading</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
