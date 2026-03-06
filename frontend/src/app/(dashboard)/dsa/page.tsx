'use client';

import { useState } from 'react';
import { Brain, Code, Lightbulb, TrendingUp, Play, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

export default function DSAPage() {
    const [problem, setProblem] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [explanation, setExplanation] = useState('');
    const [approach, setApproach] = useState('');
    const [code, setCode] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleExplain = async () => {
        if (!problem.trim()) {
            toast.error('Please enter a problem description');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/dsa/explain', {
                problem,
                difficulty
            });
            setExplanation(response.data.data.explanation);
            toast.success('Problem explained!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to explain problem');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetApproach = async () => {
        if (!problem.trim()) {
            toast.error('Please enter a problem description');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/dsa/approach', {
                problem,
                difficulty
            });
            setApproach(response.data.data.approach);
            toast.success('Approach generated!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to generate approach');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeCode = async () => {
        if (!code.trim()) {
            toast.error('Please enter your code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/dsa/analyze', {
                problem,
                code,
                difficulty
            });
            setFeedback(response.data.data.feedback);
            toast.success('Code analyzed!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to analyze code');
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
                        <Brain className="w-8 h-8 text-primary-600" />
                        DSA Intelligence Engine
                    </h1>
                    <p className="text-gray-600 mt-2">AI-powered problem solving with adaptive hints and visualizations</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Problems Solved</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Current Streak</p>
                            <p className="text-2xl font-bold mt-1">0 days</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Easy</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-bold">E</span>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Hard</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 font-bold">H</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Input */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
                        <textarea
                            className="input min-h-[200px]"
                            placeholder="Describe your DSA problem here... (e.g., 'Find the longest substring without repeating characters')"
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                        />

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty Level
                            </label>
                            <select
                                className="input"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleExplain}
                                disabled={isLoading}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                <Lightbulb className="w-4 h-4" />
                                Explain Problem
                            </button>
                            <button
                                onClick={handleGetApproach}
                                disabled={isLoading}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                            >
                                <Brain className="w-4 h-4" />
                                Get Approach
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Your Solution</h2>
                        <textarea
                            className="input font-mono text-sm min-h-[300px]"
                            placeholder="Paste your code here for AI analysis..."
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button
                            onClick={handleAnalyzeCode}
                            disabled={isLoading}
                            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                        >
                            <Code className="w-4 h-4" />
                            Analyze Code
                        </button>
                    </div>
                </div>

                {/* Right Column - Output */}
                <div className="space-y-6">
                    {explanation && (
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                Problem Explanation
                            </h2>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
                            </div>
                        </div>
                    )}

                    {approach && (
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-500" />
                                Solution Approach
                            </h2>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{approach}</p>
                            </div>
                        </div>
                    )}

                    {feedback && (
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Code className="w-5 h-5 text-green-500" />
                                Code Analysis
                            </h2>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{feedback}</p>
                            </div>
                        </div>
                    )}

                    {!explanation && !approach && !feedback && (
                        <div className="card text-center py-12">
                            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Enter a problem and click the buttons to get AI assistance</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
