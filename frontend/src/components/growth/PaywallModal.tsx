'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Lock, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

type PaywallModalProps = {
    open: boolean;
    onClose: () => void;
    featureName: string;
    source: string;
};

const points = [
    'Daily AI mentor check-ins tailored to your weak spots',
    'Company-specific prep packs for targeted role rounds',
    'Advanced mock interview evaluation and feedback rubric',
    'Offer probability forecast with next best actions',
];

export function PaywallModal({ open, onClose, featureName, source }: PaywallModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        trackEvent('paywall_viewed', {
            source,
            featureName,
        });
    }, [open, source, featureName]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#020617]/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-amber-300/40 bg-[#111a33] p-6 md:p-7">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                            <Lock className="h-3.5 w-3.5" />
                            Pro Feature
                        </div>
                        <h2 className="mt-3 text-2xl font-bold text-white">Unlock {featureName}</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            You are building momentum. Upgrade now to unlock premium guidance and close your placement gap faster.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                        title="Close paywall"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-5 space-y-3">
                    {points.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-slate-200">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                        href="/register"
                        onClick={() => {
                            trackEvent('paywall_upgrade_clicked', {
                                source,
                                featureName,
                                plan: 'pro_monthly',
                            });
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 font-semibold text-slate-900 transition hover:bg-amber-200"
                    >
                        Upgrade to Pro (Rs 799)
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10"
                    >
                        Continue on Free
                    </button>
                </div>
            </div>
        </div>
    );
}
