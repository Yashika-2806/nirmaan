'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    ChevronRight,
    Menu,
    Code,
    Layout,
    Settings,
    Maximize2
} from 'lucide-react';

// Basic templates
const TEMPLATES = {
    'bfs': `// Breadth First Search Visualization
function bfs(graph, start) {
  const queue = [start];
  const visited = new Set();
  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift();
    visualize(node); // Internal hook

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,
    'dfs': `// Depth First Search Visualization
function dfs(graph, start, visited = new Set()) {
  visualize(start); // Internal hook
  visited.add(start);

  for (const neighbor of graph[start]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
}`,
    'bubble_sort': `// Bubble Sort Visualization
async function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      highlight(j, j + 1); // Internal hook
      if (arr[j] > arr[j + 1]) {
        swap(arr, j, j + 1); // Internal hook
      }
      unhighlight(j, j + 1); // Internal hook
    }
  }
}`
};

export default function VisualizerPage() {
    const [code, setCode] = useState(TEMPLATES['bfs']);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeed] = useState(1); // 0.5x to 2x
    const [activeTemplate, setActiveTemplate] = useState('bfs');
    const [logs, setLogs] = useState<string[]>([]);

    // Mock visualization state
    const [grid, setGrid] = useState<number[][]>([]);
    const [visitedNodes, setVisitedNodes] = useState<number[]>([]);

    useEffect(() => {
        // Initialize grid or graph for visualization
        const initialGrid = Array(10).fill(0).map(() => Array(10).fill(0));
        setGrid(initialGrid);
    }, []);

    const handleRun = () => {
        setIsPlaying(true);
        setLogs(prev => [...prev, `> Starting execution of ${activeTemplate}...`]);
        // Mock execution loop
        let step = 0;
        const interval = setInterval(() => {
            if (step > 20) {
                clearInterval(interval);
                setIsPlaying(false);
                setLogs(prev => [...prev, `> Execution finished.`]);
                return;
            }
            setCurrentStep(step);
            // Simulate visiting nodes
            setVisitedNodes(prev => [...prev, Math.floor(Math.random() * 100)]);
            step++;
        }, 1000 / speed);
    };

    const loadTemplate = (template: string) => {
        setActiveTemplate(template);
        // @ts-ignore
        setCode(TEMPLATES[template]);
        setLogs(prev => [...prev, `> Loaded template: ${template}`]);
        setVisitedNodes([]);
        setCurrentStep(0);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-[#0a0a0a] text-white overflow-hidden rounded-xl border border-gray-800">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111111]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-[#00D9FF]" />
                        <span className="font-bold text-lg">Algorithm Visualizer</span>
                    </div>

                    <div className="h-6 w-px bg-gray-700 mx-2"></div>

                    <select
                        className="bg-[#1a1a1a] border border-gray-700 text-sm rounded px-3 py-1.5 focus:border-[#00D9FF] outline-none"
                        value={activeTemplate}
                        onChange={(e) => loadTemplate(e.target.value)}
                    >
                        <option value="bfs">Breadth First Search (BFS)</option>
                        <option value="dfs">Depth First Search (DFS)</option>
                        <option value="bubble_sort">Bubble Sort</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setVisitedNodes([])}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Reset"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={isPlaying}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPlaying
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-[#00D9FF] text-black hover:bg-[#00D9FF]/90'
                            }`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        {isPlaying ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Section */}
                <div className="w-1/2 border-r border-gray-800 flex flex-col bg-[#0f0f0f]">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#151515] border-b border-gray-800">
                        <span className="text-xs font-mono text-gray-500">script.js</span>
                    </div>
                    <textarea
                        className="flex-1 w-full bg-[#0a0a0a] text-gray-300 font-mono p-4 text-sm outline-none resize-none"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck="false"
                    />
                    {/* Console/Logs */}
                    <div className="h-32 border-t border-gray-800 bg-[#111111] overflow-y-auto font-mono text-xs p-2">
                        <div className="text-gray-500 mb-1">Console Output:</div>
                        {logs.map((log, i) => (
                            <div key={i} className="text-[#00D9FF]">{log}</div>
                        ))}
                    </div>
                </div>

                {/* Visualization Section */}
                <div className="w-1/2 bg-[#0a0a0a] relative flex flex-col">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <div className="bg-[#111111]/80 backdrop-blur px-3 py-1 rounded text-xs text-gray-400 border border-gray-800">
                            Step: <span className="text-[#00D9FF] font-bold">{currentStep}</span>
                        </div>
                    </div>

                    {/* Canvas/Grid Area */}
                    <div className="flex-1 flex items-center justify-center p-8">
                        {activeTemplate.includes('sort') ? (
                            <div className="flex items-end gap-1 h-64 w-full">
                                {[40, 70, 20, 90, 30, 60, 10, 50, 80, 25, 65, 35].map((h, i) => (
                                    <div
                                        key={i}
                                        style={{ height: `${h}%` }}
                                        className={`flex-1 rounded-t-sm transition-all duration-300 ${visitedNodes.includes(i) ? 'bg-[#00D9FF]' : 'bg-gray-700'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-10 gap-1">
                                {Array.from({ length: 100 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded-sm transition-all duration-500 ${visitedNodes.includes(i)
                                                ? 'bg-[#00D9FF] scale-90 shadow-[0_0_10px_#00D9FF]'
                                                : 'bg-gray-800 hover:bg-gray-700'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Controls Footer */}
                    <div className="p-4 border-t border-gray-800 bg-[#111111] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">Speed:</span>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={speed}
                                onChange={(e) => setSpeed(parseInt(e.target.value))}
                                className="w-24 accent-[#00D9FF]"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#00D9FF] rounded-sm"></div>
                                <span>Active</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
                                <span>Pending</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
