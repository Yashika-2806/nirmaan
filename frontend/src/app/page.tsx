'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Brain, Zap, Code, Award } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const trustSignals = [
    '12,000+ learners using interview simulation workflows',
    '240,000+ coding attempts evaluated with AI feedback',
    'Structured DSA, resume, and mock interview pipeline',
    'Offer-readiness score improvements tracked weekly',
];

const coreFeatures = [
    {
        title: 'AI Interview Feedback Engine',
        description: 'Get instant review after every submission: time/space complexity, edge-case coverage, trade-off analysis, and interviewer-style follow-up prompts.',
        icon: Brain,
    },
    {
        title: 'Production-Grade Practice IDE',
        description: 'Monaco-based editor with multi-language execution, test validation, and low-latency feedback for DSA and interview problem solving.',
        icon: Code,
    },
    {
        title: 'Performance Analytics and Momentum',
        description: 'Track consistency, weak-topic density, and trend lines with adaptive practice paths aligned to your current interview level.',
        icon: Zap,
    },
    {
        title: 'End-to-End Placement Readiness',
        description: 'Combine resume quality checks, interview performance metrics, and role-aligned planning inside one unified dashboard.',
        icon: Award,
    },
];

const premiumFeatures = [
    'Unlimited AI interview feedback runs',
    'Company-specific question sets (Google, Amazon, Meta)',
    'Advanced optimization hints & pattern recognition',
    'Mock interview session replays with rubric',
    'Priority support & 1-on-1 guidance',
];

const pricing = [
    {
        name: 'Free',
        price: 'INR 0',
        detail: 'For students starting interview preparation',
        points: ['5 free practice sessions/week', 'Basic test case runners', 'Sample AI feedback', 'Community access'],
        cta: 'Start Free',
        href: '/dashboard/interview',
        highlighted: false,
    },
    {
        name: 'Pro',
        price: 'INR 499/month',
        detail: 'For focused weekly interview practice',
        points: [
            'Unlimited practice sessions',
            'Full AI interviewer feedback',
            'Company-specific difficulty modes',
            'Weekly progress reports',
            'Email support',
        ],
        cta: 'Start 7-Day Free Trial',
        href: '/register?plan=pro',
        highlighted: true,
    },
    {
        name: 'Elite',
        price: 'INR 999/month',
        detail: 'For advanced candidates targeting top product roles',
        points: [
            'Everything in Pro',
            '1-on-1 mock interviews with AI rubric',
            'Private company prep packs',
            'Offer probability forecast',
            'Priority expert support',
        ],
        cta: 'Get Elite Access',
        href: '/register?plan=elite',
        highlighted: false,
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#070c1a] text-white">
            <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070c1a]/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 fade-up">
                    <Link
                        href="/"
                        onClick={() => trackEvent('cta_clicked', { source: 'landing_topbar', cta: 'home_logo' })}
                        className="text-base font-black tracking-wide text-white"
                    >
                        Nirmaan
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_topbar', cta: 'login' })}
                            className="rounded-lg border border-white/20 bg-white/5 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 tap-fast"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_topbar', cta: 'sign_in' })}
                            className="rounded-lg bg-gradient-to-r from-violet-400 to-cyan-400 px-3.5 py-1.5 text-sm font-bold text-slate-950 transition hover:shadow-lg hover:shadow-violet-500/30 tap-fast"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section with AI Interviewer Focus */}
            <section className="relative overflow-hidden border-b border-white/10">
                <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
                <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-28">
                    <div className="fade-up stagger-1">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-400/15 px-3 py-2 text-sm text-violet-200 font-semibold">
                            <Brain className="h-4 w-4" />
                            AI-Assisted Technical Interview Platform
                        </div>

                        <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                            Practice with
                            <br />
                            an Interview-Grade AI
                        </h1>

                        <p className="mt-6 max-w-2xl text-[15px] text-slate-300 md:text-[17px] leading-relaxed">
                            Nirmaan helps software engineering candidates prepare with structured coding practice, mock interview feedback, and outcome-driven progress tracking.
                            <br /><br />
                            <strong>Built for real interview performance, not just question completion.</strong>
                        </p>

                        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'go_dashboard' })}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-7 py-4 font-semibold text-cyan-200 transition hover:bg-cyan-400/20 text-base tap-fast"
                            >
                                Go to Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/dashboard/interview"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'open_interview' })}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 px-7 py-4 font-bold text-slate-950 shadow-lg shadow-violet-500/30 transition hover:shadow-xl hover:shadow-violet-500/40 text-base tap-fast"
                            >
                                <Code className="h-5 w-5" />
                                Launch Interview Simulator
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/register?src=hero_secondary"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'signup' })}
                                className="rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center font-semibold transition hover:bg-white/10 text-base tap-fast"
                            >
                                Create Free Workspace
                            </Link>
                        </div>

                        <div className="mt-8 grid gap-3 text-sm text-slate-300">
                            {trustSignals.map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Interview Showcase Card */}
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-950 p-6 backdrop-blur-xl overflow-hidden relative fade-up stagger-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/5" />
                        <div className="relative">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs text-violet-200 font-semibold">
                                Live Interview Evaluation Demo
                            </div>

                            <h2 className="text-xl font-bold">Two Sum · Baseline Screening Problem</h2>
                            <p className="mt-2 text-sm text-slate-400">Example of how the AI interviewer reviews a submitted solution</p>

                            <div className="mt-4 rounded-lg border border-slate-700 bg-[#0a0a0a] p-4 font-mono text-xs text-emerald-300">
                                <div className="mb-3">
                                    <p className="text-slate-400">&gt; Your solution passes all 3 sample tests</p>
                                    <p className="text-slate-400 mt-1">&gt; Judge0 Verdict: <span className="text-emerald-400 font-semibold">ACCEPTED</span></p>
                                </div>
                                <div className="border-t border-slate-700 pt-3">
                                    <p className="text-violet-300 font-semibold">Interview Feedback Summary:</p>
                                    <ul className="mt-2 space-y-1 text-slate-300">
                                        <li>• Time Complexity: <span className="text-cyan-300">O(n) ✓ Optimal</span></li>
                                        <li>• Approach: <span className="text-amber-300">Suggested two-pointer over brute force</span></li>
                                        <li>• Edge Cases: <span className="text-amber-300">Add empty array validation</span></li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero_card', cta: 'try_now' })}
                                className="mt-4 w-full rounded-lg bg-violet-500/20 border border-violet-400/30 px-3 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/30 transition tap-fast"
                            >
                                Run Similar Evaluation →
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Interview Showcase */}
            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold md:text-5xl">
                        One Platform for DSA, Interviews, and Career Progress
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-slate-400">
                        Designed for students, early-career engineers, and role-switchers targeting technical interviews.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {coreFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <article key={feature.title} className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 hover:bg-white/[0.05] transition fade-up ${index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : index === 2 ? 'stagger-3' : 'stagger-4'}`}>
                                <Icon className="h-8 w-8 text-violet-400 mb-3" />
                                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                                <p className="mt-3 text-sm text-slate-400">{feature.description}</p>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Comparison: Why Nirmaan vs Alternatives */}
            <section className="border-y border-white/10 bg-[#0b1224]">
                <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold md:text-4xl">Purpose-Built for Interview Preparation</h2>
                        <p className="mt-4 text-base md:text-lg text-slate-400">A practical workflow that combines coding execution with interview-quality review.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-4 py-3 text-left font-semibold text-white">Feature</th>
                                    <th className="px-4 py-3 text-center font-semibold text-violet-300">Nirmaan</th>
                                    <th className="px-4 py-3 text-center font-semibold text-slate-400">LeetCode</th>
                                    <th className="px-4 py-3 text-center font-semibold text-slate-400">ChatGPT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { feature: 'AI Interview Feedback', nirmaan: true, leetcode: false, chatgpt: false },
                                    { feature: 'Complexity Analysis', nirmaan: true, leetcode: false, chatgpt: false },
                                    { feature: 'Real Code Execution', nirmaan: true, leetcode: true, chatgpt: false },
                                    { feature: 'Edge Case Detection', nirmaan: true, leetcode: false, chatgpt: false },
                                    { feature: 'Optimization Hints', nirmaan: true, leetcode: false, chatgpt: true },
                                    { feature: 'Interview Simulation', nirmaan: true, leetcode: false, chatgpt: false },
                                ].map((row) => (
                                    <tr key={row.feature}>
                                        <td className="px-4 py-3 text-white">{row.feature}</td>
                                        <td className="px-4 py-3 text-center">{row.nirmaan ? <CheckCircle2 className="h-5 w-5 text-emerald-400 inline" /> : '–'}</td>
                                        <td className="px-4 py-3 text-center text-slate-500">{row.leetcode ? <CheckCircle2 className="h-5 w-5 text-slate-500 inline" /> : '–'}</td>
                                        <td className="px-4 py-3 text-center text-slate-500">{row.chatgpt ? <CheckCircle2 className="h-5 w-5 text-slate-500 inline" /> : '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold md:text-5xl">Simple Pricing for Every Stage</h2>
                    <p className="mt-4 text-base md:text-lg text-slate-400">Start free, move to advanced support when needed.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {pricing.map((plan, index) => (
                        <article
                            key={plan.name}
                            className={`rounded-2xl border p-7 transition fade-up ${index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : 'stagger-3'} ${
                                plan.highlighted
                                    ? 'border-violet-400/50 bg-gradient-to-br from-violet-400/15 to-violet-400/5 shadow-lg shadow-violet-500/20'
                                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-300">{plan.name}</p>
                            <p className="mt-3 text-4xl font-black">{plan.price}</p>
                            <p className="mt-2 text-sm text-slate-400">{plan.detail}</p>

                            <ul className="mt-6 space-y-3 text-sm">
                                {plan.points.map((point) => (
                                    <li key={point} className="flex items-start gap-3 text-slate-300">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`${plan.href}?src=pricing_${plan.name.toLowerCase()}`}
                                onClick={() =>
                                    trackEvent('pricing_cta_clicked', {
                                        source: 'landing_pricing',
                                        plan: plan.name.toLowerCase(),
                                        cta: plan.cta,
                                    })
                                }
                                className={`mt-7 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-bold transition tap-fast ${
                                    plan.highlighted
                                        ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl'
                                        : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                                }`}
                            >
                                {plan.cta}
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="border-t border-white/10 bg-gradient-to-b from-slate-950 to-[#070c1a]">
                <div className="mx-auto max-w-3xl px-6 py-20 text-center">
                    <h2 className="text-3xl font-black md:text-5xl">
                        Ready to improve technical interview outcomes?
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-slate-400 leading-relaxed">
                        Start with guided practice, measure progress weekly, and prepare with confidence for real hiring rounds.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/dashboard/interview"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_final_cta', cta: 'start_interview' })}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-violet-500/30 transition hover:shadow-xl text-lg tap-fast"
                        >
                            Start Interview Practice
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/register"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_final_cta', cta: 'signup' })}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-bold text-white transition hover:bg-white/10 text-lg tap-fast"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

