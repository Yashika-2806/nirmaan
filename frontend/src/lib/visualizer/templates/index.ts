import { sortingTemplates } from './sorting';
import { searchingTemplates } from './searching';
import { graphTemplates, treeTemplates, dpTemplates, recursionTemplates, datastructureTemplates } from './graphs';
import { AlgorithmTemplate } from '@/types/visualizer';

export const ALL_TEMPLATES: AlgorithmTemplate[] = [
    ...sortingTemplates,
    ...searchingTemplates,
    ...graphTemplates,
    ...treeTemplates,
    ...dpTemplates,
    ...recursionTemplates,
    ...datastructureTemplates
];

export const TEMPLATES_BY_CATEGORY = ALL_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
        acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
}, {} as Record<string, AlgorithmTemplate[]>);
