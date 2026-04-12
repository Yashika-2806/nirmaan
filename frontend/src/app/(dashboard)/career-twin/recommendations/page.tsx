'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, Filter, Sparkles } from 'lucide-react';
import {
    CareerTwinJobSearchItem,
    CareerTwinRecommendation,
    careerTwinService,
    TwinWorkMode,
} from '@/services/careerTwinService';

export default function CareerTwinRecommendationsPage() {
    const PAGE_SIZE = 30;
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [workMode, setWorkMode] = useState<TwinWorkMode>('');
    const [rows, setRows] = useState<CareerTwinRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [selectedJob, setSelectedJob] = useState<CareerTwinRecommendation | null>(null);
    const [jobDetail, setJobDetail] = useState<CareerTwinJobSearchItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [tailored, setTailored] = useState<null | { summary: string; bullets: string[]; atsKeywords: string[]; resumeFitScore: number }>(null);
    const [tailorLoading, setTailorLoading] = useState(false);

    const load = async ({ append = false } = {}) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const offset = append ? rows.length : 0;
            const result = await careerTwinService.getRecommendations({
                query,
                location,
                workMode,
                limit: PAGE_SIZE,
                offset,
            });

            const nextRows = result.recommendations || [];
            setRows((prev) => (append ? [...prev, ...nextRows] : nextRows));
            setHasMore(nextRows.length === PAGE_SIZE);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load recommendations');
        } finally {
            if (append) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        load({ append: false });
    }, []);

    const visibleRows = useMemo(() => rows, [rows]);

    const openJobDetail = async (job: CareerTwinRecommendation) => {
        setSelectedJob(job);
        setJobDetail(null);
        setTailored(null);
        setDetailLoading(true);
        try {
            const detail = await careerTwinService.getJobDetail(job.jobId);
            setJobDetail(detail);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load job details');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeJobDetail = () => {
        setSelectedJob(null);
        setJobDetail(null);
        setTailored(null);
    };

    const loadTailoredPreview = async (jobId: string) => {
        setTailorLoading(true);
        try {
            const response = await careerTwinService.tailorResume(jobId);
            setTailored(response.tailored);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to generate tailored resume');
        } finally {
            setTailorLoading(false);
        }
    };

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
                    <button onClick={() => load({ append: false })} className="btn-primary inline-flex items-center justify-center gap-2">
                        <Filter className="w-4 h-4" />
                        Apply Filters
                    </button>
                </div>
            </section>

            <section className="grid gap-3">
                {loading && <div className="card text-gray-300">Loading recommendations...</div>}
                {!loading && visibleRows.length === 0 && <div className="card text-gray-400">No matching jobs yet. Try broadening filters or syncing new jobs.</div>}
                {!loading && visibleRows.map((job) => (
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
                                onClick={() => openJobDetail(job)}
                                className="btn-outline btn-sm"
                            >
                                View Details
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

                {!loading && hasMore && (
                    <div className="flex justify-center mt-2">
                        <button
                            onClick={() => load({ append: true })}
                            className="btn-outline"
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Loading more...' : 'Load More Jobs'}
                        </button>
                    </div>
                )}
            </section>

            {selectedJob && (
                <section className="fixed inset-0 z-50 bg-black/70 p-4 overflow-y-auto" onClick={closeJobDetail}>
                    <div className="max-w-4xl mx-auto card border border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-white">{selectedJob.title}</h2>
                                <p className="text-sm text-gray-400 mt-1">{selectedJob.company} • {selectedJob.location} • {selectedJob.workMode}</p>
                            </div>
                            <button className="btn-outline btn-sm" onClick={closeJobDetail}>Close</button>
                        </div>

                        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                                <p className="text-gray-400">Fit Score</p>
                                <p className="text-cyan-300 font-semibold text-lg">{selectedJob.fitScore}%</p>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                                <p className="text-gray-400">Interview Probability</p>
                                <p className="text-violet-300 font-semibold text-lg">{selectedJob.interviewProbability}%</p>
                            </div>
                        </div>

                        {detailLoading && <p className="text-gray-300 mt-4">Loading job details...</p>}
                        {!detailLoading && jobDetail && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Job Description</p>
                                    <p className="text-gray-200 whitespace-pre-wrap">{jobDetail.description || 'No detailed description available.'}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Required Skills</p>
                                        <div className="flex flex-wrap gap-1">
                                            {jobDetail.requiredSkills?.map((skill) => (
                                                <span key={skill} className="px-2 py-1 rounded bg-gray-800 text-gray-200 text-xs">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Missing Skills</p>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedJob.missingSkills.length === 0 && <span className="text-emerald-300 text-xs">No major gaps</span>}
                                            {selectedJob.missingSkills.map((skill) => (
                                                <span key={skill} className="px-2 py-1 rounded bg-amber-900/40 text-amber-200 text-xs">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {jobDetail.applyUrl && (
                                    <a href={jobDetail.applyUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm inline-flex">
                                        Open Original Posting
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                className="btn-outline btn-sm"
                                onClick={() => loadTailoredPreview(selectedJob.jobId)}
                                disabled={tailorLoading}
                            >
                                {tailorLoading ? 'Generating...' : 'Preview Tailored Resume'}
                            </button>

                            <button
                                className="btn-outline btn-sm"
                                onClick={async () => {
                                    try {
                                        await careerTwinService.applyToJob(selectedJob.jobId, 'assisted');
                                        toast.success('Application draft prepared');
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not prepare application');
                                    }
                                }}
                            >
                                Assisted Apply
                            </button>

                            <button
                                className="btn-primary btn-sm"
                                onClick={async () => {
                                    try {
                                        await careerTwinService.applyToJob(selectedJob.jobId, 'user_approved');
                                        toast.success('Application moved to Applied');
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not submit application');
                                    }
                                }}
                            >
                                User-approved Apply
                            </button>

                            <button
                                className="btn-outline btn-sm"
                                onClick={async () => {
                                    try {
                                        await careerTwinService.applyToJob(selectedJob.jobId, 'manual');
                                        toast.success('Manual application tracked');
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not track manual application');
                                    }
                                }}
                            >
                                Track Manual Apply
                            </button>
                        </div>

                        {tailored && (
                            <div className="mt-5 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                <h3 className="text-white font-semibold">Tailored Resume Preview</h3>
                                <p className="text-xs text-cyan-300 mt-1">Resume Fit Score: {tailored.resumeFitScore}%</p>
                                <p className="text-gray-200 mt-3">{tailored.summary}</p>

                                {tailored.bullets?.length > 0 && (
                                    <ul className="list-disc ml-5 mt-3 text-gray-200 space-y-1">
                                        {tailored.bullets.slice(0, 6).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
                                    </ul>
                                )}

                                {tailored.atsKeywords?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {tailored.atsKeywords.map((keyword) => (
                                            <span key={keyword} className="px-2 py-1 rounded bg-cyan-900/40 text-cyan-200 text-xs">{keyword}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}
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
