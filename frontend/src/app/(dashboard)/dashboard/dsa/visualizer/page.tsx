'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Code2, Sparkles, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useVisualizerEngine } from '@/hooks/useVisualizerEngine';
import { TEMPLATES_BY_CATEGORY } from '@/lib/visualizer/templates';

import { CodePanel } from '@/components/visualizer/panels/CodePanel';
import { ExplanationPanel } from '@/components/visualizer/panels/ExplanationPanel';
import { Canvas } from '@/components/visualizer/canvas/Canvas';
import { ControlsPanel } from '@/components/visualizer/ControlsPanel';

export default function AdvancedVisualizerPage() {
    const engine = useVisualizerEngine();
    const [inputStr, setInputStr] = useState('');
    const [targetVal, setTargetVal] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);

    const template = engine.template;
    const timeComplexity = template?.timeComplexity || 'O(n²)';
    const spaceComplexity = template?.spaceComplexity || 'O(1)';
    const description = template?.description || 'Partitions around a pivot so smaller elements move left, then recurses on each side.';

    // Initialize custom inputs with template sample input
    useEffect(() => {
        if (template) {
            const sample = template.sampleInput;
            if (Array.isArray(sample)) {
                setInputStr(sample.join(' '));
            } else if (sample && typeof sample === 'object' && Array.isArray(sample.array)) {
                setInputStr(sample.array.join(' '));
                if (sample.target !== undefined) {
                    setTargetVal(String(sample.target));
                }
            }
        }
    }, [template]);

    // Handle Visualize action
    const handleVisualize = () => {
        if (!template) return;
        
        // Parse numbers from inputStr
        const parsedArray = inputStr
            .trim()
            .split(/[\s,]+/)
            .map(Number)
            .filter(val => !isNaN(val));

        if (parsedArray.length === 0) return;

        let finalInput: any = parsedArray;
        if (template.visualizationType === 'array') {
            finalInput = {
                array: parsedArray,
                target: Number(targetVal) || 0
            };
        }
        
        engine.visualizeCustomInput(finalInput);
    };

    // Handle Random array generation
    const handleRandom = () => {
        if (!template) return;
        
        // Generate 6 to 10 random numbers
        const count = Math.floor(Math.random() * 5) + 6; 
        const randomArr = Array.from({ length: count }, () => Math.floor(Math.random() * 89) + 10);
        
        if (template.visualizationType === 'bars') {
            setInputStr(randomArr.join(' '));
            engine.visualizeCustomInput(randomArr);
        } else if (template.visualizationType === 'array') {
            const target = randomArr[Math.floor(Math.random() * randomArr.length)];
            setInputStr(randomArr.join(' '));
            setTargetVal(String(target));
            engine.visualizeCustomInput({
                array: randomArr,
                target: target
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#05070f] text-white">
            {/* Header */}
            <div className="shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#080c14] border-b border-slate-800/80 gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/dsa" className="p-2 text-gray-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 rounded-lg transition-colors border border-slate-850">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                Algorithm Visualizer <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Pro</span>
                            </h1>
                            <p className="text-xs text-gray-400">Step-by-step execution & explanation</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center bg-slate-900/80 border border-slate-800/80 rounded-lg p-1">
                        <select
                            className="bg-transparent text-sm text-gray-200 px-3 py-2 outline-none w-full md:w-64 cursor-pointer"
                            value={engine.activeTemplateId}
                            onChange={(e) => engine.setActiveTemplateId(e.target.value)}
                            title="Select algorithm template"
                            aria-label="Select algorithm template"
                        >
                            {Object.entries(TEMPLATES_BY_CATEGORY).map(([category, templates]) => (
                                <optgroup key={category} label={category} className="bg-slate-955 text-gray-400 font-bold">
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id} className="text-white font-normal bg-slate-900">
                                            {t.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    
                    {/* Toggle Sidebar Button */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 text-sm font-semibold ${showSidebar ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-900/80 border-slate-850 text-gray-400 hover:text-white'}`}
                        title={showSidebar ? "Hide Code & Explanation" : "Show Code & Explanation"}
                        aria-label={showSidebar ? "Hide Code & Explanation" : "Show Code & Explanation"}
                        type="button"
                    >
                        <Code2 className="w-5 h-5" />
                        <span className="hidden md:inline">{showSidebar ? "Hide Code" : "Show Code"}</span>
                    </button>
                </div>
            </div>

            {/* Main Workspace Split */}
            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden p-4 md:p-6 gap-6 min-h-0">
                
                {/* Left/Main Column: Visualizer Area */}
                <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${showSidebar ? 'xl:w-2/3' : 'w-full'}`}>
                    
                    {/* Algorithm Meta & Input Bar */}
                    <div className="mb-6 space-y-4">
                        {/* Title, Badge Pills, Description */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
                                    {template?.name}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                                        Time {timeComplexity}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-bold text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.05)]">
                                        Space {spaceComplexity}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm md:text-base text-slate-400 max-w-4xl leading-relaxed">
                            {description}
                        </p>

                        {/* Input Row */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-850 backdrop-blur shadow-xl">
                            <div className="flex-1 flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 select-none">
                                    Input
                                </span>
                                <input
                                    type="text"
                                    value={inputStr}
                                    onChange={(e) => setInputStr(e.target.value)}
                                    placeholder="Enter numbers separated by space (e.g. 8 3 5 1 9 2 7 4)"
                                    className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                                    title="Array input"
                                    aria-label="Array input"
                                />
                                {template?.visualizationType === 'array' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
                                            Target
                                        </span>
                                        <input
                                            type="text"
                                            value={targetVal}
                                            onChange={(e) => setTargetVal(e.target.value)}
                                            placeholder="Target"
                                            className="w-20 bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all text-center font-mono"
                                            title="Search target"
                                            aria-label="Search target"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleVisualize}
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transform active:scale-95 text-sm"
                                >
                                    Visualize
                                </button>
                                <button
                                    onClick={handleRandom}
                                    className="px-4 py-2.5 bg-slate-955 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold rounded-lg border border-slate-850 hover:border-slate-800 transition-all flex items-center gap-2 transform active:scale-95 text-sm"
                                    title="Generate random array"
                                    aria-label="Generate random array"
                                    type="button"
                                >
                                    <Shuffle className="w-4 h-4" />
                                    <span>Random</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Visualization Canvas Card */}
                    <div className="flex-1 flex flex-col bg-[#070b14] border border-slate-850 rounded-2xl overflow-hidden shadow-2xl relative min-h-0 backdrop-blur-md">
                        {/* Top Step Counter */}
                        <div className="absolute top-4 right-4 z-20 font-mono text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800 shadow-md">
                            STEP {engine.steps.length > 0 ? engine.currentStepIndex + 1 : 0} / {engine.steps.length}
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 flex flex-col justify-center min-h-0">
                            <Canvas 
                                type={template?.visualizationType || 'bars'}
                                stateSnapshot={engine.currentStep?.stateSnapshot}
                            />
                        </div>

                        {/* Status/Explanation Capsule */}
                        <div className="p-4 bg-gradient-to-t from-[#070b14] to-transparent">
                            <div className="w-[90%] max-w-[650px] mx-auto bg-slate-955/95 border border-slate-850 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-md flex items-center justify-center gap-3">
                                {engine.steps.length > 0 && engine.currentStepIndex === engine.steps.length - 1 ? (
                                    <div className="text-center font-bold text-emerald-400 text-sm md:text-base flex items-center gap-2 animate-bounce">
                                        ✨ Array is fully sorted! 🎉
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-200 text-sm md:text-base font-medium flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                                        <span>{engine.currentStep?.title || "Click Visualize to start"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Custom Purple Timeline Slider */}
                    <div className="mt-4 px-2 py-1 bg-slate-950/40 border border-slate-900/40 rounded-xl backdrop-blur">
                        <div className="w-full flex items-center gap-4 px-3 py-2 select-none">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Start</span>
                            <input
                                type="range"
                                min="0"
                                max={Math.max(engine.steps.length - 1, 0)}
                                value={engine.currentStepIndex}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    engine.setCurrentStepIndex(val);
                                    engine.setIsPlaying(false);
                                }}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
                                style={{
                                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${engine.steps.length > 1 ? (engine.currentStepIndex / (engine.steps.length - 1)) * 100 : 0}%, #1e293b ${engine.steps.length > 1 ? (engine.currentStepIndex / (engine.steps.length - 1)) * 100 : 0}%, #1e293b 100%)`
                                }}
                                title="Visualizer Timeline"
                                aria-label="Visualizer Timeline"
                            />
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">End</span>
                        </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="mt-4 bg-[#080c14]/85 border border-slate-850 rounded-xl overflow-hidden shadow-lg">
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
                            supportedLanguages={template?.supportedLanguages || ['en']}
                        />
                    </div>

                </div>

                {/* Right Column: Code & Explanations Panel */}
                {showSidebar && (
                    <div className="w-full xl:w-1/3 flex flex-col gap-4 min-h-0 shrink-0">
                        <div className="flex-1 min-h-[300px] xl:min-h-0">
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
                )}

            </div>
        </div>
    );
}
