import { VisualizerStep, AlgorithmTemplate } from '@/types/visualizer';

export const searchingTemplates: AlgorithmTemplate[] = [
    {
        id: 'linear_search',
        name: 'Linear Search',
        category: 'Searching',
        starterCode: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`,
        sampleInput: { array: [5, 10, 15, 20, 25, 30], target: 20 },
        visualizationType: 'array',
        supportedLanguages: ['en', 'hi', 'hinglish'],
        generateSteps: (input) => {
            let arr = input.array;
            let target = input.target;
            let steps: VisualizerStep[] = [];
            let stepIdx = 0;

            steps.push({
                stepIndex: stepIdx++,
                activeLines: [1, 2],
                title: "Initialize Linear Search",
                description: `Looking for target ${target} in the array.`,
                stateSnapshot: { array: arr, currentIndex: -1, foundIndex: -1, target },
                audioText: { en: `Starting linear search for ${target}.`, hi: `लीनियर सर्च शुरू, ${target} ढूंढ रहे हैं।`, hinglish: `Linear search for ${target} start karte hain.` }
            });

            for (let i = 0; i < arr.length; i++) {
                steps.push({
                    stepIndex: stepIdx++,
                    activeLines: [3],
                    title: "Check Element",
                    description: `Checking if element at index ${i} (${arr[i]}) equals target (${target}).`,
                    stateSnapshot: { array: arr, currentIndex: i, foundIndex: -1, target },
                    audioText: { en: `Checking element at index ${i}.`, hi: `इंडेक्स ${i} के तत्व को जाँच रहे हैं।`, hinglish: `Index ${i} par check kar rahe hain.` }
                });

                if (arr[i] === target) {
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [4],
                        title: "Target Found",
                        description: `Found target ${target} at index ${i}. Returning.`,
                        stateSnapshot: { array: arr, currentIndex: i, foundIndex: i, target },
                        audioText: { en: `Target found at index ${i}.`, hi: `लक्ष्य इंडेक्स ${i} पर मिल गया।`, hinglish: `Target index ${i} par mil gaya.` }
                    });
                    return steps;
                }
            }

            steps.push({
                stepIndex: stepIdx++,
                activeLines: [7],
                title: "Target Not Found",
                description: `Target ${target} is not in the array. Returning -1.`,
                stateSnapshot: { array: arr, currentIndex: -1, foundIndex: -1, notFound: true, target },
                audioText: { en: `Target not found in the array.`, hi: `लक्ष्य इस सूची में नहीं मिला।`, hinglish: `Target array mein present nahi hai.` }
            });

            return steps;
        }
    },
    {
        id: 'binary_search', name: 'Binary Search', category: 'Searching',
        starterCode: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // Target found
    } else if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }
  return -1; // Target not found
}`,
        sampleInput: { array: [2, 4, 6, 8, 10, 12, 14, 16], target: 12 }, visualizationType: 'array', supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Binary search requires a sorted array.", stateSnapshot:input, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    },
    {
        id: 'jump_search', name: 'Jump Search', category: 'Searching',
        starterCode: `function jumpSearch(arr, target) {
  let n = arr.length;
  let step = Math.floor(Math.sqrt(n));
  let prev = 0;

  while (arr[Math.min(step, n) - 1] < target) {
    prev = step;
    step += Math.floor(Math.sqrt(n));
    if (prev >= n) return -1;
  }

  while (arr[prev] < target) {
    prev++;
    if (prev == Math.min(step, n)) return -1;
  }

  if (arr[prev] == target) return prev;
  return -1;
}`,
        sampleInput: { array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 5 }, visualizationType: 'array', supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Jump search skips elements by jumping ahead by fixed steps.", stateSnapshot:input, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    }
];
