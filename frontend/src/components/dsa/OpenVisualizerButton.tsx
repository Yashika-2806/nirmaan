'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface OpenVisualizerButtonProps {
  variant?: 'card' | 'button';
  size?: 'small' | 'medium' | 'large';
}

export function OpenVisualizerButton({
  variant = 'card',
  size = 'medium',
}: OpenVisualizerButtonProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push('/dashboard/dsa/visualizer');
  };

  if (variant === 'card') {
    return (
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group w-full relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary-600/20 via-slate-800/50 to-slate-900/80 p-8 transition-all shadow-xl hover:shadow-2xl hover:shadow-primary-500/30"
        style={{
          borderColor: isHovered ? 'rgba(var(--color-primary-500), 0.6)' : 'rgba(51, 65, 85, 0.5)',
        }}
        whileHover={{ y: -4 }}
      >
        {/* Premium gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-blue-600/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent" />
        </motion.div>

        {/* Animated glow elements */}
        <motion.div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary-500/40 blur-3xl"
          animate={isHovered ? { scale: 1.2, opacity: 0.3 } : { scale: 1, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="text-left">
            <motion.div
              className="flex items-center gap-2.5 mb-2"
              animate={isHovered ? { x: 2 } : { x: 0 }}
            >
              <motion.div
                animate={isHovered ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring' }}
              >
                <Sparkles className="w-5 h-5 text-primary-400" />
              </motion.div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
                Advanced Algo Visualizer
              </h3>
            </motion.div>
            <motion.p
              className="text-sm text-gray-300"
              animate={isHovered ? { x: 4 } : { x: 0 }}
            >
              AI-powered step-by-step learning with voice narration
            </motion.p>
          </div>
          <motion.div
            animate={isHovered ? { x: 6, y: -6 } : { x: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <ArrowUpRight className="w-7 h-7 text-primary-400 flex-shrink-0 ml-4" />
          </motion.div>
        </div>

        {/* Premium border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
          style={{
            boxShadow: 'inset 0 0 20px rgba(var(--color-primary-500), 0.3)',
          }}
        />
      </motion.button>
    );
  }

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  }[size];

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`btn-primary flex items-center gap-2 relative overflow-hidden rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 transition-all shadow-lg hover:shadow-xl hover:shadow-primary-500/50 ${sizeClasses}`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-500/50 to-blue-600/50 opacity-0"
        animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.span
        animate={isHovered ? { x: 2 } : { x: 0 }}
        className="relative z-10"
      >
        Launch Advanced Visualizer
      </motion.span>
      <motion.div
        animate={isHovered ? { x: 4, rotate: 45 } : { x: 0, rotate: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
      >
        <ArrowUpRight className="w-4 h-4" />
      </motion.div>
    </motion.button>
  );
}
