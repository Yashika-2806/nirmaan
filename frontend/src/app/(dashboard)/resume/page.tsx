'use client';

import { useState } from 'react';
import { FileText, Upload, Sparkles, Target, TrendingUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

export default function ResumePage() {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [improvements, setImprovements] = useState<string[]>([]);
    const [bulletPoints, setBulletPoints] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!resumeText.trim()) {
            toast.error('Please enter your resume content');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/resume/analyze', {
                resumeText,
                jobDescription
            });
            setAtsScore(response.data.data.atsScore);
            setImprovements(response.data.data.improvements);
            toast.success('Resume analyzed!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to analyze resume');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateBullets = async () => {
        if (!resumeText.trim()) {
            toast.error('Please enter your experience or project details');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/resume/generate-bullets', {
                content: resumeText
            });
            setBulletPoints(response.data.data.bullets);
            toast.success('Bullet points generated!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to generate bullets');
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
                        Resume Intelligence
                    </h1>
                    <p className="text-gray-600 mt-2">ATS optimization, impact bullets, and recruiter matching scores</p>
                </div>
                <button className="btn-outline flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Resume
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">ATS Score</p>
                            <p className="text-3xl font-bold mt-1">{atsScore !== null ? `${atsScore}%` : '--'}</p>
                        </div>
                        <Target className={`w-8 h-8 ${atsScore && atsScore >= 80 ? 'text-green-500' : 'text-orange-500'}`} />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Versions</p>
                            <p className="text-3xl font-bold mt-1">1</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Improvements</p>
                            <p className="text-3xl font-bold mt-1">{improvements.length}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Resume Content</h2>
                        <textarea
                            className="input min-h-[300px] font-mono text-sm"
                            placeholder="Paste your resume content here..."
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                        />
                        <button className="btn-outline w-full mt-4 flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Resume File
                        </button>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Target Job Description (Optional)</h2>
                        <textarea
                            className="input min-h-[150px]"
                            placeholder="Paste the job description to optimize your resume for..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Target className="w-4 h-4" />
                            Analyze ATS Score
                        </button>
                        <button
                            onClick={handleGenerateBullets}
                            disabled={isLoading}
                            className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate Bullets
                        </button>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {improvements.length > 0 && (
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                Improvement Suggestions
                            </h2>
                            <ul className="space-y-3">
                                {improvements.map((improvement, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-700 text-sm">{improvement}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {bulletPoints.length > 0 && (
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                AI-Generated Bullet Points
                            </h2>
                            <ul className="space-y-2">
                                {bulletPoints.map((bullet, index) => (
                                    <li key={index} className="flex items-start gap-2 text-gray-700">
                                        <span className="text-primary-600 mt-1">•</span>
                                        <span className="text-sm">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {improvements.length === 0 && bulletPoints.length === 0 && (
                        <div className="card text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Add your resume content and click analyze to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
