'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register, isLoading } = useAuthStore();
    const source = searchParams.get('src') || 'direct';
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        trackEvent('register_submitted', { source });

        if (formData.name.trim().length < 2) {
            toast.error('Name must be at least 2 characters');
            return;
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            trackEvent('register_success', { source });
            toast.success('Registration successful!');
            router.push('/dashboard');
        } catch (error: any) {
            trackEvent('register_failed', { source });
            const res = (error as any)?.response?.data;
            if (res?.errors && Array.isArray(res.errors) && res.errors.length > 0) {
                toast.error(res.errors[0].message || res.message || 'Registration failed');
            } else {
                toast.error(error.message || 'Registration failed');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#070c1a] text-white">
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
                <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_1fr]">
                    <div className="hidden lg:block fade-up">
                        <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 tap-fast">
                            <span className="h-2 w-2 rounded-full bg-cyan-300" />
                            Back to Home
                        </Link>
                        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight">Create your Nirmaan account</h1>
                        <p className="mt-3 max-w-xl text-sm text-slate-300">Join the placement acceleration workflow with structured DSA, interview preparation, and progress analytics.</p>
                    </div>

                    <div className="fade-up stagger-1">
                        <div className="rounded-2xl border border-white/15 bg-[#111a33]/80 p-6 shadow-2xl backdrop-blur-md">
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/15">
                                    <UserPlus className="h-6 w-6 text-cyan-200" />
                                </div>
                                <h2 className="text-2xl font-bold">Create Account</h2>
                                <p className="mt-1 text-sm text-slate-400">Start your interview preparation workspace in under a minute.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="input"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="input"
                                        placeholder="Minimum 8 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="input"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-2 w-full rounded-lg bg-gradient-to-r from-violet-400 to-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 tap-fast"
                                >
                                    {isLoading ? 'Creating account...' : 'Create Account'}
                                </button>
                            </form>

                            <p className="mt-5 text-center text-sm text-slate-400">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070c1a] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
