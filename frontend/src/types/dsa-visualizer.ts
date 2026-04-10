// Type definitions for DSA Visualizer

export type AlgorithmCategory = 
  | 'arrays'
  | 'sorting'
  | 'two-pointers'
  | 'stack-queue'
  | 'linked-list'
  | 'trees'
  | 'graphs'
  | 'dynamic-programming';

export type VisualizationType = 'array' | 'linked-list' | 'tree' | 'graph' | 'custom';
export type NarrationLanguage = 'english' | 'hindi' | 'hinglish';
export type CodeLanguage = 'python' | 'javascript' | 'cpp' | 'java';

export interface ExecutionStep {
  stepIndex: number;
  lineNumber: number;
  action: string; // Human-readable action
  narration: {
    english: string;
    hindi: string;
    hinglish: string;
  };
  visualization: VisualizationState;
  variables: Record<string, any>;
  highlightedElements?: number[]; // For array indices being compared
  swappedElements?: [number, number]; // For swap operations
}

export interface VisualizationState {
  type: VisualizationType;
  data: any; // Array of numbers, linked list nodes, tree nodes, etc.
  state: Record<string, any>; // Current pointers/indices
}

export interface AlgorithmTemplate {
  id: string;
  name: string;
  category: AlgorithmCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  codeLanguages: {
    [key in CodeLanguage]?: string;
  };
  inputFormat: string; // Description of input
  outputFormat: string; // Description of output
  timeComplexity: string;
  spaceComplexity: string;
  useCase: string;
  steps: ExecutionStep[];
  visualizationType: VisualizationType;
  sampleInput: any;
  sampleOutput: any;
  metadata: {
    author: string;
    lastUpdated: string;
    tags: string[];
  };
}

export interface VisualizerState {
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: 'slow' | 'normal' | 'fast';
  narrationLanguage: NarrationLanguage;
  isMuted: boolean;
  selectedTemplate: AlgorithmTemplate | null;
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  isMutable: boolean;
}

export interface AlgorithmMetadata {
  name: string;
  difficulty: string;
  category: AlgorithmCategory;
  timeComplexity: string;
  spaceComplexity: string;
  useCase: string;
  relatedProblems?: string[];
}
