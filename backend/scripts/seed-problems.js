/**
 * seed-problems.js
 * Run: node backend/scripts/seed-problems.js
 * Seeds 20 classic DSA problems into the interview_questions collection.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const InterviewQuestion = require('../src/modules/interview/models/interview-question-model');

const PROBLEMS = [
    {
        title: 'Two Sum',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] == 9, return [0, 1].\n\nExample 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]\n\nConstraints:\n2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9`,
        difficulty: 'easy',
        category: 'hash-table',
        tags: ['Array', 'Hash Table'],
        companies: ['Google', 'Amazon', 'Microsoft', 'Meta'],
        frequencyScore: 95,
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
        ],
        functionSignature: 'def twoSum(nums: List[int], target: int) -> List[int]',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
    },
    {
        title: 'Reverse Linked List',
        description: `Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nExample 1:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]\n\nExample 2:\nInput: head = [1,2]\nOutput: [2,1]\n\nConstraints:\nThe number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000`,
        difficulty: 'easy',
        category: 'linked-list',
        tags: ['Linked List', 'Recursion'],
        companies: ['Amazon', 'Microsoft', 'Meta'],
        frequencyScore: 88,
        examples: [
            { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Reversed list' },
        ],
        functionSignature: 'def reverseList(head: Optional[ListNode]) -> Optional[ListNode]',
        constraints: '0 <= nodes <= 5000',
    },
    {
        title: 'Valid Parentheses',
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nExample 1:\nInput: s = "()"  Output: true\n\nExample 2:\nInput: s = "()[]{}"  Output: true\n\nExample 3:\nInput: s = "(]"  Output: false`,
        difficulty: 'easy',
        category: 'stack',
        tags: ['String', 'Stack'],
        companies: ['Amazon', 'Google', 'Uber'],
        frequencyScore: 85,
        examples: [
            { input: 's = "()"', output: 'true', explanation: 'Open bracket closed correctly' },
            { input: 's = "(]"', output: 'false', explanation: 'Wrong type of bracket' },
        ],
        functionSignature: 'def isValid(s: str) -> bool',
        constraints: '1 <= s.length <= 10^4',
    },
    {
        title: 'Maximum Subarray',
        description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nExample 1:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.\n\nExample 2:\nInput: nums = [1]\nOutput: 1\n\nConstraints:\n1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4`,
        difficulty: 'medium',
        category: 'dynamic-programming',
        tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
        companies: ['Amazon', 'Microsoft', 'Google'],
        frequencyScore: 90,
        examples: [
            { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has sum 6' },
        ],
        functionSignature: 'def maxSubArray(nums: List[int]) -> int',
        constraints: '1 <= nums.length <= 10^5',
    },
    {
        title: 'Merge Two Sorted Lists',
        description: `You are given the heads of two sorted linked lists list1 and list2.\nMerge the two lists into one sorted list.\n\nExample 1:\nInput: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]\n\nExample 2:\nInput: list1 = [], list2 = []\nOutput: []\n\nConstraints:\nThe number of nodes in both lists is in the range [0, 50].\n-100 <= Node.val <= 100`,
        difficulty: 'easy',
        category: 'linked-list',
        tags: ['Linked List', 'Recursion'],
        companies: ['Amazon', 'Microsoft'],
        frequencyScore: 82,
        examples: [
            { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: 'Merged in sorted order' },
        ],
        functionSignature: 'def mergeTwoLists(list1, list2)',
        constraints: '0 <= nodes <= 50',
    },
    {
        title: 'Best Time to Buy and Sell Stock',
        description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\nReturn the maximum profit you can achieve. If no profit is possible, return 0.\n\nExample 1:\nInput: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 5.\n\nConstraints:\n1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4`,
        difficulty: 'easy',
        category: 'array',
        tags: ['Array', 'Dynamic Programming'],
        companies: ['Amazon', 'Google', 'Meta'],
        frequencyScore: 87,
        examples: [
            { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy at 1, sell at 6' },
        ],
        functionSignature: 'def maxProfit(prices: List[int]) -> int',
        constraints: '1 <= prices.length <= 10^5',
    },
    {
        title: 'Climbing Stairs',
        description: `You are climbing a staircase. It takes n steps to reach the top.\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExample 1:\nInput: n = 2\nOutput: 2\nExplanation: Two ways: 1+1 or 2.\n\nExample 2:\nInput: n = 3\nOutput: 3\nExplanation: Three ways: 1+1+1, 1+2, 2+1.\n\nConstraints:\n1 <= n <= 45`,
        difficulty: 'easy',
        category: 'dynamic-programming',
        tags: ['Math', 'Dynamic Programming', 'Memoization'],
        companies: ['Amazon', 'Google', 'Uber'],
        frequencyScore: 80,
        examples: [
            { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
            { input: 'n = 3', output: '3', explanation: '1+1+1 or 1+2 or 2+1' },
        ],
        functionSignature: 'def climbStairs(n: int) -> int',
        constraints: '1 <= n <= 45',
    },
    {
        title: 'Binary Search',
        description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.\n\nExample 1:\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\nExample 2:\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1\n\nConstraints:\n1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.`,
        difficulty: 'easy',
        category: 'searching',
        tags: ['Array', 'Binary Search'],
        companies: ['Google', 'Amazon', 'Microsoft'],
        frequencyScore: 78,
        examples: [
            { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: 'index 4' },
        ],
        functionSignature: 'def search(nums: List[int], target: int) -> int',
        constraints: '1 <= nums.length <= 10^4',
    },
    {
        title: 'Number of Islands',
        description: `Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.\n\nExample 1:\nInput: grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]\nOutput: 1\n\nExample 2:\nInput: grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]\nOutput: 3`,
        difficulty: 'medium',
        category: 'graph',
        tags: ['Array', 'DFS', 'BFS', 'Union Find'],
        companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg'],
        frequencyScore: 92,
        examples: [
            { input: 'grid with one island', output: '1', explanation: 'Connected land mass' },
        ],
        functionSignature: 'def numIslands(grid: List[List[str]]) -> int',
        constraints: 'm, n >= 1',
    },
    {
        title: 'Longest Common Subsequence',
        description: `Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.\nA subsequence of a string is a new string generated from the original string with some characters deleted without changing the relative order of the remaining characters.\n\nExample 1:\nInput: text1 = "abcde", text2 = "ace"\nOutput: 3\nExplanation: "ace"\n\nExample 2:\nInput: text1 = "abc", text2 = "abc"\nOutput: 3\n\nConstraints:\n1 <= text1.length, text2.length <= 1000`,
        difficulty: 'medium',
        category: 'dynamic-programming',
        tags: ['String', 'Dynamic Programming'],
        companies: ['Google', 'Amazon', 'Microsoft'],
        frequencyScore: 83,
        examples: [
            { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'LCS is "ace"' },
        ],
        functionSignature: 'def longestCommonSubsequence(text1: str, text2: str) -> int',
        constraints: '1 <= text1.length, text2.length <= 1000',
    },
    {
        title: 'House Robber',
        description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses are arranged in a circle. That means the first house is the neighbor of the last one. Meanwhile, adjacent houses have a security system connected, and it will automatically contact the police if two adjacent houses are broken into on the same night.\nGiven an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.\n\nExample 1:\nInput: nums = [2,3,2]\nOutput: 3\n\nExample 2:\nInput: nums = [1,2,3,1]\nOutput: 4`,
        difficulty: 'medium',
        category: 'dynamic-programming',
        tags: ['Array', 'Dynamic Programming'],
        companies: ['Amazon', 'Google', 'Lyft'],
        frequencyScore: 79,
        examples: [
            { input: 'nums = [2,3,2]', output: '3', explanation: 'Rob house 2 only' },
        ],
        functionSignature: 'def rob(nums: List[int]) -> int',
        constraints: '1 <= nums.length <= 100',
    },
    {
        title: 'Coin Change',
        description: `You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\n\nExample 1:\nInput: coins = [1,5,11], amount = 11\nOutput: 1\n\nExample 2:\nInput: coins = [2], amount = 3\nOutput: -1\n\nConstraints:\n1 <= coins.length <= 12\n1 <= coins[i] <= 2^31-1\n0 <= amount <= 10^4`,
        difficulty: 'medium',
        category: 'dynamic-programming',
        tags: ['Array', 'Dynamic Programming', 'BFS'],
        companies: ['Amazon', 'Google', 'Goldman Sachs'],
        frequencyScore: 85,
        examples: [
            { input: 'coins = [1,5,11], amount = 11', output: '1', explanation: '11 itself' },
        ],
        functionSignature: 'def coinChange(coins: List[int], amount: int) -> int',
        constraints: '0 <= amount <= 10^4',
    },
    {
        title: 'Product of Array Except Self',
        description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\nYou must write an algorithm that runs in O(n) time and without using the division operation.\n\nExample 1:\nInput: nums = [1,2,3,4]\nOutput: [24,12,8,6]\n\nExample 2:\nInput: nums = [-1,1,0,-3,3]\nOutput: [0,0,9,0,0]`,
        difficulty: 'medium',
        category: 'array',
        tags: ['Array', 'Prefix Sum'],
        companies: ['Amazon', 'Facebook', 'Microsoft', 'Apple'],
        frequencyScore: 88,
        examples: [
            { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'Product of all except self' },
        ],
        functionSignature: 'def productExceptSelf(nums: List[int]) -> List[int]',
        constraints: '2 <= nums.length <= 10^5',
    },
    {
        title: 'Find Minimum in Rotated Sorted Array',
        description: `Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Given the sorted rotated array nums of unique elements, return the minimum element of this array.\nYou must write an algorithm that runs in O(log n) time.\n\nExample 1:\nInput: nums = [3,4,5,1,2]\nOutput: 1\n\nExample 2:\nInput: nums = [4,5,6,7,0,1,2]\nOutput: 0\n\nConstraints:\nn == nums.length\n1 <= n <= 5000`,
        difficulty: 'medium',
        category: 'searching',
        tags: ['Array', 'Binary Search'],
        companies: ['Amazon', 'Microsoft', 'Google'],
        frequencyScore: 81,
        examples: [
            { input: 'nums = [3,4,5,1,2]', output: '1', explanation: 'Minimum is 1' },
        ],
        functionSignature: 'def findMin(nums: List[int]) -> int',
        constraints: '1 <= n <= 5000',
    },
    {
        title: '3Sum',
        description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.\nThe solution set must not contain duplicate triplets.\n\nExample 1:\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]\n\nExample 2:\nInput: nums = [0,1,1]\nOutput: []\n\nConstraints:\n3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5`,
        difficulty: 'medium',
        category: 'two-pointers',
        tags: ['Array', 'Two Pointers', 'Sorting'],
        companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'],
        frequencyScore: 89,
        examples: [
            { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'Triplets summing to 0' },
        ],
        functionSignature: 'def threeSum(nums: List[int]) -> List[List[int]]',
        constraints: '3 <= nums.length <= 3000',
    },
    {
        title: 'Longest Substring Without Repeating Characters',
        description: `Given a string s, find the length of the longest substring without repeating characters.\n\nExample 1:\nInput: s = "abcabcbb"\nOutput: 3\nExplanation: "abc" has length 3.\n\nExample 2:\nInput: s = "bbbbb"\nOutput: 1\n\nExample 3:\nInput: s = "pwwkew"\nOutput: 3\n\nConstraints:\n0 <= s.length <= 5*10^4`,
        difficulty: 'medium',
        category: 'sliding-window',
        tags: ['Hash Table', 'String', 'Sliding Window'],
        companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg'],
        frequencyScore: 93,
        examples: [
            { input: 's = "abcabcbb"', output: '3', explanation: '"abc"' },
        ],
        functionSignature: 'def lengthOfLongestSubstring(s: str) -> int',
        constraints: '0 <= s.length <= 5*10^4',
    },
    {
        title: 'Validate Binary Search Tree',
        description: `Given the root of a binary tree, determine if it is a valid binary search tree (BST).\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys less than the node's key.\n- The right subtree of a node contains only nodes with keys greater than the node's key.\n- Both the left and right subtrees must also be binary search trees.\n\nExample 1:\nInput: root = [2,1,3]\nOutput: true\n\nExample 2:\nInput: root = [5,1,4,null,null,3,6]\nOutput: false`,
        difficulty: 'medium',
        category: 'tree',
        tags: ['Tree', 'DFS', 'BFS', 'BST', 'Recursion'],
        companies: ['Amazon', 'Google', 'Microsoft'],
        frequencyScore: 84,
        examples: [
            { input: 'root = [2,1,3]', output: 'true', explanation: 'Valid BST' },
        ],
        functionSignature: 'def isValidBST(root: Optional[TreeNode]) -> bool',
        constraints: 'Number of nodes: [1, 10^4]',
    },
    {
        title: 'Word Break',
        description: `Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.\n\nExample 1:\nInput: s = "leetcode", wordDict = ["leet","code"]\nOutput: true\n\nExample 2:\nInput: s = "applepenapple", wordDict = ["apple","pen"]\nOutput: true\n\nExample 3:\nInput: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]\nOutput: false`,
        difficulty: 'medium',
        category: 'dynamic-programming',
        tags: ['Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'],
        companies: ['Amazon', 'Google', 'Facebook'],
        frequencyScore: 86,
        examples: [
            { input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true', explanation: '"leet" + "code"' },
        ],
        functionSignature: 'def wordBreak(s: str, wordDict: List[str]) -> bool',
        constraints: '1 <= s.length <= 300',
    },
    {
        title: 'Median of Two Sorted Arrays',
        description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\nThe overall run time complexity should be O(log (m+n)).\n\nExample 1:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\n\nExample 2:\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.50000\n\nConstraints:\nnums1.length == m, nums2.length == n\n0 <= m, n <= 1000\n0 <= m + n`,
        difficulty: 'hard',
        category: 'array',
        tags: ['Array', 'Binary Search', 'Divide and Conquer'],
        companies: ['Google', 'Amazon', 'Microsoft', 'Adobe'],
        frequencyScore: 87,
        examples: [
            { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'Median is 2' },
        ],
        functionSignature: 'def findMedianSortedArrays(nums1: List[int], nums2: List[int]) -> float',
        constraints: '0 <= m, n <= 1000',
    },
    {
        title: 'Trapping Rain Water',
        description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nExample 1:\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\n\nExample 2:\nInput: height = [4,2,0,3,2,5]\nOutput: 9\n\nConstraints:\nn == height.length\n1 <= n <= 2*10^4\n0 <= height[i] <= 10^5`,
        difficulty: 'hard',
        category: 'two-pointers',
        tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'],
        companies: ['Amazon', 'Google', 'Microsoft', 'Goldman Sachs'],
        frequencyScore: 91,
        examples: [
            { input: 'height = [4,2,0,3,2,5]', output: '9', explanation: 'Water trapped in valleys' },
        ],
        functionSignature: 'def trap(height: List[int]) -> int',
        constraints: '1 <= n <= 2*10^4',
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        let inserted = 0;
        let skipped = 0;

        for (const problem of PROBLEMS) {
            try {
                const existing = await InterviewQuestion.findOne({ title: problem.title });
                if (existing) {
                    console.log(`⏭️  Skipping (already exists): ${problem.title}`);
                    skipped++;
                    continue;
                }
                await InterviewQuestion.create({ ...problem, isActive: true });
                console.log(`✅ Seeded: ${problem.title}`);
                inserted++;
            } catch (err) {
                console.error(`❌ Failed to seed "${problem.title}": ${err.message}`);
            }
        }

        console.log(`\n📊 Seeding complete: ${inserted} inserted, ${skipped} skipped`);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
