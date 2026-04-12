'use client';

import React, { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';

interface ArrayVisualizationProps {
  data: number[];
  highlightedElements?: number[];
  swappedElements?: [number, number];
  sortedElements?: number[];
  comparingIndices?: number[];
  minIndex?: number;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

export function ArrayVisualization({
  data,
  highlightedElements = [],
  swappedElements,
  sortedElements = [],
  comparingIndices = [],
  minIndex,
  title = 'Array Visualization',
  size = 'large',
}: ArrayVisualizationProps) {
  const maxValue = useMemo(() => Math.max(...data, 1), [data]);

  const sizeConfig = {
    small: { barHeight: 20, barWidth: 12, gap: 2, containerHeight: 200 },
    medium: { barHeight: 30, barWidth: 20, gap: 4, containerHeight: 300 },
    large: { barHeight: 50, barWidth: 32, gap: 6, containerHeight: 400 },
  }[size];

  const containerHeightClass = {
    small: 'min-h-[200px]',
    medium: 'min-h-[300px]',
    large: 'min-h-[400px]',
  }[size];

  const barWidthClass = {
    small: 'w-3',
    medium: 'w-5',
    large: 'w-8',
  }[size];

  const getBarColor = (index: number, value: number) => {
    if (sortedElements.includes(index)) return 'bg-gradient-to-t from-green-600 to-green-400 shadow-lg shadow-green-500/50';
    if (minIndex === index) return 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/50';
    if (swappedElements && swappedElements.includes(index)) return 'bg-gradient-to-t from-red-600 to-red-400 shadow-lg shadow-red-500/50';
    if (comparingIndices.includes(index)) return 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-lg shadow-blue-500/50';
    if (highlightedElements.includes(index)) return 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/50';
    return 'bg-gradient-to-t from-slate-700 to-slate-600 hover:shadow-md hover:shadow-slate-500/30';
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0.1,
      },
    },
  };

  const barVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {title && (
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white"
        >
          {title}
        </motion.h3>
      )}

      <div className={`flex items-flex-end gap-1.5 justify-center p-8 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/50 shadow-2xl ${containerHeightClass}`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-flex-end gap-1.5 w-full justify-center"
        >
          {data.map((value, index) => (
            <motion.div
              key={`${index}-${value}`}
              layout
              variants={barVariants}
              animate={{
                height: `${(value / maxValue) * sizeConfig.containerHeight}px`,
              }}
              transition={{ 
                layout: { type: 'spring', stiffness: 100, damping: 20 },
                height: { type: 'spring', stiffness: 100, damping: 20 },
              }}
              className={`rounded-t-lg transition-all cursor-pointer min-h-1 ${barWidthClass} ${getBarColor(index, value)}`}
              title={`Index ${index}: ${value}`}
              whileHover={{ y: -4 }}
            >
              {size === 'large' && (
                <span className="text-white text-xs block text-center mt-1 font-bold">
                  {value}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-4 text-xs text-gray-400 bg-slate-900/50 p-4 rounded-lg border border-slate-700/30"
      >
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-sm bg-gradient-to-b from-slate-600 to-slate-700" />
          <span>Default</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-sm bg-gradient-to-b from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/50" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-sm bg-gradient-to-b from-blue-600 to-blue-400 shadow-lg shadow-blue-500/50" />
          <span>Comparing</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-sm bg-gradient-to-b from-red-600 to-red-400 shadow-lg shadow-red-500/50" />
          <span>Swapping</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-sm bg-gradient-to-b from-amber-600 to-amber-400 shadow-lg shadow-amber-500/50" />
          <span>Minimum</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div className="w-3 h-3 rounded-sm bg-gradient-to-b from-green-600 to-green-400 shadow-lg shadow-green-500/50" />
          <span>Sorted</span>
        </div>
      </motion.div>
    </div>
  );
}
