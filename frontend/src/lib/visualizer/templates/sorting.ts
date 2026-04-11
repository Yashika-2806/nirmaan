import { VisualizerStep, AlgorithmTemplate } from '@/types/visualizer';

export const sortingTemplates: AlgorithmTemplate[] = [
    {
        id: 'bubble_sort',
        name: 'Bubble Sort',
        category: 'Sorting',
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
        sampleInput: [64, 34, 25, 12, 22, 11, 90],
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
        sampleInput: [64, 25, 12, 22, 11],
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
        id: 'insertion_sort', name: 'Insertion Sort', category: 'Sorting',
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
        sampleInput: [12, 11, 13, 5, 6], visualizationType: 'bars', supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Load array for insertion sort", stateSnapshot:{array:input, compared:[], swapped:[], sorted:[]}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    },
    {
        id: 'merge_sort', name: 'Merge Sort', category: 'Sorting',
        starterCode: `function merge(arr, l, m, r) {
  // Merge two halves
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
        sampleInput: [38,27,43,3,9,82,10], visualizationType: 'bars', supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Load array for merge sort", stateSnapshot:{array:input, compared:[], swapped:[], sorted:[]}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    },
    {
        id: 'quick_sort', name: 'Quick Sort', category: 'Sorting',
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
        sampleInput: [10,80,30,90,40,50,70], visualizationType: 'bars', supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Load array for quick sort", stateSnapshot:{array:input, compared:[], swapped:[], sorted:[]}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    },
    {
        id: 'heap_sort', name: 'Heap Sort', category: 'Sorting',
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
        sampleInput: [12, 11, 13, 5, 6, 7], visualizationType: 'bars', supportedLanguages: ['en'],
        generateSteps: (input) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Load array for heap sort", stateSnapshot:{array:input, compared:[], swapped:[], sorted:[]}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]
    }
];
