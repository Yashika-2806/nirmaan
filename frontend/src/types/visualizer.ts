export interface VisualizerStep {
    stepIndex: number;
    activeLines: number[];       // which lines to highlight (1-indexed)
    title: string;
    description: string;
    stateSnapshot: any;          // Custom state representation depending on algo
    audioText: {
        en: string;
        hi: string;
        hinglish: string;
    };
}

export type VisualizationType = 'bars' | 'array' | 'graph' | 'tree' | 'grid' | 'board' | 'pointers' | 'table';

export interface AlgorithmTemplate {
    id: string;
    name: string;
    category: string;
    starterCode: string;
    sampleInput: any;
    visualizationType: VisualizationType;
    generateSteps: (input: any) => VisualizerStep[];
    supportedLanguages: string[];
}
