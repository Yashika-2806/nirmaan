'use client';

import { useState } from 'react';
import { BookOpen, Search, FileText, Quote, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

export default function ResearchPage() {
    const [topic, setTopic] = useState('');
    const [researchType, setResearchType] = useState('literature-review');
    const [results, setResults] = useState('');
    const [citations, setCitations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleResearch = async () => {
        if (!topic.trim()) {
            toast.error('Please enter a research topic');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`/api/research/${researchType}`, {
                topic
            });
            setResults(response.data.data.content);
            if (response.data.data.citations) {
                setCitations(response.data.data.citations);
            }
            toast.success('Research completed!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to conduct research');
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
                        <BookOpen className="w-8 h-8 text-primary-600" />
                        Research Assistant
                    </h1>
                    <p className="text-gray-600 mt-2">AI-powered literature reviews, methodology, and citations</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Papers Reviewed</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Citations</p>
                            <p className="text-2xl font-bold mt-1">{citations.length}</p>
                        </div>
                        <Quote className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Topics</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Insights</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <Sparkles className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Research Query</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Research Topic
                                </label>
                                <textarea
                                    className="input min-h-[150px]"
                                    placeholder="Enter your research topic or question..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Research Type
                                </label>
                                <select
                                    className="input"
                                    value={researchType}
                                    onChange={(e) => setResearchType(e.target.value)}
                                >
                                    <option value="literature-review">Literature Review</option>
                                    <option value="methodology">Research Methodology</option>
                                    <option value="citations">Generate Citations</option>
                                </select>
                            </div>

                            <button
                                onClick={handleResearch}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                {isLoading ? 'Researching...' : 'Start Research'}
                            </button>
                        </div>
                    </div>

                    <div className="card bg-gradient-primary text-white">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            AI Research Features
                        </h3>
                        <ul className="space-y-2 text-sm text-primary-100">
                            <li>• Comprehensive literature reviews</li>
                            <li>• Research methodology suggestions</li>
                            <li>• Automatic citation generation</li>
                            <li>• Key findings extraction</li>
                            <li>• Research gap identification</li>
                        </ul>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? (
                        <>
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    Research Results
                                </h2>
                                <div className="prose prose-sm max-w-none">
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {results}
                                    </div>
                                </div>
                            </div>

                            {citations.length > 0 && (
                                <div className="card">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Quote className="w-5 h-5 text-purple-500" />
                                        Citations
                                    </h2>
                                    <div className="space-y-3">
                                        {citations.map((citation, index) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="font-bold text-primary-600">[{index + 1}]</span>
                                                    <p className="text-sm text-gray-700">{citation}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card text-center py-20">
                            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                Ready to Research
                            </h3>
                            <p className="text-gray-500">
                                Enter your research topic and select a research type to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
