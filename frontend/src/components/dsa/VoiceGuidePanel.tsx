'use client';

import React from 'react';
import { ExecutionStep } from '@/types/dsa-visualizer';
import { Volume2, VolumeX, Zap, Variable } from 'lucide-react';

interface VoiceGuidePanelProps {
  currentStep: ExecutionStep | null;
  narrationLanguage: 'english' | 'hindi' | 'hinglish';
  onLanguageChange: (lang: 'english' | 'hindi' | 'hinglish') => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  isNarrating?: boolean;
}

export function VoiceGuidePanel({
  currentStep,
  narrationLanguage,
  onLanguageChange,
  isMuted,
  onMuteToggle,
  isNarrating = false,
}: VoiceGuidePanelProps) {
  const getNarrationText = () => {
    if (!currentStep) return 'Select an algorithm and click Play to begin.';
    return currentStep.narration[narrationLanguage];
  };

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300">Narration Language</label>
        <div className="grid grid-cols-3 gap-2">
          {(['english', 'hindi', 'hinglish'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                narrationLanguage === lang
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {lang === 'english' ? '🇬🇧 English' : lang === 'hindi' ? '🇮🇳 Hindi' : '🇮🇳 Hinglish'}
            </button>
          ))}
        </div>
      </div>

      {/* Narration Display */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isNarrating ? 'text-yellow-500 animate-pulse' : 'text-gray-500'}`} />
            Current Step
          </h3>
          <button
            onClick={onMuteToggle}
            className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-gray-300 text-sm leading-relaxed min-h-20">
          {getNarrationText()}
        </div>

        {currentStep && (
          <div className="text-xs text-gray-500 pt-2 border-t border-slate-700">
            <span className="font-mono">Line {currentStep.lineNumber}</span> • {currentStep.action}
          </div>
        )}
      </div>

      {/* Variable State Panel */}
      {currentStep && Object.keys(currentStep.variables).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Variable className="w-4 h-4" />
            Variable State
          </h3>

          <div className="space-y-2">
            {Object.entries(currentStep.variables).map(([name, value]) => (
              <div
                key={name}
                className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded text-sm"
              >
                <span className="text-cyan-400 font-mono">{name}</span>
                <span className="text-white font-semibold">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
