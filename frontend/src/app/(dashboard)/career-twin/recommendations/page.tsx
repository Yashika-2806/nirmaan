'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, Filter, Sparkles } from 'lucide-react';
import { CareerTwinRecommendation, careerTwinService, TwinWorkMode } from '@/services/careerTwinService';

export default function CareerTwinRecommendationsPage() {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [workMode, setWorkMode] = useState<TwinWorkMode>('');
    const [rows, setRows] = useState<CareerTwinRecommendation[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const result = await careerTwinService.getRecommendations({ query, location, workMode, limit: 50 });
            setRows(result.recommendations || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const topRows = useMemo(() => rows.slice(0, 30), [rows]);

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-[#081827] p-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bot className="w-6 h-6 text-cyan-300" />
                    AI Twin Job Recommendations
                </h1>
                <p className="text-sm text-gray-400 mt-2">Role-matched opportunities ranked by fit, resume readiness, and interview probability.</p>
            </section>

            <section className="card">
                <div className="grid md:grid-cols-4 gap-3">
                    <input className="input" placeholder="Search role/company" value={query} onChange={(e) => setQuery(e.target.value)} />
                    <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    <select className="input" title="Filter recommendations by work mode" value={workMode} onChange={(e) => setWorkMode(e.target.value as TwinWorkMode)}>
                        <option value="">Any mode</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">Onsite</option>
                    </select>
                    <button onClick={load} className="btn-primary inline-flex items-center justify-center gap-2">
                        <Filter className="w-4 h-4" />
                        Apply Filters
                    </button>
                </div>
            </section>

            <section className="grid gap-3">
                {loading && <div className="card text-gray-300">Loading recommendations...</div>}
                {!loading && topRows.length === 0 && <div className="card text-gray-400">No matching jobs yet. Try broadening filters or syncing new jobs.</div>}
                {!loading && topRows.map((job) => (
                    <article key={job.externalId} className="card border border-gray-800/80 hover:border-cyan-400/40">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                                <p className="text-gray-400 text-sm">{job.company} • {job.location} • {job.workMode}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Badge label={`Match ${job.fitScore}%`} tone={job.fitScore >= 75 ? 'good' : job.fitScore >= 50 ? 'mid' : 'low'} />
                                <Badge label={`Resume ${job.resumeFitScore}%`} tone="mid" />
                                <Badge label={`Interview ${job.interviewProbability}%`} tone="neutral" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Required Skills</p>
                                <div className="flex flex-wrap gap-1">
                                    {job.requiredSkills.slice(0, 8).map((skill) => (
                                        <span key={skill} className="px-2 py-1 rounded bg-gray-800 text-gray-200 text-xs">{skill}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Missing Skills</p>
                                <div className="flex flex-wrap gap-1">
                                    {job.missingSkills.length === 0 && <span className="text-emerald-300 text-xs">No major gaps</span>}
                                    {job.missingSkills.slice(0, 8).map((skill) => (
                                        <span key={skill} className="px-2 py-1 rounded bg-amber-900/40 text-amber-200 text-xs">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        await careerTwinService.applyToJob(job.jobId, 'assisted');
                                        toast.success('Application draft prepared');
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not prepare application');
                                    }
                                }}
                                className="btn-outline btn-sm"
                            >
                                Assisted Apply
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await careerTwinService.applyToJob(job.jobId, 'user_approved');
                                        toast.success('Application moved to Applied');
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not submit application');
                                    }
                                }}
                                className="btn-primary btn-sm inline-flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                User-approved Apply
                            </button>
                            {job.applyUrl && (
                                <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                                    Open Posting
                                </a>
                            )}
                        </div>
                    </article>
                ))}
            </section>
        </div>
    );
}

function Badge({ label, tone }: { label: string; tone: 'good' | 'mid' | 'low' | 'neutral' }) {
    const styles: Record<string, string> = {
        good: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
        mid: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
        low: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
        neutral: 'bg-gray-700/40 text-gray-200 border-gray-500/30',
    };

    return <span className={`px-2 py-1 rounded-full border ${styles[tone]} font-medium`}>{label}</span>;
}
