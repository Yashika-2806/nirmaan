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
    Navigation,
    BookOpen,
    FileUp,
    Users,
    Bot,
    BarChart3,
    LogOut,
    Sparkles,
    ArrowRight
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [showTopBar, setShowTopBar] = useState(true);
    const lastScrollYRef = useRef(0);

    // Removed auth check redirect - dashboard is now publicly accessible

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const navItems = [
        { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Home' },
        { href: '/dashboard/dsa', icon: <Code size={18} />, label: 'DSA Practice' },
        { href: '/dashboard/resume', icon: <FileText size={18} />, label: 'Resume Builder' },
        { href: '/dashboard/interview', icon: <MessageSquare size={18} />, label: 'Interview Prep' },
        { href: '/dashboard/roadmap', icon: <Map size={18} />, label: 'Roadmap' },
        { href: '/dashboard/career-gps', icon: <Navigation size={18} />, label: 'Career GPS' },
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
    ], [user?.role]);

    const navHrefs = useMemo(() => navItems.map((item) => item.href), [navItems]);

    useEffect(() => {
        const onScroll = () => {
            const currentY = window.scrollY;

            if (currentY <= 32) {
                setShowTopBar(true);
                lastScrollYRef.current = currentY;
                return;
            }

            if (currentY > lastScrollYRef.current + 8) {
                setShowTopBar(false);
            } else if (currentY < lastScrollYRef.current - 8) {
                setShowTopBar(true);
            }

            lastScrollYRef.current = currentY;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        // Warm key dashboard routes to make navigation feel immediate.
        navHrefs.forEach((href) => {
            router.prefetch(href);
        });
    }, [router, navHrefs]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00D9FF]/30">
            {/* Top Header Navigation */}
            <header className="sticky top-0 z-50 border-b border-gray-800/80 bg-[#0a0a0a]/95 backdrop-blur-md">
                <div
                    className={`overflow-hidden border-b border-gray-900 transition-[max-height,opacity] duration-300 ${
                        showTopBar ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-4 md:px-5 py-2.5">
                        <div className="flex items-center justify-between gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 tap-fast">
                                <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-[#00D9FF]" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold text-white tracking-wide">Nirmaan</h1>
                                    <p className="text-[10px] text-[#00D9FF] uppercase tracking-wider font-semibold">Placement Acceleration</p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 md:gap-3">
                                {isAuthenticated ? (
                                    <>
                                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-800 bg-gray-900/40">
                                            <div className="w-7 h-7 rounded-full bg-[#00D9FF]/15 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] text-xs font-semibold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="leading-tight">
                                                <p className="text-sm text-white font-semibold">{user?.name}</p>
                                                <p className="text-xs text-gray-500">{user?.subscription?.tier || 'Free'} Plan</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="px-3.5 py-2 rounded-lg border border-gray-800 text-gray-300 hover:text-[#00D9FF] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/5 transition-all text-sm font-semibold inline-flex items-center gap-2 tap-fast"
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
                                            className="px-3.5 py-2 rounded-lg border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-all text-sm font-semibold tap-fast"
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
                                />
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-3 md:p-6 relative min-h-[calc(100vh-104px)]">
                {/* Background ambient glow */}
                <div className="fixed top-0 left-0 right-0 h-96 bg-[#00D9FF]/5 blur-[120px] pointer-events-none rounded-full translate-y-[-50%]"></div>

                <div className="relative z-10 w-full mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function TopNavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`
                group shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 tap-fast
                ${active
                    ? 'bg-[#00D9FF]/12 text-[#00D9FF] border border-[#00D9FF]/30 shadow-[0_0_18px_-8px_#00D9FF]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }
            `}
        >
            <span className={`${active ? 'text-[#00D9FF]' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                {icon}
            </span>
            <span>{label}</span>
        </Link>
    );
}
