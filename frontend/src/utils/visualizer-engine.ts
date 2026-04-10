// Visualizer execution engine

import { ExecutionStep, VisualizationState } from '@/types/dsa-visualizer';

export interface ArrayVisualizerState {
  values: number[];
  comparingIndices: Set<number>;
  swappedIndices: Set<number>;
  sortedIndices: Set<number>;
  highlightedIndex: number | null;
  minIndex?: number;
  leftPointer?: number;
  rightPointer?: number;
  middlePointer?: number;
  swapterLeft?: number;
  swapperRight?: number;
}

// Speed configurations for playback
export const PLAYBACK_SPEEDS = {
  slow: { multiplier: 0.5, delayMs: 1500 },
  normal: { multiplier: 1, delayMs: 800 },
  fast: { multiplier: 2, delayMs: 300 },
};

/**
 * Generates execution steps for array sorting visualization
 * This is a generator template - implement actual algorithms in plugin system
 */
export function generateBubbleSortSteps(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const arrayCopy = [...arr];
  let stepIndex = 0;

  for (let i = 0; i < arrayCopy.length; i++) {
    for (let j = 0; j < arrayCopy.length - i - 1; j++) {
      // Compare step
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 5,
        action: `Compare arr[${j}] (${arrayCopy[j]}) with arr[${j + 1}] (${arrayCopy[j + 1]})`,
        narration: {
          english: `Comparing ${arrayCopy[j]} at position ${j} with ${arrayCopy[j + 1]} at position ${j + 1}.`,
          hindi: `स्थिति ${j} पर ${arrayCopy[j]} की तुलना स्थिति ${j + 1} पर ${arrayCopy[j + 1]} से कर रहे हैं।`,
          hinglish: `Sthiti ${j} par ${arrayCopy[j]} ki tulna sthiti ${j + 1} par ${arrayCopy[j + 1]} se kar rahe hain.`,
        },
        visualization: {
          type: 'array',
          data: [...arrayCopy],
          state: { i, j, comparingIndices: [j, j + 1] },
        },
        variables: { i, j, arr: arrayCopy },
        highlightedElements: [j, j + 1],
      });

      // Swap step if needed
      if (arrayCopy[j] > arrayCopy[j + 1]) {
        [arrayCopy[j], arrayCopy[j + 1]] = [arrayCopy[j + 1], arrayCopy[j]];
        steps.push({
          stepIndex: stepIndex++,
          lineNumber: 6,
          action: `Swap arr[${j}] and arr[${j + 1}]`,
          narration: {
            english: `Swapping ${arrayCopy[j + 1]} and ${arrayCopy[j]}.`,
            hindi: `${arrayCopy[j + 1]} और ${arrayCopy[j]} को स्वैप कर रहे हैं।`,
            hinglish: `${arrayCopy[j + 1]} aur ${arrayCopy[j]} ko swap kar rahe hain.`,
          },
          visualization: {
            type: 'array',
            data: [...arrayCopy],
            state: { i, j, swappedIndices: [j, j + 1] },
          },
          variables: { i, j, arr: arrayCopy },
          swappedElements: [j, j + 1],
        });
      }
    }
  }

  // Final step
  steps.push({
    stepIndex: stepIndex++,
    lineNumber: 0,
    action: 'Array is sorted!',
    narration: {
      english: 'The array is now completely sorted in ascending order.',
      hindi: 'सरणी अब पूरी तरह से आरोही क्रम में वर्गीकृत है।',
      hinglish: 'Sarni ab puri tarah se aarahi kram mein vargikrit hai.',
    },
    visualization: {
      type: 'array',
      data: [...arrayCopy],
      state: { sorted: true, sortedIndices: Array.from({ length: arrayCopy.length }, (_, i) => i) },
    },
    variables: { arr: arrayCopy },
    highlightedElements: Array.from({ length: arrayCopy.length }, (_, i) => i),
  });

  return steps;
}

/**
 * Generates steps for linear search
 */
export function generateLinearSearchSteps(arr: number[], target: number): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let stepIndex = 0;

  steps.push({
    stepIndex: stepIndex++,
    lineNumber: 2,
    action: 'Initialize search from index 0',
    narration: {
      english: 'Starting linear search. We will check each element sequentially.',
      hindi: 'रैखिक खोज शुरू करते हैं। हम प्रत्येक तत्व को क्रमिक रूप से जांचेंगे।',
      hinglish: 'Raikhik khoj shuru karte hain. Hum pratyek tatva ko kramik rup se janchenge.',
    },
    visualization: {
      type: 'array',
      data: arr,
      state: { index: 0, found: false },
    },
    variables: { i: 0, target },
  });

  for (let i = 0; i < arr.length; i++) {
    steps.push({
      stepIndex: stepIndex++,
      lineNumber: 3,
      action: `Check arr[${i}] (${arr[i]}) === target (${target})`,
      narration: {
        english: `Checking if ${arr[i]} equals ${target}.`,
        hindi: `जांच रहे हैं कि क्या ${arr[i]} ${target} के बराबर है।`,
        hinglish: `Check kar rahe hain ki kya ${arr[i]} ${target} ke barabar hai.`,
      },
      visualization: {
        type: 'array',
        data: arr,
        state: { index: i, found: false },
      },
      variables: { i, target },
      highlightedElements: [i],
    });

    if (arr[i] === target) {
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 4,
        action: `Found! Return index ${i}`,
        narration: {
          english: `Found the target ${target} at index ${i}!`,
          hindi: `लक्ष्य ${target} इंडेक्स ${i} पर पाया गया!`,
          hinglish: `Lakshya ${target} index ${i} par paya gaya!`,
        },
        visualization: {
          type: 'array',
          data: arr,
          state: { index: i, found: true, result: i },
        },
        variables: { i, target, result: i },
        highlightedElements: [i],
      });
      return steps;
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    lineNumber: 5,
    action: 'Element not found',
    narration: {
      english: `The target ${target} was not found in the array.`,
      hindi: `लक्ष्य ${target} सरणी में नहीं पाया गया।`,
      hinglish: `Lakshya ${target} sarni mein nahi paya gaya.`,
    },
    visualization: {
      type: 'array',
      data: arr,
      state: { found: false, result: -1 },
    },
    variables: { target, result: -1 },
  });

  return steps;
}

/**
 * Generates steps for binary search
 */
export function generateBinarySearchSteps(arr: number[], target: number): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let stepIndex = 0;
  let left = 0;
  let right = arr.length - 1;

  steps.push({
    stepIndex: stepIndex++,
    lineNumber: 2,
    action: 'Initialize left and right pointers',
    narration: {
      english: 'Starting binary search. Set left pointer at 0 and right pointer at end.',
      hindi: 'बाइनरी खोज शुरू करते हैं। बाएं सूचक को 0 पर और दाएं सूचक को अंत में रखें।',
      hinglish: 'Binary khoj shuru karte hain. Baen soochak ko 0 par aur dae soochak ko ant mein rakhen.',
    },
    visualization: {
      type: 'array',
      data: arr,
      state: { left, right, found: false },
    },
    variables: { left, right, target },
    highlightedElements: [left, right],
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      stepIndex: stepIndex++,
      lineNumber: 3,
      action: `Calculate mid = ${mid}`,
      narration: {
        english: `Middle index is ${mid}. Check middle element ${arr[mid]}.`,
        hindi: `मध्य सूचकांक ${mid} है। मध्य तत्व ${arr[mid]} की जांच करें।`,
        hinglish: `Madhya soochkank ${mid} hai. Madhya tatva ${arr[mid]} ki janch karen.`,
      },
      visualization: {
        type: 'array',
        data: arr,
        state: { left, right, mid, found: false },
      },
      variables: { left, right, mid, target },
      highlightedElements: [left, mid, right],
    });

    if (arr[mid] === target) {
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 4,
        action: `Found! Target at index ${mid}`,
        narration: {
          english: `Found the target ${target} at index ${mid}!`,
          hindi: `लक्ष्य ${target} सूचकांक ${mid} पर पाया गया!`,
          hinglish: `Lakshya ${target} soochkank ${mid} par paya gaya!`,
        },
        visualization: {
          type: 'array',
          data: arr,
          state: { left, right, mid, found: true, result: mid },
        },
        variables: { left, right, mid, target, result: mid },
        highlightedElements: [mid],
      });
      return steps;
    }

    if (arr[mid] < target) {
      left = mid + 1;
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 5,
        action: `${arr[mid]} < ${target}, move left pointer right`,
        narration: {
          english: `${arr[mid]} is less than ${target}, so we search the right half.`,
          hindi: `${arr[mid]} ${target} से कम है, इसलिए हम दाहिने आधे भाग को खोजते हैं।`,
          hinglish: `${arr[mid]} ${target} se kam hai, isliye hum dahin adhe bhag ko khojte hain.`,
        },
        visualization: {
          type: 'array',
          data: arr,
          state: { left, right, mid, found: false },
        },
        variables: { left, right, mid, target },
        highlightedElements: [left, right],
      });
    } else {
      right = mid - 1;
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 6,
        action: `${arr[mid]} > ${target}, move right pointer left`,
        narration: {
          english: `${arr[mid]} is greater than ${target}, so we search the left half.`,
          hindi: `${arr[mid]} ${target} से अधिक है, इसलिए हम बाएं आधे भाग को खोजते हैं।`,
          hinglish: `${arr[mid]} ${target} se adhik hai, isliye hum baen adhe bhag ko khojte hain.`,
        },
        visualization: {
          type: 'array',
          data: arr,
          state: { left, right, mid, found: false },
        },
        variables: { left, right, mid, target },
        highlightedElements: [left, right],
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    lineNumber: 7,
    action: 'Element not found',
    narration: {
      english: `The target ${target} was not found in the sorted array.`,
      hindi: `लक्ष्य ${target} सॉर्ट की गई सरणी में नहीं पाया गया।`,
      hinglish: `Lakshya ${target} sort ki gayi sarni mein nahi paya gaya.`,
    },
    visualization: {
      type: 'array',
      data: arr,
      state: { found: false, result: -1 },
    },
    variables: { target, result: -1 },
  });

  return steps;
}

/**
 * Generates steps for selection sort
 */
export function generateSelectionSortSteps(arr: number[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  const arrayCopy = [...arr];
  let stepIndex = 0;

  for (let i = 0; i < arrayCopy.length; i++) {
    let minIdx = i;

    for (let j = i + 1; j < arrayCopy.length; j++) {
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 4,
        action: `Compare arr[${j}] with arr[${minIdx}]`,
        narration: {
          english: `Comparing ${arrayCopy[j]} with minimum ${arrayCopy[minIdx]}.`,
          hindi: `${arrayCopy[j]} की तुलना न्यूनतम ${arrayCopy[minIdx]} से कर रहे हैं।`,
          hinglish: `${arrayCopy[j]} ki tulna minimum ${arrayCopy[minIdx]} se kar rahe hain.`,
        },
        visualization: {
          type: 'array',
          data: [...arrayCopy],
          state: { i, j, minIdx },
        },
        variables: { i, j, minIdx, arr: arrayCopy },
        highlightedElements: [j, minIdx],
      });

      if (arrayCopy[j] < arrayCopy[minIdx]) {
        minIdx = j;
        steps.push({
          stepIndex: stepIndex++,
          lineNumber: 5,
          action: `Found smaller value, update minIdx to ${minIdx}`,
          narration: {
            english: `Found a smaller value at index ${minIdx}.`,
            hindi: `सूचकांक ${minIdx} पर एक छोटा मान पाया।`,
            hinglish: `Soochkank ${minIdx} par ek chhota man paya.`,
          },
          visualization: {
            type: 'array',
            data: [...arrayCopy],
            state: { i, j, minIdx },
          },
          variables: { i, j, minIdx, arr: arrayCopy },
          highlightedElements: [minIdx],
        });
      }
    }

    if (minIdx !== i) {
      [arrayCopy[i], arrayCopy[minIdx]] = [arrayCopy[minIdx], arrayCopy[i]];
      steps.push({
        stepIndex: stepIndex++,
        lineNumber: 7,
        action: `Swap arr[${i}] with arr[${minIdx}]`,
        narration: {
          english: `Swap ${arrayCopy[minIdx]} with ${arrayCopy[i]}.`,
          hindi: `${arrayCopy[minIdx]} को ${arrayCopy[i]} के साथ स्वैप करें।`,
          hinglish: `${arrayCopy[minIdx]} ko ${arrayCopy[i]} ke sath swap karen.`,
        },
        visualization: {
          type: 'array',
          data: [...arrayCopy],
          state: { i, minIdx, sorted: Array.from({ length: i + 1 }, (_, k) => k) },
        },
        variables: { i, minIdx, arr: arrayCopy },
        swappedElements: [i, minIdx],
      });
    }
  }

  return steps;
}
