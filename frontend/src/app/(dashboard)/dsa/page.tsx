'use client';

import React, { useState, useMemo } from 'react';
import {
  Brain,
  Filter,
  Search,
  TrendingUp,
  CheckCircle,
  Zap,
  BookOpen,
  Target,
  BarChart3,
  Clock,
} from 'lucide-react';
import { OpenVisualizerButton } from '@/components/dsa/OpenVisualizerButton';
import { ProblemListItem } from '@/components/dsa/ProblemListItem';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

// Mock data for DSA sheet
const NEETCODE_PROBLEMS = [
  {
    category: 'Arrays & Hashing',
    problems: [
      {
        name: 'Contains Duplicate',
        difficulty: 'Easy' as const,
        solved: false,
        attempted: true,
        acceptance: 61,
      },
      {
        name: 'Valid Anagram',
        difficulty: 'Easy' as const,
        solved: true,
        attempted: true,
        acceptance: 75,
      },
      {
        name: 'Two Sum',
        difficulty: 'Easy' as const,
        solved: true,
        attempted: true,
        acceptance: 55,
      },
      {
        name: 'Group Anagrams',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: true,
        acceptance: 63,
      },
      {
        name: 'Top K Frequent Elements',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: false,
        acceptance: 60,
      },
      {
        name: 'Product of Array Except Self',
        difficulty: 'Medium' as const,
        solved: true,
        attempted: true,
        acceptance: 68,
      },
      {
        name: 'Longest Consecutive Sequence',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: false,
        acceptance: 51,
      },
    ],
  },
  {
    category: 'Two Pointers',
    problems: [
      {
        name: 'Valid Palindrome',
        difficulty: 'Easy' as const,
        solved: true,
        attempted: true,
        acceptance: 47,
      },
      {
        name: 'Two Sum II - Input Array Is Sorted',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: false,
        acceptance: 62,
      },
      {
        name: 'Container With Most Water',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: true,
        acceptance: 53,
      },
      {
        name: 'Trapping Rain Water',
        difficulty: 'Hard' as const,
        solved: false,
        attempted: false,
        acceptance: 57,
      },
    ],
  },
  {
    category: 'Stack',
    problems: [
      {
        name: 'Valid Parentheses',
        difficulty: 'Easy' as const,
        solved: true,
        attempted: true,
        acceptance: 41,
      },
      {
        name: 'Evaluate Reverse Polish Notation',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: false,
        acceptance: 38,
      },
      {
        name: 'Generate Parentheses',
        difficulty: 'Medium' as const,
        solved: false,
        attempted: true,
        acceptance: 71,
      },
    ],
  },
];

export default function DSAPage() {
  const [selectedSheet, setSelectedSheet] = useState('NeetCode 150');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProblem, setSelectedProblem] = useState<any>(null);


  // Calculate stats
  const allProblems = NEETCODE_PROBLEMS.flatMap((cat) =>
    cat.problems.map((p) => ({ ...p, category: cat.category }))
  );

  const solvedCount = useMemo(() => allProblems.filter((p) => p.solved).length, []);
  const attemptedCount = useMemo(() => allProblems.filter((p) => p.attempted).length, []);
  const totalCount = allProblems.length;

  // Filter problems
  const filteredProblems = useMemo(() => {
    return NEETCODE_PROBLEMS.map((cat) => ({
      ...cat,
      problems: cat.problems.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty =
          selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
        const matchesCategory =
          selectedCategory === 'all' || cat.category === selectedCategory;

        return matchesSearch && matchesDifficulty && matchesCategory;
      }),
    })).filter((cat) => cat.problems.length > 0);
  }, [searchQuery, selectedDifficulty, selectedCategory]);

  const categories = useMemo(
    () => Array.from(new Set(NEETCODE_PROBLEMS.map((c) => c.category))),
    []
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-primary-600 to-blue-600" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary-600/20 text-primary-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">DSA Practice Hub</h1>
              <p className="text-gray-400 mt-1">Master Data Structures & Algorithms with curated problems</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Problems Solved</p>
              <p className="text-3xl font-bold text-white mt-2">{solvedCount}</p>
              <p className="text-xs text-gray-500 mt-1">{Math.round((solvedCount / totalCount) * 100)}% progress</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500/30" />
          </div>
        </div>

        <div className="card border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Attempted</p>
              <p className="text-3xl font-bold text-white mt-2">{attemptedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Active learning</p>
            </div>
            <Zap className="w-12 h-12 text-blue-500/30" />
          </div>
        </div>

        <div className="card border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Easy</p>
              <p className="text-3xl font-bold text-white mt-2">
                {allProblems.filter((p) => p.difficulty === 'Easy').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Foundation</p>
            </div>
            <Target className="w-12 h-12 text-cyan-500/30" />
          </div>
        </div>

        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Hard</p>
              <p className="text-3xl font-bold text-white mt-2">
                {allProblems.filter((p) => p.difficulty === 'Hard').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Challenge</p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-500/30" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Sheet Selector */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              DSA Sheet
            </h3>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="input w-full"
            >
              <option value="NeetCode 150">NeetCode 150</option>
              <option value="LeetCode Top 100">LeetCode Top 100</option>
              <option value="Blind 75">Blind 75</option>
            </select>
          </div>

          {/* Search */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </h3>
            <input
              type="text"
              placeholder="Find a problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Difficulty
            </h3>
            <div className="space-y-2">
              {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <label
                  key={diff}
                  className="flex items-center gap-3 text-sm cursor-pointer text-gray-400 hover:text-white transition-colors"
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={diff}
                    checked={selectedDifficulty === diff}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span>{diff === 'all' ? 'All Levels' : diff}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Category
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <label className="flex items-center gap-3 text-sm cursor-pointer text-gray-400 hover:text-white transition-colors">
                <input
                  type="radio"
                  name="category"
                  value="all"
                  checked={selectedCategory === 'all'}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-4 h-4"
                />
                <span>All Categories</span>
              </label>
              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 text-sm cursor-pointer text-gray-400 hover:text-white transition-colors"
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={selectedCategory === cat}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="lg:col-span-3 space-y-6">
          {filteredProblems.length > 0 ? (
            filteredProblems.map((categoryGroup) => (
              <div key={categoryGroup.category} className="space-y-3">
                <h2 className="text-xl font-bold text-white">{categoryGroup.category}</h2>
                <div className="space-y-2">
                  {categoryGroup.problems.map((problem, idx) => (
                    <ProblemListItem
                      key={`${categoryGroup.category}-${idx}`}
                      problem={problem}
                      isSelected={selectedProblem?.name === problem.name}
                      onSelect={setSelectedProblem}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No problems found</p>
              <p className="text-gray-600 text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Visualizer CTA */}
      <div className="mt-12 pt-12 border-t border-slate-700">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Master Algorithms?</h2>
            <p className="text-gray-400">
              Use our AI-powered visualizer to understand complex algorithms step by step with interactive animations and voice narration.
            </p>
          </div>
          <OpenVisualizerButton variant="card" />
        </div>
      </div>
    </div>
  );
}

