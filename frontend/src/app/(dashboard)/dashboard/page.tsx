'use client';

import { useAuthStore } from '@/store/auth';
import { TrendingUp, Code, FileText, MessageSquare, Target, Sparkles, Rocket, Brain, Trophy, ArrowRight, Zap, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-[#111111] border border-[#00D9FF]/20 p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                        <span className="text-sm font-medium text-[#00D9FF] uppercase tracking-wider">Career OS</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <span className="text-white">Welcome back, </span>
                        <span className="text-[#00D9FF]">{user?.name}!</span> 👋
                    </h1>
                    <p className="text-gray-400 text-lg">Here's your career progress overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Code className="w-6 h-6 text-[#00D9FF]" />}
                    label="DSA Problems Solved"
                    value="0"
                />
                <StatCard
                    icon={<MessageSquare className="w-6 h-6 text-[#00D9FF]" />}
                    label="Interview Sessions"
                    value="0"
                />
                <StatCard
                    icon={<FileText className="w-6 h-6 text-[#00D9FF]" />}
                    label="Resume Versions"
                    value="0"
                />
                <StatCard
                    icon={<Target className="w-6 h-6 text-[#00D9FF]" />}
                    label="Weekly Goal"
                    value={`${user?.preferences?.weeklyGoal || 5} hrs`}
                    subtext="On track"
                />
            </div>

            {/* Quick Actions & Features Grid */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-[#00D9FF]" />
                    <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Practice DSA */}
                    <ActionCard
                        href="/dashboard/dsa"
                        icon={<Code className="w-8 h-8 text-[#00D9FF]" />}
                        title="Practice DSA"
                        description="Solve problems with AI guidance"
                    />

                    {/* Mock Interview */}
                    <ActionCard
                        href="/dashboard/interview"
                        icon={<MessageSquare className="w-8 h-8 text-[#00D9FF]" />}
                        title="Mock Interview"
                        description="Prepare for your next interview"
                    />

                    {/* Build Resume */}
                    <ActionCard
                        href="/dashboard/resume"
                        icon={<FileText className="w-8 h-8 text-[#00D9FF]" />}
                        title="Build Resume"
                        description="Create ATS-optimized resume"
                    />

                    {/* Career Roadmap */}
                    <ActionCard
                        href="/dashboard/roadmap"
                        icon={<Target className="w-8 h-8 text-[#00D9FF]" />}
                        title="Career Roadmap"
                        description="Personalized learning path"
                    />

                    {/* Research Assistant */}
                    <ActionCard
                        href="/research"
                        icon={<Brain className="w-8 h-8 text-[#00D9FF]" />}
                        title="Research Assistant"
                        description="AI-powered research help"
                    />

                    {/* PDF Learning */}
                    <ActionCard
                        href="/dashboard/pdf"
                        icon={<BookOpen className="w-8 h-8 text-[#00D9FF]" />}
                        title="PDF Learning"
                        description="Extract insights from PDFs"
                    />

                    {/* Skill Marketplace */}
                    <ActionCard
                        href="/dashboard/skill-marketplace"
                        icon={<Users className="w-8 h-8 text-[#00D9FF]" />}
                        title="Skill Marketplace"
                        description="Exchange skills with peers"
                    />

                    {/* Career Twin */}
                    <ActionCard
                        href="/dashboard/career-twin"
                        icon={<Sparkles className="w-8 h-8 text-[#00D9FF]" />}
                        title="Career Twin"
                        description="AI career companion"
                    />

                    {/* View All */}
                    <ActionCard
                        href="/dashboard"
                        icon={<Trophy className="w-8 h-8 text-[#00D9FF]" />}
                        title="View All"
                        description="Explore more features"
                    />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl bg-[#111111] border border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#00D9FF]" />
                    <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                </div>
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00D9FF]/10 flex items-center justify-center">
                        <Rocket className="w-8 h-8 text-[#00D9FF]" />
                    </div>
                    <p className="text-gray-400 mb-2">No recent activity yet</p>
                    <p className="text-sm text-gray-500">Start your journey by exploring the features above!</p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subtext = "+0%" }: any) {
    return (
        <div className="group relative overflow-hidden rounded-xl bg-[#111111] border border-gray-800 p-6 hover:border-[#00D9FF]/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-xs text-green-400 font-medium">{subtext}</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );
}

function ActionCard({ href, icon, title, description }: any) {
    return (
        <Link href={href}>
            <div className="group relative overflow-hidden rounded-xl bg-[#111111] border border-gray-800 p-6 hover:border-[#00D9FF]/50 hover:bg-[#111111] transition-all duration-300 cursor-pointer h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9FF]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#00D9FF]/20 transition-colors">
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{description}</p>
                    <div className="flex items-center gap-2 text-[#00D9FF] text-sm font-medium">
                        <span>Get started</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
