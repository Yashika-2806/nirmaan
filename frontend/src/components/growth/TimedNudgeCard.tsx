'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BellRing, Clock3 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

type TimedNudgeCardProps = {
    userId?: string;
    createdAt?: string;
    isPaidUser: boolean;
};

type NudgeConfig = {
    day: number;
    title: string;
    message: string;
    cta: string;
    href: string;
    source: string;
};

const nudgeConfigs: NudgeConfig[] = [
    {
        day: 1,
        title: 'Day 1 Sprint: Build your first momentum win',
        message: 'Finish one Resume Lift task and one Interview Gym rep today to start your compounding loop.',
        cta: 'Start Day 1 Sprint',
        href: '/dashboard/resume',
        source: 'nudge_day_1',
    },
    {
        day: 3,
        title: 'Day 3 Checkpoint: Most students drop here',
        message: 'Stay in the top 25 percent by completing your DSA Momentum set before tonight.',
        cta: 'Complete DSA Momentum',
        href: '/dashboard/dsa',
        source: 'nudge_day_3',
    },
    {
        day: 7,
        title: 'Day 7 Upgrade Moment: You have enough signal now',
        message: 'Unlock Pro mentor check-ins to convert your first-week effort into faster shortlist outcomes.',
        cta: 'Unlock Pro Guidance',
        href: '/dashboard/career-twin',
        source: 'nudge_day_7',
    },
];

function getUserAgeInDays(createdAt?: string) {
    if (!createdAt) {
        return 1;
    }

    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
        return 1;
    }

    const diff = Date.now() - created.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function TimedNudgeCard({ userId, createdAt, isPaidUser }: TimedNudgeCardProps) {
    const [dismissed, setDismissed] = useState(false);

    const activeNudge = useMemo(() => {
        const day = getUserAgeInDays(createdAt);
        return nudgeConfigs.find((nudge) => nudge.day === day) || null;
    }, [createdAt]);

    useEffect(() => {
        if (!userId || !activeNudge) {
            return;
        }

        const dismissKey = `nirmaan:nudge:dismissed:${userId}:${activeNudge.day}`;
        const wasDismissed = window.localStorage.getItem(dismissKey) === '1';
        setDismissed(wasDismissed);
        if (wasDismissed) {
            return;
        }

        trackEvent('nudge_viewed', {
            source: activeNudge.source,
            day: activeNudge.day,
            isPaidUser,
        });
    }, [activeNudge, isPaidUser, userId]);

    if (!activeNudge || dismissed) {
        return null;
    }

    const isUpgradeNudge = activeNudge.day === 7 && !isPaidUser;

    return (
        <section className="rounded-2xl border border-indigo-300/35 bg-indigo-300/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/30 bg-indigo-300/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-indigo-100">
                        <BellRing className="h-3.5 w-3.5" />
                        Retention Nudge
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-white">{activeNudge.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm text-slate-200">{activeNudge.message}</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                    <Clock3 className="h-3.5 w-3.5" />
                    Day {activeNudge.day}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                    href={activeNudge.href}
                    onClick={() =>
                        trackEvent('nudge_clicked', {
                            source: activeNudge.source,
                            day: activeNudge.day,
                            isUpgradeNudge,
                        })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-300 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-indigo-200"
                >
                    {activeNudge.cta}
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        if (userId) {
                            const dismissKey = `nirmaan:nudge:dismissed:${userId}:${activeNudge.day}`;
                            window.localStorage.setItem(dismissKey, '1');
                        }
                        setDismissed(true);
                        trackEvent('nudge_dismissed', {
                            source: activeNudge.source,
                            day: activeNudge.day,
                        });
                    }}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                    Dismiss
                </button>
            </div>
        </section>
    );
}
