'use client';

/**
 * useProctor — React hook that implements the full proctoring system
 *
 * Responsibilities:
 *  - Request camera / mic via getUserMedia
 *  - Enter/monitor fullscreen
 *  - Detect tab switches, window blur, fullscreen exit
 *  - Report violations to backend via /api/proctor/*
 *  - Heartbeat every 30 s
 *  - Compute and submit final proctor report on finish()
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from '@/lib/axios';

export type ViolationType =
    | 'tab_switch'
    | 'window_blur'
    | 'fullscreen_exit'
    | 'copy_paste'
    | 'rapid_paste'
    | 'face_missing'
    | 'multiple_faces';

export interface ViolationCounts {
    tabSwitches:     number;
    windowBlurs:     number;
    fullscreenExits: number;
    copyPastes:      number;
    rapidPastes:     number;
    faceMissing:     number;
    multipleFaces:   number;
}

export interface ProctorScoring {
    testCaseScore:    number;
    timeScore:        number;
    codeQualityScore: number;
    violationPenalty: number;
    finalScore:       number;
    grade:            string;
}

interface UseProctorOptions {
    interviewSessionId?: string;
    company?:            string;
    role?:               string;
    timeLimitSeconds?:   number;
    onViolation?:        (type: ViolationType, counts: ViolationCounts) => void;
    onFullscreenExit?:   () => void;
    onTimeLimitReached?: () => void;
}

export function useProctor(options: UseProctorOptions = {}) {
    const {
        interviewSessionId,
        company = '',
        role    = '',
        timeLimitSeconds = 3600,
        onViolation,
        onFullscreenExit,
        onTimeLimitReached,
    } = options;

    const [proctorSessionId, setProctorSessionId] = useState<string | null>(null);
    const [isActive,         setIsActive]         = useState(false);
    const [cameraStream,     setCameraStream]      = useState<MediaStream | null>(null);
    const [cameraEnabled,    setCameraEnabled]     = useState(false);
    const [micEnabled,       setMicEnabled]        = useState(false);
    const [isFullscreen,     setIsFullscreen]      = useState(false);
    const [violationCounts,  setViolationCounts]   = useState<ViolationCounts>({
        tabSwitches:     0,
        windowBlurs:     0,
        fullscreenExits: 0,
        copyPastes:      0,
        rapidPastes:     0,
        faceMissing:     0,
        multipleFaces:   0,
    });
    const [warnings, setWarnings]     = useState<string[]>([]);
    const [elapsed,  setElapsed]      = useState(0);

    const proctorIdRef    = useRef<string | null>(null);
    const heartbeatRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const violCountRef    = useRef<ViolationCounts>({
        tabSwitches:     0,
        windowBlurs:     0,
        fullscreenExits: 0,
        copyPastes:      0,
        rapidPastes:     0,
        faceMissing:     0,
        multipleFaces:   0,
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    const addWarning = useCallback((msg: string) => {
        setWarnings(prev => [...prev.slice(-4), msg]);
    }, []);

    const recordViolation = useCallback(async (type: ViolationType, detail = '', severity: 'low' | 'medium' | 'high' = 'medium') => {
        // Update local counts
        const countKey: Record<ViolationType, keyof ViolationCounts> = {
            tab_switch:      'tabSwitches',
            window_blur:     'windowBlurs',
            fullscreen_exit: 'fullscreenExits',
            copy_paste:      'copyPastes',
            rapid_paste:     'rapidPastes',
            face_missing:    'faceMissing',
            multiple_faces:  'multipleFaces',
        };
        const key = countKey[type];
        if (key) {
            violCountRef.current = {
                ...violCountRef.current,
                [key]: (violCountRef.current[key] || 0) + 1,
            };
            setViolationCounts({ ...violCountRef.current });
        }

        onViolation?.(type, { ...violCountRef.current });

        // Report to backend
        const sid = proctorIdRef.current;
        if (!sid) return;
        try {
            await axios.post('/proctor/violation', {
                proctorSessionId: sid,
                type,
                detail,
                severity,
            });
        } catch { /* non-critical */ }
    }, [onViolation]);

    // ── Start proctoring ──────────────────────────────────────────────────────

    const startProctoring = useCallback(async () => {
        try {
            // 1. Create backend session
            const resp = await axios.post('/proctor/start', {
                interviewSessionId: interviewSessionId || undefined,
                company,
                role,
                timeLimitSeconds,
            });
            const sid: string = resp.data?.data?.proctorSessionId;
            proctorIdRef.current = sid;
            setProctorSessionId(sid);

            // 2. Request camera + mic
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setCameraStream(stream);
                setCameraEnabled(true);
                setMicEnabled(true);
            } catch (camErr) {
                addWarning('Camera/mic access denied — proctoring without camera.');
            }

            // 3. Enter fullscreen
            try {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } catch { /* user denied — show warning */ }

            // 4. Start heartbeat (30 s)
            heartbeatRef.current = setInterval(async () => {
                if (!proctorIdRef.current) return;
                try {
                    await axios.post('/proctor/heartbeat', {
                        proctorSessionId: proctorIdRef.current,
                        cameraEnabled:    cameraEnabled,
                        micEnabled:       micEnabled,
                        fullscreenActive: !!document.fullscreenElement,
                    });
                } catch { /* non-critical */ }
            }, 30_000);

            // 5. Elapsed timer
            elapsedTimerRef.current = setInterval(() => {
                setElapsed(prev => {
                    const next = prev + 1;
                    if (next >= timeLimitSeconds) {
                        onTimeLimitReached?.();
                    }
                    return next;
                });
            }, 1000);

            setIsActive(true);
        } catch (err) {
            console.error('Failed to start proctoring:', err);
        }
    }, [interviewSessionId, company, role, timeLimitSeconds, addWarning, onTimeLimitReached, cameraEnabled, micEnabled]);

    // ── Stop / finish ─────────────────────────────────────────────────────────

    const finishProctoring = useCallback(async (params: {
        testCasePct:      number;
        aiCodeScore:      number;
        status?:          'completed' | 'auto_submitted' | 'abandoned';
        submissionHashes?: Array<{ questionId: string; codeHash: string }>;
    }): Promise<ProctorScoring | null> => {
        if (heartbeatRef.current)    clearInterval(heartbeatRef.current);
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

        // Stop camera
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }

        // Exit fullscreen
        if (document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch { /* ignore */ }
        }

        const sid = proctorIdRef.current;
        if (!sid) return null;

        try {
            const resp = await axios.post('/proctor/finish', {
                proctorSessionId:   sid,
                testCasePct:        params.testCasePct,
                timeTakenSeconds:   elapsed,
                aiCodeScore:        params.aiCodeScore,
                status:             params.status || 'completed',
                submissionHashes:   params.submissionHashes || [],
                cameraEnabled,
                micEnabled,
            });
            setIsActive(false);
            return resp.data?.data?.scoring as ProctorScoring;
        } catch {
            setIsActive(false);
            return null;
        }
    }, [cameraStream, elapsed, cameraEnabled, micEnabled]);

    // ── Violation detectors ───────────────────────────────────────────────────

    useEffect(() => {
        if (!isActive) return;

        const handleVisibility = () => {
            if (document.hidden) {
                addWarning('⚠️ Tab switch detected! Return immediately.');
                recordViolation('tab_switch', 'Tab became hidden', 'high');
            }
        };

        const handleBlur = () => {
            addWarning('⚠️ Window focus lost!');
            recordViolation('window_blur', 'Window lost focus', 'medium');
        };

        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            if (!isFs) {
                addWarning('⚠️ Fullscreen exited! You must stay in fullscreen during the interview.');
                recordViolation('fullscreen_exit', 'Fullscreen exited', 'high');
                onFullscreenExit?.();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isActive, addWarning, recordViolation, onFullscreenExit]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (heartbeatRef.current)    clearInterval(heartbeatRef.current);
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
            if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
        };
    }, [cameraStream]);

    // ── Re-enter fullscreen helper ────────────────────────────────────────────

    const reEnterFullscreen = useCallback(async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch { /* ignore */ }
    }, []);

    // ── Paste detection helper (call from Monaco editor paste event) ──────────

    const handlePasteDetected = useCallback((charCount: number) => {
        if (charCount > 50) {
            addWarning('⚠️ Large paste detected and flagged.');
            recordViolation(
                charCount > 200 ? 'rapid_paste' : 'copy_paste',
                `Pasted ${charCount} characters`,
                charCount > 200 ? 'high' : 'medium'
            );
        }
    }, [addWarning, recordViolation]);

    return {
        // State
        proctorSessionId,
        isActive,
        cameraStream,
        cameraEnabled,
        micEnabled,
        isFullscreen,
        violationCounts,
        warnings,
        elapsed,

        // Actions
        startProctoring,
        finishProctoring,
        reEnterFullscreen,
        handlePasteDetected,
        recordViolation,
        addWarning,

        // Dismiss last warning
        dismissWarning: () => setWarnings(prev => prev.slice(1)),
    };
}
