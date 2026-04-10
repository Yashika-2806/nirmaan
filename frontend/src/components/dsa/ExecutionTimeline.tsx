'use client';

import React from 'react';
import { ExecutionStep } from '@/types/dsa-visualizer';
import { ChevronRight } from 'lucide-react';

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
}

export function ExecutionTimeline({
  steps,
  currentStepIndex,
  onStepClick,
}: ExecutionTimelineProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-300">Execution Timeline</h3>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {steps.map((step, index) => (
          <button
            key={`step-${index}`}
            onClick={() => onStepClick(index)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              currentStepIndex === index
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            {currentStepIndex === index && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-shrink-0 text-xs font-mono text-gray-500">#{index + 1}</span>
            <span className="truncate flex-1">{step.action}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
