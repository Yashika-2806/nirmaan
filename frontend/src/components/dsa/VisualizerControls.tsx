'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VisualizerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  onSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  onMuteToggle: () => void;
  currentSpeed: 'slow' | 'normal' | 'fast';
  isMuted: boolean;
  canPlayNext: boolean;
  canPlayPrevious: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export function VisualizerControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onReset,
  onSpeedChange,
  onMuteToggle,
  currentSpeed,
  isMuted,
  canPlayNext,
  canPlayPrevious,
  currentStep,
  totalSteps,
}: VisualizerControlsProps) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Main Controls */}
      <motion.div
        className="flex flex-wrap gap-2 justify-center bg-gradient-to-r from-slate-800/40 to-slate-800/20 p-4 rounded-xl border border-slate-700/50"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {/* Reset Button */}
        <motion.button
          onClick={onReset}
          className="btn-secondary p-3 rounded-lg inline-flex items-center gap-2 bg-slate-700/60 hover:bg-slate-600 transition-all border border-slate-600/50"
          title="Reset to beginning"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, delay: 0.1 } as any}
          >
            <RotateCcw className="w-5 h-5" />
          </motion.div>
          <span className="hidden sm:inline text-sm font-medium">Reset</span>
        </motion.button>

        {/* Previous Button */}
        <motion.button
          onClick={onPrevious}
          disabled={!canPlayPrevious}
          className="btn-secondary p-3 rounded-lg inline-flex items-center gap-2 bg-slate-700/60 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-600/50"
          title="Previous step"
          whileHover={canPlayPrevious ? { scale: 1.08, x: -2 } : {}}
          whileTap={canPlayPrevious ? { scale: 0.95 } : {}}
        >
          <SkipBack className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Previous</span>
        </motion.button>

        {/* Play/Pause Button - Premium */}
        <motion.button
          onClick={onPlayPause}
          className="btn-primary px-8 p-3 rounded-lg inline-flex items-center gap-2 relative overflow-hidden shadow-lg"
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary-600/50 to-primary-700/50 opacity-0"
            animate={isPlaying ? { opacity: [0, 1] } : { opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.div
            animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity } as any}
            className="relative z-10"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </motion.div>
          <span className="relative z-10 font-semibold">
            {isPlaying ? 'Pause' : 'Play'}
          </span>
        </motion.button>

        {/* Next Button */}
        <motion.button
          onClick={onNext}
          disabled={!canPlayNext}
          className="btn-secondary p-3 rounded-lg inline-flex items-center gap-2 bg-slate-700/60 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-slate-600/50"
          title="Next step"
          whileHover={canPlayNext ? { scale: 1.08, x: 2 } : {}}
          whileTap={canPlayNext ? { scale: 0.95 } : {}}
        >
          <SkipForward className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Next</span>
        </motion.button>

        {/* Mute Button */}
        <motion.button
          onClick={onMuteToggle}
          className="btn-secondary p-3 rounded-lg inline-flex items-center gap-2 bg-slate-700/60 hover:bg-slate-600 transition-all border border-slate-600/50"
          title={isMuted ? 'Unmute narration' : 'Mute narration'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ scale: isMuted ? 0.8 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Speed Control */}
      <motion.div
        className="flex justify-center gap-2 flex-wrap bg-gradient-to-r from-slate-800/40 to-slate-800/20 p-4 rounded-xl border border-slate-700/50"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <motion.span className="text-sm text-gray-300 flex items-center font-semibold">
          <Zap className="w-4 h-4 mr-2 text-yellow-400" />
          Speed:
        </motion.span>
        {(['slow', 'normal', 'fast'] as const).map((speed) => (
          <motion.button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
              currentSpeed === speed
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                : 'bg-slate-700/60 text-gray-300 border-slate-600/50 hover:bg-slate-600'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            {speed === 'slow' ? '0.5x' : speed === 'normal' ? '1x' : '2x'}
          </motion.button>
        ))}
      </motion.div>

      {/* Progress */}
      {currentStep !== undefined && totalSteps !== undefined && (
        <motion.div
          className="text-center bg-gradient-to-r from-slate-800/40 to-slate-800/20 p-4 rounded-xl border border-slate-700/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div className="text-sm text-gray-300 mb-3 font-semibold">
            Step <span className="text-primary-400">{currentStep + 1}</span> of{' '}
            <span className="text-primary-400">{totalSteps}</span>
          </motion.div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600/50 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: totalSteps > 0 ? `${((currentStep + 1) / totalSteps) * 100}%` : '0%',
              }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
