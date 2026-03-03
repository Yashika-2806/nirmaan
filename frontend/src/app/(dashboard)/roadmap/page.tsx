'use client';

import { useState } from 'react';
import { Map, Target, Calendar, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

interface Milestone {
    title: string;
    skills: string[];
    duration: string;
    completed: boolean;
}

export default function RoadmapPage() {
    const [goal, setGoal] = useState('');
    const [currentRole, setCurrentRole] = useState('');
    const [duration, setDuration] = useState('6');
    const [roadmap, setRoadmap] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const handleGenerate = async () => {
        if (!goal.trim() || !currentRole.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/roadmap/generate', {
                goal,
                currentRole,
                duration: parseInt(duration)
            });
            setRoadmap(response.data.data.milestones);
            setHasGenerated(true);
            toast.success('Roadmap generated!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to generate roadmap');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMilestone = (index: number) => {
        const updated = [...roadmap];
        updated[index].completed = !updated[index].completed;
        setRoadmap(updated);
        toast.success(updated[index].completed ? 'Milestone completed!' : 'Milestone unchecked');
    };

    const completedCount = roadmap.filter(m => m.completed).length;
    const progress = roadmap.length > 0 ? Math.round((completedCount / roadmap.length) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Map className="w-8 h-8 text-primary-600" />
                        Career Roadmap Generator
                    </h1>
                    <p className="text-gray-600 mt-2">AI-powered personalized learning paths with skill graphs</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Progress</p>
                            <p className="text-2xl font-bold mt-1">{progress}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Milestones</p>
                            <p className="text-2xl font-bold mt-1">{completedCount}/{roadmap.length}</p>
                        </div>
                        <Target className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Duration</p>
                            <p className="text-2xl font-bold mt-1">{duration}m</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Skills</p>
                            <p className="text-2xl font-bold mt-1">{roadmap.reduce((sum, m) => sum + m.skills.length, 0)}</p>
                        </div>
                        <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {!hasGenerated ? (
                /* Generation Form */
                <div className="max-w-2xl mx-auto">
                    <div className="card">
                        <h2 className="text-2xl font-semibold mb-6 text-center">Generate Your Career Roadmap</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Role
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Junior Developer, Student, Career Switcher"
                                    value={currentRole}
                                    onChange={(e) => setCurrentRole(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Career Goal
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Senior Software Engineer at FAANG, ML Engineer"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timeline (months)
                                </label>
                                <select
                                    className="input"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                >
                                    <option value="3">3 months</option>
                                    <option value="6">6 months</option>
                                    <option value="12">12 months</option>
                                    <option value="24">24 months</option>
                                </select>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                            >
                                <Zap className="w-5 h-5" />
                                Generate AI Roadmap
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card text-center">
                            <Target className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Personalized</h3>
                            <p className="text-sm text-gray-600">Tailored to your background and goals</p>
                        </div>
                        <div className="card text-center">
                            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Adaptive</h3>
                            <p className="text-sm text-gray-600">Adjusts based on your progress</p>
                        </div>
                        <div className="card text-center">
                            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">AI-Powered</h3>
                            <p className="text-sm text-gray-600">Industry insights and trends</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Roadmap Display */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Roadmap Timeline */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold">Your Roadmap</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {currentRole} → {goal}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setHasGenerated(false)}
                                    className="btn-outline btn-sm"
                                >
                                    New Roadmap
                                </button>
                            </div>

                            <div className="relative">
                                {/* Progress Line */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                                <div className="space-y-6">
                                    {roadmap.map((milestone, index) => (
                                        <div key={index} className="relative pl-16">
                                            {/* Timeline Dot */}
                                            <div
                                                className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center ${milestone.completed
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-white border-4 border-primary-500 text-primary-600'
                                                    }`}
                                            >
                                                {milestone.completed ? (
                                                    <CheckCircle className="w-6 h-6" />
                                                ) : (
                                                    <span className="font-bold">{index + 1}</span>
                                                )}
                                            </div>

                                            {/* Milestone Card */}
                                            <div
                                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${milestone.completed
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-white border-gray-200 hover:border-primary-300'
                                                    }`}
                                                onClick={() => toggleMilestone(index)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                                                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                                        {milestone.duration}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {milestone.skills.map((skill, skillIndex) => (
                                                        <span
                                                            key={skillIndex}
                                                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="font-semibold mb-4">Overall Progress</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Completion</span>
                                    <span className="font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-primary h-3 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    {completedCount} of {roadmap.length} milestones completed
                                </p>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="font-semibold mb-4">Skills to Learn</h3>
                            <div className="space-y-2">
                                {Array.from(new Set(roadmap.flatMap(m => m.skills))).slice(0, 10).map((skill, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                                        <span>{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card bg-gradient-primary text-white">
                            <h3 className="font-semibold mb-2">Keep Going!</h3>
                            <p className="text-sm text-primary-100">
                                You're making great progress. Stay consistent and you'll reach your goal!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
