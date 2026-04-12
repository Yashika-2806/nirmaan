'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { aiService } from '@/services/aiService';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface AnalysisState {
    loading: boolean;
    error: string | null;
    analysis: any | null;
}

interface DSAAnalysisDisplayProps {
    problemTitle: string;
    problemDescription: string;
    code: string;
    language: string;
    onAnalysisComplete?: (analysis: any) => void;
}

export default function DSAAnalysisDisplay({
    problemTitle,
    problemDescription,
    code,
    language,
    onAnalysisComplete
}: DSAAnalysisDisplayProps) {
    const [state, setState] = useState<AnalysisState>({
        loading: false,
        error: null,
        analysis: null
    });

    const handleAnalyze = async () => {
        if (!code.trim()) {
            setState(prev => ({ ...prev, error: 'Please provide code to analyze' }));
            return;
        }

        setState({ loading: true, error: null, analysis: null });

        try {
            const result = await aiService.analyzeDSASolution(
                problemTitle,
                problemDescription,
                code,
                language
            );

            setState({ loading: false, error: null, analysis: result.analysis });
            onAnalysisComplete?.(result.analysis);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
            setState({ loading: false, error: errorMsg, analysis: null });
        }
    };

    return (
        <div className="w-full space-y-4">
            <button
                onClick={handleAnalyze}
                disabled={state.loading}
                className="w-full btn-primary flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
                {state.loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing your solution...
                    </>
                ) : (
                    <>
                        <Zap className="w-5 h-5" />
                        Get Interview-Ready Analysis
                    </>
                )}
            </button>

            {state.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-200">{state.error}</div>
                </div>
            )}

            {state.analysis && (
                <div className="space-y-6">
                    {/* Overall Rating */}
                    <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-semibold">Overall Assessment</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                state.analysis.rating === 'Strong' ? 'bg-green-500/20 text-green-300' :
                                state.analysis.rating === 'Good' ? 'bg-blue-500/20 text-blue-300' :
                                state.analysis.rating === 'Fair' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-orange-500/20 text-orange-300'
                            }`}>
                                {state.analysis.rating || 'Pending'}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">{state.analysis.correctness}</p>
                    </div>

                    {/* Approach Summary */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            Your Approach
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {state.analysis.approachSummary}
                        </p>
                    </div>

                    {/* Correctness Details */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            Correctness Analysis
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {state.analysis.correctnessDetails}
                        </p>
                    </div>

                    {/* Complexity Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                            <h4 className="text-cyan-300 text-sm font-semibold mb-2">Your Solution</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-400">Time:</span>
                                    <span className="text-white ml-2 font-mono">{state.analysis.timeComplexity}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Space:</span>
                                    <span className="text-white ml-2 font-mono">{state.analysis.spaceComplexity}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                            <h4 className="text-green-300 text-sm font-semibold mb-2">Optimal Solution</h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-400">Time:</span>
                                    <span className="text-white ml-2 font-mono">{state.analysis.optimalTimeComplexity}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Space:</span>
                                    <span className="text-white ml-2 font-mono">{state.analysis.optimalSpaceComplexity}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Strengths */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-green-300 mb-3">What You Did Well ✅</h3>
                        <ul className="space-y-2">
                            {state.analysis.strengths?.map((strength: string, idx: number) => (
                                <li key={idx} className="text-gray-300 text-sm flex gap-2">
                                    <span className="text-green-400 font-bold">•</span>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Improvements */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-300 mb-3">Areas for Improvement 📝</h3>
                        <ul className="space-y-2">
                            {state.analysis.improvements?.map((improvement: string, idx: number) => (
                                <li key={idx} className="text-gray-300 text-sm flex gap-2">
                                    <span className="text-yellow-400 font-bold">•</span>
                                    {improvement}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Optimal Solution */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-300 mb-2">Optimal Approach</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-3">
                            {state.analysis.optimalSolution}
                        </p>
                    </div>

                    {/* Edge Cases */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-300 mb-3">Important Edge Cases</h3>
                        <ul className="space-y-2">
                            {state.analysis.edgeCases?.map((edgeCase: string, idx: number) => (
                                <li key={idx} className="text-gray-300 text-sm flex gap-2">
                                    <span className="text-purple-400 font-bold">→</span>
                                    {edgeCase}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Interview Tip */}
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <h3 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Interview Pro Tip
                        </h3>
                        <p className="text-gray-300 text-sm">{state.analysis.interviewTip}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
