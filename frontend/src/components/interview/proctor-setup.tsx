'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, CameraOff, Mic, MicOff, Maximize2, ShieldCheck,
    AlertTriangle, Loader2, CheckCircle2, ChevronRight, Monitor,
    Wifi, Eye, Lock,
} from 'lucide-react';

interface ProctorSetupProps {
    onStart:    () => Promise<void>;
    onSkip:     () => void;
    isStarting: boolean;
    company:    string;
    role:       string;
}

type PermState = 'idle' | 'checking' | 'granted' | 'denied';

export default function ProctorSetup({ onStart, onSkip, isStarting, company, role }: ProctorSetupProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [camPerm, setCamPerm]   = useState<PermState>('idle');
    const [micPerm, setMicPerm]   = useState<PermState>('idle');
    const [step, setStep]         = useState<'briefing' | 'permissions' | 'check' | 'ready'>('briefing');
    const [micLevel, setMicLevel] = useState(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micRafRef   = useRef<number>(0);

    // Request camera + mic
    async function requestPermissions() {
        setStep('permissions');
        setCamPerm('checking');
        setMicPerm('checking');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCamPerm('granted');
            setMicPerm('granted');

            // Mic level visualizer
            const ctx = new AudioContext();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;
            const buf = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(buf);
                const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
                setMicLevel(Math.min(100, avg * 2));
                micRafRef.current = requestAnimationFrame(tick);
            };
            tick();
            setTimeout(() => setStep('check'), 600);
        } catch {
            setCamPerm('denied');
            setMicPerm('denied');
            setTimeout(() => setStep('check'), 400);
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelAnimationFrame(micRafRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    // Auto-advance to ready after check
    useEffect(() => {
        if (step === 'check') {
            const t = setTimeout(() => setStep('ready'), 1800);
            return () => clearTimeout(t);
        }
    }, [step]);

    const checks = [
        { label: 'Secure connection', done: true,              icon: Wifi },
        { label: 'Camera access',     done: camPerm === 'granted', icon: Camera },
        { label: 'Microphone',        done: micPerm === 'granted', icon: Mic },
        { label: 'Browser support',   done: true,              icon: Monitor },
        { label: 'Integrity engine',  done: step === 'ready',  icon: ShieldCheck },
    ];

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(14,165,233,0.10),transparent)]" />

            <div className="relative z-10 w-full max-w-3xl">
                {/* ── STEP: BRIEFING ── */}
                <AnimatePresence mode="wait">
                    {step === 'briefing' && (
                        <motion.div key="briefing"
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                            className="text-center"
                        >
                            {/* Company badge */}
                            <div className="mb-6 flex items-center justify-center gap-2">
                                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
                                    {company} — Technical Interview
                                </span>
                            </div>

                            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                                Ready to<br />
                                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                    prove yourself?
                                </span>
                            </h1>
                            <p className="mx-auto mt-4 max-w-lg text-base text-slate-400">
                                You&apos;re about to enter a real-time proctored coding interview for the <strong className="text-slate-200">{role}</strong> position. 
                                This session is monitored for integrity.
                            </p>

                            {/* Rules grid */}
                            <div className="mx-auto mt-10 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                                {[
                                    { icon: Lock,       color: 'cyan',    title: 'Fullscreen locked',   desc: 'Exiting fullscreen flags a violation.' },
                                    { icon: Eye,        color: 'violet',  title: 'Activity monitored',  desc: 'Tab switches, copy-paste are tracked.' },
                                    { icon: Camera,     color: 'emerald', title: 'Webcam on',           desc: 'Floating preview shown throughout.' },
                                    { icon: ShieldCheck,color: 'amber',   title: 'AI proctored',        desc: 'Suspicious patterns auto-flagged.' },
                                ].map(item => (
                                    <div key={item.title} className={`flex gap-3 rounded-2xl border border-${item.color}-500/20 bg-${item.color}-500/8 p-4`}>
                                        <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-${item.color}-500/15`}>
                                            <item.icon className={`h-4 w-4 text-${item.color}-400`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{item.title}</p>
                                            <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Scoring */}
                            <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60">
                                <p className="border-b border-slate-700/60 px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                                    How you&apos;re scored
                                </p>
                                <div className="grid grid-cols-4 divide-x divide-slate-800">
                                    {[
                                        { label: 'Test Cases', pct: '70%', color: 'text-cyan-400' },
                                        { label: 'Code Quality', pct: '10%', color: 'text-violet-400' },
                                        { label: 'Time Efficiency', pct: '10%', color: 'text-emerald-400' },
                                        { label: 'Integrity', pct: '10%', color: 'text-rose-400' },
                                    ].map(s => (
                                        <div key={s.label} className="py-4 text-center">
                                            <p className={`text-2xl font-black ${s.color}`}>{s.pct}</p>
                                            <p className="mt-1 text-[10px] text-slate-500">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <button
                                    onClick={requestPermissions}
                                    className="group flex items-center gap-2 rounded-2xl border border-cyan-400/60 bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 active:scale-95"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    I agree — Enable Proctoring
                                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                                <button onClick={onSkip} className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-4 transition">
                                    Skip — Practice Mode
                                </button>
                            </div>
                            <p className="mt-4 text-xs text-slate-600">Camera feed is never recorded or stored on our servers.</p>
                        </motion.div>
                    )}

                    {/* ── STEP: PERMISSIONS ── */}
                    {step === 'permissions' && (
                        <motion.div key="permissions"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-6 text-center"
                        >
                            <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                            <div>
                                <p className="text-xl font-bold text-white">Requesting permissions…</p>
                                <p className="mt-2 text-sm text-slate-400">Allow camera and microphone access when your browser prompts.</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP: CHECK ── */}
                    {(step === 'check' || step === 'ready') && (
                        <motion.div key="check"
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="grid gap-6 lg:grid-cols-[300px_1fr]"
                        >
                            {/* Live camera preview */}
                            <div className="flex flex-col gap-4">
                                <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-400/40 bg-slate-900 shadow-2xl shadow-cyan-500/10">
                                    {camPerm === 'granted' ? (
                                        <video ref={videoRef} autoPlay muted playsInline
                                            className="h-52 w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                                    ) : (
                                        <div className="flex h-52 items-center justify-center">
                                            <CameraOff className="h-12 w-12 text-slate-600" />
                                        </div>
                                    )}
                                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                                    </div>
                                </div>

                                {/* Mic level */}
                                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        {micPerm === 'granted' ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-rose-400" />}
                                        <span className="text-xs text-slate-400">Microphone Level</span>
                                    </div>
                                    <div className="flex gap-[3px]">
                                        {Array.from({ length: 20 }).map((_, i) => (
                                            <div key={i} className={`h-4 flex-1 rounded-sm transition-colors ${i < (micLevel / 5) ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Environment checks */}
                            <div>
                                <p className="mb-4 text-lg font-bold text-white">Environment Check</p>
                                <div className="space-y-2">
                                    {checks.map((c, i) => (
                                        <motion.div key={c.label}
                                            initial={{ opacity: 0, x: 16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.15 }}
                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c.done ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-slate-700 bg-slate-900/50'}`}
                                        >
                                            {c.done
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                : <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                            }
                                            <c.icon className={`h-4 w-4 ${c.done ? 'text-emerald-300' : 'text-slate-500'}`} />
                                            <span className={`text-sm ${c.done ? 'text-white' : 'text-slate-500'}`}>{c.label}</span>
                                            {c.done && (
                                                <span className="ml-auto text-xs font-semibold text-emerald-400">OK</span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {camPerm === 'denied' && (
                                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                        Camera/mic denied. You can still proceed — proctoring will rely on behavioral signals only.
                                    </div>
                                )}

                                <AnimatePresence>
                                    {step === 'ready' && (
                                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 space-y-3"
                                        >
                                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                                <p className="text-sm font-semibold text-emerald-200">All systems ready. You may begin.</p>
                                            </div>
                                            <button
                                                onClick={onStart}
                                                disabled={isStarting}
                                                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/60 bg-gradient-to-r from-cyan-500 to-blue-500 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:opacity-60"
                                            >
                                                {isStarting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</> : <><ShieldCheck className="h-4 w-4" /> Start Interview Now<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                                            </button>
                                            <button onClick={onSkip} className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition">
                                                Skip proctoring (practice mode)
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
