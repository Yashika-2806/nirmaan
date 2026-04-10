'use client';

import React, { useEffect } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CodeDisplayProps {
  code: string;
  language: string;
  highlightedLineNumber?: number;
  title?: string;
  onCopy?: () => void;
}

export function CodeDisplay({
  code,
  language,
  highlightedLineNumber,
  title = 'Code',
  onCopy,
}: CodeDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const lines = code.split('\n');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          {title}
        </h3>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-100">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`transition-colors ${
                highlightedLineNumber === index + 1
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <span className="text-gray-600 mr-4">{String(index + 1).padStart(3)}</span>
              {line}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
