'use client';

import React from 'react';
import { AlgorithmTemplate, AlgorithmCategory } from '@/types/dsa-visualizer';
import { ChevronDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface TemplateSelectorProps {
  templates: AlgorithmTemplate[];
  selectedTemplate: AlgorithmTemplate | null;
  onSelect: (template: AlgorithmTemplate) => void;
  currentCategory?: AlgorithmCategory;
  onCategoryChange?: (category: AlgorithmCategory) => void;
}

const CATEGORIES: { label: string; value: AlgorithmCategory }[] = [
  { label: 'Arrays & Basics', value: 'arrays' },
  { label: 'Sorting', value: 'sorting' },
  { label: 'Two Pointers', value: 'two-pointers' },
  { label: 'Stack / Queue', value: 'stack-queue' },
  { label: 'Linked List', value: 'linked-list' },
  { label: 'Trees', value: 'trees' },
  { label: 'Graphs', value: 'graphs' },
  { label: 'Dynamic Programming', value: 'dynamic-programming' },
];

export function TemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
  currentCategory = 'arrays',
  onCategoryChange,
}: TemplateSelectorProps) {
  const filteredTemplates = templates.filter((t) => t.category === currentCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-400/15 border-green-400/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/15 border-yellow-400/30';
      case 'hard':
        return 'text-red-400 bg-red-400/15 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/15 border-gray-400/30';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Category</label>
        <motion.div
          className="grid grid-cols-2 gap-2 md:grid-cols-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.value}
              onClick={() => onCategoryChange?.(cat.value)}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border-2 ${
                currentCategory === cat.value
                  ? 'bg-gradient-to-r from-primary-600/80 to-primary-700 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                  : 'bg-slate-800/60 text-gray-300 border-slate-700 hover:border-slate-600 hover:bg-slate-700/60'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Template Selection */}
      <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Algorithm</label>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  variants={itemVariants}
                  onClick={() => onSelect(template)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-gradient-to-br from-primary-600/20 to-primary-600/10 border-primary-600 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-gradient-to-br from-slate-800/40 to-slate-800/20 border-slate-700 text-gray-300 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <motion.h4
                        className="font-semibold text-white"
                        animate={selectedTemplate?.id === template.id ? { x: 0 } : { x: 0 }}
                      >
                        {template.name}
                      </motion.h4>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{template.description}</p>
                    </div>
                    <motion.span
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg ml-2 whitespace-nowrap border ${getDifficultyColor(template.difficulty)}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                    </motion.span>
                  </div>
                </motion.button>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-400"
              >
                <p>No templates in this category yet.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Template Info */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border-2 border-slate-700 p-5 rounded-xl space-y-3 shadow-lg shadow-slate-900/50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-primary-400" />
            <h4 className="font-bold text-white text-lg">{selectedTemplate.name}</h4>
          </motion.div>

          <motion.div
            className="text-xs space-y-2.5 text-gray-300"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p variants={itemVariants} className="flex justify-between">
              <span className="text-gray-500 font-semibold">Time Complexity:</span>
              <span className="text-cyan-300 font-mono font-bold">{selectedTemplate.timeComplexity}</span>
            </motion.p>
            <motion.p variants={itemVariants} className="flex justify-between">
              <span className="text-gray-500 font-semibold">Space Complexity:</span>
              <span className="text-cyan-300 font-mono font-bold">{selectedTemplate.spaceComplexity}</span>
            </motion.p>
            <motion.p variants={itemVariants} className="flex flex-col gap-1">
              <span className="text-gray-500 font-semibold">Use Case:</span>
              <span className="text-gray-300">{selectedTemplate.useCase}</span>
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
