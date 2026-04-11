'use client';

import { ChevronLeft, Settings2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useVisualizerEngine } from '@/hooks/useVisualizerEngine';
import { TEMPLATES_BY_CATEGORY } from '@/lib/visualizer/templates';

import { CodePanel } from '@/components/visualizer/panels/CodePanel';
import { ExplanationPanel } from '@/components/visualizer/panels/ExplanationPanel';
import { Canvas } from '@/components/visualizer/canvas/Canvas';
import { ControlsPanel } from '@/components/visualizer/ControlsPanel';

export default function AdvancedVisualizerPage() {
    const engine = useVisualizerEngine();

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#050505] text-white">
            {/* Header */}
            <div className="shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#0a0a0a] border-b border-gray-800 gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/dsa" className="p-2 text-gray-500 hover:text-white bg-[#111] hover:bg-[#1a1a1a] rounded-lg transition-colors border border-gray-800">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00D9FF]/10 rounded-lg border border-[#00D9FF]/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#00D9FF]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">Algorithm Visualizer <span className="bg-[#00D9FF]/20 text-[#00D9FF] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Pro</span></h1>
                            <p className="text-xs text-gray-500">Step-by-step execution & explanation</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center bg-[#111111] border border-gray-800 rounded-lg p-1">
                        <select
                            className="bg-transparent text-sm text-gray-200 px-3 py-2 outline-none w-full md:w-64 cursor-pointer"
                            value={engine.activeTemplateId}
                            onChange={(e) => engine.setActiveTemplateId(e.target.value)}
                            title="Select algorithm template"
                            aria-label="Select algorithm template"
                        >
                            {Object.entries(TEMPLATES_BY_CATEGORY).map(([category, templates]) => (
                                <optgroup key={category} label={category} className="bg-[#1a1a1a] text-gray-400 font-bold">
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id} className="text-white font-normal">
                                            {t.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <button
                        className="p-2.5 text-gray-400 hover:text-white bg-[#111111] border border-gray-800 rounded-lg transition-colors"
                        title="Open visualizer settings"
                        aria-label="Open visualizer settings"
                        type="button"
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Workspace Split */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
                
                {/* Left Column: Editor & Explanations */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 min-h-0">
                        <CodePanel 
                            code={engine.code} 
                            activeLines={engine.currentStep?.activeLines || []} 
                        />
                    </div>
                    <div className="h-64 shrink-0">
                        <ExplanationPanel 
                            title={engine.currentStep?.title || ""}
                            description={engine.currentStep?.description || ""}
                            stepIndex={engine.currentStepIndex}
                            totalSteps={engine.steps.length}
                        />
                    </div>
                </div>

                {/* Right Column: Visualization Canvas */}
                <div className="w-full lg:w-2/3 flex flex-col bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-lg relative min-h-0">
                    {/* Top Stats Bar */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs font-medium text-gray-400">
                                {engine.template?.category}
                            </span>
                            <span className="px-3 py-1 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-full text-xs font-bold text-[#00D9FF]">
                                {engine.template?.name}
                            </span>
                        </div>
                        <div className="font-mono text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded backdrop-blur border border-gray-800">
                            STEP {engine.currentStepIndex + 1}/{engine.steps.length}
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <Canvas 
                        type={engine.template?.visualizationType || 'bars'}
                        stateSnapshot={engine.currentStep?.stateSnapshot}
                    />

                    {/* Timeline Progress */}
                    <div className="px-6 py-2">
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden cursor-pointer relative" onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            const newStep = Math.floor(pos * engine.steps.length);
                            engine.handleReset();
                            setTimeout(() => {
                                // A slight hack, properly handled in engine usually
                            }, 0);
                        }}>
                            <progress
                                className="absolute top-0 left-0 bottom-0 w-full h-full appearance-none [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-[#00D9FF] [&::-moz-progress-bar]:bg-[#00D9FF]"
                                value={engine.steps.length > 0 ? engine.currentStepIndex + 1 : 0}
                                max={Math.max(engine.steps.length, 1)}
                                aria-label="Visualization progress"
                            />
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <ControlsPanel 
                        isPlaying={engine.isPlaying}
                        speed={engine.speed}
                        onPlayPause={engine.handlePlayPause}
                        onNext={engine.handleNext}
                        onPrev={engine.handlePrev}
                        onReset={engine.handleReset}
                        onSpeedChange={engine.setSpeed}
                        isNarrationEnabled={engine.narration.isNarrationEnabled}
                        onToggleNarration={() => engine.narration.setIsNarrationEnabled(!engine.narration.isNarrationEnabled)}
                        language={engine.narration.language}
                        onLanguageChange={engine.narration.setLanguage as any}
                        supportedLanguages={engine.template?.supportedLanguages || ['en']}
                    />
                </div>
                
            </div>
        </div>
    );
}
