'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

type ThemeToggleProps = {
    variant?: 'inline' | 'floating';
};

export function ThemeToggle({ variant = 'inline' }: ThemeToggleProps) {
    const { isLight, mounted, toggleTheme } = useTheme();

    if (variant === 'floating') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-md transition tap-fast ${
                    isLight
                        ? 'border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-100'
                        : 'border-cyan-200/30 bg-[#0b1326]/80 text-cyan-100 hover:bg-[#102043]'
                }`}
            >
                {mounted && isLight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                {mounted ? (isLight ? 'Dark' : 'Light') : 'Theme'}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition tap-fast ${
                isLight
                    ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'border-cyan-200/30 bg-cyan-400/5 text-cyan-100 hover:bg-cyan-400/10'
            }`}
        >
            {mounted && isLight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
            {mounted ? (isLight ? 'Dark' : 'Light') : 'Theme'}
        </button>
    );
}
