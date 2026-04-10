'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Code2,
  Zap,
  Volume2,
  VolumeX,
  Languages,
  ChevronDown,
  Sparkles,
  Brain,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ArrayVisualization } from '@/components/dsa/ArrayVisualization';
import { VisualizerControls } from '@/components/dsa/VisualizerControls';
import { TemplateSelector } from '@/components/dsa/TemplateSelector';
import { VoiceGuidePanel } from '@/components/dsa/VoiceGuidePanel';
import { ExecutionTimeline } from '@/components/dsa/ExecutionTimeline';
import { CodeDisplay } from '@/components/dsa/CodeDisplay';
import {
  ALGORITHM_TEMPLATES,
  getAllTemplates,
  getTemplatesByCategory,
} from '@/data/algorithm-templates';
import { AlgorithmTemplate, AlgorithmCategory, ExecutionStep } from '@/types/dsa-visualizer';
import {
  generateBubbleSortSteps,
  generateLinearSearchSteps,
  generateBinarySearchSteps,
  generateSelectionSortSteps,
  PLAYBACK_SPEEDS,
} from '@/utils/visualizer-engine';
import { SimpleVoiceNarrator } from '@/utils/voice-narration';

type CodeLanguage = 'python' | 'javascript' | 'cpp' | 'java';

export default function AdvancedVisualizerPage() {
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<AlgorithmTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AlgorithmCategory>('arrays');
  const [selectedCodeLanguage, setSelectedCodeLanguage] = useState<CodeLanguage>('python');
  const [narrationLanguage, setNarrationLanguage] = useState<'english' | 'hindi' | 'hinglish'>('english');
  const [playbackSpeed, setPlaybackSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [voiceNarrator] = useState(() => new SimpleVoiceNarrator());

  // Get all templates for the selector
  const allTemplates = useMemo(() => getAllTemplates(), []);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !executionSteps.length) return;

    const speed = PLAYBACK_SPEEDS[playbackSpeed];
    const timer = setTimeout(() => {
      if (currentStepIndex < executionSteps.length - 1) {
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);

        // Speak narration if not muted
        if (!isMuted && executionSteps[nextIndex]) {
          const text = executionSteps[nextIndex].narration[narrationLanguage];
          voiceNarrator.speak(text, { rate: speed.multiplier });
        }
      } else {
        setIsPlaying(false);
      }
    }, speed.delayMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, executionSteps, playbackSpeed, isMuted, narrationLanguage, voiceNarrator]);

  // Generate steps when template changes
  useEffect(() => {
    if (!selectedTemplate) {
      setExecutionSteps([]);
      setCurrentStepIndex(0);
      return;
    }

    let steps: ExecutionStep[] = [];

    // Generate steps based on template
    if (selectedTemplate.id === 'bubble-sort') {
      steps = generateBubbleSortSteps([64, 34, 25, 12, 22]);
    } else if (selectedTemplate.id === 'selection-sort') {
      steps = generateSelectionSortSteps([64, 25, 12, 22, 11]);
    } else if (selectedTemplate.id === 'linear-search') {
      steps = generateLinearSearchSteps([2, 5, 8, 1, 9], 8);
    } else if (selectedTemplate.id === 'binary-search') {
      steps = generateBinarySearchSteps([1, 3, 5, 7, 9, 11, 13], 7);
    } else if (selectedTemplate.steps && selectedTemplate.steps.length > 0) {
      steps = selectedTemplate.steps;
    }

    setExecutionSteps(steps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [selectedTemplate]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    if (currentStepIndex >= executionSteps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentStepIndex, executionSteps.length]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < executionSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (!isMuted && executionSteps[nextIndex]) {
        const text = executionSteps[nextIndex].narration[narrationLanguage];
        voiceNarrator.speak(text);
      }
    }
  }, [currentStepIndex, executionSteps, isMuted, narrationLanguage, voiceNarrator]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (!isMuted && executionSteps[prevIndex]) {
        const text = executionSteps[prevIndex].narration[narrationLanguage];
        voiceNarrator.speak(text);
      }
    }
  }, [currentStepIndex, executionSteps, isMuted, narrationLanguage, voiceNarrator]);

  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    voiceNarrator.stop();
  }, [voiceNarrator]);

  const handleSpeedChange = useCallback((speed: 'slow' | 'normal' | 'fast') => {
    setPlaybackSpeed(speed);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
    if (isPlaying) {
      voiceNarrator.stop();
    }
  }, [isMuted, isPlaying, voiceNarrator]);

  // Get current step
  const currentStep = executionSteps[currentStepIndex] || null;

  // Get visualization data from current step
  const getVisualizationData = () => {
    if (!currentStep) return null;

    if (selectedTemplate?.visualizationType === 'array' && currentStep.visualization.type === 'array') {
      return {
        data: currentStep.visualization.data,
        highlightedElements: currentStep.highlightedElements,
        swappedElements: currentStep.swappedElements,
        sortedElements: Array.from(
          new Set(
            executionSteps.slice(0, currentStepIndex + 1).flatMap((s) => {
              if (s.visualization.state.sorted) return s.visualization.state.sortedIndices || [];
              return [];
            })
          )
        ),
      };
    }

    return null;
  };

  const vizData = getVisualizationData();
  const code = selectedTemplate?.codeLanguages[selectedCodeLanguage] || '';

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6 pb-20">
      {/* Premium Header with Animations */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 via-slate-900/50 to-black p-8 shadow-2xl"
      >
        {/* Animated gradient overlays */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              'radial-gradient(400px at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 80%)',
              'radial-gradient(400px at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 80%)',
              'radial-gradient(400px at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 80%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity } as any}
        />

        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/30 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity } as any}
        />

        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 } as any}
        />

        <div className="relative z-10 space-y-4">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity } as any}
            >
              <Brain className="w-8 h-8 text-primary-400" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity } as any}
            >
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-primary-200 to-cyan-300 bg-clip-text text-transparent mb-3">
              Advanced Algorithm Visualizer
            </h1>
            <motion.p
              className="text-gray-300 text-lg font-medium max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="inline-flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                AI-powered step-by-step learning
              </span>
              <span className="block mt-2 text-gray-400">
                Interactive visualization • Voice narration • Multiple languages • 3x playback speeds
              </span>
            </motion.p>
          </motion.div>
        </div>

        {/* Premium border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity } as any}
          style={{
            boxShadow: 'inset 0 0 30px rgba(59, 130, 246, 0.2), inset 0 0 60px rgba(139, 92, 246, 0.1)',
          }}
        />
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Templates & Settings */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <TemplateSelector
              templates={allTemplates}
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              currentCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* Code Language Selector */}
          {selectedTemplate && (
            <div className="card space-y-3">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Code Language
              </label>
              <select
                value={selectedCodeLanguage}
                onChange={(e) => setSelectedCodeLanguage(e.target.value as CodeLanguage)}
                className="input w-full"
              >
                {Object.keys(selectedTemplate.codeLanguages).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center Panel - Visualization & Code */}
        <div className="lg:col-span-6 space-y-6">
          {selectedTemplate && executionSteps.length > 0 ? (
            <>
              {/* Visualization Canvas */}
              <div className="card">
                {vizData ? (
                  <ArrayVisualization
                    data={vizData.data}
                    highlightedElements={vizData.highlightedElements}
                    swappedElements={vizData.swappedElements}
                    sortedElements={vizData.sortedElements}
                    title={selectedTemplate.name}
                    size="large"
                  />
                ) : (
                  <div className="h-96 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Visualization not available for this algorithm</span>
                  </div>
                )}
              </div>

              {/* Code Display */}
              {code && (
                <div className="card">
                  <CodeDisplay
                    code={code}
                    language={selectedCodeLanguage}
                    highlightedLineNumber={currentStep?.lineNumber}
                    title={`${selectedCodeLanguage.toUpperCase()} Implementation`}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="card h-96 flex flex-col items-center justify-center text-center text-gray-500">
              <Zap className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-lg">Select an algorithm to begin</p>
              <p className="text-sm mt-2">Choose from our library of templates to visualize step by step</p>
            </div>
          )}
        </div>

        {/* Right Panel - Controls & Narration */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls */}
          {selectedTemplate && executionSteps.length > 0 && (
            <div className="card">
              <VisualizerControls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onReset={handleReset}
                onSpeedChange={handleSpeedChange}
                onMuteToggle={handleMuteToggle}
                currentSpeed={playbackSpeed}
                isMuted={isMuted}
                canPlayNext={currentStepIndex < executionSteps.length - 1}
                canPlayPrevious={currentStepIndex > 0}
                currentStep={currentStepIndex}
                totalSteps={executionSteps.length}
              />
            </div>
          )}

          {/* Voice Guide Panel */}
          {selectedTemplate && (
            <div className="card">
              <VoiceGuidePanel
                currentStep={currentStep}
                narrationLanguage={narrationLanguage}
                onLanguageChange={setNarrationLanguage}
                isMuted={isMuted}
                onMuteToggle={handleMuteToggle}
                isNarrating={isPlaying}
              />
            </div>
          )}

          {/* Timeline */}
          {selectedTemplate && executionSteps.length > 0 && (
            <div className="card">
              <ExecutionTimeline
                steps={executionSteps}
                currentStepIndex={currentStepIndex}
                onStepClick={(index) => {
                  setCurrentStepIndex(index);
                  setIsPlaying(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Algorithm Info Footer */}
      {selectedTemplate && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="card p-4">
            <p className="text-gray-500 text-sm">Time Complexity</p>
            <p className="text-white font-mono font-semibold mt-2">{selectedTemplate.timeComplexity}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-sm">Space Complexity</p>
            <p className="text-white font-mono font-semibold mt-2">{selectedTemplate.spaceComplexity}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-sm">Difficulty</p>
            <p className={`font-semibold mt-2 capitalize ${
              selectedTemplate.difficulty === 'easy'
                ? 'text-green-400'
                : selectedTemplate.difficulty === 'medium'
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {selectedTemplate.difficulty}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-sm">Use Case</p>
            <p className="text-white text-sm mt-2">{selectedTemplate.useCase}</p>
          </div>
        </div>
      )}
    </div>
  );
}
