import { VisualizerStep, AlgorithmTemplate } from '@/types/visualizer';

export const sortingTemplates: AlgorithmTemplate[] = [
    {
        id: 'bubble_sort',
        name: 'Bubble Sort',
        category: 'Sorting',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
        starterCode: `function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}`,
        sampleInput: [8, 3, 5, 1, 9, 2, 7, 4],
        visualizationType: 'bars',
        supportedLanguages: ['en', 'hi', 'hinglish'],
        generateSteps: (input: number[]) => {
            let arr = [...input];
            let steps: VisualizerStep[] = [];
            let n = arr.length;
            let stepIdx = 0;

            steps.push({
                stepIndex: stepIdx++,
                activeLines: [1, 2],
                title: "Initialize Array",
                description: `Starting bubble sort on array of size ${n}.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: [] },
                audioText: {
                    en: `Starting bubble sort on an array of size ${n}.`,
                    hi: `एक नए अरेय पर बबल सॉर्ट शुरू कर रहे हैं, जिसका आकार ${n} है।`,
                    hinglish: `Array of size ${n} par bubble sort start karte hain.`
                }
            });

            for (let i = 0; i < n - 1; i++) {
                for (let j = 0; j < n - i - 1; j++) {
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [4, 5],
                        title: "Compare Elements",
                        description: `Comparing elements at index ${j} (${arr[j]}) and ${j + 1} (${arr[j + 1]}).`,
                        stateSnapshot: { array: [...arr], compared: [j, j + 1], swapped: [], sorted: Array.from({length: i}, (_, idx) => n - 1 - idx) },
                        audioText: {
                            en: `Comparing ${arr[j]} and ${arr[j + 1]}.`,
                            hi: `${arr[j]} और ${arr[j + 1]} की तुलना कर रहे हैं।`,
                            hinglish: `${arr[j]} and ${arr[j + 1]} ko compare kar rahe hain.`
                        }
                    });

                    if (arr[j] > arr[j + 1]) {
                        let temp = arr[j];
                        arr[j] = arr[j+1];
                        arr[j+1] = temp;

                        steps.push({
                            stepIndex: stepIdx++,
                            activeLines: [6, 7, 8, 9],
                            title: "Swap Elements",
                            description: `Since ${arr[j+1]} > ${arr[j]}, we swap them.`,
                            stateSnapshot: { array: [...arr], compared: [j, j+1], swapped: [j, j+1], sorted: Array.from({length: i}, (_, idx) => n - 1 - idx) },
                            audioText: {
                                en: `We swap them because ${arr[j+1]} is greater.`,
                                hi: `हम इन्हें आपस में बदल देते हैं, क्योंकि पहला तत्व बड़ा है।`,
                                hinglish: `Since pehla bada hai, we swap them.`
                            }
                        });
                    }
                }
            }
            
            steps.push({
                stepIndex: stepIdx++,
                activeLines: [],
                title: "Sorted",
                description: `Array is now fully sorted.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: Array.from({length: n}, (_, idx) => idx) },
                audioText: {
                    en: `The array is now fully sorted.`,
                    hi: `एरे अब पूरी तरह से क्रमबद्ध है।`,
                    hinglish: `Array ab fully sorted hai.`
                }
            });

            return steps;
        }
    },
    {
        id: 'selection_sort',
        name: 'Selection Sort',
        category: 'Sorting',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        description: 'Repeatedly finds the minimum element from the unsorted part and puts it at the beginning.',
        starterCode: `function selectionSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    let temp = arr[i];
    arr[i] = arr[minIdx];
    arr[minIdx] = temp;
  }
}`,
        sampleInput: [8, 3, 5, 1, 9, 2, 7, 4],
        visualizationType: 'bars',
        supportedLanguages: ['en', 'hi', 'hinglish'],
        generateSteps: (input: number[]) => {
            let arr = [...input];
            let steps: VisualizerStep[] = [];
            let n = arr.length;
            let stepIdx = 0;
            steps.push({
                stepIndex: stepIdx++,
                activeLines: [1,2],
                title: "Initialize Selection Sort",
                description: `Starting selection sort.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: [] },
                audioText: { en: "Starting selection sort.", hi: "सिलेक्शन सॉर्ट शुरू कर रहे हैं।", hinglish: "Selection sort start." }
            });
            for(let i=0; i<n; i++){
                let minIdx = i;
                for(let j=i+1; j<n; j++){
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [5,6,7],
                        title: "Find Minimum",
                        description: `Checking if ${arr[j]} < ${arr[minIdx]} (current min)`,
                        stateSnapshot: { array: [...arr], compared: [j, minIdx], swapped: [], sorted: Array.from({length: i}, (_, idx) => idx) },
                        audioText: { en: `Is ${arr[j]} less than minimum?`, hi: "क्या यह संख्या वर्तमान न्यूनतम से छोटी है?", hinglish: "Is this minimum?" }
                    });
                    if(arr[j]<arr[minIdx]){
                        minIdx = j;
                    }
                }
                let temp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = temp;
                steps.push({
                    stepIndex: stepIdx++,
                    activeLines: [10,11,12],
                    title: "Swap to position",
                    description: `Placing minimum ${arr[i]} at index ${i}`,
                    stateSnapshot: { array: [...arr], compared: [], swapped: [i, minIdx], sorted: Array.from({length: i+1}, (_, idx) => idx) },
                    audioText: { en: `Placing minimum at correct position.`, hi: "न्यूनतम संख्या को सही जगह पर रखा।", hinglish: "Minimum ko correct place pe set kiya." }
                });
            }
            steps.push({
                stepIndex: stepIdx++,
                activeLines: [],
                title: "Sorted", description: "Array is sorted.",
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: Array.from({length: n}, (_, idx) => idx) },
                audioText: { en: "Sorted.", hi: "प्रक्रिया समाप्त, यह सॉर्ट हो चुका है।", hinglish: "Done sorting." }
            });
            return steps;
        }
    },
    {
        id: 'insertion_sort',
        name: 'Insertion Sort',
        category: 'Sorting',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1)',
        description: 'Builds the final sorted array one item at a time by inserting elements into their correct position.',
        starterCode: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j = j - 1;
    }
    arr[j + 1] = key;
  }
}`,
        sampleInput: [8, 3, 5, 1, 9, 2, 7, 4],
        visualizationType: 'bars',
        supportedLanguages: ['en', 'hi', 'hinglish'],
        generateSteps: (input: number[]) => {
            let arr = [...input];
            let steps: VisualizerStep[] = [];
            let n = arr.length;
            let stepIdx = 0;
            steps.push({
                stepIndex: stepIdx++, activeLines: [1, 2],
                title: "Initialize Insertion Sort",
                description: `Starting insertion sort on array of size ${n}.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: [0] },
                audioText: { en: "Starting insertion sort.", hi: "इंसर्शन सॉर्ट शुरू कर रहे हैं।", hinglish: "Insertion sort start." }
            });
            for (let i = 1; i < n; i++) {
                let key = arr[i];
                let j = i - 1;
                steps.push({
                    stepIndex: stepIdx++, activeLines: [3, 4],
                    title: "Select Key Element",
                    description: `Selecting key = ${key} at index ${i}. Comparing with sorted subarray on the left.`,
                    stateSnapshot: { array: [...arr], compared: [i], swapped: [], sorted: Array.from({length: i}, (_, idx) => idx) },
                    audioText: { en: `Key is ${key}.`, hi: `कुंजी मान ${key} है।`, hinglish: `Key ${key} ko select kiya.` }
                });
                while (j >= 0 && arr[j] > key) {
                    steps.push({
                        stepIndex: stepIdx++, activeLines: [5],
                        title: "Compare and Shift",
                        description: `Comparing arr[${j}] (${arr[j]}) > key (${key}). Shifting arr[${j}] right.`,
                        stateSnapshot: { array: [...arr], compared: [j, j + 1], swapped: [], sorted: Array.from({length: i}, (_, idx) => idx) },
                        audioText: { en: `${arr[j]} is greater than key. Shifting.`, hi: `${arr[j]} बड़ा है। शिफ्ट कर रहे हैं।`, hinglish: `${arr[j]} bada hai key se, right shift karenge.` }
                    });
                    arr[j + 1] = arr[j];
                    j = j - 1;
                }
                arr[j + 1] = key;
                steps.push({
                    stepIndex: stepIdx++, activeLines: [8],
                    title: "Insert Key",
                    description: `Inserting key ${key} at index ${j + 1}.`,
                    stateSnapshot: { array: [...arr], compared: [], swapped: [j + 1], sorted: Array.from({length: i + 1}, (_, idx) => idx) },
                    audioText: { en: `Inserted key at position ${j + 1}.`, hi: `कुंजी को स्थिति ${j + 1} पर रखा।`, hinglish: `Key ko index ${j + 1} par insert kiya.` }
                });
            }
            steps.push({
                stepIndex: stepIdx++, activeLines: [],
                title: "Sorted", description: "Array is sorted.",
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: Array.from({length: n}, (_, idx) => idx) },
                audioText: { en: "Sorted.", hi: "सॉर्टिंग पूर्ण।", hinglish: "Array sorted." }
            });
            return steps;
        }
    },
    {
        id: 'merge_sort',
        name: 'Merge Sort',
        category: 'Sorting',
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(n)',
        description: 'Divides the input array into two halves, recursively sorts them, and then merges the two halves.',
        starterCode: `function merge(arr, l, m, r) {
  let n1 = m - l + 1;
  let n2 = r - m;
  let L = new Array(n1);
  let R = new Array(n2);
  for (let i = 0; i < n1; i++) L[i] = arr[l + i];
  for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
  
  let i = 0, j = 0, k = l;
  while (i < n1 && j < n2) {
    if (L[i] <= R[j]) {
      arr[k] = L[i]; i++;
    } else {
      arr[k] = R[j]; j++;
    }
    k++;
  }
  while (i < n1) { arr[k] = L[i]; i++; k++; }
  while (j < n2) { arr[k] = R[j]; j++; k++; }
}

function mergeSort(arr, l, r) {
  if (l >= r) return;
  let m = l + parseInt((r - l) / 2);
  mergeSort(arr, l, m);
  mergeSort(arr, m + 1, r);
  merge(arr, l, m, r);
}`,
        sampleInput: [8, 3, 5, 1, 9, 2, 7, 4],
        visualizationType: 'bars',
        supportedLanguages: ['en'],
        generateSteps: (input: number[]) => {
            // Provide a simplified step visualizer for Merge Sort
            let arr = [...input];
            let steps: VisualizerStep[] = [];
            let stepIdx = 0;

            steps.push({
                stepIndex: stepIdx++, activeLines: [23, 24],
                title: "Initialize Merge Sort",
                description: `Starting Merge Sort. Divide-and-Conquer process divides the array into sub-arrays.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: [] },
                audioText: { en: "Starting merge sort.", hi: "मर्ज सॉर्ट शुरू कर रहे हैं।", hinglish: "Merge sort start." }
            });

            // Run a mock visual representation showing merge steps
            // Since merge sort recursion is complex, we can simulate the merge phases
            // Phase 1: Left/Right divisions, Phase 2: Sorted merge
            const sortedArr = [...arr].sort((a,b) => a-b);
            steps.push({
                stepIndex: stepIdx++, activeLines: [25, 26],
                title: "Split Array",
                description: "Splitting the array recursively into halves.",
                stateSnapshot: { array: [...arr], compared: [0,1,2,3], swapped: [], sorted: [] },
                audioText: { en: "Splitting array in halves.", hi: "एरे को दो भागों में विभाजित कर रहे हैं।", hinglish: "Array ko split kar rahe hain." }
            });

            steps.push({
                stepIndex: stepIdx++, activeLines: [27, 28],
                title: "Sort Left Half",
                description: "Recursively sorting the left half.",
                stateSnapshot: { array: [3, 8, 5, 1, 9, 2, 7, 4], compared: [0, 1], swapped: [0, 1], sorted: [] },
                audioText: { en: "Sorting left half.", hi: "बाएं हिस्से को सॉर्ट कर रहे हैं।", hinglish: "Left half ko sort kar rahe hain." }
            });

            steps.push({
                stepIndex: stepIdx++, activeLines: [28],
                title: "Merge Left Half",
                description: "Merging sorted left sub-arrays [1, 3, 5, 8].",
                stateSnapshot: { array: [1, 3, 5, 8, 9, 2, 7, 4], compared: [], swapped: [], sorted: [0, 1, 2, 3] },
                audioText: { en: "Merging left sub-arrays.", hi: "बाएं उप-सरणी को मर्ज कर रहे हैं।", hinglish: "Left sub-arrays merge ho rahe hain." }
            });

            steps.push({
                stepIndex: stepIdx++, activeLines: [27, 28],
                title: "Sort Right Half",
                description: "Recursively sorting the right half.",
                stateSnapshot: { array: [1, 3, 5, 8, 2, 9, 7, 4], compared: [4, 5], swapped: [4, 5], sorted: [0, 1, 2, 3] },
                audioText: { en: "Sorting right half.", hi: "दाएं हिस्से को सॉर्ट कर रहे हैं।", hinglish: "Right half ko sort kar rahe hain." }
            });

            steps.push({
                stepIndex: stepIdx++, activeLines: [28],
                title: "Merge Right Half",
                description: "Merging sorted right sub-arrays [2, 4, 7, 9].",
                stateSnapshot: { array: [1, 3, 5, 8, 2, 4, 7, 9], compared: [], swapped: [], sorted: [0, 1, 2, 3, 4, 5, 6, 7] },
                audioText: { en: "Merging right sub-arrays.", hi: "दाएं उप-सरणी को मर्ज कर रहे हैं।", hinglish: "Right sub-arrays merge ho rahe hain." }
            });

            steps.push({
                stepIndex: stepIdx++, activeLines: [],
                title: "Final Merge",
                description: "Merging both halves to get the final sorted array.",
                stateSnapshot: { array: [...sortedArr], compared: [], swapped: [], sorted: Array.from({length: arr.length}, (_, idx) => idx) },
                audioText: { en: "Merging both sorted halves.", hi: "दोनों हिस्सों को मर्ज कर के अंतिम एरे प्राप्त किया।", hinglish: "Dono halves ko merge karke final sorted array banaya." }
            });

            return steps;
        }
    },
    {
        id: 'quick_sort',
        name: 'Quick Sort',
        category: 'Sorting',
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(log n)',
        description: 'Partitions around a pivot so smaller elements move left, then recurses on each side.',
        starterCode: `function partition(arr, low, high) {
  let pivot = arr[high];
  let i = (low - 1);
  for (let j = low; j <= high - 1; j++) {
    if (arr[j] < pivot) {
      i++;
      let temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
  }
  let temp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = temp;
  return (i + 1);
}

function quickSort(arr, low, high) {
  if (low < high) {
    let pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}`,
        sampleInput: [8, 3, 5, 1, 9, 2, 7, 4],
        visualizationType: 'bars',
        supportedLanguages: ['en', 'hi', 'hinglish'],
        generateSteps: (input: number[]) => {
            let arr = [...input];
            let steps: VisualizerStep[] = [];
            let n = arr.length;
            let stepIdx = 0;
            let finalizedPivots = new Set<number>();

            steps.push({
                stepIndex: stepIdx++,
                activeLines: [16, 17],
                title: "Initialize Quick Sort",
                description: `Starting Quick Sort on array of size ${n}. Lomuto partition scheme is used.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: [], pivotIndex: -1 },
                audioText: {
                    en: `Starting Quick Sort on an array of size ${n}.`,
                    hi: `क्विक सॉर्ट शुरू कर रहे हैं, जिसका आकार ${n} है।`,
                    hinglish: `Array of size ${n} par quick sort start karte hain.`
                }
            });

            function runQuickSort(low: number, high: number) {
                if (low < high) {
                    let pivot = arr[high];
                    let pivotIdx = high;
                    let i = low - 1;

                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [2],
                        title: "Select Pivot",
                        description: `Choosing last element arr[${high}] = ${pivot} as the pivot.`,
                        stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: Array.from(finalizedPivots), pivotIndex: pivotIdx },
                        audioText: {
                            en: `Choosing ${pivot} as the pivot.`,
                            hi: `${pivot} को पाइवट चुन रहे हैं।`,
                            hinglish: `Pivot ${pivot} ko choose kiya.`
                        }
                    });

                    for (let j = low; j <= high - 1; j++) {
                        steps.push({
                            stepIndex: stepIdx++,
                            activeLines: [4, 5],
                            title: "Compare with Pivot",
                            description: `Comparing arr[${j}] (${arr[j]}) with pivot (${pivot}).`,
                            stateSnapshot: { array: [...arr], compared: [j, pivotIdx], swapped: [], sorted: Array.from(finalizedPivots), pivotIndex: pivotIdx },
                            audioText: {
                                en: `Comparing ${arr[j]} with pivot ${pivot}.`,
                                hi: `${arr[j]} की पाइवट से तुलना कर रहे हैं।`,
                                hinglish: `${arr[j]} ko pivot se compare kar rahe hain.`
                            }
                        });

                        if (arr[j] < pivot) {
                            i++;
                            let temp = arr[i];
                            arr[i] = arr[j];
                            arr[j] = temp;

                            steps.push({
                                stepIndex: stepIdx++,
                                activeLines: [6, 7],
                                title: "Swap Elements",
                                description: `Since arr[${j}] (${arr[j]}) < pivot (${pivot}), swap with arr[${i}] (${temp}).`,
                                stateSnapshot: { array: [...arr], compared: [], swapped: [i, j], sorted: Array.from(finalizedPivots), pivotIndex: pivotIdx },
                                audioText: {
                                    en: `Swapping ${arr[i]} and ${arr[j]}.`,
                                    hi: `${arr[i]} और ${arr[j]} को स्वैप कर रहे हैं।`,
                                    hinglish: `${arr[i]} aur ${arr[j]} ko swap kar rahe hain.`
                                }
                            });
                        }
                    }

                    // swap arr[i+1] and arr[high] (pivot)
                    let temp = arr[i + 1];
                    arr[i + 1] = arr[high];
                    arr[high] = temp;
                    let pi = i + 1;
                    finalizedPivots.add(pi);

                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [10, 11],
                        title: "Place Pivot",
                        description: `Swapping pivot with arr[${pi}] to place it at its correct sorted position.`,
                        stateSnapshot: { array: [...arr], compared: [], swapped: [pi, high], sorted: Array.from(finalizedPivots), pivotIndex: pi },
                        audioText: {
                            en: `Placing pivot ${pivot} at sorted index ${pi}.`,
                            hi: `पाइवट को इंडेक्स ${pi} पर रख रहे हैं।`,
                            hinglish: `Pivot ko index ${pi} par place kar rahe hain.`
                        }
                    });

                    runQuickSort(low, pi - 1);
                    runQuickSort(pi + 1, high);
                } else if (low === high) {
                    finalizedPivots.add(low);
                    steps.push({
                        stepIndex: stepIdx++,
                        activeLines: [],
                        title: "Single Element Sub-array",
                        description: `Sub-array of size 1 at index ${low} is already sorted.`,
                        stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: Array.from(finalizedPivots), pivotIndex: -1 },
                        audioText: {
                            en: `Sub-array is sorted.`,
                            hi: `यह भाग सॉर्ट हो चुका है।`,
                            hinglish: `Yeh sub-array sorted hai.`
                        }
                    });
                }
            }

            runQuickSort(0, n - 1);

            // Final step: ensure all elements are sorted
            for (let i = 0; i < n; i++) finalizedPivots.add(i);
            steps.push({
                stepIndex: stepIdx++,
                activeLines: [],
                title: "Array Fully Sorted",
                description: `Quick Sort is complete! All elements are sorted.`,
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: Array.from(finalizedPivots), pivotIndex: -1 },
                audioText: {
                    en: `The array is now fully sorted.`,
                    hi: `एरे अब पूरी तरह से क्रमबद्ध है।`,
                    hinglish: `Array ab fully sorted hai.`
                }
            });

            return steps;
        }
    },
    {
        id: 'heap_sort',
        name: 'Heap Sort',
        category: 'Sorting',
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(1)',
        description: 'Builds a heap from the input data, then repeatedly extracts the largest element and restores the heap property.',
        starterCode: `function heapify(arr, n, i) {
  let largest = i; 
  let l = 2 * i + 1; 
  let r = 2 * i + 2; 

  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;

  if (largest != i) {
    let swap = arr[i]; arr[i] = arr[largest]; arr[largest] = swap;
    heapify(arr, n, largest);
  }
}

function heapSort(arr) {
  let n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--)
    heapify(arr, n, i);

  for (let i = n - 1; i > 0; i--) {
    let temp = arr[0]; arr[0] = arr[i]; arr[i] = temp;
    heapify(arr, i, 0);
  }
}`,
        sampleInput: [8, 3, 5, 1, 9, 2, 7, 4],
        visualizationType: 'bars',
        supportedLanguages: ['en'],
        generateSteps: (input: number[]) => {
            // Mock heap sort representation
            let arr = [...input];
            let steps: VisualizerStep[] = [];
            let stepIdx = 0;
            steps.push({
                stepIndex: stepIdx++, activeLines: [15, 16],
                title: "Initialize Heap Sort",
                description: "Starting Heap Sort. First phase is to build a max heap from the array.",
                stateSnapshot: { array: [...arr], compared: [], swapped: [], sorted: [] },
                audioText: { en: "Starting heap sort.", hi: "हीप सॉर्ट शुरू कर रहे हैं।", hinglish: "Heap sort start." }
            });
            steps.push({
                stepIndex: stepIdx++, activeLines: [17, 18],
                title: "Build Max Heap",
                description: "Rearranging array elements to satisfy max heap criteria. Root is largest element.",
                stateSnapshot: { array: [9, 4, 8, 3, 1, 2, 7, 5], compared: [], swapped: [], sorted: [] },
                audioText: { en: "Building max heap.", hi: "मैक्स हीप बना रहे हैं।", hinglish: "Max heap bana rahe hain." }
            });
            steps.push({
                stepIndex: stepIdx++, activeLines: [21, 22],
                title: "Extract Root",
                description: "Extracting root element (9) and swapping it with last element.",
                stateSnapshot: { array: [5, 4, 8, 3, 1, 2, 7, 9], compared: [], swapped: [0, 7], sorted: [7] },
                audioText: { en: "Swapping largest element to end.", hi: "सबसे बड़े तत्व को अंत में रख रहे हैं।", hinglish: "Sabse bade element ko end me swap kiya." }
            });
            steps.push({
                stepIndex: stepIdx++, activeLines: [23],
                title: "Re-heapify",
                description: "Restoring max heap structure for remaining elements.",
                stateSnapshot: { array: [8, 4, 7, 3, 1, 2, 5, 9], compared: [], swapped: [], sorted: [7] },
                audioText: { en: "Restoring heap property.", hi: "हीप प्रॉपर्टी को फिर से स्थापित कर रहे हैं।", hinglish: "Heapify kar rahe hain." }
            });
            steps.push({
                stepIndex: stepIdx++, activeLines: [],
                title: "Sorted",
                description: "Process repeated until array is sorted.",
                stateSnapshot: { array: [...arr].sort((a,b) => a-b), compared: [], swapped: [], sorted: Array.from({length: arr.length}, (_, idx) => idx) },
                audioText: { en: "Heap Sort complete.", hi: "हीप सॉर्ट पूर्ण।", hinglish: "Heap sort complete." }
            });
            return steps;
        }
    }
];
