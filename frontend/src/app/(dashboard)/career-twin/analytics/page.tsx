'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCcw, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { careerTwinService, CareerTwinFunnelMetrics, CareerTwinSourceConfig } from '@/services/careerTwinService';
import { useAuthStore } from '@/store/auth';

const stageLabel: Record<string, string> = {
    draft: 'Draft',
    applied: 'Applied',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offer: 'Offer',
};

export default function CareerTwinAnalyticsPage() {
    const { user } = useAuthStore();
    const isAdmin = (user?.role || '').toLowerCase() === 'admin';

    const [lookbackDays, setLookbackDays] = useState(30);
    const [funnel, setFunnel] = useState<CareerTwinFunnelMetrics | null>(null);
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [sources, setSources] = useState<CareerTwinSourceConfig[]>([]);
    const [newSource, setNewSource] = useState({
        sourceType: 'greenhouse' as 'greenhouse' | 'lever' | 'workday',
        sourceKey: '',
        label: '',
        autoDisableEnabled: true,
        syncIntervalMinutes: 30,
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            const [funnelData, syncData] = await Promise.all([
                careerTwinService.getAnalyticsFunnel(lookbackDays),
                isAdmin ? careerTwinService.getSyncStatus(24) : Promise.resolve(null),
            ]);

            const sourceData = isAdmin ? await careerTwinService.listSourceConfigs() : { sources: [] };
            setFunnel(funnelData);
            setSyncStatus(syncData);
            setSources(sourceData.sources || []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Unable to load AI Twin analytics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, [lookbackDays, isAdmin]);

    const fitBars = useMemo(() => {
        return (funnel?.fitCategoryConversion || []).map((item) => ({
            fitCategory: item.fitCategory.replace('_', ' '),
            shortlistRate: item.shortlistRate,
            interviewRate: item.interviewRate,
            offerRate: item.offerRate,
        }));
    }, [funnel?.fitCategoryConversion]);

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0a1220] via-[#0d1930] to-[#132542] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-cyan-300" />
                            AI Twin Conversion Analytics
                        </h1>
                        <p className="text-sm text-gray-300 mt-2">Monitor recommendation-to-offer flow and fit-category performance.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="input !py-2"
                            title="Select analytics lookback duration"
                            value={lookbackDays}
                            onChange={(e) => setLookbackDays(Number(e.target.value))}
                        >
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={30}>30 days</option>
                            <option value={60}>60 days</option>
                            <option value={90}>90 days</option>
                        </select>
                        <button className="btn-outline btn-sm inline-flex items-center gap-2" onClick={loadAll}>
                            <RefreshCcw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Metric label="Applications" value={funnel?.totals.applications || 0} />
                <Metric label="Applied" value={funnel?.totals.applied || 0} />
                <Metric label="Shortlisted" value={funnel?.totals.shortlisted || 0} />
                <Metric label="Interviews" value={funnel?.totals.interviews || 0} />
                <Metric label="Offers" value={funnel?.totals.offers || 0} />
                <Metric label="Rejected" value={funnel?.totals.rejected || 0} />
            </section>

            <section className="grid lg:grid-cols-2 gap-4">
                <div className="card">
                    <h2 className="text-lg font-semibold text-white">Pipeline Funnel</h2>
                    {isLoading && <p className="text-gray-400 mt-3">Loading funnel...</p>}
                    {!isLoading && (
                        <div className="mt-3 space-y-3">
                            {(funnel?.stages || []).map((stage) => (
                                <div key={stage.stage} className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-white">{stageLabel[stage.stage] || stage.stage}</p>
                                        <p className="text-sm text-cyan-200">{stage.count}</p>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400 flex gap-4">
                                        <span>Conversion {stage.conversionFromStart}%</span>
                                        <span>Drop {stage.dropFromPrevious}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold text-white">Fit Category Conversion</h2>
                    <div className="h-[320px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fitBars}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#243244" />
                                <XAxis dataKey="fitCategory" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="shortlistRate" name="Shortlist %" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="interviewRate" name="Interview %" fill="#818cf8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="offerRate" name="Offer %" fill="#34d399" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {isAdmin && (
                <section className="card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-white inline-flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-cyan-300" />
                            Provider Sync Operations
                        </h2>
                        <div className="flex gap-2">
                            <button
                                className="btn-outline btn-sm"
                                onClick={async () => {
                                    try {
                                        await careerTwinService.triggerConfiguredSync();
                                        toast.success('Configured providers queued');
                                        await loadAll();
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not queue providers');
                                    }
                                }}
                            >
                                Queue Configured Sources
                            </button>
                            <button
                                className="btn-primary btn-sm"
                                onClick={async () => {
                                    try {
                                        await careerTwinService.runSyncQueue(10);
                                        toast.success('Sync queue processed');
                                        await loadAll();
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not process queue');
                                    }
                                }}
                            >
                                Run Queue Now
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2">
                        <Metric label="Total Logs" value={syncStatus?.summary?.total || 0} compact />
                        <Metric label="Queued" value={syncStatus?.summary?.queued || 0} compact />
                        <Metric label="Running" value={syncStatus?.summary?.running || 0} compact />
                        <Metric label="Success" value={syncStatus?.summary?.success || 0} compact />
                        <Metric label="Failed" value={syncStatus?.summary?.failed || 0} compact />
                        <Metric label="Imported" value={syncStatus?.summary?.imported || 0} compact />
                    </div>

                    <div className="mt-4 grid md:grid-cols-3 gap-2">
                        {(syncStatus?.sourceHealth || []).slice(0, 9).map((item: any) => (
                            <div key={`${item.sourceType}:${item.sourceKey}`} className="rounded-lg border border-gray-800 bg-gray-900/40 p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-gray-300 truncate">{item.sourceType}:{item.sourceKey}</p>
                                    <HealthBadge status={item.healthStatus} />
                                </div>
                                <div className="mt-1 text-[11px] text-gray-500">
                                    Score {item.healthScore} • Success {item.successRate}%
                                </div>
                                {item.alerts?.length > 0 && (
                                    <div className="mt-1 text-[11px] text-amber-300">
                                        {item.alerts.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {(syncStatus?.alerts || []).length > 0 && (
                        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                            <p className="text-xs uppercase tracking-wide text-amber-200">Active Source Alerts</p>
                            <div className="mt-2 space-y-1">
                                {(syncStatus.alerts || []).slice(0, 10).map((alert: any, idx: number) => (
                                    <p key={`${alert.sourceType}:${alert.sourceKey}:${idx}`} className="text-xs text-amber-100">
                                        {alert.sourceType}:{alert.sourceKey} • {alert.healthStatus} • {alert.alerts.join(', ')}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 border-t border-gray-800 pt-4">
                        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3">Source Config Manager</h3>

                        <div className="grid md:grid-cols-5 gap-2 mb-3">
                            <select
                                className="input !py-2"
                                title="Select source type"
                                value={newSource.sourceType}
                                onChange={(e) => setNewSource((s) => ({ ...s, sourceType: e.target.value as 'greenhouse' | 'lever' | 'workday' }))}
                            >
                                <option value="greenhouse">Greenhouse</option>
                                <option value="lever">Lever</option>
                                <option value="workday">Workday</option>
                            </select>
                            <input
                                className="input !py-2 md:col-span-2"
                                placeholder="Source key (board/company/feed URL)"
                                value={newSource.sourceKey}
                                onChange={(e) => setNewSource((s) => ({ ...s, sourceKey: e.target.value }))}
                            />
                            <input
                                className="input !py-2"
                                placeholder="Label"
                                value={newSource.label}
                                onChange={(e) => setNewSource((s) => ({ ...s, label: e.target.value }))}
                            />
                            <button
                                className="btn-primary btn-sm"
                                onClick={async () => {
                                    if (!newSource.sourceKey.trim()) {
                                        toast.error('Source key is required');
                                        return;
                                    }
                                    try {
                                        await careerTwinService.createSourceConfig(newSource);
                                        toast.success('Source config added');
                                        setNewSource({ sourceType: 'greenhouse', sourceKey: '', label: '', autoDisableEnabled: true, syncIntervalMinutes: 30 });
                                        await loadAll();
                                    } catch (error: any) {
                                        toast.error(error?.response?.data?.message || 'Could not add source');
                                    }
                                }}
                            >
                                Add Source
                            </button>
                        </div>

                        <div className="space-y-2">
                            {sources.map((source) => (
                                <div key={source._id} className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{source.label || `${source.sourceType}:${source.sourceKey}`}</p>
                                            <p className="text-xs text-gray-400">{source.sourceType} • {source.sourceKey}</p>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                Enabled: {source.enabled ? 'yes' : 'no'} • Failure streak: {source.failureStreak || 0}
                                            </p>
                                            {source.autoDisabledReason && (
                                                <p className="text-[11px] text-rose-300 mt-1">Auto-disabled: {source.autoDisabledReason}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn-outline btn-sm"
                                                onClick={async () => {
                                                    try {
                                                        await careerTwinService.updateSourceConfig(source._id, { enabled: !source.enabled });
                                                        toast.success(source.enabled ? 'Source disabled' : 'Source enabled');
                                                        await loadAll();
                                                    } catch (error: any) {
                                                        toast.error(error?.response?.data?.message || 'Could not update source');
                                                    }
                                                }}
                                            >
                                                {source.enabled ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                className="btn-outline btn-sm"
                                                onClick={async () => {
                                                    try {
                                                        await careerTwinService.updateSourceConfig(source._id, {
                                                            autoDisableBypass: !source.autoDisableBypass,
                                                            ...(source.enabled ? {} : { enabled: true }),
                                                            ...(source.enabled ? {} : { failureStreak: 0 }),
                                                        });
                                                        toast.success(!source.autoDisableBypass ? 'Manual override enabled' : 'Manual override disabled');
                                                        await loadAll();
                                                    } catch (error: any) {
                                                        toast.error(error?.response?.data?.message || 'Could not update override');
                                                    }
                                                }}
                                            >
                                                {source.autoDisableBypass ? 'Override ON' : 'Override OFF'}
                                            </button>
                                            <button
                                                className="btn-outline btn-sm"
                                                onClick={async () => {
                                                    try {
                                                        await careerTwinService.updateSourceConfig(source._id, {
                                                            autoDisableEnabled: !source.autoDisableEnabled,
                                                        });
                                                        toast.success(source.autoDisableEnabled ? 'Auto-disable OFF' : 'Auto-disable ON');
                                                        await loadAll();
                                                    } catch (error: any) {
                                                        toast.error(error?.response?.data?.message || 'Could not toggle auto-disable');
                                                    }
                                                }}
                                            >
                                                {source.autoDisableEnabled ? 'Auto-disable ON' : 'Auto-disable OFF'}
                                            </button>
                                            <button
                                                className="btn-outline btn-sm"
                                                onClick={async () => {
                                                    try {
                                                        await careerTwinService.queueSourceById(source._id);
                                                        toast.success('Source queued');
                                                        await loadAll();
                                                    } catch (error: any) {
                                                        toast.error(error?.response?.data?.message || 'Could not queue source');
                                                    }
                                                }}
                                            >
                                                Queue
                                            </button>
                                            <button
                                                className="btn-outline btn-sm"
                                                onClick={async () => {
                                                    try {
                                                        await careerTwinService.recoverSourceById(source._id);
                                                        toast.success('Source recovered and sync scheduled');
                                                        await loadAll();
                                                    } catch (error: any) {
                                                        toast.error(error?.response?.data?.message || 'Could not recover source');
                                                    }
                                                }}
                                            >
                                                Recover
                                            </button>
                                            <button
                                                className="btn-outline btn-sm"
                                                onClick={async () => {
                                                    try {
                                                        await careerTwinService.deleteSourceConfig(source._id);
                                                        toast.success('Source removed');
                                                        await loadAll();
                                                    } catch (error: any) {
                                                        toast.error(error?.response?.data?.message || 'Could not delete source');
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Sync: {source.lastSyncStatus || 'idle'} {source.lastSyncedAt ? `• ${new Date(source.lastSyncedAt).toLocaleString()}` : ''}
                                    </div>
                                </div>
                            ))}
                            {sources.length === 0 && <p className="text-sm text-gray-400">No persisted source configs yet.</p>}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
    const classes = status === 'healthy'
        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
        : status === 'warning'
            ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
            : 'bg-rose-500/20 text-rose-200 border-rose-500/40';

    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${classes}`}>{status}</span>;
}

function Metric({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
    return (
        <div className={`rounded-xl border border-gray-800 bg-gray-950/40 ${compact ? 'p-2' : 'p-4'}`}>
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-cyan-200 mt-1`}>{value}</p>
        </div>
    );
}
