'use client';

import { useState } from 'react';
import { Users, Sparkles, Calendar, MessageSquare, TrendingUp, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

interface Match {
    name: string;
    skillOffered: string;
    skillWanted: string;
    matchScore: number;
    availability: string;
}

export default function SkillMarketplacePage() {
    const [skillOffered, setSkillOffered] = useState('');
    const [skillWanted, setSkillWanted] = useState('');
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasListing, setHasListing] = useState(false);

    const handleCreateListing = async () => {
        if (!skillOffered.trim() || !skillWanted.trim()) {
            toast.error('Please fill in both skills');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/api/marketplace/offer', {
                skillOffered,
                skillWanted
            });
            setHasListing(true);
            toast.success('Listing created! Finding matches...');
            await findMatches();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create listing');
        } finally {
            setIsLoading(false);
        }
    };

    const findMatches = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/marketplace/matches');
            setMatches(response.data.data.matches);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to find matches');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = (match: Match) => {
        toast.success(`Connection request sent to ${match.name}!`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary-600" />
                        Skill Swap Marketplace
                    </h1>
                    <p className="text-gray-600 mt-2">Exchange skills with peers through AI-powered matching</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Active Listings</p>
                            <p className="text-2xl font-bold mt-1">{hasListing ? 1 : 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Matches</p>
                            <p className="text-2xl font-bold mt-1">{matches.length}</p>
                        </div>
                        <Sparkles className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Connections</p>
                            <p className="text-2xl font-bold mt-1">0</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Success Rate</p>
                            <p className="text-2xl font-bold mt-1">--</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Listing */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Your Skill Exchange</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Skill You Can Teach
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., React Development, Python, UI Design"
                                    value={skillOffered}
                                    onChange={(e) => setSkillOffered(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Skill You Want to Learn
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Machine Learning, DevOps, System Design"
                                    value={skillWanted}
                                    onChange={(e) => setSkillWanted(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleCreateListing}
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                {hasListing ? 'Update Listing' : 'Create Listing'}
                            </button>

                            {hasListing && (
                                <button
                                    onClick={findMatches}
                                    disabled={isLoading}
                                    className="btn-secondary w-full flex items-center justify-center gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    Find New Matches
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="card bg-gradient-primary text-white">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            How It Works
                        </h3>
                        <ul className="space-y-2 text-sm text-primary-100">
                            <li>• List skills you can teach</li>
                            <li>• Specify skills you want to learn</li>
                            <li>• AI finds perfect matches</li>
                            <li>• Connect and start learning</li>
                            <li>• Build your network</li>
                        </ul>
                    </div>
                </div>

                {/* Matches */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Your Matches
                        </h2>

                        {matches.length > 0 ? (
                            <div className="space-y-4">
                                {matches.map((match, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                                                    {match.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{match.name}</h3>
                                                    <p className="text-sm text-gray-600">{match.availability}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                                                <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                                                <span className="text-sm font-bold text-yellow-700">
                                                    {match.matchScore}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Can Teach You</p>
                                                <p className="font-medium text-sm text-green-700">
                                                    {match.skillOffered}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Wants to Learn</p>
                                                <p className="font-medium text-sm text-blue-700">
                                                    {match.skillWanted}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleConnect(match)}
                                                className="btn-primary flex-1 btn-sm flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                Connect
                                            </button>
                                            <button className="btn-outline btn-sm flex items-center justify-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Schedule
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    No Matches Yet
                                </h3>
                                <p className="text-gray-500">
                                    Create a listing to find people who want to exchange skills with you
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
