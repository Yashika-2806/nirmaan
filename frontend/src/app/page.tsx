'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const trustSignals = [
    '12,000+ students preparing with Nirmaan',
    '2.4 lakh+ interview questions solved',
    'Used by students from 180+ campuses',
    'Avg resume score uplift: +31% in 14 days',
];

const coreFeatures = [
    {
        title: 'OfferPath Engine',
        description: 'Get a personalized 90-day placement plan with your readiness score and next best action.',
    },
    {
        title: 'Resume Lift Studio',
        description: 'Turn weak bullets into ATS-friendly impact statements that recruiters shortlist faster.',
    },
    {
        title: 'Interview Gym',
        description: 'Practice with AI interview simulations and sharpen answers for HR and technical rounds.',
    },
];

const premiumFeatures = [
    'Daily AI Mentor check-ins',
    'Company-specific prep packs',
    'Offer probability forecast',
    'Mock interview replay + rubric analysis',
];

const pricing = [
    {
        name: 'Free',
        price: 'Rs 0',
        detail: 'Start your prep with guided basics',
        points: ['3 placement sprints/week', 'Basic resume score', 'Limited DSA plan', '1 AI mentor prompt/day'],
        cta: 'Get Started Free',
        href: '/register',
        highlighted: false,
    },
    {
        name: 'Pro',
        price: 'Rs 799/month',
        detail: 'For serious placement acceleration',
        points: [
            'Daily personalized sprints',
            'Unlimited AI mentor sessions',
            'Full ATS rewrite suggestions',
            'Company-specific interview prep',
            'Weekly progress analytics',
        ],
        cta: 'Start 7-Day Placement Sprint',
        href: '/register',
        highlighted: true,
    },
    {
        name: 'Elite',
        price: 'Rs 1,999/month',
        detail: 'For students targeting top-tier offers',
        points: [
            'Everything in Pro',
            'Priority resume review credits',
            'Advanced mock interview insights',
            'Premium support lane',
        ],
        cta: 'Apply for Elite',
        href: '/register',
        highlighted: false,
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#070c1a] text-white">
            <section className="relative overflow-hidden border-b border-white/10">
                <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                            <Sparkles className="h-4 w-4" />
                            Placements 2026 Fast Track is live
                        </div>

                        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                            Stop Guessing.
                            <br />
                            Start Cracking Placements in 90 Days.
                        </h1>

                        <p className="mt-5 max-w-xl text-base text-slate-200 md:text-lg">
                            Nirmaan turns your semester into a step-by-step placement plan with daily tasks,
                            ATS-ready resumes, coding prep, and AI mentor feedback built for Indian campus hiring.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/register?src=hero_primary"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'start_7_day_sprint' })}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
                            >
                                Start My 7-Day Placement Sprint
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/login?src=hero_secondary"
                                onClick={() => trackEvent('cta_clicked', { source: 'landing_hero', cta: 'readiness_score' })}
                                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-center font-semibold transition hover:bg-white/10"
                            >
                                See My Placement Readiness Score
                            </Link>
                        </div>

                        <div className="mt-7 grid gap-2 text-sm text-slate-200">
                            {trustSignals.map((item) => (
                                <div key={item} className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Your Live Placement Panel</h2>
                            <span className="rounded-full bg-emerald-300/20 px-2 py-1 text-xs text-emerald-100">
                                Updated today
                            </span>
                        </div>

                        <div className="grid gap-3">
                            <div className="rounded-xl bg-[#111a33] p-4">
                                <p className="text-sm text-slate-300">Resume ATS Score</p>
                                <p className="mt-1 text-2xl font-bold">74 to 86</p>
                                <p className="mt-1 text-xs text-emerald-300">+12 in last 9 days</p>
                            </div>

                            <div className="rounded-xl bg-[#111a33] p-4">
                                <p className="text-sm text-slate-300">Current Streak</p>
                                <p className="mt-1 text-2xl font-bold">11 days</p>
                                <p className="mt-1 text-xs text-cyan-200">Do today&#39;s sprint to keep streak alive</p>
                            </div>

                            <div className="rounded-xl bg-[#111a33] p-4">
                                <p className="text-sm text-slate-300">This Week Target</p>
                                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-200">
                                    <li>2 mock interview rounds</li>
                                    <li>15 DSA medium questions</li>
                                    <li>Resume project bullet upgrade</li>
                                </ul>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                                <TrendingUp className="h-4 w-4" />
                                On this pace, your shortlist probability can reach 68% in 4 weeks.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-8 flex items-center gap-2 text-cyan-200">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm uppercase tracking-[0.2em]">Placement Acceleration Platform</p>
                </div>

                <h2 className="max-w-3xl text-3xl font-bold md:text-4xl">
                    Everything you need to move from placement stress to interview confidence.
                </h2>

                <div className="mt-10 grid gap-5 md:grid-cols-3">
                    {coreFeatures.map((feature) => (
                        <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                            <h3 className="text-xl font-semibold text-cyan-100">{feature.title}</h3>
                            <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="border-y border-white/10 bg-[#0b1224]">
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-20 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                        <h3 className="text-2xl font-semibold">Premium unlocks your final 30 percent gap</h3>
                        <p className="mt-3 text-slate-300">
                            Free gets you started. Pro gets you consistent daily execution, deeper AI feedback, and faster shortlist conversion.
                        </p>
                        <div className="mt-5 space-y-3">
                            {premiumFeatures.map((item) => (
                                <div key={item} className="flex items-start gap-2 text-sm text-slate-200">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">Urgency Trigger</p>
                        <h3 className="mt-2 text-2xl font-semibold">Placement season starts in 63 days</h3>
                        <p className="mt-3 text-sm text-amber-50/90">
                            Students with 14+ active streak days are 2.3x more likely to get shortlists. Start now to enter interview season ahead of your batch.
                        </p>
                        <Link
                            href="/register?src=urgency_trigger"
                            onClick={() => trackEvent('cta_clicked', { source: 'landing_urgency', cta: 'lock_90_day_plan' })}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-200"
                        >
                            Lock My 90-Day Plan
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold md:text-4xl">Choose your acceleration tier</h2>
                    <p className="mt-3 text-slate-300">Built for students who want outcomes, not random prep.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {pricing.map((plan) => (
                        <article
                            key={plan.name}
                            className={`rounded-2xl border p-6 ${
                                plan.highlighted
                                    ? 'border-cyan-300/50 bg-cyan-300/10 shadow-[0_0_60px_-35px_rgba(34,211,238,0.9)]'
                                    : 'border-white/10 bg-white/[0.03]'
                            }`}
                        >
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">{plan.name}</p>
                            <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                            <p className="mt-2 text-sm text-slate-300">{plan.detail}</p>

                            <ul className="mt-5 space-y-2 text-sm text-slate-200">
                                {plan.points.map((point) => (
                                    <li key={point} className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
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
                                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
                                    plan.highlighted
                                        ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200'
                                        : 'border border-white/15 bg-white/5 hover:bg-white/10'
                                }`}
                            >
                                {plan.cta}
                            </Link>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

