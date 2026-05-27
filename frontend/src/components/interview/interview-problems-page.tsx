'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronRight, Trophy, TrendingUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import InterviewAiLabPageV2 from './interview-ai-lab-page-v2';

interface Problem {
    _id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    tags: string[];
    accepted: number;
    submissions: number;
    testCaseCount: number;
    lastAttempt?: {
        verdict: string;
        createdAt: string;
    };
}

interface ProblemsResponse {
    problems: Problem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function InterviewProblemsPage() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
    const [selectedProblemData, setSelectedProblemData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [page, setPage] = useState(1);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // Fetch problems
    useEffect(() => {
        const fetchProblems = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (difficultyFilter) params.append('difficulty', difficultyFilter);
                if (categoryFilter) params.append('category', categoryFilter);
                params.append('page', page.toString());
                params.append('limit', '20');

                const response = await api.get<ProblemsResponse>(
                    `/interview/problems?${params.toString()}`
                );

                setProblems(response.data.problems);
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to fetch problems');
            } finally {
                setLoading(false);
            }
        };

        fetchProblems();
    }, [difficultyFilter, categoryFilter, page]);

    // Search problems
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await api.get(
                `/interview/problems/search?q=${encodeURIComponent(searchQuery)}`
            );
            setProblems(response.data.data.results);
            setPage(1);
        } catch (error: any) {
            toast.error('Search failed');
        }
    };

    // Fetch problem details
    const handleSelectProblem = async (problemId: string) => {
        // 1. Request Fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }

        // 2. Request Camera & Mic
        let stream = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMediaStream(stream);
            } catch (err) {
                toast.error('Camera/Mic access denied. Proceeding without strict proctoring.', { icon: '⚠️' });
            }
        }

        try {
            const response = await api.get(`/interview/problems/${problemId}`);
            setSelectedProblem(problemId);
            setSelectedProblemData(response.data.data);
        } catch (error: any) {
            toast.error('Failed to load problem');
        }
    };

    // If a problem is selected, show the IDE
    if (selectedProblem && selectedProblemData) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/80 z-10">
                    <button
                        onClick={() => {
                            setSelectedProblem(null);
                            if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen();
                            if (mediaStream) {
                                mediaStream.getTracks().forEach(t => t.stop());
                                setMediaStream(null);
                            }
                        }}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold text-white"
                    >
                        ← Back to Problems
                    </button>
                    <h2 className="text-white font-bold text-lg">{selectedProblemData.title}</h2>
                    <div className="w-24"></div> {/* spacer */}
                </div>
                <div className="flex-1 relative">
                    <InterviewAiLabPageV2
                        questionId={selectedProblem}
                        question={selectedProblemData}
                        mediaStream={mediaStream}
                    />
                </div>
            </div>
        );
    }

    // Show problems list
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            {/* Header */}
            <div className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-4xl font-bold mb-6">Code Interview Practice</h1>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search problems by title or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded bg-slate-800 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
                        >
                            Search
                        </button>
                    </form>

                    {/* Filters */}
                    <div className="flex gap-4 flex-wrap">
                        <select
                            value={difficultyFilter}
                            onChange={(e) => {
                                setDifficultyFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-4 py-2 rounded bg-slate-800 border border-slate-600 text-white hover:border-slate-500"
                        >
                            <option value="">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-4 py-2 rounded bg-slate-800 border border-slate-600 text-white hover:border-slate-500"
                        >
                            <option value="">All Categories</option>
                            <option value="Array">Array</option>
                            <option value="String">String</option>
                            <option value="Tree">Tree</option>
                            <option value="Graph">Graph</option>
                            <option value="DP">Dynamic Programming</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Problems Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-24 bg-slate-700/50 rounded animate-pulse"
                            />
                        ))}
                    </div>
                ) : problems.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-400 text-lg">No problems found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {problems.map((problem, index) => (
                            <motion.div
                                key={problem._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectProblem(problem._id)}
                                className="group cursor-pointer bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg p-6 transition transform hover:scale-[1.02]"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold group-hover:text-blue-400 transition">
                                            {problem.title}
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                                            {problem.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition ml-4" />
                                </div>

                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex gap-3">
                                        {/* Difficulty Badge */}
                                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                                            problem.difficulty === 'Easy'
                                                ? 'bg-green-900/30 text-green-400'
                                                : problem.difficulty === 'Medium'
                                                ? 'bg-yellow-900/30 text-yellow-400'
                                                : 'bg-red-900/30 text-red-400'
                                        }`}>
                                            {problem.difficulty}
                                        </span>

                                        {/* Category Badge */}
                                        <span className="px-3 py-1 rounded text-xs font-semibold bg-blue-900/30 text-blue-400">
                                            {problem.category}
                                        </span>
                                    </div>

                                    <div className="flex gap-6 text-xs text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4" />
                                            <span>{problem.accepted} solved</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>{problem.submissions} attempts</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            <span>{problem.testCaseCount} tests</span>
                                        </div>
                                    </div>

                                    {problem.lastAttempt && (
                                        <div className={`text-xs font-semibold ${
                                            problem.lastAttempt.verdict === 'Accepted'
                                                ? 'text-green-400'
                                                : 'text-slate-400'
                                        }`}>
                                            Last: {problem.lastAttempt.verdict}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {problems.length > 0 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-slate-400">
                            Page {page}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
