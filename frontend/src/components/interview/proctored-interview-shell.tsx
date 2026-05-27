'use client';

/**
 * ProctoredInterviewShell — Production-Grade Interview Orchestrator
 *
 * Manages full interview lifecycle:
 *   proctor-setup → interview → done
 *
 * Features:
 *  - Camera/mic/fullscreen proctoring via useProctor
 *  - Live trust score HUD via WebcamWidget
 *  - Violation overlays with auto-dismiss
 *  - Submission confirm + cinematic final score reveal
 *  - Real plagiarism hash submission
 *  - Stats propagation for accurate scoring
 */

import { useCallback, useState } from 'react';
import { useProctor } from '@/hooks/useProctor';
import WebcamWidget from './webcam-widget';
import ViolationOverlay from './violation-overlay';
import ProctorSetup from './proctor-setup';
import SubmissionConfirm, { FinalScoreModal } from './submission-modals';
import InterviewAiLabPage from './interview-ai-lab-page';

type ShellPhase = 'proctor-setup' | 'interview' | 'done';

export default function ProctoredInterviewShell() {
    const [shellPhase,        setShellPhase]        = useState<ShellPhase>('proctor-setup');
    const [isStartingProctor, setIsStartingProctor] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showFinalScore,    setShowFinalScore]    = useState(false);
    const [proctorScore,      setProctorScore]      = useState<any>(null);
    const [passedTests,       setPassedTests]       = useState(0);
    const [totalTests,        setTotalTests]        = useState(0);

    /* ── Session data lifted from InterviewAiLabPage ─────────────────────── */
    const [sessionMeta,       setSessionMeta]       = useState({ company: 'Interview', role: 'Session' });
    const [interviewSessionId,setInterviewSessionId]= useState<string | undefined>(undefined);
    const [interviewStats,    setInterviewStats]    = useState({ testCasePct: 0, aiCodeScore: 0 });
    const [submissionCodes,   setSubmissionCodes]   = useState<Array<{ questionId: string; rawCode: string }>>([]);

    /* ── Proctor hook ────────────────────────────────────────────────────── */
    const proctor = useProctor({
        interviewSessionId,
        company:          sessionMeta.company,
        role:             sessionMeta.role,
        timeLimitSeconds: 3600,
        onViolation:     () => {},
        onFullscreenExit:() => {},
        onTimeLimitReached: () => { handleAutoSubmit(); },
    });

    /* ── Handlers ────────────────────────────────────────────────────────── */
    const handleStartProctored = useCallback(async () => {
        setIsStartingProctor(true);
        try {
            await proctor.startProctoring();
            setShellPhase('interview');
        } catch {
            setShellPhase('interview');
        } finally {
            setIsStartingProctor(false);
        }
    }, [proctor]);

    const handleSkipProctor = () => setShellPhase('interview');

    const handleAutoSubmit = useCallback(async () => {
        if (!proctor.isActive) return;
        const scoring = await proctor.finishProctoring({
            testCasePct: interviewStats.testCasePct,
            aiCodeScore: interviewStats.aiCodeScore,
            status: 'auto_submitted',
        });
        setProctorScore(scoring);
        setShowFinalScore(true);
        setShellPhase('done');
    }, [proctor, interviewStats]);

    const handleConfirmSubmit = useCallback(async () => {
        setShowSubmitConfirm(false);
        if (proctor.isActive) {
            const scoring = await proctor.finishProctoring({
                testCasePct: interviewStats.testCasePct,
                aiCodeScore: interviewStats.aiCodeScore,
                status: 'completed',
                submissionHashes: submissionCodes.map(({ questionId, rawCode }) => ({
                    questionId,
                    codeHash: rawCode,
                    rawCode,
                })),
            });
            setProctorScore(scoring);
            setShowFinalScore(true);
        }
        setShellPhase('done');
    }, [proctor, interviewStats, submissionCodes]);

    /* ── Render ──────────────────────────────────────────────────────────── */
    return (
        <>
            {/* ── Floating proctoring UI (always in DOM when active) ───── */}
            <WebcamWidget
                stream={proctor.cameraStream}
                cameraEnabled={proctor.cameraEnabled}
                micEnabled={proctor.micEnabled}
                isProctored={proctor.isActive}
                violationCounts={proctor.violationCounts}
                elapsed={proctor.elapsed}
            />

            <ViolationOverlay
                warnings={proctor.warnings}
                violationCounts={proctor.violationCounts}
                isFullscreen={proctor.isFullscreen}
                onDismiss={proctor.dismissWarning}
                onReEnterFullscreen={proctor.reEnterFullscreen}
            />

            {/* ── Modals ────────────────────────────────────────────────── */}
            <SubmissionConfirm
                open={showSubmitConfirm}
                onConfirm={handleConfirmSubmit}
                onCancel={() => setShowSubmitConfirm(false)}
                isSubmitting={false}
                violationCounts={proctor.violationCounts}
                passedTests={passedTests}
                totalTests={totalTests}
            />

            <FinalScoreModal
                open={showFinalScore}
                scoring={proctorScore}
                onClose={() => { setShowFinalScore(false); setShellPhase('done'); }}
            />

            {/* ── Proctor setup screen ──────────────────────────────────── */}
            {shellPhase === 'proctor-setup' && (
                <ProctorSetup
                    company={sessionMeta.company}
                    role={sessionMeta.role}
                    isStarting={isStartingProctor}
                    onStart={handleStartProctored}
                    onSkip={handleSkipProctor}
                />
            )}

            {/* ── Main interview (always mounted to preserve state) ─────── */}
            <div className={shellPhase === 'proctor-setup' ? 'hidden' : ''}>
                <InterviewAiLabPage
                    proctorActive={proctor.isActive}
                    onPasteDetected={proctor.handlePasteDetected}
                    onRequestSubmitConfirm={() => setShowSubmitConfirm(true)}
                    onSessionCreated={(sessionId, company, role) => {
                        setInterviewSessionId(sessionId);
                        setSessionMeta({ company, role });
                    }}
                    onStatsUpdate={(testCasePct, aiCodeScore) => {
                        setInterviewStats({ testCasePct, aiCodeScore });
                    }}
                    onTestResults={(passed, total) => {
                        setPassedTests(passed);
                        setTotalTests(total);
                    }}
                    onCodeSubmitted={(questionId, rawCode) => {
                        setSubmissionCodes(prev => {
                            const filtered = prev.filter(s => s.questionId !== questionId);
                            return [...filtered, { questionId, rawCode }];
                        });
                    }}
                />
            </div>
        </>
    );
}
