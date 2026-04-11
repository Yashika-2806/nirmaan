'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Brain, Zap, Code, Award } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
    const { isLight } = useTheme();

    return (
        <div className={`landing-shell min-h-screen ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isLight ? 'border-slate-200/80 bg-white/85' : 'border-cyan-300/10 bg-[#060b18]/85'}`}>
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 fade-up">
                    <Link
                        href="/"
                        onClick={() => trackEvent('cta_clicked', { source: 'landing_topbar', cta: 'home_logo' })}
                        className={`text-base font-extrabold tracking-[0.12em] ${isLight ? 'text-slate-900' : 'text-white'}`}
                    >
                        Nirmaan
                    </Link>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/login"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_topbar', cta: 'login' })}
                            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition tap-fast ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-cyan-200/30 bg-cyan-400/5 text-cyan-100 hover:bg-cyan-400/10'}`}
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_topbar', cta: 'sign_in' })}
                            className={`rounded-lg bg-gradient-to-r px-3.5 py-1.5 text-sm font-bold transition tap-fast ${isLight ? 'from-sky-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'from-cyan-300 to-sky-400 text-slate-950 hover:shadow-lg hover:shadow-cyan-500/30'}`}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section with AI Interviewer Focus */}
            <section className={`landing-hero relative overflow-hidden border-b grid-overlay ${isLight ? 'border-slate-200/80' : 'border-cyan-300/10'}`}>
                <div className={`absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl ${isLight ? 'bg-sky-400/20' : 'bg-cyan-400/15'}`} />
                <div className={`absolute right-0 top-20 h-96 w-96 rounded-full blur-3xl ${isLight ? 'bg-orange-300/20' : 'bg-orange-400/10'}`} />
                <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
                    <div className="fade-up stagger-1">
                        <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${isLight ? 'border-sky-300 bg-sky-100 text-sky-700' : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100'}`}>
                            <Brain className="h-4 w-4" />
                            AI-Assisted Technical Interview Platform
                        </div>

                        <h1 className={`text-4xl font-extrabold leading-tight tracking-tight md:text-6xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Practice with
                            <br />
                            an Interview-Grade <span className={isLight ? 'text-sky-600' : 'text-cyan-200'}>AI</span>
                        </h1>

                        <p className={`mt-6 max-w-2xl text-[15px] leading-relaxed md:text-[17px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            Nirmaan helps software engineering candidates prepare with structured coding practice, mock interview feedback, and outcome-driven progress tracking.
                            <br /><br />
                            <strong>Built for real interview performance, not just question completion.</strong>
                        </p>

                        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'go_dashboard' })}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-4 text-base font-semibold transition tap-fast ${isLight ? 'border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200' : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20'}`}
                            >
                                Go to Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/dashboard/interview"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'open_interview' })}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-7 py-4 text-base font-bold shadow-lg transition hover:shadow-xl tap-fast ${isLight ? 'from-sky-500 via-cyan-500 to-teal-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/30' : 'from-cyan-300 via-sky-300 to-teal-300 text-slate-950 shadow-cyan-500/30 hover:shadow-cyan-500/40'}`}
                            >
                                <Code className="h-5 w-5" />
                                Launch Interview Simulator
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/register?src=hero_secondary"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'signup' })}
                                className={`rounded-xl border px-7 py-4 text-center text-base font-semibold transition tap-fast ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-cyan-200/25 bg-white/[0.04] hover:bg-white/[0.08]'}`}
                            >
                                Create Free Workspace
                            </Link>
                        </div>

                        <div className={`mt-8 grid gap-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            {trustSignals.map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isLight ? 'text-sky-500' : 'text-cyan-300'}`} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Interview Showcase Card */}
                    <div className={`landing-showcase relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl fade-up stagger-2 ${isLight ? 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/50 shadow-[0_20px_45px_rgba(14,116,144,0.08)]' : 'border-cyan-300/15 bg-gradient-to-br from-slate-900/45 via-[#0a1224] to-[#070d1b]'}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${isLight ? 'from-sky-400/10 via-transparent to-orange-300/10' : 'from-cyan-400/10 via-transparent to-orange-400/10'}`} />
                        <div className="relative">
                            <div className={`mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold ${isLight ? 'border-sky-300 bg-sky-100 text-sky-700' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'}`}>
                                Live Interview Evaluation Demo
                            </div>

                            <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Two Sum · Baseline Screening Problem</h2>
                            <p className={`mt-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Example of how the AI interviewer reviews a submitted solution</p>

                            <div className={`mt-4 rounded-lg border p-4 font-mono text-xs text-emerald-300 ${isLight ? 'border-slate-200 bg-slate-100' : 'border-slate-700 bg-[#0a0a0a]'}`}>
                                <div className="mb-3">
                                    <p className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>&gt; Your solution passes all 3 sample tests</p>
                                    <p className={`mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>&gt; Judge0 Verdict: <span className="font-semibold text-emerald-500">ACCEPTED</span></p>
                                </div>
                                <div className={`border-t pt-3 ${isLight ? 'border-slate-300' : 'border-slate-700'}`}>
                                    <p className={`font-semibold ${isLight ? 'text-sky-700' : 'text-cyan-300'}`}>Interview Feedback Summary:</p>
                                    <ul className={`mt-2 space-y-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                                        <li>• Time Complexity: <span className={isLight ? 'text-sky-700' : 'text-cyan-300'}>O(n) ✓ Optimal</span></li>
                                        <li>• Approach: <span className="text-orange-300">Suggested two-pointer over brute force</span></li>
                                        <li>• Edge Cases: <span className="text-orange-300">Add empty array validation</span></li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero_card', cta: 'try_now' })}
                                className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm font-semibold transition tap-fast ${isLight ? 'border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200' : 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'}`}
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
                    <h2 className={`text-3xl font-bold md:text-5xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        One Platform for DSA, Interviews, and Career Progress
                    </h2>
                    <p className={`mx-auto mt-4 max-w-3xl text-base md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        Designed for students, early-career engineers, and role-switchers targeting technical interviews.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {coreFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <article key={feature.title} className={`landing-feature-card rounded-2xl border p-6 transition fade-up ${index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : index === 2 ? 'stagger-3' : 'stagger-4'} ${isLight ? 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'}`}>
                                <Icon className={`mb-3 h-8 w-8 ${isLight ? 'text-sky-500' : 'text-cyan-300'}`} />
                                <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h3>
                                <p className={`mt-3 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{feature.description}</p>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Comparison: Why Nirmaan vs Alternatives */}
            <section className={`landing-compare border-y ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-cyan-300/10 bg-[#091327]'}`}>
                <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
                    <div className="mb-12 text-center">
                        <h2 className={`text-3xl font-bold md:text-4xl ${isLight ? 'text-slate-900' : 'text-white'}`}>Purpose-Built for Interview Preparation</h2>
                        <p className={`mt-4 text-base md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>A practical workflow that combines coding execution with interview-quality review.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                                    <th className={`px-4 py-3 text-left font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Feature</th>
                                    <th className={`px-4 py-3 text-center font-semibold ${isLight ? 'text-sky-600' : 'text-cyan-300'}`}>Nirmaan</th>
                                    <th className={`px-4 py-3 text-center font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>LeetCode</th>
                                    <th className={`px-4 py-3 text-center font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ChatGPT</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                                {[
                                    { feature: 'AI Interview Feedback', nirmaan: true, leetcode: false, chatgpt: false },
                                    { feature: 'Complexity Analysis', nirmaan: true, leetcode: false, chatgpt: false },
                                    { feature: 'Real Code Execution', nirmaan: true, leetcode: true, chatgpt: false },
                                    { feature: 'Edge Case Detection', nirmaan: true, leetcode: false, chatgpt: false },
                                    { feature: 'Optimization Hints', nirmaan: true, leetcode: false, chatgpt: true },
                                    { feature: 'Interview Simulation', nirmaan: true, leetcode: false, chatgpt: false },
                                ].map((row) => (
                                    <tr key={row.feature}>
                                        <td className={`px-4 py-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>{row.feature}</td>
                                        <td className="px-4 py-3 text-center">{row.nirmaan ? <CheckCircle2 className="h-5 w-5 text-emerald-400 inline" /> : '–'}</td>
                                        <td className={`px-4 py-3 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{row.leetcode ? <CheckCircle2 className={`inline h-5 w-5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} /> : '–'}</td>
                                        <td className={`px-4 py-3 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{row.chatgpt ? <CheckCircle2 className={`inline h-5 w-5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} /> : '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-10 text-center">
                    <h2 className={`text-3xl font-bold md:text-5xl ${isLight ? 'text-slate-900' : 'text-white'}`}>Simple Pricing for Every Stage</h2>
                    <p className={`mt-4 text-base md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Start free, move to advanced support when needed.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {pricing.map((plan, index) => (
                        <article
                            key={plan.name}
                            className={`rounded-2xl border p-7 transition fade-up ${index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : 'stagger-3'} ${
                                plan.highlighted
                                    ? isLight
                                        ? 'border-sky-300 bg-gradient-to-br from-sky-100 via-white to-cyan-100/70 shadow-lg shadow-cyan-500/10'
                                        : 'border-cyan-300/50 bg-gradient-to-br from-cyan-400/20 via-cyan-500/10 to-sky-400/5 shadow-lg shadow-cyan-500/20'
                                    : isLight
                                        ? 'border-slate-200 bg-white hover:border-slate-300'
                                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                        >
                            <p className={`text-xs font-bold uppercase tracking-[0.3em] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>{plan.name}</p>
                            <p className={`mt-3 text-4xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{plan.price}</p>
                            <p className={`mt-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{plan.detail}</p>

                            <ul className="mt-6 space-y-3 text-sm">
                                {plan.points.map((point) => (
                                    <li key={point} className={`flex items-start gap-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
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
                                        ? isLight
                                            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl'
                                            : 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-xl'
                                        : isLight
                                            ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
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
            <section className={`landing-final border-t bg-gradient-to-b ${isLight ? 'border-slate-200 from-sky-50 via-white to-slate-50' : 'border-cyan-300/10 from-[#081326] to-[#070b16]'}`}>
                <div className="mx-auto max-w-3xl px-6 py-20 text-center">
                    <h2 className={`text-3xl font-black md:text-5xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Ready to improve technical interview outcomes?
                    </h2>
                    <p className={`mt-4 text-base leading-relaxed md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        Start with guided practice, measure progress weekly, and prepare with confidence for real hiring rounds.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link
                            href="/dashboard/interview"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_final_cta', cta: 'start_interview' })}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-8 py-4 text-lg font-bold shadow-lg transition hover:shadow-xl tap-fast ${isLight ? 'from-sky-500 to-cyan-500 text-white shadow-cyan-500/20' : 'from-cyan-300 to-sky-400 text-slate-950 shadow-cyan-500/30'}`}
                        >
                            Start Interview Practice
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            href="/register"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_final_cta', cta: 'signup' })}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-8 py-4 text-lg font-bold transition tap-fast ${isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-cyan-200/25 bg-white/5 text-white hover:bg-white/10'}`}
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

