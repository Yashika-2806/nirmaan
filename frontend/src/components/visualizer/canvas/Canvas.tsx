import { VisualizationType } from '@/types/visualizer';

interface CanvasProps {
    type: VisualizationType;
    stateSnapshot: any;
}

export function Canvas({ type, stateSnapshot }: CanvasProps) {
    if (!stateSnapshot) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Ready to visualize...
            </div>
        );
    }

    if (type === 'bars' && stateSnapshot.array) {
        const arr = stateSnapshot.array as number[];
        const maxVal = Math.max(...arr, 1);
        const { compared = [], swapped = [], sorted = [] } = stateSnapshot;

        return (
            <div className="flex-1 flex items-end justify-center gap-1 w-full px-8 pb-8 h-full min-h-[300px]">
                {arr.map((val, i) => {
                    const height = (val / maxVal) * 100;
                    let bgColor = 'bg-gray-700'; // default
                    
                    if (sorted.includes(i)) bgColor = 'bg-green-500 shadow-[0_0_10px_-2px_#22c55e]';
                    else if (swapped.includes(i)) bgColor = 'bg-red-500 shadow-[0_0_10px_-2px_#ef4444]';
                    else if (compared.includes(i)) bgColor = 'bg-yellow-500 shadow-[0_0_10px_-2px_#eab308]';
                    else bgColor = 'bg-gradient-to-t from-[#00D9FF] to-cyan-300 shadow-[0_0_10px_-2px_#00D9FF]';

                    return (
                        <div key={i} className="flex flex-col items-center gap-2 group flex-1 h-full justify-end">
                            <div className="text-xs text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{val}</div>
                            <div
                                style={{ height: `${height}%` }}
                                className={`w-full rounded-t-sm transition-all duration-300 ${bgColor}`}
                            ></div>
                            <div className="text-xs text-gray-600">{i}</div>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (type === 'array' && stateSnapshot.array) {
        const arr = stateSnapshot.array as any[];
        const { currentIndex, foundIndex, notFound } = stateSnapshot;
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 h-full">
                <div className="flex flex-wrap items-center justify-center gap-2 p-4">
                    {arr.map((val, i) => {
                        let borderColor = 'border-gray-700';
                        let bgColor = 'bg-gray-900';
                        let textColor = 'text-gray-300';
                        let scale = 'scale-100';

                        if (i === foundIndex) {
                            borderColor = 'border-green-500';
                            bgColor = 'bg-green-500/20';
                            textColor = 'text-green-400 font-bold';
                            scale = 'scale-110 shadow-[0_0_15px_#22c55e]';
                        } else if (i === currentIndex) {
                            borderColor = 'border-yellow-500';
                            bgColor = 'bg-yellow-500/20';
                            textColor = 'text-yellow-400';
                            scale = 'scale-105 shadow-[0_0_10px_#eab308]';
                        } else if (notFound) {
                            borderColor = 'border-red-500/30';
                            textColor = 'text-red-500/50';
                        }

                        return (
                            <div key={i} className={`flex flex-col items-center gap-2 transition-all duration-300 ${scale}`}>
                                <div className={`w-14 h-14 flex items-center justify-center border-2 rounded-lg text-lg ${borderColor} ${bgColor} ${textColor}`}>
                                    {val}
                                </div>
                                <span className="text-xs text-gray-600">{i}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (type === 'graph' && stateSnapshot.nodes) {
        const { nodes, edges, visited = [], currentNode, queue = [] } = stateSnapshot;
        // Simple circular layout for nodes
        const radius = 100;
        const center = 150;
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 h-full gap-8">
               <div className="relative w-[300px] h-[300px] border border-gray-800 rounded-xl bg-gray-900/50">
                    {/* SVG for Edges */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {edges.map((edge: [string, string], i: number) => {
                            const n1Idx = nodes.indexOf(edge[0]);
                            const n2Idx = nodes.indexOf(edge[1]);
                            if (n1Idx===-1 || n2Idx===-1) return null;
                            const x1 = center + radius * Math.cos((2 * Math.PI * n1Idx) / nodes.length) - 5;
                            const y1 = center + radius * Math.sin((2 * Math.PI * n1Idx) / nodes.length) - 5;
                            const x2 = center + radius * Math.cos((2 * Math.PI * n2Idx) / nodes.length) - 5;
                            const y2 = center + radius * Math.sin((2 * Math.PI * n2Idx) / nodes.length) - 5;
                            return <line key={i} x1={x1+20} y1={y1+20} x2={x2+20} y2={y2+20} stroke="#333" strokeWidth="2" />;
                        })}
                    </svg>
                    {/* Nodes */}
                    {nodes.map((node: string, i: number) => {
                        const x = center + radius * Math.cos((2 * Math.PI * i) / nodes.length) - 20;
                        const y = center + radius * Math.sin((2 * Math.PI * i) / nodes.length) - 20;
                        const isCurrent = currentNode === node;
                        const isVisited = visited.includes(node);
                        return (
                            <div key={i} style={{ left: x, top: y }} className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 z-10 
                                ${isCurrent ? 'bg-yellow-500 text-black shadow-[0_0_15px_#eab308] scale-110' 
                                : isVisited ? 'bg-[#00D9FF] text-black shadow-[0_0_10px_#00D9FF]' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                {node}
                            </div>
                        )
                    })}
               </div>
               
               {/* Queue display for BFS */}
               {queue && (
                   <div className="flex items-center gap-2">
                       <span className="text-gray-500 text-sm font-bold">Queue:</span>
                       <div className="flex gap-1 border border-gray-700 p-1 min-w-[50px] min-h-[36px] bg-gray-900 rounded">
                           {queue.map((q: string, i: number) => (
                               <span key={i} className="px-2 py-0.5 bg-gray-800 text-[#00D9FF] rounded border border-gray-700">{q}</span>
                           ))}
                       </div>
                   </div>
               )}
            </div>
         );
    }

    if (type === 'tree' && stateSnapshot.nodes) {
        const { nodes, visited = [], currentNode } = stateSnapshot;
        // Simple hardcoded max 15 nodes binary tree layout for 4 levels
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-full">
                <div className="flex flex-col items-center gap-6">
                    {/* Render tree manually by levels assuming array representation (0: root, 1: L, 2: R etc) */}
                    {[ [0], [1, 2], [3, 4, 5, 6] ].map((levelIndices, level) => (
                        <div key={level} className="flex gap-8 justify-center w-full">
                            {levelIndices.map(idx => {
                                if (idx >= nodes.length || nodes[idx] === null) return <div key={idx} className="w-12 h-12"></div>;
                                const isCurrent = currentNode === nodes[idx];
                                const isVisited = visited.includes(nodes[idx]);
                                return (
                                    <div key={idx} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300
                                        ${isCurrent ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_15px_#eab308]' 
                                        : isVisited ? 'bg-green-500 text-black shadow-[0_0_10px_#22c55e]' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                        {nodes[idx]}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'table' && stateSnapshot.table) {
        const { table, highlights = [], currentCell } = stateSnapshot;
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 h-full">
                <div className="flex gap-1">
                    {table.map((val: any, i: number) => {
                        const isCurrent = currentCell === i;
                        const isHighlight = highlights.includes(i);
                        return (
                            <div key={i} className="flex flex-col items-center gap-1 group">
                                <div className="text-xs text-gray-500 font-mono">[{i}]</div>
                                <div className={`w-12 h-12 flex items-center justify-center text-lg font-bold border transition-all duration-300
                                    ${isCurrent ? 'bg-yellow-500 text-black border-yellow-400 scale-110 z-10 shadow-[0_0_10px_#eab308]' 
                                    : isHighlight ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]' : 'bg-gray-900 border-gray-700 text-gray-300'}`}>
                                    {val === null || val === undefined ? '' : val}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    if (type === 'board' && stateSnapshot.board) {
        const { board } = stateSnapshot; // board is a 2D array
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-full">
                <div className="flex flex-col gap-1 border-4 border-gray-800 p-1 bg-gray-900">
                    {board.map((row: any[], r: number) => (
                        <div key={r} className="flex gap-1">
                            {row.map((cell: any, c: number) => {
                                const isQueen = cell === 'Q';
                                return (
                                    <div key={`${r}-${c}`} className={`w-12 h-12 flex items-center justify-center text-2xl transition-all
                                        ${(r+c)%2 === 0 ? 'bg-gray-300' : 'bg-gray-500'} 
                                        ${isQueen ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110' : 'text-transparent'}`}>
                                        {isQueen ? '♛' : '.'}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'pointers' && stateSnapshot.nodes) {
        const { nodes, currentPtr, prevPtr, nextPtr } = stateSnapshot;
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 h-full gap-8">
                <div className="flex items-center gap-4 flex-wrap justify-center">
                    {nodes.map((val: any, i: number) => {
                        return (
                            <div key={i} className="flex items-center gap-4">
                                <div className="relative w-16 h-12 border border-[#00D9FF] bg-[#00D9FF]/10 text-[#00D9FF] flex items-center justify-center font-bold rounded shadow-[0_0_10px_rgba(0,217,255,0.2)]">
                                    {val}
                                    {currentPtr === i && <span className="absolute -top-6 text-xs text-yellow-500 font-bold bg-gray-900 px-1 rounded border border-yellow-500">curr</span>}
                                    {prevPtr === i && <span className="absolute -bottom-6 text-xs text-red-500 font-bold bg-gray-900 px-1 rounded border border-red-500">prev</span>}
                                    {nextPtr === i && <span className="absolute -top-6 text-xs text-green-500 font-bold bg-gray-900 px-1 rounded border border-green-500 translate-x-3">next</span>}
                                </div>
                                {i < nodes.length - 1 && (
                                    <div className="text-gray-500 font-bold text-xl">→</div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
            Visualization for {type} starting...
        </div>
    );
}
