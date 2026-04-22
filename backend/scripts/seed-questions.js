const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const InterviewQuestion = require('../src/modules/interview/models/interview-question-model');
const TestCaseModel = require('../src/modules/interview/models/test-case-model');
const logger = require('../src/core/utils/logger');

// Sample DSA questions
const SAMPLE_QUESTIONS = [
    {
        title: 'Two Sum',
        description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: 'easy',
        category: 'array',
        tags: ['array', 'hash-table', 'two-pointers'],
        functionSignature: 'def twoSum(nums: List[int], target: int) -> List[int]:',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
        examples: [
            {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'The sum of 2 and 7 is 9. Therefore, we return [0, 1].',
            },
            {
                input: 'nums = [3,2,4], target = 6',
                output: '[1,2]',
                explanation: 'The sum of 2 and 4 is 6. Therefore, we return [1, 2].',
            },
        ],
        companies: ['Google', 'Amazon', 'Microsoft'],
        frequencyScore: 90,
    },
    {
        title: 'Reverse String',
        description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
        difficulty: 'easy',
        category: 'string',
        tags: ['string', 'two-pointers'],
        functionSignature: 'def reverseString(s: List[str]) -> None:',
        constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
        examples: [
            {
                input: 's = ["h","e","l","l","o"]',
                output: '["o","l","l","e","h"]',
                explanation: 'The string is reversed in-place.',
            },
        ],
        companies: ['Facebook', 'Microsoft'],
        frequencyScore: 75,
    },
    {
        title: 'Binary Tree Level Order Traversal',
        description: `Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).`,
        difficulty: 'medium',
        category: 'tree',
        tags: ['tree', 'breadth-first-search', 'queue'],
        functionSignature: 'def levelOrder(root: Optional[TreeNode]) -> List[List[int]]:',
        constraints: 'The number of nodes in the tree is in the range [0, 2000].\n-1000 <= Node.val <= 1000',
        examples: [
            {
                input: 'root = [3,9,20,null,null,15,7]',
                output: '[[3],[9,20],[15,7]]',
                explanation: 'Level order traversal.',
            },
        ],
        companies: ['Google', 'Amazon', 'Apple', 'Meta'],
        frequencyScore: 85,
    },
    {
        title: 'Longest Substring Without Repeating Characters',
        description: `Given a string s, find the length of the longest substring without repeating characters.`,
        difficulty: 'medium',
        category: 'string',
        tags: ['string', 'hash-table', 'sliding-window'],
        functionSignature: 'def lengthOfLongestSubstring(s: str) -> int:',
        constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
        examples: [
            {
                input: 's = "abcabcbb"',
                output: '3',
                explanation: 'The answer is "abc", with the length of 3.',
            },
        ],
        companies: ['Google', 'Amazon', 'Microsoft', 'Meta'],
        frequencyScore: 95,
    },
    {
        title: 'Merge K Sorted Lists',
        description: `You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.`,
        difficulty: 'hard',
        category: 'linked-list',
        tags: ['linked-list', 'heap', 'merge-sort', 'divide-and-conquer'],
        constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500',
        examples: [
            {
                input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
                output: '[1,1,2,1,3,4,4,5,6]',
                explanation: 'The linked-lists are merged into one sorted list.',
            },
        ],
        companies: ['Google', 'Amazon', 'Microsoft'],
        frequencyScore: 80,
    },
];

// Sample test cases for each question
const SAMPLE_TEST_CASES = {
    'Two Sum': [
        {
            title: 'Basic Example',
            input: '[2,7,11,15]\n9',
            expected: '[0,1]',
            explanation: 'Simple case with target at beginning of array',
            isVisible: true,
            difficulty: 'easy',
            category: 'normal',
        },
        {
            title: 'Negative Numbers',
            input: '[-1,0,-2,4]\n0',
            expected: '[0,2]',
            explanation: 'Test with negative numbers',
            isVisible: true,
            difficulty: 'medium',
            category: 'edge_case',
        },
        {
            title: 'Large Numbers',
            input: '[1000000,2000000,3000000]\n3000000',
            expected: '[0,1]',
            explanation: 'Test with large numbers',
            isVisible: false,
            difficulty: 'easy',
            category: 'normal',
        },
    ],
    'Reverse String': [
        {
            title: 'Basic String',
            input: '["h","e","l","l","o"]',
            expected: '["o","l","l","e","h"]',
            explanation: 'Simple reversal',
            isVisible: true,
            difficulty: 'easy',
            category: 'normal',
        },
        {
            title: 'Single Character',
            input: '["a"]',
            expected: '["a"]',
            explanation: 'Edge case - single character',
            isVisible: true,
            difficulty: 'easy',
            category: 'edge_case',
        },
        {
            title: 'Empty String',
            input: '[]',
            expected: '[]',
            explanation: 'Edge case - empty string',
            isVisible: false,
            difficulty: 'easy',
            category: 'edge_case',
        },
    ],
    'Binary Tree Level Order Traversal': [
        {
            title: 'Complete Tree',
            input: '[3,9,20,null,null,15,7]',
            expected: '[[3],[9,20],[15,7]]',
            explanation: 'Standard complete binary tree',
            isVisible: true,
            difficulty: 'medium',
            category: 'normal',
        },
        {
            title: 'Single Node',
            input: '[1]',
            expected: '[[1]]',
            explanation: 'Tree with single node',
            isVisible: true,
            difficulty: 'easy',
            category: 'edge_case',
        },
        {
            title: 'Empty Tree',
            input: '[]',
            expected: '[]',
            explanation: 'Empty tree',
            isVisible: false,
            difficulty: 'easy',
            category: 'edge_case',
        },
    ],
};

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.info('Connected to MongoDB');

        // Clear existing data
        await InterviewQuestion.deleteMany({});
        await TestCaseModel.deleteMany({});
        logger.info('Cleared existing data');

        // Seed questions
        const createdQuestions = await InterviewQuestion.insertMany(SAMPLE_QUESTIONS);
        logger.info(`Created ${createdQuestions.length} sample questions`);

        // Seed test cases
        for (const question of createdQuestions) {
            const testCases = SAMPLE_TEST_CASES[question.title] || [];
            const testCaseDocs = testCases.map(tc => ({
                ...tc,
                questionId: question._id,
                generatedBy: 'seed',
            }));

            if (testCaseDocs.length > 0) {
                await TestCaseModel.insertMany(testCaseDocs);
                logger.info(`Created ${testCaseDocs.length} test cases for "${question.title}"`);
            }
        }

        logger.info('✓ Database seeding complete');
        process.exit(0);
    } catch (error) {
        logger.error('Seeding error:', error.message);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
