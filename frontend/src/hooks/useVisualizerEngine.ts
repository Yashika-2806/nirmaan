import { useState, useEffect, useRef, useCallback } from 'react';
import { VisualizerStep, AlgorithmTemplate } from '@/types/visualizer';
import { ALL_TEMPLATES } from '@/lib/visualizer/templates';
import { useNarration } from './useNarration';

export function useVisualizerEngine() {
    const [activeTemplateId, setActiveTemplateId] = useState<string>('bubble_sort');
    const [template, setTemplate] = useState<AlgorithmTemplate | null>(null);
    const [code, setCode] = useState('');
    
    const [steps, setSteps] = useState<VisualizerStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    
    const narration = useNarration();
    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize/Change Template
    useEffect(() => {
        const t = ALL_TEMPLATES.find(t => t.id === activeTemplateId) || ALL_TEMPLATES[0];
        setTemplate(t);
        setCode(t.starterCode);
        
        const generatedSteps = t.generateSteps(t.sampleInput);
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setIsPlaying(false);
        narration.stop();
        
    }, [activeTemplateId, narration.stop]);

    const playStep = useCallback((index: number) => {
        if (index < steps.length && index >= 0) {
            setCurrentStepIndex(index);
            const step = steps[index];
            if (step.audioText) {
                narration.speak(step.audioText);
            }
        } else {
            setIsPlaying(false);
        }
    }, [steps, narration]);

    // Handle Auto Play with async loop to wait for narration
    const activeRef = useRef(false);
    activeRef.current = isPlaying;
    const currentStepRef = useRef(currentStepIndex);
    currentStepRef.current = currentStepIndex;

    useEffect(() => {
        if (!isPlaying) return;

        let isCancelled = false;

        const runLoop = async () => {
            while (activeRef.current && !isCancelled) {
                const step = steps[currentStepRef.current];
                if (!step) break;

                // Base minimum delay before next step
                const baseDelay = 1500 / speed;

                if (narration.isNarrationEnabled && step.audioText) {
                    // Try waiting for audio + a small buffer, but cap it so it's not freezing forever
                    const audioPromise = narration.speak(step.audioText);
                    const timeoutPromise = new Promise(resolve => setTimeout(resolve, baseDelay));
                    
                    // Wait for both minimal delay and the audio to finish
                    await Promise.all([audioPromise, timeoutPromise]);
                    
                    // Add a tiny buffer after speaking before triggering the next slide
                    if (!isCancelled && activeRef.current) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } else {
                    // Just wait the standard speed-adjusted delay
                    await new Promise(resolve => setTimeout(resolve, baseDelay));
                }

                if (isCancelled || !activeRef.current) break;

                setCurrentStepIndex(prev => {
                    const next = prev + 1;
                    if (next >= steps.length) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return next;
                });
            }
        };

        runLoop();

        return () => {
            isCancelled = true;
        };
    }, [isPlaying, speed, steps, narration.speak, narration.isNarrationEnabled]);

    const handlePlayPause = () => {
        if (currentStepIndex >= steps.length - 1 && !isPlaying) {
            // Restart if at end
            setCurrentStepIndex(0);
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        setIsPlaying(false);
        if (currentStepIndex < steps.length - 1) {
            playStep(currentStepIndex + 1);
        }
    };

    const handlePrev = () => {
        setIsPlaying(false);
        if (currentStepIndex > 0) {
            playStep(currentStepIndex - 1);
        }
    };

    const handleReset = () => {
        setIsPlaying(false);
        narration.stop();
        setCurrentStepIndex(0);
    };

    const visualizeCustomInput = useCallback((customInput: any) => {
        if (!template) return;
        setIsPlaying(false);
        narration.stop();
        const generatedSteps = template.generateSteps(customInput);
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
    }, [template, narration.stop]);

    const currentStep = steps[currentStepIndex] || null;

    return {
        activeTemplateId,
        setActiveTemplateId,
        template,
        code,
        setCode,
        steps,
        currentStepIndex,
        setCurrentStepIndex,
        currentStep,
        isPlaying,
        setIsPlaying,
        speed,
        setSpeed,
        handlePlayPause,
        handleNext,
        handlePrev,
        handleReset,
        visualizeCustomInput,
        narration
    };
}
