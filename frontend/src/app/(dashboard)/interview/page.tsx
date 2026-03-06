'use client';

import { useState } from 'react';
import { MessageSquare, Play, Award, TrendingUp, Building2, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

interface Question {
    question: string;
    answer: string;
    score?: number;
    feedback?: string;
}

export default function InterviewPage() {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [round, setRound] = useState('technical');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionStarted, setSessionStarted] = useState(false);

    const handleStartSession = async () => {
        if (!company.trim() || !role.trim()) {
            toast.error('Please enter company and role');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/interview/start', {
                company,
                role,
                round
            });
            setQuestions(response.data.data.questions.map((q: string) => ({ question: q, answer: '' })));
            setSessionStarted(true);
            toast.success('Interview session started!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to start session');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim()) {
            toast.error('Please provide an answer');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/interview/evaluate', {
                question: questions[currentIndex].question,
                answer: currentAnswer,
                round
            });

            const updatedQuestions = [...questions];
            updatedQuestions[currentIndex] = {
                ...updatedQuestions[currentIndex],
                answer: currentAnswer,
                score: response.data.data.score,
                feedback: response.data.data.feedback
            };
            setQuestions(updatedQuestions);
            setCurrentAnswer('');

            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }

            toast.success('Answer evaluated!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to evaluate answer');
        } finally {
            setIsLoading(false);
        }
    };

    const averageScore = questions.filter(q => q.score).length > 0
        ? Math.round(questions.reduce((sum, q) => sum + (q.score || 0), 0) / questions.filter(q => q.score).length)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-primary-600" />
                        Interview AI Lab
                    </h1>
                    <p className="text-gray-600 mt-2">Company-specific questions with real-time AI evaluation</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Sessions</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <Play className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Avg Score</p>
                            <p className="text-2xl font-bold mt-1">{averageScore}%</p>
                        </div>
                        <Award className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Questions</p>
                            <p className="text-2xl font-bold mt-1">{questions.filter(q => q.answer).length}/{questions.length}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Improvement</p>
                            <p className="text-2xl font-bold mt-1">--</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {!sessionStarted ? (
                /* Setup Form */
                <div className="max-w-2xl mx-auto">
                    <div className="card">
                        <h2 className="text-2xl font-semibold mb-6 text-center">Start Interview Practice</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Google, Amazon, Microsoft"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Software Engineer, Product Manager"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Interview Round
                                </label>
                                <select
                                    className="input"
                                    value={round}
                                    onChange={(e) => setRound(e.target.value)}
                                >
                                    <option value="technical">Technical</option>
                                    <option value="behavioral">Behavioral</option>
                                    <option value="system-design">System Design</option>
                                </select>
                            </div>

                            <button
                                onClick={handleStartSession}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                            >
                                <Play className="w-5 h-5" />
                                Start Interview Session
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Interview Session */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Interview Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-6 h-6 text-primary-600" />
                                    <div>
                                        <h3 className="font-semibold">{company}</h3>
                                        <p className="text-sm text-gray-600">{role} - {round}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    Question {currentIndex + 1} of {questions.length}
                                </div>
                            </div>

                            <div className="bg-primary-50 p-6 rounded-lg mb-6">
                                <p className="text-lg font-medium text-gray-800">
                                    {questions[currentIndex]?.question}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Your Answer
                                        </label>
                                        <button className="btn-outline btn-sm flex items-center gap-2">
                                            <Mic className="w-4 h-4" />
                                            Voice Input
                                        </button>
                                    </div>
                                    <textarea
                                        className="input min-h-[200px]"
                                        placeholder="Type your answer here..."
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSubmitAnswer}
                                        disabled={isLoading}
                                        className="btn-primary flex-1"
                                    >
                                        Submit Answer
                                    </button>
                                    {currentIndex > 0 && (
                                        <button
                                            onClick={() => setCurrentIndex(currentIndex - 1)}
                                            className="btn-outline"
                                        >
                                            Previous
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {questions[currentIndex]?.feedback && (
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-yellow-500" />
                                    AI Feedback
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Score:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${questions[currentIndex].score}%` }}
                                            />
                                        </div>
                                        <span className="font-bold text-lg">{questions[currentIndex].score}%</span>
                                    </div>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                        {questions[currentIndex].feedback}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Sidebar */}
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="font-semibold mb-4">Progress</h3>
                            <div className="space-y-2">
                                {questions.map((q, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${index === currentIndex
                                                ? 'bg-primary-100 border-2 border-primary-500'
                                                : q.answer
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-gray-50 border border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Q{index + 1}</span>
                                            {q.score && (
                                                <span className="text-xs font-bold text-green-600">
                                                    {q.score}%
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSessionStarted(false);
                                setQuestions([]);
                                setCurrentIndex(0);
                                setCurrentAnswer('');
                            }}
                            className="btn-outline w-full"
                        >
                            End Session
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
