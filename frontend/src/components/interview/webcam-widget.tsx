'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ViolationCounts } from '@/hooks/useProctor';

interface WebcamWidgetProps {
    stream:          MediaStream | null;
    cameraEnabled:   boolean;
    micEnabled:      boolean;
    isProctored:     boolean;
    violationCounts: ViolationCounts;
    elapsed:         number;          // seconds
}

function fmtTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

function computeTrustScore(counts: ViolationCounts): number {
    const penalty =
        (counts.tabSwitches     || 0) * 5 +
        (counts.windowBlurs     || 0) * 3 +
        (counts.fullscreenExits || 0) * 5 +
        (counts.copyPastes      || 0) * 8 +
        (counts.rapidPastes     || 0) * 10;
    return Math.max(0, 100 - penalty);
}

export default function WebcamWidget({
    stream, cameraEnabled, micEnabled, isProctored, violationCounts, elapsed,
}: WebcamWidgetProps) {
    const videoRef  = useRef<HTMLVideoElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef    = useRef<number>(0);
    const [micLevel, setMicLevel]   = useState(0);
    const [expanded, setExpanded]   = useState(true);

    // Bind video stream
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Mic activity analyser
    useEffect(() => {
        if (!stream || !micEnabled) { setMicLevel(0); return; }
        try {
            const ctx      = new AudioContext();
            const src      = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            src.connect(analyser);
            analyserRef.current = analyser;
            const buf = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(buf);
                const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
                setMicLevel(Math.min(100, avg * 2.5));
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();
            return () => {
                cancelAnimationFrame(rafRef.current);
                ctx.close();
            };
        } catch { /* non-critical */ }
    }, [stream, micEnabled]);

    const trustScore = computeTrustScore(violationCounts);
    const totalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);

    const trustColor  = trustScore >= 80 ? 'text-emerald-400'
                      : trustScore >= 60 ? 'text-amber-400'
                      : 'text-rose-400';
    const trustStroke = trustScore >= 80 ? '#34d399'
                      : trustScore >= 60 ? '#fbbf24'
                      : '#f87171';
    const TrustIcon = trustScore >= 80 ? ShieldCheck : trustScore >= 60 ? Shield : ShieldAlert;

    return (
        <AnimatePresence>
            {isProctored && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 40 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 40 }}
                    className="fixed right-4 top-4 z-[9999] flex flex-col gap-2"
                    style={{ userSelect: 'none' }}
                >
                    {/* Camera preview */}
                    <motion.div
                        layout
                        className="relative overflow-hidden rounded-2xl border-2 border-cyan-400/50 bg-slate-900 shadow-2xl shadow-black/60"
                        style={{ width: expanded ? 160 : 48, height: expanded ? 120 : 48 }}
                    >
                        {expanded && cameraEnabled && stream ? (
                            <video ref={videoRef} autoPlay muted playsInline
                                className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                        ) : expanded ? (
                            <div className="flex h-full w-full items-center justify-center bg-slate-950">
                                <CameraOff className="h-7 w-7 text-slate-600" />
                            </div>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <Camera className="h-5 w-5 text-cyan-400" />
                            </div>
                        )}

                        {/* REC indicator */}
                        {expanded && (
                            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                REC
                            </div>
                        )}

                        {/* Elapsed timer */}
                        {expanded && (
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-black/60 px-1 py-0.5 text-center font-mono text-[10px] font-semibold text-slate-200 backdrop-blur-sm">
                                {fmtTime(elapsed)}
                            </div>
                        )}

                        {/* Toggle button */}
                        <button onClick={() => setExpanded(p => !p)}
                            className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-0.5 text-slate-300 hover:text-white transition">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                                {expanded
                                    ? <path d="M2 2h6v6H2z" fillOpacity="0.5" />
                                    : <path d="M0 0h10v10H0z" fillOpacity="0.5" />
                                }
                            </svg>
                        </button>
                    </motion.div>

                    {/* Trust Score HUD */}
                    {expanded && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/95 px-3 py-2.5 shadow-xl backdrop-blur">

                            {/* Trust ring + score */}
                            <div className="flex items-center gap-2.5">
                                <div className="relative h-9 w-9 flex-shrink-0">
                                    <svg className="-rotate-90" width="36" height="36" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
                                        <motion.circle cx="18" cy="18" r="14" fill="none"
                                            stroke={trustStroke} strokeWidth="3.5" strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 14}`}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 14 * (1 - trustScore / 100) }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </svg>
                                    <TrustIcon className={`absolute inset-0 m-auto h-4 w-4 ${trustColor}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500">Trust Score</p>
                                    <p className={`text-lg font-black leading-tight ${trustColor}`}>{trustScore}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-[10px] text-slate-500">Violations</p>
                                    <p className={`text-lg font-black ${totalViolations === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {totalViolations}
                                    </p>
                                </div>
                            </div>

                            {/* Mic level bars */}
                            {micEnabled && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    {micEnabled ? <Mic className="h-3 w-3 text-emerald-400 flex-shrink-0" /> : <MicOff className="h-3 w-3 text-rose-400 flex-shrink-0" />}
                                    <div className="flex flex-1 gap-[2px]">
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <div key={i}
                                                className={`flex-1 rounded-sm transition-all duration-75 ${i < Math.round(micLevel / 6.25)
                                                    ? (micLevel > 60 ? 'bg-amber-400' : 'bg-emerald-400')
                                                    : 'bg-slate-700'}`}
                                                style={{ height: `${8 + (i % 3) * 2}px` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status pills */}
                            <div className="mt-2 flex gap-1.5">
                                <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${cameraEnabled ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/30 bg-rose-500/10 text-rose-300'}`}>
                                    {cameraEnabled ? <Camera className="h-2 w-2" /> : <CameraOff className="h-2 w-2" />} CAM
                                </span>
                                <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${micEnabled ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/30 bg-rose-500/10 text-rose-300'}`}>
                                    {micEnabled ? <Mic className="h-2 w-2" /> : <MicOff className="h-2 w-2" />} MIC
                                </span>
                                <span className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" /> LIVE
                                </span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
