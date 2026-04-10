'use client';

import React from 'react';
import { Lock, BarChart3 } from 'lucide-react';

interface ProblemListItemProps {
  problem: {
    name: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category?: string;
    solved?: boolean;
    attempted?: boolean;
    likeCount?: number;
    acceptance?: number;
  };
  isSelected?: boolean;
  onSelect?: (problem: any) => void;
}

export function ProblemListItem({
  problem,
  isSelected,
  onSelect,
}: ProblemListItemProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400 bg-green-400/10';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Hard':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <button
      onClick={() => onSelect?.(problem)}
      className={`w-full text-left p-4 rounded-lg border transition-all group ${
        isSelected
          ? 'bg-primary-600/20 border-primary-600 '
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
            {problem.solved && <span className="text-green-500 mr-2">✓</span>}
            {problem.name}
          </h4>
          {problem.category && (
            <p className="text-xs text-gray-500 mt-1">{problem.category}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty.charAt(0).toUpperCase()}
          </span>
          {problem.solved && (
            <Lock className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {problem.acceptance !== undefined && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <BarChart3 className="w-3 h-3" />
          <span>{problem.acceptance}% acceptance</span>
        </div>
      )}
    </button>
  );
}
