'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { FunnelMetricsResponse, growthAnalyticsService } from '@/services/growthAnalyticsService';

const stageLabels: Record<string, string> = {
    cta_clicked: 'Landing CTA Clicked',
    register_submitted: 'Register Submitted',
    register_success: 'Register Success',
    dashboard_viewed: 'Dashboard Viewed',
    paywall_viewed: 'Paywall Viewed',
    paywall_upgrade_clicked: 'Upgrade Clicked',
};

export default function FunnelPage() {
    const [metrics, setMetrics] = useState<FunnelMetricsResponse | null>(null);
    const [lookbackDays, setLookbackDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMetrics = async () => {
            setIsLoading(true);
            try {
                const data = await growthAnalyticsService.getFunnelMetrics(lookbackDays);
                setMetrics(data);
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Unable to load funnel metrics');
            } finally {
                setIsLoading(false);
            }
        };

        loadMetrics();
    }, [lookbackDays]);

    const stageRows = useMemo(() => metrics?.stages || [], [metrics?.stages]);

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-cyan-300/25 bg-[#0e162d] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Growth Funnel Monitor</h1>
                        <p className="mt-2 text-sm text-slate-300">Server-side conversion flow from first click to upgrade intent.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Event logs: {metrics?.totals?.eventsTracked || 0}
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <label htmlFor="lookbackDays" className="text-sm text-slate-300">Lookback</label>
                    <select
                        id="lookbackDays"
                        title="Lookback duration"
                        value={lookbackDays}
                        onChange={(e) => setLookbackDays(Number(e.target.value))}
                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white"
                    >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                    </select>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Landing CTA Clicks" value={metrics?.totals?.landingClicks || 0} icon={<Users className="h-5 w-5 text-cyan-200" />} />
                <MetricCard label="Register Success" value={metrics?.totals?.registerSuccess || 0} icon={<TrendingUp className="h-5 w-5 text-emerald-300" />} />
                <MetricCard label="Upgrade Clicks" value={metrics?.totals?.upgrades || 0} icon={<TrendingDown className="h-5 w-5 text-amber-300" />} />
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111a33] p-6">
                <h2 className="text-xl font-semibold text-white">Stage Conversion</h2>
                {isLoading ? (
                    <p className="mt-4 text-sm text-slate-300">Loading funnel metrics...</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {stageRows.map((stage) => (
                            <div key={stage.stage} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-white">{stageLabels[stage.stage] || stage.stage}</p>
                                    <p className="text-sm text-cyan-100">{stage.count} events</p>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                                    <span>Total conversion: {stage.conversionFromStart}%</span>
                                    <span>Drop from previous: {stage.dropFromPrevious}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111a33] p-6">
                <h2 className="text-xl font-semibold text-white">Top Landing Sources</h2>
                <div className="mt-4 space-y-2">
                    {(metrics?.topSources || []).map((source) => (
                        <div key={source.source} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <p className="text-sm text-slate-200">{source.source}</p>
                            <p className="text-sm font-semibold text-cyan-100">{source.count}</p>
                        </div>
                    ))}
                    {(metrics?.topSources || []).length === 0 && (
                        <p className="text-sm text-slate-300">No source data yet for selected lookback window.</p>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111a33] p-6">
                <h2 className="text-xl font-semibold text-white">Action Notes</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200">
                    <li>If Register Submitted is high but Register Success is low, fix friction in registration and error messaging.</li>
                    <li>If Dashboard Viewed is low after register, improve post-signup routing speed and onboarding immediacy.</li>
                    <li>If Paywall Viewed is high but Upgrade Clicked is low, strengthen paywall value proof and urgency.</li>
                </ul>
            </section>
        </div>
    );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#111a33] p-5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-300">{label}</p>
                {icon}
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
    );
}
