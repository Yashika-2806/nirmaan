'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export type OnboardingData = {
    year: string;
    targetRole: string;
    prepLevel: string;
};

type OnboardingGateProps = {
    userId?: string;
    userName?: string;
    open: boolean;
    onComplete: (data: OnboardingData) => void;
};

const yearOptions = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Recent Graduate'];
const roleOptions = ['Software Engineer', 'Data Analyst', 'Product Role', 'Consulting/Business', 'Not Sure Yet'];
const prepOptions = ['Just Starting', 'Inconsistent', 'Some Momentum', 'Interview Ready'];

export function OnboardingGate({ userId, userName, open, onComplete }: OnboardingGateProps) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        year: '',
        targetRole: '',
        prepLevel: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        trackEvent('onboarding_started', {
            userId: userId || 'anonymous',
            source: 'dashboard_gate',
        });
    }, [open, userId]);

    const steps = useMemo(
        () => [
            {
                key: 'year',
                title: 'What stage are you in?',
                description: 'We tailor your sprint intensity based on your current semester.',
                options: yearOptions,
            },
            {
                key: 'targetRole',
                title: 'What role are you targeting?',
                description: 'This helps Nirmaan prioritize your highest-impact tasks first.',
                options: roleOptions,
            },
            {
                key: 'prepLevel',
                title: 'How is your prep momentum right now?',
                description: 'Be honest. We use this to calibrate your first 7-day sprint.',
                options: prepOptions,
            },
        ],
        []
    );

    if (!open) {
        return null;
    }

    const current = steps[step];
    const currentValue = data[current.key as keyof OnboardingData];

    const handleSelect = (value: string) => {
        setData((prev) => ({ ...prev, [current.key]: value }));
    };

    const handleNext = () => {
        if (!currentValue) {
            return;
        }

        if (step < steps.length - 1) {
            setStep((prev) => prev + 1);
            return;
        }

        trackEvent('onboarding_completed', {
            userId: userId || 'anonymous',
            year: data.year,
            targetRole: data.targetRole,
            prepLevel: data.prepLevel,
        });
        onComplete(data);
    };

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#020617]/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-cyan-300/30 bg-[#0d162d] p-6 md:p-8">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
                            <Sparkles className="h-3.5 w-3.5" />
                            Step {step + 1} of {steps.length}
                        </div>
                        <h2 className="mt-3 text-2xl font-bold text-white">Welcome{userName ? `, ${userName}` : ''}. Build your first winning sprint.</h2>
                        <p className="mt-2 text-sm text-slate-300">Answer 3 quick questions and we will personalize your plan instantly.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                        <span className="font-semibold text-cyan-100">~40 sec setup</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-white">{current.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{current.description}</p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {current.options.map((option) => {
                            const selected = currentValue === option;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`rounded-xl border p-3 text-left transition ${
                                        selected
                                            ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                                            : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/40 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold">{option}</span>
                                        {selected && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <progress
                        title="Onboarding progress"
                        className="h-2 w-28 rounded-full [appearance:none] [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-cyan-300 [&::-webkit-progress-value]:to-emerald-300 [&::-moz-progress-bar]:bg-cyan-300"
                        value={step + 1}
                        max={steps.length}
                    />

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!currentValue}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {step < steps.length - 1 ? 'Continue' : 'Generate My Plan'}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
