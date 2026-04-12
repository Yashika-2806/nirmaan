'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, MessageSquarePlus, Pencil, X } from 'lucide-react';
import { ApplicationStatus, CareerTwinApplication, careerTwinService } from '@/services/careerTwinService';

const columns: Array<{ key: ApplicationStatus; label: string }> = [
    { key: 'draft', label: 'Draft' },
    { key: 'applied', label: 'Applied' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'interview', label: 'Interview' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'offer', label: 'Offer' },
];

// ─── Inline note editor modal ─────────────────────────────────────────────────
function NoteModal({
    item,
    onClose,
    onSave,
}: {
    item: CareerTwinApplication;
    onClose: () => void;
    onSave: (note: string) => Promise<void>;
}) {
    const [note, setNote] = useState(item.notes || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(note);
        setSaving(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="card max-w-md w-full border border-gray-700 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                        {item.notes ? 'Edit Note' : 'Add Note'} — {item.jobId?.title}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <textarea
                    className="input min-h-[100px] resize-none"
                    placeholder="Add a note about this application..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    autoFocus
                />

                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="btn-outline btn-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary btn-sm"
                    >
                        {saving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CareerTwinTrackerPage() {
    const [kanban, setKanban] = useState<Record<string, CareerTwinApplication[]>>({});
    const [loading, setLoading] = useState(false);
    const [editingNote, setEditingNote] = useState<CareerTwinApplication | null>(null);

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

    const saveNote = async (item: CareerTwinApplication, note: string) => {
        try {
            await careerTwinService.updateApplicationStatus(item._id, item.status, note);
            toast.success('Note saved');
            setEditingNote(null);
            await load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save note');
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0a0f1e] via-[#0e1729] to-[#101f33] p-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CalendarClock className="w-6 h-6 text-cyan-300" />
                    Application Tracker
                </h1>
                <p className="text-gray-400 text-sm mt-2">
                    Kanban board powered by Tracking Agent and Learning Agent feedback loops.
                </p>
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
                                            <span className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-200">
                                                Match {item.matchScore}%
                                            </span>
                                            <span className="px-2 py-1 rounded bg-indigo-500/15 text-indigo-200">
                                                Interview {item.interviewProbability}%
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-gray-500 mt-2">
                                            Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                        </p>

                                        {item.notes && (
                                            <p className="text-xs text-amber-200 mt-1 line-clamp-2">
                                                📝 {item.notes}
                                            </p>
                                        )}

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

                                        <button
                                            className="btn-outline btn-sm mt-2 inline-flex items-center gap-1.5"
                                            onClick={() => setEditingNote(item)}
                                        >
                                            {item.notes
                                                ? <><Pencil className="w-3 h-3" />Edit Note</>
                                                : <><MessageSquarePlus className="w-3 h-3" />Add Note</>
                                            }
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Inline note modal */}
            {editingNote && (
                <NoteModal
                    item={editingNote}
                    onClose={() => setEditingNote(null)}
                    onSave={(note) => saveNote(editingNote, note)}
                />
            )}
        </div>
    );
}
