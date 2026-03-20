'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, UploadCloud, RefreshCcw, ArrowRight, Sparkles, Briefcase, KanbanSquare } from 'lucide-react';
import { careerTwinService, TwinDashboardData, TwinWorkMode } from '@/services/careerTwinService';
import { useAuthStore } from '@/store/auth';

export default function CareerTwinPage() {
    const { user } = useAuthStore();
    const isAdmin = (user?.role || '').toLowerCase() === 'admin';

    const [dashboard, setDashboard] = useState<TwinDashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [workMode, setWorkMode] = useState<TwinWorkMode>('');
    const [resumeText, setResumeText] = useState('');
    const [uploadingText, setUploadingText] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await careerTwinService.getDashboard({ query, location, workMode, limit: 30 });
            setDashboard(data);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load AI Twin dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const topRecommendations = useMemo(
        () => dashboard?.recommendations?.recommendations?.slice(0, 6) || [],
        [dashboard]
    );

    const appCounts = useMemo(() => {
        const apps = dashboard?.tracking?.applications || [];
        return {
            total: apps.length,
            active: apps.filter((a) => ['applied', 'shortlisted', 'interview'].includes(a.status)).length,
            offers: apps.filter((a) => a.status === 'offer').length,
        };
    }, [dashboard]);

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-cyan-500/30 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_60%),linear-gradient(145deg,_#030712_0%,_#0b1222_60%,_#0f1f32_100%)] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Bot className="w-8 h-8 text-cyan-300" />
                            AI Twin / Career Twin
                        </h1>
                        <p className="text-gray-300 mt-2 max-w-3xl">
                            Multi-agent career engine: profile intelligence, role matching, tailored resumes, assisted apply, and adaptive learning from outcomes.
                        </p>
                    </div>
                    <button onClick={loadDashboard} className="btn-outline inline-flex items-center gap-2" disabled={loading}>
                        <RefreshCcw className="w-4 h-4" />
                        Refresh Signals
                    </button>
                    {isAdmin && (
                        <Link href="/dashboard/career-twin/analytics" className="btn-outline inline-flex items-center gap-2">
                            Twin Analytics
                        </Link>
                    )}
                </div>
            </section>

            <section className="grid lg:grid-cols-4 gap-3">
                <StatCard label="Recommended Jobs" value={String(dashboard?.recommendations?.metrics?.totalJobs || 0)} />
                <StatCard label="Strong Fit Jobs" value={String(dashboard?.recommendations?.metrics?.strongFitCount || 0)} />
                <StatCard label="Applications" value={String(appCounts.total)} />
                <StatCard label="Twin Confidence" value={`${dashboard?.tracking?.progress?.confidenceScore || 0}%`} />
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-white">Recommended Jobs</h2>
                        <Link href="/career-twin/recommendations" className="text-sm text-cyan-300 inline-flex items-center gap-1 hover:text-cyan-200">
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-2 mt-3">
                        <input className="input" placeholder="Role or company" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                        <select className="input" title="Filter by work mode" value={workMode} onChange={(e) => setWorkMode(e.target.value as TwinWorkMode)}>
                            <option value="">Any mode</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="onsite">Onsite</option>
                        </select>
                    </div>

                    <button onClick={loadDashboard} className="btn-primary btn-sm mt-3">Apply Filters</button>

                    <div className="mt-4 space-y-3">
                        {loading && <p className="text-gray-400">Loading recommendations...</p>}
                        {!loading && topRecommendations.length === 0 && <p className="text-gray-400">No jobs yet. Sync jobs or upload resume for stronger matching.</p>}
                        {!loading && topRecommendations.map((job) => (
                            <article key={job.externalId} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{job.title}</p>
                                        <p className="text-xs text-gray-400">{job.company} • {job.location}</p>
                                    </div>
                                    <div className="text-xs flex gap-2">
                                        <StatusTag tone={job.fitCategory === 'strong_fit' ? 'green' : job.fitCategory === 'moderate_fit' ? 'blue' : 'amber'} label={`Fit ${job.fitScore}%`} />
                                        <StatusTag tone="violet" label={`Interview ${job.interviewProbability}%`} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="card">
                        <h2 className="text-lg font-semibold text-white">Applications</h2>
                        <p className="text-sm text-gray-400 mt-1">Track by stage with timeline-aware updates.</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <MiniPill label="Active" value={String(appCounts.active)} />
                            <MiniPill label="Offers" value={String(appCounts.offers)} />
                            <MiniPill label="Shortlist Rate" value={`${dashboard?.tracking?.progress?.shortlistRate || 0}%`} />
                            <MiniPill label="Offer Rate" value={`${dashboard?.tracking?.progress?.offerRate || 0}%`} />
                        </div>
                        <Link href="/career-twin/tracker" className="btn-outline btn-sm inline-flex items-center gap-2 mt-3">
                            <KanbanSquare className="w-4 h-4" />
                            Open Tracker
                        </Link>
                    </div>

                    <div className="card">
                        <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
                        <ul className="mt-2 space-y-2 text-sm text-gray-300">
                            {(dashboard?.tracking?.aiSuggestions || []).slice(0, 4).map((item) => (
                                <li key={item} className="flex gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-4">
                <div className="card">
                    <h2 className="text-lg font-semibold text-white">Skill Gaps</h2>
                    <div className="mt-3 space-y-2">
                        {(dashboard?.tracking?.skillGaps || []).slice(0, 6).map((gap) => (
                            <div key={gap.skill} className="rounded-lg border border-gray-800 bg-gray-900/40 p-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-200 capitalize">{gap.skill}</span>
                                    <span className="text-amber-300">Demand {gap.demandCount}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{gap.suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold text-white">Upload Resume to Rebuild Twin</h2>
                    <p className="text-sm text-gray-400 mt-1">Use plain text paste or PDF upload. Profile Agent will refresh your skill graph.</p>
                    <textarea
                        className="input mt-3 min-h-[130px]"
                        placeholder="Paste resume text here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={async () => {
                                if (!resumeText.trim()) {
                                    toast.error('Please paste resume text first');
                                    return;
                                }
                                setUploadingText(true);
                                try {
                                    await careerTwinService.uploadResumeText(resumeText);
                                    toast.success('Resume parsed and AI Twin updated');
                                    setResumeText('');
                                    await loadDashboard();
                                } catch (error: any) {
                                    toast.error(error?.response?.data?.message || 'Failed to upload resume text');
                                } finally {
                                    setUploadingText(false);
                                }
                            }}
                            disabled={uploadingText}
                            className="btn-primary btn-sm inline-flex items-center gap-2"
                        >
                            <UploadCloud className="w-4 h-4" />
                            {uploadingText ? 'Parsing...' : 'Upload Text'}
                        </button>

                        <label className="btn-outline btn-sm inline-flex items-center gap-2 cursor-pointer">
                            <Briefcase className="w-4 h-4" />
                            {uploadingFile ? 'Uploading...' : 'Upload PDF'}
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingFile(true);
                                    try {
                                        await careerTwinService.uploadResumeFile(file);
                                        toast.success('PDF parsed and AI Twin updated');
                                        await loadDashboard();
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Failed to upload PDF');
                                    } finally {
                                        setUploadingFile(false);
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="card py-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-cyan-300 mt-1">{value}</p>
        </div>
    );
}

function MiniPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-gray-900/60 border border-gray-800 px-2 py-1">
            <p className="text-[10px] uppercase text-gray-500">{label}</p>
            <p className="text-sm text-cyan-200 font-semibold">{value}</p>
        </div>
    );
}

function StatusTag({ tone, label }: { tone: 'green' | 'blue' | 'amber' | 'violet'; label: string }) {
    const classes: Record<string, string> = {
        green: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
        blue: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
        amber: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
        violet: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
    };

    return <span className={`px-2 py-1 rounded-full border ${classes[tone]}`}>{label}</span>;
}
