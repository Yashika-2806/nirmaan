import { AlgorithmTemplate } from '@/types/dsa-visualizer';

export const ALGORITHM_TEMPLATES: Record<string, AlgorithmTemplate> = {
  // ==================== SEARCHING ====================
  'linear-search': {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'arrays',
    difficulty: 'easy',
    description: 'Search for element by checking each position sequentially.',
    codeLanguages: {
      python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
      javascript: `function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) return i;
    }
    return -1;
}`,
      cpp: `int linearSearch(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`,
      java: `public static int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`,
    },
    inputFormat: 'Array and target value',
    outputFormat: 'Index if found, -1 otherwise',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'Unsorted arrays, small datasets',
    visualizationType: 'array',
    sampleInput: { arr: [2, 5, 8, 1, 9], target: 8 },
    sampleOutput: 2,
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Start at index 0', narration: { english: 'Start searching from index 0.', hindi: 'इंडेक्स 0 से शुरू करें।', hinglish: 'Index 0 se shuru karein.' }, visualization: { type: 'array', data: [2, 5, 8, 1, 9], state: { i: 0 } }, variables: { i: 0, target: 8 }, highlightedElements: [0] },
      { stepIndex: 1, lineNumber: 3, action: 'Check arr[0], not found', narration: { english: 'Element 2 does not match target 8.', hindi: 'तत्व 2 मेल नहीं खाता।', hinglish: 'Element 2 mel nahi khata.' }, visualization: { type: 'array', data: [2, 5, 8, 1, 9], state: { i: 2 } }, variables: { i: 2, target: 8 }, highlightedElements: [2] },
      { stepIndex: 2, lineNumber: 3, action: 'Check arr[2]=8, FOUND!', narration: { english: 'Found element 8 at index 2!', hindi: 'इंडेक्स 2 पर तत्व 8 मिला!', hinglish: 'Index 2 par element 8 mila!' }, visualization: { type: 'array', data: [2, 5, 8, 1, 9], state: { i: 2, found: true } }, variables: { i: 2, target: 8, found: true }, highlightedElements: [2] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['searching', 'arrays', 'beginner'] },
  },

  'binary-search': {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'arrays',
    difficulty: 'easy',
    description: 'Efficient search in sorted array by halving search space.',
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
        let mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      cpp: `int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = (left + right) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      java: `public static int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = (left + right) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    },
    inputFormat: 'Sorted array and target',
    outputFormat: 'Index if found, -1 otherwise',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    useCase: 'Sorted arrays, large datasets',
    visualizationType: 'array',
    sampleInput: { arr: [1, 3, 5, 7, 9, 11, 13], target: 7 },
    sampleOutput: 3,
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Initialize left=0, right=6', narration: { english: 'Set pointers at start and end.', hindi: 'दोनों सिरों पर सूचक रखें।', hinglish: 'Donon siro par pointer rakhen.' }, visualization: { type: 'array', data: [1, 3, 5, 7, 9, 11, 13], state: { left: 0, right: 6 } }, variables: { left: 0, right: 6, target: 7 }, highlightedElements: [] },
      { stepIndex: 1, lineNumber: 4, action: 'Calculate mid=3, arr[3]=7', narration: { english: 'Middle element is 7, which matches!', hindi: 'मध्य तत्व 7 है।', hinglish: 'Madhya element 7 hai.' }, visualization: { type: 'array', data: [1, 3, 5, 7, 9, 11, 13], state: { left: 0, right: 6, mid: 3, found: true } }, variables: { left: 0, right: 6, mid: 3, found: true }, highlightedElements: [3] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['searching', 'arrays', 'efficient'] },
  },

  'jump-search': {
    id: 'jump-search',
    name: 'Jump Search',
    category: 'arrays',
    difficulty: 'easy',
    description: 'Search sorted array by jumping to find bracket, then linear search.',
    codeLanguages: {
      python: `import math
def jump_search(arr, target):
    n = len(arr)
    step = int(math.sqrt(n))
    prev = 0
    while arr[min(step, n) - 1] < target:
        prev = step
        step += int(math.sqrt(n))
        if prev >= n:
            return -1
    while arr[prev] < target:
        prev += 1
        if prev == min(step, n):
            return -1
    if arr[prev] == target:
        return prev
    return -1`,
      javascript: `function jumpSearch(arr, target) {
    const n = arr.length;
    const step = Math.floor(Math.sqrt(n));
    let prev = 0;
    while (arr[Math.min(step, n) - 1] < target) {
        prev = step;
        step += Math.floor(Math.sqrt(n));
        if (prev >= n) return -1;
    }
    while (arr[prev] < target) {
        prev++;
        if (prev === Math.min(step, n)) return -1;
    }
    if (arr[prev] === target) return prev;
    return -1;
}`,
      cpp: `int jumpSearch(vector<int>& arr, int target) {
    int n = arr.size();
    int step = sqrt(n);
    int prev = 0;
    while (arr[min(step, n) - 1] < target) {
        prev = step;
        step += sqrt(n);
        if (prev >= n) return -1;
    }
    while (arr[prev] < target) {
        prev++;
        if (prev == min(step, n)) return -1;
    }
    return arr[prev] == target ? prev : -1;
}`,
      java: `public static int jumpSearch(int[] arr, int target) {
    int n = arr.length;
    int step = (int) Math.sqrt(n);
    int prev = 0;
    while (arr[Math.min(step, n) - 1] < target) {
        prev = step;
        step += (int) Math.sqrt(n);
        if (prev >= n) return -1;
    }
    while (arr[prev] < target) {
        prev++;
        if (prev == Math.min(step, n)) return -1;
    }
    return arr[prev] == target ? prev : -1;
}`,
    },
    inputFormat: 'Sorted array and target',
    outputFormat: 'Index if found, -1 otherwise',
    timeComplexity: 'O(√n)',
    spaceComplexity: 'O(1)',
    useCase: 'Sorted arrays, better than linear, simpler than binary',
    visualizationType: 'array',
    sampleInput: { arr: [0, 1, 1, 2, 3, 5, 8, 13, 21], target: 8 },
    sampleOutput: 6,
    steps: [
      { stepIndex: 0, lineNumber: 4, action: 'Calculate step size', narration: { english: 'Jump size is square root of array length.', hindi: 'जंप का आकार सरणी लंबाई का वर्गमूल है।', hinglish: 'Jump ka akar array length ka vargmul hai.' }, visualization: { type: 'array', data: [0, 1, 1, 2, 3, 5, 8, 13, 21], state: { step: 3 } }, variables: { step: 3 }, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['searching', 'arrays'] },
  },

  // ==================== SORTING ====================
  'bubble-sort': {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting',
    difficulty: 'easy',
    description: 'Sort by repeatedly swapping adjacent elements if in wrong order.',
    codeLanguages: {
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
      javascript: `function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}`,
      cpp: `void bubbleSort(vector<int>& arr) {
    for (int i = 0; i < arr.size(); i++) {
        for (int j = 0; j < arr.size() - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
      java: `public static void bubbleSort(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        for (int j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
    },
    inputFormat: 'Unsorted array',
    outputFormat: 'Sorted array',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    useCase: 'Small arrays, educational',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Compare 64 and 34', narration: { english: 'Compare first two elements. 64 > 34, so swap.', hindi: '64 और 34 की तुलना करें।', hinglish: 'comparison karein aur swap karein.' }, visualization: { type: 'array', data: [64, 34, 25, 12, 22], state: { comparing: [0, 1] } }, variables: {}, highlightedElements: [0, 1] },
      { stepIndex: 1, lineNumber: 5, action: 'Swap 64 and 34', narration: { english: 'Swap positions of 64 and 34.', hindi: '64 और 34 को स्वैप करें।', hinglish: 'Swap karein.' }, visualization: { type: 'array', data: [34, 64, 25, 12, 22], state: { swapped: [0, 1] } }, variables: {}, swappedElements: [0, 1] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['sorting', 'easy'] },
  },

  'selection-sort': {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'sorting',
    difficulty: 'easy',
    description: 'Find minimum and place at start, repeat for rest.',
    codeLanguages: {
      python: `def selection_sort(arr):
    for i in range(len(arr)):
        min_idx = i
        for j in range(i + 1, len(arr)):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
      javascript: `function selectionSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    return arr;
}`,
      cpp: `void selectionSort(vector<int>& arr) {
    for (int i = 0; i < arr.size(); i++) {
        int minIdx = i;
        for (int j = i + 1; j < arr.size(); j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        swap(arr[i], arr[minIdx]);
    }
}`,
      java: `public static void selectionSort(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        int minIdx = i;
        for (int j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        int temp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = temp;
    }
}`,
    },
    inputFormat: 'Unsorted array',
    outputFormat: 'Sorted array',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    useCase: 'Small arrays, memory-constrained',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Find minimum=12', narration: { english: 'Find minimum element. It is 12 at index 3.', hindi: 'न्यूनतम तत्व 12 है।', hinglish: 'Nyuntam element 12 hai.' }, visualization: { type: 'array', data: [64, 34, 25, 12, 22], state: { minIdx: 3 } }, variables: { minIdx: 3 }, highlightedElements: [3] },
      { stepIndex: 1, lineNumber: 6, action: 'Swap 64 and 12', narration: { english: 'Swap first element with minimum.', hindi: 'पहले तत्व को न्यूनतम से स्वैप करें।', hinglish: 'Pehle element ko min se swap karein.' }, visualization: { type: 'array', data: [12, 34, 25, 64, 22], state: { sorted: [0], swapped: [0, 3] } }, variables: { minIdx: 0 }, swappedElements: [0, 3] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['sorting', 'easy'] },
  },

  'insertion-sort': {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting',
    difficulty: 'easy',
    description: 'Build sorted array by inserting elements one at a time.',
    codeLanguages: {
      python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
      javascript: `function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    return arr;
}`,
      cpp: `void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
      java: `public static void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
    },
    inputFormat: 'Unsorted array',
    outputFormat: 'Sorted array',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    useCase: 'Small arrays, nearly sorted data, online sorting',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Start with i=1, key=34', narration: { english: 'Take second element 34 and insert correctly.', hindi: '34 लें और सही स्थान पर डालें।', hinglish: '34 len aur sahi sthan par dalen.' }, visualization: { type: 'array', data: [64, 34, 25, 12, 22], state: { i: 1, sorted: [0] } }, variables: { i: 1, key: 34 }, highlightedElements: [1] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['sorting', 'easy'] },
  },

  'merge-sort': {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting',
    difficulty: 'medium',
    description: 'Divide array, sort recursively, merge sorted halves.',
    codeLanguages: {
      python: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,
      javascript: `function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    let mid = Math.floor(arr.length / 2);
    let left = mergeSort(arr.slice(0, mid));
    let right = mergeSort(arr.slice(mid));
    return merge(left, right);
}`,
      cpp: `void mergeSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}`,
      java: `public static void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}`,
    },
    inputFormat: 'Unsorted array',
    outputFormat: 'Sorted array',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    useCase: 'Large datasets, stable sorting',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Divide array at middle', narration: { english: 'Divide array and recursively sort halves.', hindi: 'सरणी को आधे में विभाजित करें।', hinglish: 'Array ko adhe mein vibhajit karein.' }, visualization: { type: 'array', data: [64, 34, 25, 12, 22], state: { phase: 'divide' } }, variables: {}, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['sorting', 'medium', 'divide-conquer'] },
  },

  'quick-sort': {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'sorting',
    difficulty: 'medium',
    description: 'Partition with pivot, recursively sort partitions.',
    codeLanguages: {
      python: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + mid + quick_sort(right)`,
      javascript: `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => x < pivot);
    const mid = arr.filter(x => x === pivot);
    const right = arr.filter(x => x > pivot);
    return [...quickSort(left), ...mid, ...quickSort(right)];
}`,
      cpp: `void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
      java: `public static void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
    },
    inputFormat: 'Unsorted array',
    outputFormat: 'Sorted array',
    timeComplexity: 'O(n log n) avg',
    spaceComplexity: 'O(log n)',
    useCase: 'General-purpose sorting, practical use',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Choose pivot=25', narration: { english: 'Select middle element as pivot.', hindi: 'मध्य तत्व को पिवट चुनें।', hinglish: 'Madhya element ko pivot chunen.' }, visualization: { type: 'array', data: [64, 34, 25, 12, 22], state: { pivot: 25 } }, variables: { pivot: 25 }, highlightedElements: [2] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['sorting', 'medium', 'divide-conquer'] },
  },

  'heap-sort': {
    id: 'heap-sort',
    name: 'Heap Sort',
    category: 'sorting',
    difficulty: 'medium',
    description: 'Build max heap, repeatedly extract root to sort.',
    codeLanguages: {
      python: `def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    return arr`,
      javascript: `function heapSort(arr) {
    let n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        heapify(arr, i, 0);
    }
    return arr;
}`,
      cpp: `void heapSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--) heapify(arr, n, i);
    for (int i = n - 1; i > 0; i--) {
        swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}`,
      java: `public static void heapSort(int[] arr) {
    int n = arr.length;
    for (int i = n / 2 - 1; i >= 0; i--) heapify(arr, n, i);
    for (int i = n - 1; i > 0; i--) {
        int temp = arr[0];
        arr[0] = arr[i]; arr[i] = temp;
        heapify(arr, i, 0);
    }
}`,
    },
    inputFormat: 'Unsorted array',
    outputFormat: 'Sorted array',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
    useCase: 'Guaranteed O(n log n), in-place sorting',
    visualizationType: 'array',
    sampleInput: { arr: [64, 34, 25, 12, 22] },
    sampleOutput: [12, 22, 25, 34, 64],
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Build max heap', narration: { english: 'Heapify array to form max heap.', hindi: 'मैक्स हीप संरचना बनाएं।', hinglish: 'Max heap banayein.' }, visualization: { type: 'array', data: [64, 34, 25, 12, 22], state: { phase: 'heapify' } }, variables: {}, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['sorting', 'medium', 'heap'] },
  },

  // ==================== TWO POINTERS ====================
  'two-sum': {
    id: 'two-sum',
    name: 'Two Sum',
    category: 'two-pointers',
    difficulty: 'easy',
    description: 'Find two numbers that add up to target using hash map.',
    codeLanguages: {
      python: `def two_sum(arr, target):
    seen = {}
    for i, num in enumerate(arr):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      javascript: `function twoSum(arr, target) {
    const seen = {};
    for (let i = 0; i < arr.length; i++) {
        const complement = target - arr[i];
        if (complement in seen) {
            return [seen[complement], i];
        }
        seen[arr[i]] = i;
    }
    return [];
}`,
      cpp: `vector<int> twoSum(vector<int>& arr, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < arr.size(); i++) {
        int complement = target - arr[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[arr[i]] = i;
    }
    return {};
}`,
      java: `public int[] twoSum(int[] arr, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < arr.length; i++) {
        int complement = target - arr[i];
        if (seen.containsKey(complement)) {
            return new int[]{seen.get(complement), i};
        }
        seen.put(arr[i], i);
    }
    return new int[]{};
}`,
    },
    inputFormat: 'Array and target sum',
    outputFormat: 'Indices of two numbers',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    useCase: 'Array problems, interviews',
    visualizationType: 'array',
    sampleInput: { arr: [2, 7, 11, 15], target: 9 },
    sampleOutput: [0, 1],
    steps: [
      { stepIndex: 0, lineNumber: 4, action: 'Check 2, need 7', narration: { english: 'Check 2. We need 7 to make sum 9.', hindi: '2 को देखें। हमें 7 चाहिए।', hinglish: '2 ko dekhen. Humne 7 chahiye.' }, visualization: { type: 'array', data: [2, 7, 11, 15], state: { i: 0 } }, variables: { complement: 7, target: 9 }, highlightedElements: [0] },
      { stepIndex: 1, lineNumber: 4, action: 'Check 7, found 2!', narration: { english: 'Check 7. Found 2! Return indices [0,1].', hindi: '7 को चेक करें। 2 मिल गया! [0,1] रिटर्न करें।', hinglish: '7 check karein. 2 mil gaya!' }, visualization: { type: 'array', data: [2, 7, 11, 15], state: { found: true } }, variables: { found: true }, highlightedElements: [0, 1] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['array', 'two-pointers'] },
  },

  'container-most-water': {
    id: 'container-most-water',
    name: 'Container With Most Water',
    category: 'two-pointers',
    difficulty: 'medium',
    description: 'Find two lines forming container with maximum area.',
    codeLanguages: {
      python: `def maxArea(height):
    left, right = 0, len(height) - 1
    max_area = 0
    while left < right:
        current = min(height[left], height[right]) * (right - left)
        max_area = max(max_area, current)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return max_area`,
      javascript: `function maxArea(height) {
    let left = 0, right = height.length - 1;
    let maxArea = 0;
    while (left < right) {
        let current = Math.min(height[left], height[right]) * (right - left);
        maxArea = Math.max(maxArea, current);
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxArea;
}`,
      cpp: `int maxArea(vector<int>& height) {
    int left = 0, right = height.size() - 1;
    int maxArea = 0;
    while (left < right) {
        int current = min(height[left], height[right]) * (right - left);
        maxArea = max(maxArea, current);
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxArea;
}`,
      java: `public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxArea = 0;
    while (left < right) {
        int current = Math.min(height[left], height[right]) * (right - left);
        maxArea = Math.max(maxArea, current);
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxArea;
}`,
    },
    inputFormat: 'Array of heights',
    outputFormat: 'Maximum area',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'Greedy algorithms, two-pointers',
    visualizationType: 'array',
    sampleInput: { heights: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
    sampleOutput: 49,
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Start with left=0, right=8', narration: { english: 'Initialize pointers at both ends.', hindi: 'दोनों सिरों पर सूचक रखें।', hinglish: 'Donon siro par pointer rakhen.' }, visualization: { type: 'array', data: [1, 8, 6, 2, 5, 4, 8, 3, 7], state: { left: 0, right: 8 } }, variables: { left: 0, right: 8 }, highlightedElements: [0, 8] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['two-pointers', 'greedy'] },
  },

  // ==================== DYNAMIC PROGRAMMING ====================
  'climbing-stairs': {
    id: 'climbing-stairs',
    name: 'Climbing Stairs',
    category: 'dynamic-programming',
    difficulty: 'easy',
    description: 'Count ways to climb n stairs taking 1 or 2 steps.',
    codeLanguages: {
      python: `def climbStairs(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for i in range(3, n + 1):
        a, b = b, a + b
    return b`,
      javascript: `function climbStairs(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}`,
      cpp: `int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
      java: `public int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
    },
    inputFormat: 'Number of stairs',
    outputFormat: 'Number of ways',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'DP introduction, fibonacci-like problems',
    visualizationType: 'array',
    sampleInput: { n: 5 },
    sampleOutput: 8,
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'dp[1]=1', narration: { english: 'Base case: 1 stair = 1 way.', hindi: '1 सीढ़ी = 1 तरीका।', hinglish: '1 sidhi = 1 tareeka.' }, visualization: { type: 'array', data: [0, 1, 0, 0, 0, 0], state: {} }, variables: { n: 5 }, highlightedElements: [1] },
      { stepIndex: 1, lineNumber: 2, action: 'dp[2]=2', narration: { english: '2 stairs: 1+1 or 2 = 2 ways.', hindi: '2 सीढ़ी: 1+1 या 2 = 2 तरीके।', hinglish: '2 sidhi: 1+1 ya 2 = 2 tareeke.' }, visualization: { type: 'array', data: [0, 1, 2, 0, 0, 0], state: {} }, variables: { n: 5 }, highlightedElements: [2] },
      { stepIndex: 2, lineNumber: 5, action: 'dp[3]=dp[2]+dp[1]=3', narration: { english: 'Each stairs = sum of previous two.', hindi: 'हर सीढ़ी = पिछली दो का योग।', hinglish: 'Har sidhi = pichli do ka sum.' }, visualization: { type: 'array', data: [0, 1, 2, 3, 0, 0], state: {} }, variables: { n: 5 }, highlightedElements: [3] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['dp', 'easy', 'fibonacci'] },
  },

  'fibonacci': {
    id: 'fibonacci',
    name: 'Fibonacci Sequence',
    category: 'dynamic-programming',
    difficulty: 'easy',
    description: 'Generate fibonacci where each term is sum of previous two.',
    codeLanguages: {
      python: `def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
      javascript: `function fibonacci(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}`,
      cpp: `int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
      java: `public int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
    },
    inputFormat: 'Position n',
    outputFormat: 'Fibonacci number at position n',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'DP basics, sequence generation',
    visualizationType: 'array',
    sampleInput: { n: 7 },
    sampleOutput: 13,
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'fib(0)=0', narration: { english: 'First fibonacci is 0.', hindi: 'पहली फाइबोनैच्ची 0 है।', hinglish: 'Pehli Fibonacci 0 hai.' }, visualization: { type: 'array', data: [0, 1, 1, 2, 3, 5, 8, 13], state: {} }, variables: { n: 7 }, highlightedElements: [0] },
      { stepIndex: 1, lineNumber: 2, action: 'fib(1)=1', narration: { english: 'Second fibonacci is 1.', hindi: 'दूसरी फाइबोनैच्ची 1 है।', hinglish: 'Dusri Fibonacci 1 hai.' }, visualization: { type: 'array', data: [0, 1, 1, 2, 3, 5, 8, 13], state: {} }, variables: { n: 7 }, highlightedElements: [1] },
      { stepIndex: 2, lineNumber: 5, action: 'Continue pattern', narration: { english: 'Each number = sum of previous two.', hindi: 'हर संख्या = पिछली दो का योग।', hinglish: 'Har number = pichli do ka sum.' }, visualization: { type: 'array', data: [0, 1, 1, 2, 3, 5, 8, 13], state: {} }, variables: { n: 7 }, highlightedElements: [0, 1, 2, 3, 4, 5, 6, 7] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['dp', 'easy', 'sequence'] },
  },

  'coin-change': {
    id: 'coin-change',
    name: 'Coin Change',
    category: 'dynamic-programming',
    difficulty: 'medium',
    description: 'Find minimum coins to make given amount.',
    codeLanguages: {
      python: `def coinChange(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
      javascript: `function coinChange(coins, amount) {
    const dp = Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
        for (let coin of coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      cpp: `int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, INT_MAX);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i && dp[i - coin] != INT_MAX) {
                dp[i] = min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] == INT_MAX ? -1 : dp[amount];
}`,
      java: `public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i && dp[i - coin] != Integer.MAX_VALUE) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
}`,
    },
    inputFormat: 'Coin denominations and target amount',
    outputFormat: 'Minimum coins or -1',
    timeComplexity: 'O(n*amount)',
    spaceComplexity: 'O(amount)',
    useCase: 'Optimization problems, change making',
    visualizationType: 'array',
    sampleInput: { coins: [1, 2, 5], amount: 5 },
    sampleOutput: 1,
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Initialize dp array', narration: { english: 'Create dp array for minimum coins at each amount.', hindi: 'dp सरणी बनाएं जो न्यूनतम सिक्के दिखाए।', hinglish: 'dp array banayein jo minimum coins dikhaaye.' }, visualization: { type: 'array', data: [0, 1, 1, 2, 2, 1], state: {} }, variables: { amount: 5 }, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['dp', 'medium', 'optimization'] },
  },

  'longest-common-subsequence': {
    id: 'longest-common-subsequence',
    name: 'Longest Common Subsequence',
    category: 'dynamic-programming',
    difficulty: 'medium',
    description: 'Find length of LCS between two strings.',
    codeLanguages: {
      python: `def lcs(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`,
      javascript: `function lcs(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i-1] === text2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[m][n];
}`,
      cpp: `int lcs(string text1, string text2) {
    int m = text1.size(), n = text2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1[i-1] == text2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[m][n];
}`,
      java: `public int lcs(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i-1) == text2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[m][n];
}`,
    },
    inputFormat: 'Two strings',
    outputFormat: 'Length of LCS',
    timeComplexity: 'O(m*n)',
    spaceComplexity: 'O(m*n)',
    useCase: 'String matching, sequence alignment',
    visualizationType: 'array',
    sampleInput: { text1: 'abc', text2: 'ac' },
    sampleOutput: 2,
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Build DP table', narration: { english: 'Build 2D DP table for LCS lengths.', hindi: 'LCS लंबाई के लिए DP टेबल बनाएं।', hinglish: 'LCS length ke liye DP table banayein.' }, visualization: { type: 'array', data: [], state: {} }, variables: {}, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['dp', 'medium', 'string'] },
  },

  '0-1-knapsack': {
    id: '0-1-knapsack',
    name: '0/1 Knapsack',
    category: 'dynamic-programming',
    difficulty: 'medium',
    description: 'Maximize value with weight constraint. Each item 0 or 1 times.',
    codeLanguages: {
      python: `def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w])
            else:
                dp[i][w] = dp[i-1][w]
    return dp[n][capacity]`,
      javascript: `function knapsack(weights, values, capacity) {
    const n = weights.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= capacity; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w]);
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    return dp[n][capacity];
}`,
      cpp: `int knapsack(vector<int>& weights, vector<int>& values, int capacity) {
    int n = weights.size();
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w]);
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    return dp[n][capacity];
}`,
      java: `public int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w]);
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    return dp[n][capacity];
}`,
    },
    inputFormat: 'Weights, values, and capacity',
    outputFormat: 'Maximum value',
    timeComplexity: 'O(n*capacity)',
    spaceComplexity: 'O(n*capacity)',
    useCase: 'Resource allocation, optimization',
    visualizationType: 'array',
    sampleInput: { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 5 },
    sampleOutput: 10,
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Build DP table', narration: { english: 'Build 2D table to find maximum value.', hindi: 'अधिकतम मान के लिए टेबल बनाएं।', hinglish: 'Maximum value ke liye table banayein.' }, visualization: { type: 'array', data: [], state: {} }, variables: { capacity: 5 }, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['dp', 'medium', 'backpack'] },
  },

  // ==================== GRAPH ALGORITHMS ====================
  'breadth-first-search': {
    id: 'breadth-first-search',
    name: 'Breadth-First Search (BFS)',
    category: 'graphs',
    difficulty: 'medium',
    description: 'Traverse graph level by level using queue.',
    codeLanguages: {
      python: `def bfs(graph, start):
    visited = set()
    queue = [start]
    visited.add(start)
    result = []
    while queue:
        vertex = queue.pop(0)
        result.append(vertex)
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return result`,
      javascript: `function bfs(graph, start) {
    const visited = new Set();
    const queue = [start];
    visited.add(start);
    const result = [];
    while (queue.length > 0) {
        const vertex = queue.shift();
        result.push(vertex);
        for (let neighbor of graph[vertex] || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return result;
}`,
      cpp: `vector<int> bfs(vector<vector<int>>& graph, int start) {
    vector<bool> visited(graph.size(), false);
    queue<int> q;
    vector<int> result;
    q.push(start);
    visited[start] = true;
    while (!q.empty()) {
        int vertex = q.front();
        q.pop();
        result.push_back(vertex);
        for (int neighbor : graph[vertex]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
    return result;
}`,
      java: `public List<Integer> bfs(List<List<Integer>> graph, int start) {
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new LinkedList<>();
    List<Integer> result = new ArrayList<>();
    queue.add(start);
    visited[start] = true;
    while (!queue.isEmpty()) {
        int vertex = queue.poll();
        result.add(vertex);
        for (int neighbor : graph.get(vertex)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.add(neighbor);
            }
        }
    }
    return result;
}`,
    },
    inputFormat: 'Graph and start node',
    outputFormat: 'BFS traversal order',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    useCase: 'Shortest path, level order, connected components',
    visualizationType: 'graph',
    sampleInput: { graph: { 0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2] }, start: 0 },
    sampleOutput: [0, 1, 2, 3],
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Start BFS from node 0', narration: { english: 'Begin BFS from node 0. Add to queue.', hindi: 'नोड 0 से शुरू करें। कतार में जोड़ें।', hinglish: 'Node 0 se shuru karein. Queue mein jodhen.' }, visualization: { type: 'graph', data: [], state: { visited: [0], queue: [0] } }, variables: { start: 0 }, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['graph', 'medium', 'traversal'] },
  },

  'depth-first-search': {
    id: 'depth-first-search',
    name: 'Depth-First Search (DFS)',
    category: 'graphs',
    difficulty: 'medium',
    description: 'Traverse graph exploring deep before wide using stack/recursion.',
    codeLanguages: {
      python: `def dfs(graph, vertex, visited=None):
    if visited is None:
        visited = set()
    visited.add(vertex)
    result = [vertex]
    for neighbor in graph[vertex]:
        if neighbor not in visited:
            result.extend(dfs(graph, neighbor, visited))
    return result`,
      javascript: `function dfs(graph, vertex, visited = new Set()) {
    visited.add(vertex);
    let result = [vertex];
    for (let neighbor of graph[vertex] || []) {
        if (!visited.has(neighbor)) {
            result.push(...dfs(graph, neighbor, visited));
        }
    }
    return result;
}`,
      cpp: `void dfs(vector<vector<int>>& graph, int vertex, vector<bool>& visited, vector<int>& result) {
    visited[vertex] = true;
    result.push_back(vertex);
    for (int neighbor : graph[vertex]) {
        if (!visited[neighbor]) {
            dfs(graph, neighbor, visited, result);
        }
    }
}`,
      java: `public List<Integer> dfs(List<List<Integer>> graph, int vertex, boolean[] visited, List<Integer> result) {
    visited[vertex] = true;
    result.add(vertex);
    for (int neighbor : graph.get(vertex)) {
        if (!visited[neighbor]) {
            dfs(graph, neighbor, visited, result);
        }
    }
    return result;
}`,
    },
    inputFormat: 'Graph and start node',
    outputFormat: 'DFS traversal order',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    useCase: 'Topological sort, cycle detection, connected components',
    visualizationType: 'graph',
    sampleInput: { graph: { 0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2] }, start: 0 },
    sampleOutput: [0, 1, 3, 2],
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Visit node 0', narration: { english: 'Start DFS at node 0. Mark visited.', hindi: 'नोड 0 पर DFS शुरू करें।', hinglish: 'Node 0 par DFS shuru karein.' }, visualization: { type: 'graph', data: [], state: { visited: [0], current: 0 } }, variables: { vertex: 0 }, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['graph', 'medium', 'traversal'] },
  },

  'dijkstra': {
    id: 'dijkstra',
    name: 'Dijkstra\'s Shortest Path',
    category: 'graphs',
    difficulty: 'hard',
    description: 'Find shortest path from source to all vertices.',
    codeLanguages: {
      python: `def dijkstra(graph, start):
    import heapq
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    while pq:
        curr_dist, curr = heapq.heappop(pq)
        if curr_dist > distances[curr]:
            continue
        for neighbor, weight in graph[curr]:
            distance = curr_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
    return distances`,
      javascript: `function dijkstra(graph, start) {
    const distances = {};
    const visited = new Set();
    for (let node in graph) distances[node] = Infinity;
    distances[start] = 0;
    while (visited.size < Object.keys(graph).length) {
        let minNode = null, minDist = Infinity;
        for (let node in distances) {
            if (!visited.has(node) && distances[node] < minDist) {
                minNode = node; minDist = distances[node];
            }
        }
        if (minNode === null) break;
        visited.add(minNode);
        for (let [neighbor, weight] of graph[minNode] || []) {
            distances[neighbor] = Math.min(distances[neighbor], distances[minNode] + weight);
        }
    }
    return distances;
}`,
      cpp: `map<int, int> dijkstra(vector<vector<pair<int, int>>>& graph, int start) {
    map<int, int> distances;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    for (size_t i = 0; i < graph.size(); i++) distances[i] = INT_MAX;
    distances[start] = 0;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [dist, u] = pq.top(); pq.pop();
        if (dist > distances[u]) continue;
        for (auto [v, w] : graph[u]) {
            if (distances[u] + w < distances[v]) {
                distances[v] = distances[u] + w;
                pq.push({distances[v], v});
            }
        }
    }
    return distances;
}`,
      java: `public Map<Integer, Integer> dijkstra(List<List<Pair>> graph, int start) {
    Map<Integer, Integer> distances = new HashMap<>();
    PriorityQueue<Pair> pq = new PriorityQueue<>();
    for (int i = 0; i < graph.size(); i++) distances.put(i, Integer.MAX_VALUE);
    distances.put(start, 0);
    pq.add(new Pair(0, start));
    while (!pq.isEmpty()) {
        Pair curr = pq.poll();
        if (curr.dist > distances.get(curr.node)) continue;
        for (Pair next : graph.get(curr.node)) {
            int newDist = distances.get(curr.node) + next.dist;
            if (newDist < distances.get(next.node)) {
                distances.put(next.node, newDist);
                pq.add(new Pair(newDist, next.node));
            }
        }
    }
    return distances;
}`,
    },
    inputFormat: 'Weighted graph and source node',
    outputFormat: 'Shortest distances from source',
    timeComplexity: 'O((V+E)log V)',
    spaceComplexity: 'O(V)',
    useCase: 'GPS navigation, network routing',
    visualizationType: 'graph',
    sampleInput: { graph: { 0: [[1, 4], [2, 1]], 1: [[0, 4], [2, 2]], 2: [[0, 1], [1, 2]] }, start: 0 },
    sampleOutput: { 0: 0, 1: 3, 2: 1 },
    steps: [
      { stepIndex: 0, lineNumber: 4, action: 'Initialize distances', narration: { english: 'Set start distance to 0, others as infinity.', hindi: 'शुरुआत दूरी = 0, बाकी = अनंत।', hinglish: 'Start distance 0, baaki infinite.' }, visualization: { type: 'graph', data: [], state: {} }, variables: { start: 0 }, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['graph', 'hard', 'shortest-path'] },
  },

  // ==================== RECURSION / BACKTRACKING ====================
  'n-queens': {
    id: 'n-queens',
    name: 'N-Queens Problem',
    category: 'graphs',
    difficulty: 'hard',
    description: 'Place N queens on NxN board so no two queens attack each other.',
    codeLanguages: {
      python: `def solve_n_queens(n):
    def backtrack(row, cols, diag1, diag2, board):
        if row == n:
            solutions.append([row[:] for row in board])
            return
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue
            board[row][col] = True
            cols.add(col)
            diag1.add(row - col)
            diag2.add(row + col)
            
            backtrack(row + 1, cols, diag1, diag2, board)
            
            board[row][col] = False
            cols.discard(col)
            diag1.discard(row - col)
            diag2.discard(row + col)
    
    solutions = []
    board = [[False] * n for _ in range(n)]
    backtrack(0, set(), set(), set(), board)
    return solutions`,
      javascript: `function solveNQueens(n) {
    const solutions = [];
    const cols = new Set(), diag1 = new Set(), diag2 = new Set();
    const board = Array(n).fill().map(() => Array(n).fill(false));
    
    function backtrack(row) {
        if (row === n) {
            solutions.push(board.map(r => [...r]));
            return;
        }
        for (let col = 0; col < n; col++) {
            if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
            board[row][col] = true;
            cols.add(col);
            diag1.add(row - col);
            diag2.add(row + col);
            
            backtrack(row + 1);
            
            board[row][col] = false;
            cols.delete(col);
            diag1.delete(row - col);
            diag2.delete(row + col);
        }
    }
    backtrack(0);
    return solutions;
}`,
      cpp: `void solveNQueens(int n, int row, vector<vector<int>>& board, set<int>& cols, set<int>& diag1, set<int>& diag2, vector<vector<vector<int>>>& solutions) {
    if (row == n) {
        solutions.push_back(board);
        return;
    }
    for (int col = 0; col < n; col++) {
        if (cols.count(col) || diag1.count(row - col) || diag2.count(row + col)) continue;
        board[row][col] = 1;
        cols.insert(col);
        diag1.insert(row - col);
        diag2.insert(row + col);
        
        solveNQueens(n, row + 1, board, cols, diag1, diag2, solutions);
        
        board[row][col] = 0;
        cols.erase(col);
        diag1.erase(row - col);
        diag2.erase(row + col);
    }
}`,
      java: `public List<List<String>> solveNQueens(int n) {
    List<List<String>> solutions = new ArrayList<>();
    boolean[][] board = new boolean[n][n];
    Set<Integer> cols = new HashSet<>(), diag1 = new HashSet<>(), diag2 = new HashSet<>();
    backtrack(0, board, cols, diag1, diag2, solutions, n);
    return solutions;
}`,
    },
    inputFormat: 'Integer N',
    outputFormat: 'All valid board configurations',
    timeComplexity: 'O(N!)',
    spaceComplexity: 'O(N)',
    useCase: 'Constraint satisfaction, backtracking',
    visualizationType: 'graph',
    sampleInput: { n: 4 },
    sampleOutput: 2,
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Start placing queens from row 0', narration: { english: 'Try placing queen at each column in row 0.', hindi: 'हर स्तंभ में रानी रखने का प्रयास करें।', hinglish: 'Har column mein queen rakhne ka prayas karein.' }, visualization: { type: 'graph', data: [], state: { row: 0 } }, variables: { n: 4 }, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['backtracking', 'hard', 'constraint'] },
  },

  // ==================== LINKED LIST / STACK / QUEUE ====================
  'reverse-linked-list': {
    id: 'reverse-linked-list',
    name: 'Reverse Linked List',
    category: 'linked-list',
    difficulty: 'easy',
    description: 'Reverse a linked list iteratively.',
    codeLanguages: {
      python: `def reverseList(head):
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev`,
      javascript: `function reverseList(head) {
    let prev = null, curr = head;
    while (curr) {
        const nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
      cpp: `ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
      java: `public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
    },
    inputFormat: 'Head of linked list',
    outputFormat: 'Head of reversed list',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'Linked list manipulation',
    visualizationType: 'linked-list',
    sampleInput: { list: [1, 2, 3, 4, 5] },
    sampleOutput: [5, 4, 3, 2, 1],
    steps: [
      { stepIndex: 0, lineNumber: 3, action: 'Start with head=1, prev=null', narration: { english: 'Initialize pointers at start.', hindi: 'सूचक को शुरुआत में सेट करें।', hinglish: 'Pointers ko start mein set karein.' }, visualization: { type: 'linked-list', data: [[1, 2, 3]], state: {} }, variables: { prev: null }, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['linked-list', 'easy'] },
  },

  'detect-cycle-linked-list': {
    id: 'detect-cycle-linked-list',
    name: 'Detect Cycle in Linked List',
    category: 'linked-list',
    difficulty: 'easy',
    description: 'Detect if linked list has cycle using Floyd\'s algorithm.',
    codeLanguages: {
      python: `def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False`,
      javascript: `function hasCycle(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
}`,
      cpp: `bool hasCycle(ListNode *head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`,
      java: `public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}`,
    },
    inputFormat: 'Head of linked list',
    outputFormat: 'True if cycle exists, false otherwise',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    useCase: 'Cycle detection in linked lists',
    visualizationType: 'linked-list',
    sampleInput: { list: [1, 2, 3, 4, 5], cycleAt: 2 },
    sampleOutput: true,
    steps: [
      { stepIndex: 0, lineNumber: 2, action: 'Initialize slow=head, fast=head', narration: { english: 'Use Floyd\'s cycle detection algorithm.', hindi: 'फ्लॉयड\'s एल्गोरिथम का उपयोग करें।', hinglish: 'Floyd algorithm ka upyog karein.' }, visualization: { type: 'linked-list', data: [[1, 2, 3]], state: {} }, variables: {}, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['linked-list', 'easy'] },
  },

  'stack-operations': {
    id: 'stack-operations',
    name: 'Stack Push/Pop',
    category: 'stack-queue',
    difficulty: 'easy',
    description: 'Basic stack operations: push and pop elements.',
    codeLanguages: {
      python: `class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        if not self.is_empty():
            return self.items.pop()
    
    def is_empty(self):
        return len(self.items) == 0`,
      javascript: `class Stack {
    constructor() {
        this.items = [];
    }
    push(item) { this.items.push(item); }
    pop() { if (!this.isEmpty()) return this.items.pop(); }
    isEmpty() { return this.items.length === 0; }
    peek() { if (!this.isEmpty()) return this.items[this.items.length - 1]; }
}`,
      cpp: `class Stack {
    vector<int> items;
public:
    void push(int item) { items.push_back(item); }
    int pop() { if (!isEmpty()) { int top = items.back(); items.pop_back(); return top; } return -1; }
    bool isEmpty() { return items.empty(); }
};`,
      java: `class Stack<T> {
    private List<T> items = new ArrayList<>();
    public void push(T item) { items.add(item); }
    public T pop() { if (!isEmpty()) return items.remove(items.size() - 1); return null; }
    public T peek() { if (!isEmpty()) return items.get(items.size() - 1); return null; }
}`,
    },
    inputFormat: 'Operations and values',
    outputFormat: 'Stack state',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(n)',
    useCase: 'Memory management, expression evaluation',
    visualizationType: 'array',
    sampleInput: { operations: ['push 1', 'push 2', 'push 3', 'pop'] },
    sampleOutput: [1, 2],
    steps: [
      { stepIndex: 0, lineNumber: 6, action: 'Push 1', narration: { english: 'Add element 1 to top of stack.', hindi: 'स्टैक में 1 जोड़ें।', hinglish: 'Stack mein 1 jodhen.' }, visualization: { type: 'array', data: [1], state: {} }, variables: {}, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['stack', 'easy'] },
  },

  'queue-operations': {
    id: 'queue-operations',
    name: 'Queue Enqueue/Dequeue',
    category: 'stack-queue',
    difficulty: 'easy',
    description: 'Basic queue operations: enqueue and dequeue elements.',
    codeLanguages: {
      python: `from collections import deque

class Queue:
    def __init__(self):
        self.items = deque()
    
    def enqueue(self, item):
        self.items.append(item)
    
    def dequeue(self):
        if not self.is_empty():
            return self.items.popleft()`,
      javascript: `class Queue {
    constructor() { this.items = []; }
    enqueue(item) { this.items.push(item); }
    dequeue() { if (!this.isEmpty()) return this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
}`,
      cpp: `class Queue {
    queue<int> items;
public:
    void enqueue(int item) { items.push(item); }
    int dequeue() { if (!isEmpty()) { int front = items.front(); items.pop(); return front; } return -1; }
    bool isEmpty() { return items.empty(); }
};`,
      java: `class Queue<T> {
    private List<T> items = new ArrayList<>();
    public void enqueue(T item) { items.add(item); }
    public T dequeue() { if (!isEmpty()) return items.remove(0); return null; }
    public boolean isEmpty() { return items.isEmpty(); }
}`,
    },
    inputFormat: 'Operations and values',
    outputFormat: 'Queue state',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(n)',
    useCase: 'Job scheduling, task management',
    visualizationType: 'array',
    sampleInput: { operations: ['enqueue 1', 'enqueue 2', 'enqueue 3', 'dequeue'] },
    sampleOutput: [2, 3],
    steps: [
      { stepIndex: 0, lineNumber: 6, action: 'Enqueue 1', narration: { english: 'Add 1 to back of queue.', hindi: 'कतार में 1 जोड़ें।', hinglish: 'Queue mein 1 jodhen.' }, visualization: { type: 'array', data: [1], state: {} }, variables: {}, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['queue', 'easy'] },
  },

  // ==================== TREE ALGORITHMS ====================
  'bst-insert-search': {
    id: 'bst-insert-search',
    name: 'BST Insert & Search',
    category: 'trees',
    difficulty: 'easy',
    description: 'Insert and search elements in binary search tree.',
    codeLanguages: {
      python: `class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

class BST:
    def __init__(self):
        self.root = None
    
    def insert(self, val):
        if not self.root:
            self.root = TreeNode(val)
        else:
            self._insert_helper(self.root, val)
    
    def _insert_helper(self, node, val):
        if val < node.val:
            if node.left is None:
                node.left = TreeNode(val)
            else:
                self._insert_helper(node.left, val)
        else:
            if node.right is None:
                node.right = TreeNode(val)
            else:
                self._insert_helper(node.right, val)`,
      javascript: `class TreeNode {
    constructor(val = 0) { this.val = val; this.left = null; this.right = null; }
}
class BST {
    insert(val) {
        if (!this.root) this.root = new TreeNode(val);
        else this._insertHelper(this.root, val);
    }
    _insertHelper(node, val) {
        if (val < node.val) {
            node.left ? this._insertHelper(node.left, val) : (node.left = new TreeNode(val));
        } else {
            node.right ? this._insertHelper(node.right, val) : (node.right = new TreeNode(val));
        }
    }
}`,
      cpp: `struct TreeNode { int val; TreeNode* left; TreeNode* right; TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} };
class BST {
    TreeNode* root = nullptr;
public:
    void insert(int val) { root = insertHelper(root, val); }
    TreeNode* insertHelper(TreeNode* node, int val) {
        if (!node) return new TreeNode(val);
        if (val < node->val) node->left = insertHelper(node->left, val);
        else node->right = insertHelper(node->right, val);
        return node;
    }
};`,
      java: `class TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }
public class BST {
    TreeNode root;
    public void insert(int val) { root = insertHelper(root, val); }
    private TreeNode insertHelper(TreeNode node, int val) {
        if (node == null) return new TreeNode(val);
        if (val < node.val) node.left = insertHelper(node.left, val);
        else node.right = insertHelper(node.right, val);
        return node;
    }
}`,
    },
    inputFormat: 'Values to insert and search',
    outputFormat: 'Boolean for search results',
    timeComplexity: 'O(log n) avg',
    spaceComplexity: 'O(n)',
    useCase: 'Binary search trees, data structures',
    visualizationType: 'tree',
    sampleInput: { operations: ['insert 50', 'insert 30', 'insert 70', 'search 30'] },
    sampleOutput: true,
    steps: [
      { stepIndex: 0, lineNumber: 8, action: 'Insert 50 as root', narration: { english: 'Insert 50 as the root node.', hindi: 'जड़ नोड में 50 डालें।', hinglish: 'Root node mein 50 dalen.' }, visualization: { type: 'tree', data: [[50]], state: {} }, variables: { val: 50 }, highlightedElements: [0] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['tree', 'bst', 'easy'] },
  },

  'tree-inorder-traversal': {
    id: 'tree-inorder-traversal',
    name: 'Tree Inorder Traversal',
    category: 'trees',
    difficulty: 'easy',
    description: 'Traverse tree in inorder (Left, Root, Right) order.',
    codeLanguages: {
      python: `def inorderTraversal(root):
    result = []
    def dfs(node):
        if not node:
            return
        dfs(node.left)
        result.append(node.val)
        dfs(node.right)
    dfs(root)
    return result`,
      javascript: `function inorderTraversal(root) {
    const result = [];
    function dfs(node) {
        if (!node) return;
        dfs(node.left);
        result.push(node.val);
        dfs(node.right);
    }
    dfs(root);
    return result;
}`,
      cpp: `vector<int> inorderTraversal(TreeNode* root) {
    vector<int> result;
    function<void(TreeNode*)> dfs = [&](TreeNode* node) {
        if (!node) return;
        dfs(node->left);
        result.push_back(node->val);
        dfs(node->right);
    };
    dfs(root);
    return result;
}`,
      java: `public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    dfs(root, result);
    return result;
}
private void dfs(TreeNode node, List<Integer> result) {
    if (node == null) return;
    dfs(node.left, result);
    result.add(node.val);
    dfs(node.right, result);
}`,
    },
    inputFormat: 'Tree root node',
    outputFormat: 'Inorder traversal list',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    useCase: 'Tree traversal, BST validation',
    visualizationType: 'tree',
    sampleInput: { tree: [1, null, 2] },
    sampleOutput: [1, 2],
    steps: [
      { stepIndex: 0, lineNumber: 4, action: 'Visit left subtree', narration: { english: 'Recursively visit left subtree first.', hindi: 'पहले बाएं उप-पेड़ को देखें।', hinglish: 'Pehle baaye sub-tree ko dekhen.' }, visualization: { type: 'tree', data: [[1, null, 2]], state: {} }, variables: {}, highlightedElements: [] },
    ],
    metadata: { author: 'DSA Lab', lastUpdated: '2024-01-15', tags: ['tree', 'traversal', 'easy'] },
  },
};

export function getAllTemplates(): AlgorithmTemplate[] {
  return Object.values(ALGORITHM_TEMPLATES);
}

export function getTemplateById(id: string): AlgorithmTemplate | undefined {
  return ALGORITHM_TEMPLATES[id];
}

export function getTemplatesByCategory(category: string): AlgorithmTemplate[] {
  return Object.values(ALGORITHM_TEMPLATES).filter((t) => t.category === category);
}
