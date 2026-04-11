import { VisualizerStep, AlgorithmTemplate } from '@/types/visualizer';

export const graphTemplates: AlgorithmTemplate[] = [
    {
        id: 'bfs_graph', name: 'Breadth First Search (BFS)', category: 'Graphs',
        starterCode: `function bfs(graph, start) {\n  const queue = [start];\n  const visited = new Set([start]);\n  const result = [];\n  // ...\n}`,
        sampleInput: { nodes: ['A', 'B', 'C', 'D', 'E'], edges: [['A','B'], ['A','C'], ['B','D'], ['C','E']], start: 'A' },
        visualizationType: 'graph', supportedLanguages: ['en', 'hi', 'hinglish'],
        generateSteps: (input) => { 
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const { nodes, edges, start } = input;
            const adj: any = {}; nodes.forEach((n: string) => adj[n] = []);
            edges.forEach(([u,v]: [string,string]) => { adj[u].push(v); adj[v].push(u); });
            const queue = [start]; const visited = [start];
            steps.push({ stepIndex: stepIdx++, activeLines: [2,3], title: "Start BFS", description: `Start from ${start}`, stateSnapshot: {nodes, edges, visited:[...visited], currentNode: start, queue:[...queue]}, audioText: {en:`Start BFS at node ${start}.`, hi:`बीएफएस शुरू।`, hinglish:`BFS start.`} });
            while(queue.length > 0) {
                const node = queue.shift();
                steps.push({ stepIndex: stepIdx++, activeLines: [6], title: "Dequeue", description: `Dequeue ${node}`, stateSnapshot: {nodes, edges, visited:[...visited], currentNode: node, queue:[...queue]}, audioText: {en:`Dequeue ${node}.`, hi:`नोड ${node} निकाला।`, hinglish:`Dequeue ${node}.`} });
                for(let neighbor of adj[node as string]) {
                    if(!visited.includes(neighbor)) {
                        visited.push(neighbor); queue.push(neighbor);
                        steps.push({ stepIndex: stepIdx++, activeLines: [10], title: "Visit Neighbor", description: `Add ${neighbor}`, stateSnapshot: {nodes, edges, visited:[...visited], currentNode: node, queue:[...queue]}, audioText: {en:`Found ${neighbor}.`, hi:`पड़ोसी मिला।`, hinglish:`Found neighbor.`} });
                    }
                }
            }
            steps.push({ stepIndex: stepIdx++, activeLines: [], title: "Done", description: `Finished.`, stateSnapshot: {nodes, edges, visited:[...visited], currentNode: null, queue:[]}, audioText: {en:`Done.`, hi:`पूरा हुआ।`, hinglish:`Done.`} });
            return steps;
        }
    },
    { 
        id: 'dfs_graph', name: 'Depth First Search (DFS)', category: 'Graphs', 
        starterCode: `function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  for(let neighbor of graph[start]) {
    if(!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
}`, 
        sampleInput: { nodes: ['A', 'B', 'C', 'D', 'E'], edges: [['A','B'], ['A','C'], ['B','D'], ['C','E']], start: 'A' }, visualizationType: 'graph', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => { 
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const { nodes, edges, start } = input;
            const adj: any = {}; nodes.forEach((n: string) => adj[n] = []);
            edges.forEach(([u,v]: [string,string]) => { adj[u].push(v); adj[v].push(u); });
            const visited: string[] = [];
            const dfs = (node: string) => {
                visited.push(node);
                steps.push({ stepIndex: stepIdx++, activeLines: [2], title: "Visit", description: `DFS at ${node}`, stateSnapshot: {nodes, edges, visited:[...visited], currentNode: node}, audioText: {en:`DFS at ${node}.`, hi:`डीएफएस ${node} पर।`, hinglish:`DFS at ${node}.`} });
                for(let neighbor of adj[node]) {
                    if(!visited.includes(neighbor)) dfs(neighbor);
                }
            };
            dfs(start);
            steps.push({ stepIndex: stepIdx++, activeLines: [], title: "Done", description: `Finished.`, stateSnapshot: {nodes, edges, visited:[...visited], currentNode: null}, audioText: {en:`Done.`, hi:`पूरा हुआ।`, hinglish:`Done.`} });
            return steps;
        } 
    },
    { 
        id: 'dijkstra', name: 'Dijkstra (Shortest Path)', category: 'Graphs', 
        starterCode: `function dijkstra(graph, start) {
  let distances = {};
  for(let node in graph) distances[node] = Infinity;
  distances[start] = 0;
  let pq = [{node: start, dist: 0}];
  while(pq.length > 0) {
    pq.sort((a,b) => a.dist - b.dist);
    let {node, dist} = pq.shift();
    for(let neighbor of graph[node]) {
      let newDist = dist + neighbor.weight;
      if(newDist < distances[neighbor.node]) {
        distances[neighbor.node] = newDist;
        pq.push({node: neighbor.node, dist: newDist});
      }
    }
  }
  return distances;
}`, 
        sampleInput: { nodes: ['A', 'B', 'C', 'D'], edges: [['A','B'], ['B','C'], ['A','C'], ['C','D']], start: 'A' }, visualizationType: 'graph', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => { 
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const { nodes, edges, start } = input;
            steps.push({ stepIndex: stepIdx++, activeLines: [], title: "Dijkstra", description: `Dijkstra Graph`, stateSnapshot: {nodes, edges, visited:[start], currentNode: start}, audioText: {en:`Start Dijkstra.`, hi:`शुरू।`, hinglish:`Start.`} });
            return steps;
        } 
    },
    { 
        id: 'topological_sort', name: 'Topological Sort', category: 'Graphs', 
        starterCode: `function topologicalSort(graph, numNodes) {
  let inDegree = Array(numNodes).fill(0);
  for(let u in graph)
    for(let v of graph[u]) inDegree[v]++;
  
  let queue = [];
  for(let i=0; i<numNodes; i++) 
    if(inDegree[i] === 0) queue.push(i);
  
  let order = [];
  while(queue.length) {
    let u = queue.shift();
    order.push(u);
    for(let v of graph[u]) {
      if(--inDegree[v] === 0) queue.push(v);
    }
  }
  return order;
}`, 
        sampleInput: { nodes: ['A', 'B', 'C', 'D'], edges: [['A','B'], ['A','C'], ['B','D'], ['C','D']], start: 'A' }, visualizationType: 'graph', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => { 
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const { nodes, edges, start } = input;
            steps.push({ stepIndex: stepIdx++, activeLines: [], title: "Topological Sort", description: `Topo Sort Graph`, stateSnapshot: {nodes, edges, visited:[], currentNode: null}, audioText: {en:`Start Topo sort.`, hi:`शुरू।`, hinglish:`Start.`} });
            return steps;
        } 
    }
];

export const treeTemplates: AlgorithmTemplate[] = [
    { 
        id: 'preorder_traversal', name: 'Preorder Traversal', category: 'Trees', 
        starterCode: `function preorder(root) {
  if (root === null) return;
  console.log(root.val); // Root
  preorder(root.left);   // Left
  preorder(root.right);  // Right
}`, 
        sampleInput: {nodes:[1,2,3,4,5,6,7], root:1}, visualizationType: 'tree', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => {
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const nodes = input.nodes; const visited: number[] = [];
            const traverse = (idx: number) => {
                if(idx >= nodes.length || nodes[idx] === null) return;
                const val = nodes[idx];
                visited.push(val);
                steps.push({ stepIndex: stepIdx++, activeLines: [3], title: "Root", description: `Visit ${val}`, stateSnapshot: {nodes, visited: [...visited], currentNode: val}, audioText: {en:`Visit ${val}`, hi:`नोड ${val} पर`, hinglish:`Visit ${val}.`} });
                traverse(2 * idx + 1);
                traverse(2 * idx + 2);
            };
            traverse(0);
            return steps;
        }
    },
    { 
        id: 'inorder_traversal', name: 'Inorder Traversal', category: 'Trees', 
        starterCode: `function inorder(root) {
  if (root === null) return;
  inorder(root.left);    // Left
  console.log(root.val); // Root
  inorder(root.right);   // Right
}`, 
        sampleInput: {nodes:[1,2,3,4,5,6,7], root:1}, visualizationType: 'tree', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => {
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const nodes = input.nodes; const visited: number[] = [];
            const traverse = (idx: number) => {
                if(idx >= nodes.length || nodes[idx] === null) return;
                traverse(2 * idx + 1);
                const val = nodes[idx];
                visited.push(val);
                steps.push({ stepIndex: stepIdx++, activeLines: [3], title: "Root", description: `Visit ${val}`, stateSnapshot: {nodes, visited: [...visited], currentNode: val}, audioText: {en:`Visit ${val}`, hi:`नोड ${val} पर`, hinglish:`Visit ${val}.`} });
                traverse(2 * idx + 2);
            };
            traverse(0);
            return steps;
        }
    },
    { 
        id: 'postorder_traversal', name: 'Postorder Traversal', category: 'Trees', 
        starterCode: `function postorder(root) {
  if (root === null) return;
  postorder(root.left);  // Left
  postorder(root.right); // Right
  console.log(root.val); // Root
}`, 
        sampleInput: {nodes:[1,2,3,4,5,6,7], root:1}, visualizationType: 'tree', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => {
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            const nodes = input.nodes; const visited: number[] = [];
            const traverse = (idx: number) => {
                if(idx >= nodes.length || nodes[idx] === null) return;
                traverse(2 * idx + 1);
                traverse(2 * idx + 2);
                const val = nodes[idx];
                visited.push(val);
                steps.push({ stepIndex: stepIdx++, activeLines: [3], title: "Root", description: `Visit ${val}`, stateSnapshot: {nodes, visited: [...visited], currentNode: val}, audioText: {en:`Visit ${val}`, hi:`नोड ${val} पर`, hinglish:`Visit ${val}.`} });
            };
            traverse(0);
            return steps;
        }
    },
    { 
        id: 'bst_insert', name: 'BST Insert', category: 'Trees', 
        starterCode: `function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;
}`, 
        sampleInput: {nodes:[4,2,7,1,3,null,null], root:4}, visualizationType: 'tree', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (input) => { return [{stepIndex:0, activeLines:[], title:"Ready", description:"BST Insert", stateSnapshot:{nodes: input.nodes}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]; }
    },
    { 
        id: 'bst_search', name: 'BST Search', category: 'Trees', 
        starterCode: `function searchBST(root, val) {
  if (!root || root.val === val) return root;
  if (val < root.val) return searchBST(root.left, val);
  return searchBST(root.right, val);
}`, 
        sampleInput: {nodes:[4,2,7,1,3], root:4}, visualizationType: 'tree', supportedLanguages: ['en'], 
        generateSteps: (input) => { return [{stepIndex:0, activeLines:[], title:"Ready", description:"BST Search", stateSnapshot:{nodes: input.nodes}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]; }
    },
    { 
        id: 'bst_delete', name: 'BST Delete', category: 'Trees', 
        starterCode: `function deleteNode(root, key) {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let minNode = root.right;
    while (minNode.left) minNode = minNode.left;
    root.val = minNode.val;
    root.right = deleteNode(root.right, root.val);
  }
  return root;
}`, 
        sampleInput: {nodes:[5,3,6,2,4,null,7], root:5}, visualizationType: 'tree', supportedLanguages: ['en'], 
        generateSteps: (input) => { return [{stepIndex:0, activeLines:[], title:"Ready", description:"BST Delete", stateSnapshot:{nodes: input.nodes}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}]; }
    }
];

export const dpTemplates: AlgorithmTemplate[] = [
    { 
        id: 'fibonacci', name: 'Fibonacci DP', category: 'Dynamic Programming', 
        starterCode: `function fib(n) {
  let dp = new Array(n+1).fill(0);
  dp[0] = 0; dp[1] = 1;
  for(let i=2; i<=n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
  }
  return dp[n];
}`, 
        sampleInput: 7, visualizationType: 'table', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (n) => {
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            let dp = new Array(n+1).fill(null);
            dp[0] = 0; dp[1] = 1;
            steps.push({ stepIndex: stepIdx++, activeLines: [3,4], title: "Base Cases", description: `dp[0]=0, dp[1]=1`, stateSnapshot: {table:[...dp], highlights:[0,1]}, audioText: {en:`Base cases set.`, hi:`बेस केस सेट हो गए।`, hinglish:`Base cases set.`} });
            for(let i=2; i<=n; i++) {
                dp[i] = dp[i-1] + dp[i-2];
                steps.push({ stepIndex: stepIdx++, activeLines: [7], title: `Calculated dp[${i}]`, description: `Stored ${dp[i]}`, stateSnapshot: {table:[...dp], currentCell: i, highlights:[i-1, i-2]}, audioText: {en:`Stored ${dp[i]}.`, hi:`${dp[i]} सेव किया।`, hinglish:`Stored ${dp[i]}.`} });
            }
            return steps;
        }
    },
    { 
        id: 'knapsack', name: '0/1 Knapsack', category: 'Dynamic Programming', 
        starterCode: `function knapsack(W, wt, val, n) {
  let dp = Array(n + 1).fill(0).map(() => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= W; w++) {
      if (wt[i - 1] <= w) {
        dp[i][w] = Math.max(val[i - 1] + dp[i - 1][w - wt[i - 1]], dp[i - 1][w]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}`, 
        sampleInput: [0, 10, 20, 30, 40], visualizationType: 'table', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Knapsack 1D Table state", stateSnapshot:{table: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    },
    { 
        id: 'lcs', name: 'Longest Common Subsequence', category: 'Dynamic Programming', 
        starterCode: `function longestCommonSubsequence(text1, text2) {
  let m = text1.length, n = text2.length;
  let dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`, 
        sampleInput: [1, 1, 2, 2, 3], visualizationType: 'table', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"LCS 1D DP Array mapped", stateSnapshot:{table: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    },
    { 
        id: 'coin_change', name: 'Coin Change', category: 'Dynamic Programming', 
        starterCode: `function coinChange(coins, amount) {
  let dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`, 
        sampleInput: [0, 1, 2, 1, 2], visualizationType: 'table', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Coin change DP array", stateSnapshot:{table: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    }
];

export const recursionTemplates: AlgorithmTemplate[] = [
    { 
        id: 'n_queens', name: 'N-Queens Solver', category: 'Recursion / Backtracking', 
        starterCode: `function solveNQueens(n) {
  let res = [];
  let board = Array.from({length: n}, () => Array(n).fill('.'));
  const isValid = (r, c) => {
    for(let i=0; i<r; i++) if(board[i][c] === 'Q') return false;
    for(let i=r-1, j=c-1; i>=0 && j>=0; i--, j--) if(board[i][j] === 'Q') return false;
    for(let i=r-1, j=c+1; i>=0 && j<n; i--, j++) if(board[i][j] === 'Q') return false;
    return true;
  };
  const backtrack = (r) => {
    if(r === n) { res.push(board.map(row => row.join(''))); return; }
    for(let c = 0; c < n; c++) {
      if(isValid(r, c)) {
        board[r][c] = 'Q';
        backtrack(r + 1);
        board[r][c] = '.';
      }
    }
  };
  backtrack(0);
  return res;
}`, 
        sampleInput: 4, visualizationType: 'board', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (n) => {
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            let board = Array.from({length: n}, () => Array(n).fill('.'));
            const isValid = (r: number, c: number) => {
                for(let i=0; i<r; i++) if(board[i][c] === 'Q') return false;
                for(let i=r-1, j=c-1; i>=0 && j>=0; i--, j--) if(board[i][j] === 'Q') return false;
                for(let i=r-1, j=c+1; i>=0 && j<n; i--, j++) if(board[i][j] === 'Q') return false;
                return true;
            };
            const backtrack = (r: number) => {
                if(r === n) {
                    steps.push({ stepIndex: stepIdx++, activeLines: [], title:"Done", description:`Solution found.`, stateSnapshot:{board: board.map(row=>[...row])}, audioText:{en:`Solved.`, hi:`समाधान।`, hinglish:`Solved.`} });
                    return true;
                }
                for(let c=0; c<n; c++) {
                    if(isValid(r, c)) {
                        board[r][c] = 'Q';
                        steps.push({ stepIndex: stepIdx++, activeLines: [], title:"Place Queen", description:`Put Q at ${r},${c}`, stateSnapshot:{board: board.map(row=>[...row])}, audioText:{en:`Placed.`, hi:`रखा।`, hinglish:`Placed.`} });
                        if(backtrack(r+1)) return true;
                        board[r][c] = '.';
                    }
                }
                return false;
            };
            backtrack(0);
            return steps;
        }
    },
    { 
        id: 'sudoku', name: 'Sudoku Solver', category: 'Recursion / Backtracking', 
        starterCode: `function solveSudoku(board) {
  const isValid = (r, c, k) => {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === k || board[i][c] === k) return false;
      if (board[3 * Math.floor(r / 3) + Math.floor(i / 3)][3 * Math.floor(c / 3) + i % 3] === k) return false;
    }
    return true;
  };
  const solve = () => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === '.') {
          for (let k = 1; k <= 9; k++) {
            if (isValid(i, j, k.toString())) {
              board[i][j] = k.toString();
              if (solve()) return true;
              board[i][j] = '.';
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  solve();
}`, 
        sampleInput: { board: Array(9).fill(Array(9).fill('.')) }, visualizationType: 'board', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Sudoku board", stateSnapshot:{board: i.board}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    },
    { 
        id: 'subsets', name: 'Subset Generation', category: 'Recursion / Backtracking', 
        starterCode: `function subsets(nums) {
  let res = [];
  const backtrack = (start, path) => {
    res.push([...path]);
    for(let i=start; i<nums.length; i++) {
      path.push(nums[i]);
      backtrack(i+1, path);
      path.pop();
    }
  };
  backtrack(0, []);
  return res;
}`, 
        sampleInput: [1,2,3], visualizationType: 'array', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Subset array", stateSnapshot:{array: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    },
    { 
        id: 'permutations', name: 'Permutations', category: 'Recursion / Backtracking', 
        starterCode: `function permute(nums) {
  let res = [];
  const backtrack = (path) => {
    if(path.length === nums.length) { res.push([...path]); return; }
    for(let i=0; i<nums.length; i++) {
      if(path.includes(nums[i])) continue;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
    }
  };
  backtrack([]);
  return res;
}`, 
        sampleInput: [1,2,3], visualizationType: 'array', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Permutations array", stateSnapshot:{array: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    }
];

export const datastructureTemplates: AlgorithmTemplate[] = [
    { 
        id: 'reverse_ll', name: 'Reverse Linked List', category: 'Linked List / Stack / Queue', 
        starterCode: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`, 
        sampleInput: [1,2,3,4,5], visualizationType: 'pointers', supportedLanguages: ['en', 'hi', 'hinglish'], 
        generateSteps: (nodes) => {
            let steps: VisualizerStep[] = []; let stepIdx = 0;
            let curr = 0; let prev = -1;
            while(curr < nodes.length) {
                let nxt = curr + 1;
                steps.push({ stepIndex: stepIdx++, activeLines: [7], title: "Reverse Link", description:"curr.next = prev", stateSnapshot:{nodes, currentPtr: curr, prevPtr: prev, nextPtr: nxt < nodes.length ? nxt : -1}, audioText:{en:"Reversing pointer.", hi:"पॉइंटर उल्टा किया।", hinglish:"Pointer reversed."} });
                prev = curr; curr = nxt;
            }
            steps.push({ stepIndex: stepIdx++, activeLines: [12], title: "Finished", description:"Done", stateSnapshot:{nodes, currentPtr: -1, prevPtr: prev, nextPtr: -1}, audioText:{en:"List reversed.", hi:"पूरी तरह उलटी हो चुकी है।", hinglish:"List reversed."} });
            return steps;
        }
    },
    { 
        id: 'cycle_ll', name: 'Detect Cycle', category: 'Linked List / Stack / Queue', 
        starterCode: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`, 
        sampleInput: [1,2,3,4,5], visualizationType: 'pointers', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Tortoise & Hare representation", stateSnapshot:{nodes: i, currentPtr: 0, nextPtr: 1, prevPtr: -1}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    },
    { 
        id: 'stack_ops', name: 'Stack Push/Pop', category: 'Linked List / Stack / Queue', 
        starterCode: `class Stack {
  constructor() { this.items = []; }
  push(element) { this.items.push(element); }
  pop() { if (this.isEmpty()) return "Underflow"; return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
}`, 
        sampleInput: [10, 20, 30], visualizationType: 'array', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Stack visualization", stateSnapshot:{array: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    },
    { 
        id: 'queue_ops', name: 'Queue Enqueue/Dequeue', category: 'Linked List / Stack / Queue', 
        starterCode: `class Queue {
  constructor() { this.items = []; }
  enqueue(element) { this.items.push(element); }
  dequeue() { if (this.isEmpty()) return "Underflow"; return this.items.shift(); }
  front() { if (this.isEmpty()) return "No elements"; return this.items[0]; }
  isEmpty() { return this.items.length === 0; }
}`, 
        sampleInput: [10, 20, 30], visualizationType: 'array', supportedLanguages: ['en'], 
        generateSteps: (i) => [{stepIndex:0, activeLines:[], title:"Ready", description:"Queue representation", stateSnapshot:{array: i}, audioText:{en:"Ready.",hi:"Ready.",hinglish:"Ready."}}] 
    }
];
