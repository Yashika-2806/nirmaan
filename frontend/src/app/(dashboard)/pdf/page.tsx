'use client';

import { useState } from 'react';
import { FileText, Upload, MessageSquare, Brain, BookOpen, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

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
