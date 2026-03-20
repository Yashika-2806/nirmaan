'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock } from 'lucide-react';
import { ApplicationStatus, CareerTwinApplication, careerTwinService } from '@/services/careerTwinService';

const columns: Array<{ key: ApplicationStatus; label: string }> = [
    { key: 'draft', label: 'Draft' },
    { key: 'applied', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview', label: 'Interview' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'offer', label: 'Offer' },
];

export default function CareerTwinTrackerPage() {
    const [kanban, setKanban] = useState<Record<string, CareerTwinApplication[]>>({});
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await careerTwinService.getApplications();
            setKanban(data.kanban || {});
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to load application tracker');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const moveStatus = async (applicationId: string, toStatus: ApplicationStatus) => {
        try {
            await careerTwinService.updateApplicationStatus(applicationId, toStatus);
            toast.success(`Moved to ${toStatus}`);
            await load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0a0f1e] via-[#0e1729] to-[#101f33] p-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CalendarClock className="w-6 h-6 text-cyan-300" />
                    Application Tracker
                </h1>
                <p className="text-gray-400 text-sm mt-2">Kanban board powered by Tracking Agent and Learning Agent feedback loops.</p>
            </section>

            {loading && <div className="card text-gray-300">Loading tracker...</div>}
            {!loading && (
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {columns.map((column) => (
                        <div key={column.key} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3 min-h-[260px]">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm uppercase tracking-wide text-gray-300">{column.label}</h2>
                                <span className="text-xs text-gray-500">{(kanban[column.key] || []).length}</span>
                            </div>

                            <div className="space-y-3">
                                {(kanban[column.key] || []).map((item) => (
                                    <article key={item._id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                                        <p className="text-sm font-semibold text-white">{item.jobId?.title}</p>
                                        <p className="text-xs text-gray-400">{item.jobId?.company}</p>
                                        <div className="mt-2 flex gap-2 text-[11px]">
                                            <span className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-200">Match {item.matchScore}%</span>
                                            <span className="px-2 py-1 rounded bg-indigo-500/15 text-indigo-200">Interview {item.interviewProbability}%</span>
                                        </div>
                                        <select
                                            className="input mt-2 !py-2 !text-sm"
                                            title="Change application status"
                                            value={item.status}
                                            onChange={(e) => moveStatus(item._id, e.target.value as ApplicationStatus)}
                                        >
                                            {columns.map((opt) => (
                                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
