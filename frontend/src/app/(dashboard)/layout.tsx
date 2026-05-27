'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import {
    LayoutDashboard,
    Code,
    FileText,
    MessageSquare,
    Map,
    BookOpen,
    FileUp,
    Users,
    Bot,
    BarChart3,
    LogOut,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { isLight } = useTheme();
    // Removed auth check redirect - dashboard is now publicly accessible

    // Hide navigation during interview
    const isOnInterview = pathname.includes('/interview');

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const navItems = useMemo(
        () => [
            { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Home' },
            { href: '/dashboard/dsa', icon: <Code size={18} />, label: 'DSA Practice' },
            { href: '/dashboard/resume', icon: <FileText size={18} />, label: 'Resume Builder' },
            { href: '/dashboard/interview', icon: <MessageSquare size={18} />, label: 'Interview Prep' },
            { href: '/dashboard/roadmap', icon: <Map size={18} />, label: 'Roadmap' },
            { href: '/research', icon: <BookOpen size={18} />, label: 'Research' },
            { href: '/dashboard/pdf', icon: <FileUp size={18} />, label: 'PDF Learning' },
            { href: '/dashboard/skill-marketplace', icon: <Users size={18} />, label: 'Community' },
            { href: '/dashboard/career-twin', icon: <Bot size={18} />, label: 'AI Twin' },
            ...((user?.role || '').toLowerCase() === 'admin'
                ? [
                    { href: '/dashboard/career-twin/analytics', icon: <BarChart3 size={16} />, label: 'Twin Analytics' },
                    { href: '/dashboard/funnel', icon: <BarChart3 size={16} />, label: 'Growth Funnel' },
                ]
                : []),
        ],
        [user?.role],
    );

    const navHrefs = useMemo(() => navItems.map((item) => item.href), [navItems]);

    useEffect(() => {
        // Warm key dashboard routes to make navigation feel immediate.
        navHrefs.forEach((href) => {
            router.prefetch(href);
        });
    }, [router, navHrefs]);

    return (
        <div className={`min-h-screen font-sans selection:bg-[#00D9FF]/30 ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#0a0a0a] text-white'}`}>
            {/* Top Header Navigation - Hidden during interview */}
            {!isOnInterview && (
            <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${isLight ? 'border-slate-300/80 bg-white/95' : 'border-gray-800/80 bg-[#0a0a0a]/95'}`}>
                <div
                    className={`overflow-hidden border-b ${isLight ? 'border-slate-200' : 'border-gray-900'}`}
                >
                    <div className="px-4 md:px-5 py-2.5">
                        <div className="flex items-center justify-between gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 tap-fast">
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isLight ? 'bg-sky-100 border-sky-300' : 'bg-[#00D9FF]/10 border-[#00D9FF]/30'}`}>
                                    <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                                </div>
                                <div>
                                    <h1 className={`text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>Nirmaan</h1>
                                    <p className="text-[10px] text-[#00D9FF] uppercase tracking-wider font-semibold">Placement Acceleration</p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 md:gap-3">
                                <ThemeToggle />
                                {isAuthenticated ? (
                                    <>
                                        <div className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg border ${isLight ? 'border-slate-300 bg-white' : 'border-gray-800 bg-gray-900/40'}`}>
                                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[#00D9FF] text-xs font-semibold ${isLight ? 'bg-sky-100 border-sky-300' : 'bg-[#00D9FF]/15 border-[#00D9FF]/40'}`}>
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="leading-tight">
                                                <p className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{user?.name}</p>
                                                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{user?.subscription?.tier || 'Free'} Plan</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className={`px-3.5 py-2 rounded-lg border transition-all text-sm font-semibold inline-flex items-center gap-2 tap-fast ${isLight ? 'border-slate-300 text-slate-700 hover:text-[#00D9FF] hover:border-[#00D9FF]/50 hover:bg-sky-50' : 'border-gray-800 text-gray-300 hover:text-[#00D9FF] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/5'}`}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="px-3.5 py-2 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/50 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-all text-sm font-semibold inline-flex items-center gap-2 tap-fast"
                                        >
                                            Sign In
                                            <ArrowRight size={16} />
                                        </Link>
                                        <Link
                                            href="/register"
                                            className={`px-3.5 py-2 rounded-lg border transition-all text-sm font-semibold tap-fast ${isLight ? 'border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400' : 'border-gray-800 text-gray-300 hover:text-white hover:border-gray-700'}`}
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 md:px-5 py-2.5">
                    <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {navItems.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <TopNavItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    active={active}
                                    isLight={isLight}
                                />
                            );
                        })}
                    </nav>
                </div>
            </header>
            )}

            {/* Main Content */}
            <main className={`${isOnInterview ? 'p-0 relative h-screen' : 'p-3 md:p-6 relative min-h-[calc(100vh-104px)]'}`}>
                {!isOnInterview && (
                <>
                {/* Background ambient glow */}
                <div className={`fixed top-0 left-0 right-0 h-96 blur-[120px] pointer-events-none rounded-full translate-y-[-50%] ${isLight ? 'bg-sky-300/20' : 'bg-[#00D9FF]/5'}`}></div>
                </>
                )}

                <div className={isOnInterview ? 'w-full h-full' : 'relative z-10 w-full mx-auto'}>
                    {children}
                </div>
            </main>
        </div>
    );
}

function TopNavItem({ href, icon, label, active, isLight }: { href: string; icon: React.ReactNode; label: string; active: boolean; isLight: boolean }) {
    return (
        <Link
            href={href}
            className={`
                group shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 tap-fast
                ${active
                    ? 'bg-[#00D9FF]/12 text-[#00D9FF] border border-[#00D9FF]/30 shadow-[0_0_18px_-8px_#00D9FF]'
                    : isLight
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }
            `}
        >
            <span className={`${active ? 'text-[#00D9FF]' : isLight ? 'text-slate-400 group-hover:text-slate-800' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                {icon}
            </span>
            <span>{label}</span>
        </Link>
    );
}
