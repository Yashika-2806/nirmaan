'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
    LogOut,
    Sparkles
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00D9FF]/30">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col z-50">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">HYKROX</h1>
                            <p className="text-[10px] text-[#00D9FF] uppercase tracking-wider font-semibold">Creative Design</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4 mt-2">Menu</div>
                    <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === '/dashboard'} />
                    <NavLink href="/dashboard/dsa" icon={<Code size={18} />} label="DSA Practice" active={pathname === '/dashboard/dsa'} />
                    <NavLink href="/dashboard/resume" icon={<FileText size={18} />} label="Resume Builder" active={pathname === '/dashboard/resume'} />
                    <NavLink href="/dashboard/interview" icon={<MessageSquare size={18} />} label="Interview Prep" active={pathname === '/dashboard/interview'} />

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4 mt-6">Tools</div>
                    <NavLink href="/dashboard/roadmap" icon={<Map size={18} />} label="Roadmap" active={pathname === '/dashboard/roadmap'} />
                    <NavLink href="/dashboard/research" icon={<BookOpen size={18} />} label="Research" active={pathname === '/dashboard/research'} />
                    <NavLink href="/dashboard/pdf" icon={<FileUp size={18} />} label="PDF Learning" active={pathname === '/dashboard/pdf'} />
                    <NavLink href="/dashboard/skill-marketplace" icon={<Users size={18} />} label="Community" active={pathname === '/dashboard/skill-marketplace'} />
                    <NavLink href="/dashboard/career-twin" icon={<Bot size={18} />} label="AI Twin" active={pathname === '/dashboard/career-twin'} />
                </nav>

                <div className="p-4 border-t border-gray-800 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-[#00D9FF] font-bold shadow-lg shadow-[#00D9FF]/5">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate text-sm">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.subscription?.tier || 'Free'} Plan</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-800 text-gray-400 hover:text-[#00D9FF] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/5 transition-all text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8 relative min-h-screen">
                {/* Background ambient glow */}
                <div className="fixed top-0 left-64 right-0 h-96 bg-[#00D9FF]/5 blur-[120px] pointer-events-none rounded-full translate-y-[-50%]"></div>

                <div className="relative z-10 w-full mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`
                group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                    ? 'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20 shadow-[0_0_15px_-5px_#00D9FF]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }
            `}
        >
            <span className={`${active ? 'text-[#00D9FF]' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                {icon}
            </span>
            <span>{label}</span>
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_5px_#00D9FF]"></div>
            )}
        </Link>
    );
}
