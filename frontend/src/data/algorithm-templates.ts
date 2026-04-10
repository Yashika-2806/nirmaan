import { AlgorithmTemplate } from '@/types/dsa-visualizer';

export const ALGORITHM_TEMPLATES: Record<string, AlgorithmTemplate> = {
  // ==================== ARRAYS / BASICS ====================
  'linear-search': {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'arrays',
    difficulty: 'easy',
    description: 'Search for an element by iterating through each element sequentially.',
    codeLanguages: {
      python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
      javascript: `function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}`,
      cpp: `int linearSearch(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`,
    },
    inputFormat: 'Array of integers and a target value',
    outputFormat: 'Index of target if found, -1 otherwise',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'Simple searches, unsorted arrays',
    visualizationType: 'array',
    sampleInput: { arr: [2, 5, 8, 1, 9], target: 8 },
    sampleOutput: 2,
    steps: [
      {
        stepIndex: 0,
        lineNumber: 2,
        action: 'Initialize loop pointer i to 0',
        narration: {
          english: 'We start by initializing the loop counter i to zero.',
          hindi: 'हम लूप काउंटर i को शून्य से शुरू करते हैं।',
          hinglish: 'Hum loop counter i ko zero se shuru karte hain.',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 0, found: false },
        },
        variables: { i: 0, target: 8 },
        highlightedElements: [0],
      },
      {
        stepIndex: 1,
        lineNumber: 3,
        action: 'Check if arr[0] equals target (2 === 8? No)',
        narration: {
          english: 'We check if the first element equals 8. It is 2, so it does not match.',
          hindi: 'हम जांचते हैं कि पहला तत्व 8 के बराबर है। यह 2 है, तो यह मेल नहीं खाता।',
          hinglish: 'Hum check karte hain ki pehla element 8 ke barabar hai. Yeh 2 hai, toh match nahi hota.',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 0, found: false },
        },
        variables: { i: 0, target: 8 },
        highlightedElements: [0],
      },
      {
        stepIndex: 2,
        lineNumber: 2,
        action: 'Move to next element (i = 1)',
        narration: {
          english: 'Move to the next element.',
          hindi: 'अगले तत्व पर जाएं।',
          hinglish: 'Agle element par jaen.',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 1, found: false },
        },
        variables: { i: 1, target: 8 },
        highlightedElements: [1],
      },
      {
        stepIndex: 3,
        lineNumber: 3,
        action: 'Check if arr[1] equals target (5 === 8? No)',
        narration: {
          english: 'Check the second element. It is 5, which does not equal 8.',
          hindi: 'दूसरे तत्व को जांचें। यह 5 है, जो 8 के बराबर नहीं है।',
          hinglish: 'Doosre element ko check karo. Yeh 5 hai, jo 8 ke barabar nahi hai.',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 1, found: false },
        },
        variables: { i: 1, target: 8 },
        highlightedElements: [1],
      },
      {
        stepIndex: 4,
        lineNumber: 2,
        action: 'Move to next element (i = 2)',
        narration: {
          english: 'Continue to the next element.',
          hindi: 'अगले तत्व जारी रखें।',
          hinglish: 'Agle element jaari rakhen.',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 2, found: false },
        },
        variables: { i: 2, target: 8 },
        highlightedElements: [2],
      },
      {
        stepIndex: 5,
        lineNumber: 3,
        action: 'Check if arr[2] equals target (8 === 8? Yes)',
        narration: {
          english: 'Check the third element. It is 8, which matches our target!',
          hindi: 'तीसरे तत्व को जांचें। यह 8 है, जो हमारे लक्ष्य से मेल खाता है!',
          hinglish: 'Teesre element ko check karo. Yeh 8 hai, jo hamare target se mel khata hai!',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 2, found: true },
        },
        variables: { i: 2, target: 8 },
        highlightedElements: [2],
      },
      {
        stepIndex: 6,
        lineNumber: 4,
        action: 'Return index 2',
        narration: {
          english: 'Found! We return the index 2.',
          hindi: 'पाया! हम इंडेक्स 2 रिटर्न करते हैं।',
          hinglish: 'Paya! Hum index 2 return karte hain.',
        },
        visualization: {
          type: 'array',
          data: [2, 5, 8, 1, 9],
          state: { i: 2, found: true, result: 2 },
        },
        variables: { i: 2, target: 8, result: 2 },
        highlightedElements: [2],
      },
    ],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['searching', 'arrays', 'beginner'],
    },
  },

  // ==================== SORTING ====================
  'bubble-sort': {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting',
    difficulty: 'easy',
    description: 'Sort array by repeatedly stepping through and swapping adjacent elements if they are in wrong order.',
    codeLanguages: {
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
      javascript: `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}`,
    },
    inputFormat: 'Array of unsorted integers',
    outputFormat: 'Array sorted in ascending order',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    useCase: 'Teaching sorting concepts, small datasets',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      {
        stepIndex: 0,
        lineNumber: 3,
        action: 'Start outer loop, i = 0',
        narration: {
          english: 'Begin bubble sort. We will make multiple passes through the array.',
          hindi: 'बबल सॉर्ट शुरू करें। हम सरणी के माध्यम से कई पास करेंगे।',
          hinglish: 'Bubble sort shuru karo. Hum sarni ke madhya se kai pass karenge.',
        },
        visualization: {
          type: 'array',
          data: [64, 34, 25, 12, 22],
          state: { i: 0, j: 0 },
        },
        variables: { i: 0, n: 5 },
      },
      {
        stepIndex: 1,
        lineNumber: 4,
        action: 'Start inner loop, j = 0',
        narration: {
          english: 'Start comparing adjacent elements from the beginning.',
          hindi: 'शुरुआत से प्रत्येक सन्निहित तत्व की तुलना करना शुरू करें।',
          hinglish: 'Shuruhat se pratyek samip tatvon ki tulna karna shuru karo.',
        },
        visualization: {
          type: 'array',
          data: [64, 34, 25, 12, 22],
          state: { i: 0, j: 0 },
        },
        variables: { i: 0, j: 0 },
        highlightedElements: [0, 1],
      },
      {
        stepIndex: 2,
        lineNumber: 5,
        action: 'Compare arr[0] and arr[1]: 64 > 34? Yes, swap',
        narration: {
          english: 'Compare 64 and 34. Since 64 is greater, we swap them.',
          hindi: '64 और 34 की तुलना करें। चूंकि 64 अधिक है, हम उन्हें स्वैप करते हैं।',
          hinglish: '64 aur 34 ki tulna karo. Kyunki 64 zyada hai, hum unhe swap karte hain.',
        },
        visualization: {
          type: 'array',
          data: [34, 64, 25, 12, 22],
          state: { i: 0, j: 0 },
        },
        variables: { i: 0, j: 0 },
        swappedElements: [0, 1],
      },
      {
        stepIndex: 3,
        lineNumber: 4,
        action: 'Move to j = 1',
        narration: {
          english: 'Move to the next pair.',
          hindi: 'अगली जोड़ी पर जाएं।',
          hinglish: 'Agli jodi par jao.',
        },
        visualization: {
          type: 'array',
          data: [34, 64, 25, 12, 22],
          state: { i: 0, j: 1 },
        },
        variables: { i: 0, j: 1 },
        highlightedElements: [1, 2],
      },
      {
        stepIndex: 4,
        lineNumber: 5,
        action: 'Compare arr[1] and arr[2]: 64 > 25? Yes, swap',
        narration: {
          english: 'Compare 64 and 25. Since 64 is greater, we swap.',
          hindi: '64 और 25 की तुलना करें। चूंकि 64 अधिक है, हम स्वैप करते हैं।',
          hinglish: '64 aur 25 ki tulna karo. Kyunki 64 zyada hai, hum swap karte hain.',
        },
        visualization: {
          type: 'array',
          data: [34, 25, 64, 12, 22],
          state: { i: 0, j: 1 },
        },
        variables: { i: 0, j: 1 },
        swappedElements: [1, 2],
      },
    ],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['sorting', 'beginner', 'visualization'],
    },
  },

  'selection-sort': {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'sorting',
    difficulty: 'easy',
    description: 'Sort by repeatedly finding the minimum element and placing it at the beginning.',
    codeLanguages: {
      python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
      javascript: `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    return arr;
}`,
    },
    inputFormat: 'Array of unsorted integers',
    outputFormat: 'Array sorted in ascending order',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    useCase: 'Educational, understanding sorting',
    visualizationType: 'array',
    sampleInput: { arr: [64, 25, 12, 22, 11] },
    sampleOutput: [11, 12, 22, 25, 64],
    steps: [
      {
        stepIndex: 0,
        lineNumber: 3,
        action: 'Start with i = 0, find minimum element',
        narration: {
          english: 'Begin selection sort. We find the minimum element in the array.',
          hindi: 'चयन सॉर्ट शुरू करें। हम सरणी में न्यूनतम तत्व ढूंढते हैं।',
          hinglish: 'Selection sort shuru karo. Hum sarni mein minimum element dhundh te hain.',
        },
        visualization: {
          type: 'array',
          data: [64, 25, 12, 22, 11],
          state: { i: 0, minIdx: 4 },
        },
        variables: { i: 0, minIdx: 4 },
      },
    ],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['sorting', 'easy'],
    },
  },

  'merge-sort': {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting',
    difficulty: 'medium',
    description: 'Divide and conquer sorting algorithm. Divides array in half, recursively sorts, then merges.',
    codeLanguages: {
      python: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
    },
    inputFormat: 'Array of unsorted integers',
    outputFormat: 'Array sorted in ascending order',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    useCase: 'Efficient sorting for large datasets',
    visualizationType: 'array',
    sampleInput: { arr: [38, 27, 43, 3, 9, 82, 10] },
    sampleOutput: [3, 9, 10, 27, 38, 43, 82],
    steps: [],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['sorting', 'medium', 'divide-and-conquer'],
    },
  },

  // ==================== TWO POINTERS ====================
  'two-sum': {
    id: 'two-sum',
    name: 'Two Sum (Sorted Array)',
    category: 'two-pointers',
    difficulty: 'easy',
    description: 'Find two numbers that add up to a target using two pointers on sorted array.',
    codeLanguages: {
      python: `def two_sum(arr, target):
    left = 0
    right = len(arr) - 1
    while left < right:
        current_sum = arr[left] + arr[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []`,
      javascript: `function twoSum(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left < right) {
        const sum = arr[left] + arr[right];
        if (sum === target) return [left, right];
        if (sum < target) left++;
        else right--;
    }
    return [];
}`,
    },
    inputFormat: 'Sorted array of integers and target sum',
    outputFormat: 'Indices of two numbers that sum to target',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'Two pointer technique, efficient searching',
    visualizationType: 'array',
    sampleInput: { arr: [2, 7, 11, 15], target: 9 },
    sampleOutput: [0, 1],
    steps: [],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['two-pointers', 'arrays', 'easy'],
    },
  },

  'reverse-array': {
    id: 'reverse-array',
    name: 'Reverse Array In-place',
    category: 'two-pointers',
    difficulty: 'easy',
    description: 'Reverse an array using two pointers from both ends.',
    codeLanguages: {
      python: `def reverse_array(arr):
    left = 0
    right = len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr`,
      javascript: `function reverseArray(arr) {
    let left = 0, right = arr.length - 1;
    while (left < right) {
        [arr[left], arr[right]] = [arr[right], arr[left]];
        left++;
        right--;
    }
    return arr;
}`,
    },
    inputFormat: 'Array of integers',
    outputFormat: 'Reversed array',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'In-place reversals, space-efficient solutions',
    visualizationType: 'array',
    sampleInput: { arr: [1, 2, 3, 4, 5] },
    sampleOutput: [5, 4, 3, 2, 1],
    steps: [],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['two-pointers', 'in-place', 'easy'],
    },
  },

  // ==================== DYNAMIC PROGRAMMING ====================
  'climbing-stairs': {
    id: 'climbing-stairs',
    name: 'Climbing Stairs',
    category: 'dynamic-programming',
    difficulty: 'easy',
    description: 'Calculate number of ways to climb stairs if you can take 1 or 2 steps at a time.',
    codeLanguages: {
      python: `def climb_stairs(n):
    if n <= 1:
        return 1
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
      javascript: `function climbStairs(n) {
    if (n <= 1) return 1;
    const dp = new Array(n + 1);
    dp[1] = 1;
    dp[2] = 2;
    for (let i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}`,
    },
    inputFormat: 'Number of stairs (n)',
    outputFormat: 'Number of ways to climb n stairs',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    useCase: 'Introduction to dynamic programming',
    visualizationType: 'custom',
    sampleInput: { n: 4 },
    sampleOutput: 5,
    steps: [],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['dynamic-programming', 'easy'],
    },
  },

  'fibonacci': {
    id: 'fibonacci',
    name: 'Fibonacci Sequence',
    category: 'dynamic-programming',
    difficulty: 'easy',
    description: 'Generate fibonacci number at position n using dynamic programming.',
    codeLanguages: {
      python: `def fibonacci(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`,
    },
    inputFormat: 'Position in fibonacci sequence (n)',
    outputFormat: 'Fibonacci number at position n',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    useCase: 'Learning DP, number sequences',
    visualizationType: 'custom',
    sampleInput: { n: 6 },
    sampleOutput: 8,
    steps: [],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['dynamic-programming', 'sequences'],
    },
  },

  // ==================== SEARCHING ====================
  'binary-search': {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'arrays',
    difficulty: 'easy',
    description: 'Efficiently search sorted array by eliminating half of elements with each comparison.',
    codeLanguages: {
      python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      javascript: `function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    },
    inputFormat: 'Sorted array and target value',
    outputFormat: 'Index of target or -1 if not found',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    useCase: 'Fast searching in sorted data',
    visualizationType: 'array',
    sampleInput: { arr: [1, 3, 5, 7, 9, 11, 13], target: 7 },
    sampleOutput: 3,
    steps: [],
    metadata: {
      author: 'Nirmaan DSA Lab',
      lastUpdated: '2024-01-15',
      tags: ['searching', 'logarithmic', 'medium'],
    },
  },
};

export function getTemplatesByCategory(category: string): AlgorithmTemplate[] {
  return Object.values(ALGORITHM_TEMPLATES).filter(
    (template) => template.category === category
  );
}

export function getAllTemplates(): AlgorithmTemplate[] {
  return Object.values(ALGORITHM_TEMPLATES);
}

export function getTemplateById(id: string): AlgorithmTemplate | undefined {
  return ALGORITHM_TEMPLATES[id];
}
