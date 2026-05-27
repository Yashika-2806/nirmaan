/**
 * Seed Interview Problems Database
 * Populates the database with sample interview problems and test cases
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const InterviewQuestion = require('../src/modules/interview/models/interview-question-model');
const TestCaseModel = require('../src/modules/interview/models/test-case-model');

const sampleProblems = [
    {
        title: "Two Sum",
        description: `
Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

You can return the answer in any order.
        `,
        difficulty: "easy",
        category: "array",
        tags: ["Array", "Hash Table", "Two Pointers"],
        accepted_count: 1500,
        submission_count: 3000,
        constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9, Only one valid answer exists.",
        functionSignature: "function twoSum(nums: number[], target: number): number[]",
        examples: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "The sum of 2 and 7 is 9. Therefore, index 0 and 1 are returned. Alternatively, index 1 and 0 are also accepted as a solution."
            },
            {
                input: "nums = [3,2,4], target = 6",
                output: "[1,2]",
                explanation: "The sum of 2 and 4 is 6. Therefore, the output is [1,2]."
            }
        ],
        starter_code: {
            python: `
def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass
            `,
            javascript: `
function twoSum(nums, target) {
    // Write your solution here
    return [];
}
            `,
            java: `
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[2];
    }
}
            `,
            cpp: `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};
            `
        },
        solutions: [
            {
                language: "python",
                code: `
def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
                `,
                explanation: "Hash table approach: For each number, check if complement exists in hash table."
            }
        ]
    },
    {
        title: "Reverse String",
        description: `
Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.
        `,
        difficulty: "easy",
        category: "string",
        tags: ["String", "Two Pointers"],
        accepted_count: 1200,
        submission_count: 2000,
        constraints: "1 <= s.length <= 10^5, s[i] is a printable ascii character.",
        functionSignature: "function reverseString(s: string[]): void",
        examples: [
            {
                input: 's = ["h","e","l","l","o"]',
                output: '["o","l","l","e","h"]',
                explanation: "The string reversed in-place."
            }
        ],
        starter_code: {
            python: `
def reverseString(s: list[str]) -> None:
    # Do not return anything, modify s in-place instead.
    pass
            `,
            javascript: `
function reverseString(s) {
    // Do not return anything, modify s in-place instead.
}
            `
        }
    },
    {
        title: "Longest Substring Without Repeating Characters",
        description: `
Given a string s, find the length of the longest substring without repeating characters.
        `,
        difficulty: "medium",
        category: "string",
        tags: ["String", "Sliding Window", "Hash Table"],
        accepted_count: 800,
        submission_count: 2500,
        constraints: "0 <= s.length <= 5 * 10^4, s consists of English letters, digits, symbols and spaces.",
        functionSignature: "function lengthOfLongestSubstring(s: string): number",
        examples: [
            {
                input: 's = "abcabcbb"',
                output: "3",
                explanation: 'The answer is "abc", with the length of 3.'
            }
        ],
        starter_code: {
            python: `
def lengthOfLongestSubstring(s: str) -> int:
    # Write your solution here
    return 0
            `
        }
    },
    {
        title: "Merge Sorted Array",
        description: `
You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, 
representing the number of valid elements in nums1 and nums2 respectively.

Merge nums2 into nums1 as one sorted array.

Note: You may assume that nums1 has a total length of m + n, that it has enough space to hold additional elements from nums2.
        `,
        difficulty: "easy",
        category: "array",
        tags: ["Array", "Two Pointers"],
        accepted_count: 1100,
        submission_count: 1800,
        constraints: "nums1.length == m + n, nums2.length == n, 0 <= m, n <= 200, 1 <= m + n <= 200",
        functionSignature: "function merge(nums1: number[], m: number, nums2: number[], n: number): void",
        examples: [
            {
                input: "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3",
                output: "[1,2,2,3,5,6]",
                explanation: "The arrays we are merging are [1,2,3] and [2,5,6]."
            }
        ],
        starter_code: {
            python: `
def merge(nums1: list[int], m: int, nums2: list[int], n: int) -> None:
    # Do not return anything, modify nums1 in-place instead.
    pass
            `
        }
    }
];

const sampleTestCases = {
    "Two Sum": [
        { title: "Sample Test 1", input: "2 7 11 15\n9", expected: "0 1", isVisible: true, category: "normal" },
        { title: "Sample Test 2", input: "3 2 4\n6", expected: "1 2", isVisible: true, category: "normal" },
        { title: "Edge Case - Duplicates", input: "3 3\n6", expected: "0 1", isVisible: false, category: "edge_case" },
        { title: "Normal Test", input: "1 2 3 4 5\n9", expected: "3 4", isVisible: false, category: "normal" },
    ],
    "Reverse String": [
        { title: "Sample Test 1", input: "h e l l o", expected: "o l l e h", isVisible: true, category: "normal" },
        { title: "Single Character", input: "a", expected: "a", isVisible: true, category: "edge_case" },
        { title: "Two Characters", input: "a b", expected: "b a", isVisible: false, category: "normal" },
    ],
    "Longest Substring Without Repeating Characters": [
        { title: "Sample Test 1", input: "abcabcbb", expected: "3", isVisible: true, category: "normal" },
        { title: "All Same Characters", input: "bbbbb", expected: "1", isVisible: true, category: "edge_case" },
        { title: "Mixed Characters", input: "pwwkew", expected: "3", isVisible: false, category: "normal" },
    ],
    "Merge Sorted Array": [
        { title: "Sample Test 1", input: "1 2 3 0 0 0\n2 5 6", expected: "1 2 2 3 5 6", isVisible: true, category: "normal" },
        { title: "Single Element", input: "1", expected: "1", isVisible: false, category: "edge_case" },
    ]
};

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/nirmaan?authSource=admin');
        console.log('Connected to MongoDB');

        // Clear existing data
        await InterviewQuestion.deleteMany({});
        await TestCaseModel.deleteMany({});
        console.log('Cleared existing data');

        // Seed problems
        const createdProblems = await InterviewQuestion.insertMany(sampleProblems);
        console.log(`Created ${createdProblems.length} problems`);

        // Seed test cases
        for (const problem of createdProblems) {
            const testCases = sampleTestCases[problem.title] || [];
            const tcWithQuestionId = testCases.map(tc => ({
                ...tc,
                questionId: problem._id
            }));
            
            await TestCaseModel.insertMany(tcWithQuestionId);
            console.log(`Created ${tcWithQuestionId.length} test cases for "${problem.title}"`);
        }

        console.log('\n✅ Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error.message);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
