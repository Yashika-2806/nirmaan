import { VisualizerStep, AlgorithmTemplate } from '@/types/visualizer';

export const searchingTemplates: AlgorithmTemplate[] = [
    {
        id: 'linear_search',
        name: 'Linear Search',
        category: 'Searching',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        description: 'Checks each element in the list sequentially until a match is found or the whole list has been searched.',
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
        id: 'binary_search',
        name: 'Binary Search',
        category: 'Searching',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        description: 'Repeatedly divides the search interval in half. If target is less than middle element, narrow the interval.',
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
        sampleInput: { array: [2, 4, 6, 8, 10, 12, 14, 16], target: 12 },
        visualizationType: 'array',
        supportedLanguages: ['en'],
        generateSteps: (input) => {
            let arr = [...input.array].sort((a, b) => a - b);
            let target = input.target;
            let steps: VisualizerStep[] = [];
            let stepIdx = 0;
            let n = arr.length;

            steps.push({
                stepIndex: stepIdx++,
                activeLines: [1, 2, 3],
                title: "Initialize Binary Search",
                description: `Searching for target ${target} in a sorted array of size ${n}.`,
                stateSnapshot: { array: arr, currentIndex: -1, foundIndex: -1, left: 0, right: n - 1, mid: -1, target },
                audioText: { en: `Starting binary search for ${target}.`, hi: `बाइनरी सर्च शुरू, ${target} ढूंढ रहे हैं।`, hinglish: `Binary search for ${target} start karte hain.` }
            });

            let left = 0;
            let right = n - 1;
            while (left <= right) {
                let mid = Math.floor((left + right) / 2);
                steps.push({
                    stepIndex: stepIdx++,
                    activeLines: [5, 6],
                    title: "Calculate Middle Index",
                    description: `Checking index mid = ${mid} (value: ${arr[mid]}). Search range is index ${left} to ${right}.`,
                    stateSnapshot: { array: arr, currentIndex: mid, foundIndex: -1, left, right, mid, target },
                    audioText: { en: `Middle index is ${mid}. Value is ${arr[mid]}.`, hi: `मध्य इंडेक्स ${mid} है। वहां मान ${arr[mid]} है।`, hinglish: `Mid index ${mid} par value ${arr[mid]} hai.` }
                });

                if (arr[mid] === target) {
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [8, 9],
                        title: "Target Found",
                        description: `Target ${target} matches element at index ${mid}. Search complete!`,
                        stateSnapshot: { array: arr, currentIndex: mid, foundIndex: mid, left, right, mid, target },
                        audioText: { en: `Target found at index ${mid}!`, hi: `लक्ष्य इंडेक्स ${mid} पर मिल गया।`, hinglish: `Target index ${mid} par mil gaya.` }
                    });
                    return steps;
                } else if (arr[mid] < target) {
                    left = mid + 1;
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [10, 11],
                        title: "Search Right Half",
                        description: `Since ${arr[mid]} < target (${target}), target must be in the right half. Moving left pointer to mid + 1 = ${left}.`,
                        stateSnapshot: { array: arr, currentIndex: -1, foundIndex: -1, left, right, mid, target },
                        audioText: { en: `Target is larger. Searching right half.`, hi: `लक्ष्य बड़ा है। दायें भाग में खोज रहे हैं।`, hinglish: `Target bada hai. Right half check karenge.` }
                    });
                } else {
                    right = mid - 1;
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [12, 13],
                        title: "Search Left Half",
                        description: `Since ${arr[mid]} > target (${target}), target must be in the left half. Moving right pointer to mid - 1 = ${right}.`,
                        stateSnapshot: { array: arr, currentIndex: -1, foundIndex: -1, left, right, mid, target },
                        audioText: { en: `Target is smaller. Searching left half.`, hi: `लक्ष्य छोटा है। बायें भाग में खोज रहे हैं।`, hinglish: `Target chota hai. Left half check karenge.` }
                    });
                }
            }

            steps.push({
                stepIndex: stepIdx++,
                activeLines: [16],
                title: "Target Not Found",
                description: `Left pointer crossed right pointer. Target ${target} is not in the array.`,
                stateSnapshot: { array: arr, currentIndex: -1, foundIndex: -1, notFound: true, left, right, mid: -1, target },
                audioText: { en: `Target not found in the array.`, hi: `लक्ष्य सूची में नहीं मिला।`, hinglish: `Target array mein nahi mila.` }
            });

            return steps;
        }
    },
    {
        id: 'jump_search',
        name: 'Jump Search',
        category: 'Searching',
        timeComplexity: 'O(√n)',
        spaceComplexity: 'O(1)',
        description: 'Searches in a sorted array by jumping ahead by fixed steps and then performing linear search.',
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
        sampleInput: { array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 5 },
        visualizationType: 'array',
        supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Jump search skips elements by jumping ahead by fixed steps.", stateSnapshot:input, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    }
];
