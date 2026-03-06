'use client';

import { useState } from 'react';
import { User, Brain, Zap, TrendingUp, Target, Play, BarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

interface DigitalTwin {
    personality: string;
    workStyle: string;
    strengths: string[];
    growthAreas: string[];
}

interface Simulation {
    scenario: string;
    outcome: string;
    recommendation: string;
}

export default function CareerTwinPage() {
    const [hasCreated, setHasCreated] = useState(false);
    const [twin, setTwin] = useState<DigitalTwin | null>(null);
    const [scenario, setScenario] = useState('');
    const [simulation, setSimulation] = useState<Simulation | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateTwin = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/career-twin/create');
            setTwin(response.data.data.twin);
            setHasCreated(true);
            toast.success('Digital twin created!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create twin');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulate = async () => {
        if (!scenario.trim()) {
            toast.error('Please describe a career scenario');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/career-twin/simulate', {
                scenario
            });
            setSimulation(response.data.data.simulation);
            toast.success('Simulation complete!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to run simulation');
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
                        <User className="w-8 h-8 text-primary-600" />
                        Career Digital Twin
                    </h1>
                    <p className="text-gray-600 mt-2">Simulate career decisions before making them in real life</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Twin Status</p>
                            <p className="text-2xl font-bold mt-1">{hasCreated ? 'Active' : 'Inactive'}</p>
                        </div>
                        <User className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Simulations</p>
                            <p className="text-2xl font-bold mt-1">{simulation ? 1 : 0}</p>
                        </div>
                        <Play className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Insights</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <Brain className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Accuracy</p>
                            <p className="text-2xl font-bold mt-1">--</p>
                        </div>
                        <BarChart className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            {!hasCreated ? (
                /* Create Twin */
                <div className="max-w-2xl mx-auto">
                    <div className="card text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Create Your Digital Twin</h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            AI will analyze your profile, skills, and preferences to create a digital twin that simulates career decisions
                        </p>
                        <button
                            onClick={handleCreateTwin}
                            disabled={isLoading}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            Create Digital Twin
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="card text-center">
                            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">AI Analysis</h3>
                            <p className="text-sm text-gray-600">Deep personality and skill analysis</p>
                        </div>
                        <div className="card text-center">
                            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Simulations</h3>
                            <p className="text-sm text-gray-600">Test career decisions safely</p>
                        </div>
                        <div className="card text-center">
                            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <h3 className="font-semibold mb-1">Predictions</h3>
                            <p className="text-sm text-gray-600">Data-driven outcome forecasts</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Twin Dashboard */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Twin Profile */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                Your Digital Twin
                            </h2>

                            {twin && (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Personality Type</p>
                                        <p className="font-medium">{twin.personality}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Work Style</p>
                                        <p className="font-medium">{twin.workStyle}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Strengths</p>
                                        <div className="flex flex-wrap gap-2">
                                            {twin.strengths.map((strength, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                                                >
                                                    {strength}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Growth Areas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {twin.growthAreas.map((area, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                                                >
                                                    {area}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card bg-gradient-secondary text-white">
                            <h3 className="font-semibold mb-2">Simulation Ideas</h3>
                            <ul className="space-y-2 text-sm text-secondary-100">
                                <li>• Switching to a new role</li>
                                <li>• Relocating to a new city</li>
                                <li>• Starting a side project</li>
                                <li>• Joining a startup vs big tech</li>
                                <li>• Pursuing higher education</li>
                            </ul>
                        </div>
                    </div>

                    {/* Simulation Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Play className="w-5 h-5 text-green-500" />
                                Run Simulation
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Career Scenario
                                    </label>
                                    <textarea
                                        className="input min-h-[150px]"
                                        placeholder="Describe a career decision you're considering... (e.g., 'Should I switch from backend to frontend development?' or 'What if I join a startup instead of staying at my current company?')"
                                        value={scenario}
                                        onChange={(e) => setScenario(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSimulate}
                                    disabled={isLoading}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    Run Simulation
                                </button>
                            </div>
                        </div>

                        {simulation && (
                            <div className="card">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    Simulation Results
                                </h2>

                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-blue-600" />
                                            Scenario
                                        </h3>
                                        <p className="text-sm text-gray-700">{simulation.scenario}</p>
                                    </div>

                                    <div className="p-4 bg-purple-50 rounded-lg">
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-purple-600" />
                                            Predicted Outcome
                                        </h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {simulation.outcome}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-green-600" />
                                            AI Recommendation
                                        </h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {simulation.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!simulation && (
                            <div className="card text-center py-12">
                                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    Describe a career scenario to see how it might play out
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
