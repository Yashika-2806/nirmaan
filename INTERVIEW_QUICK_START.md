# Interview Practice Platform - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. **Windows Users**
```bash
setup-interview.bat
```

### 2. **Linux/Mac Users**
```bash
chmod +x setup-interview.sh
./setup-interview.sh
```

Both scripts will:
- Start Docker containers
- Seed sample problems
- Display access URLs

**Expected Output:**
```
✓ Docker containers started
✓ Interview problems seeded successfully

Available URLs:
  • Frontend:  http://localhost:3000
  • Backend:   http://localhost:5000
```

---

## 📝 Using the Interview IDE

### From Frontend

1. Navigate to `http://localhost:3000`
2. Go to **Interview** section
3. Click **Browse Problems**
4. Search or filter problems
5. Click on a problem to open the IDE

### In the IDE

**Left Side (Editor):**
- Write your code in Monaco editor
- Select language (Python, JavaScript, Java, C++)
- Use starter code or write from scratch

**Right Side (Results):**
- **Output Tab:** See execution output
- **Errors Tab:** View compilation/runtime errors
- **Tests Tab:** See test case results
- **Feedback Tab:** Get AI feedback

**Action Buttons:**
- **Run Code:** Test against sample test cases
- **Submit:** Test against all test cases (including hidden)
- **Reset:** Clear code to starter template

---

## 🧪 Test Cases

### Sample (Visible) vs Hidden

**Sample Test Cases:**
- Visible before you submit
- Use to validate your approach
- Shown in "Run Code" results

**Hidden Test Cases:**
- Only revealed after submission
- Used for final scoring
- More comprehensive coverage

### Example: Two Sum Problem

**Sample Test Cases (2):**
```
Input: [2,7,11,15], target=9       → Expected: [0,1]
Input: [3,2,4], target=6           → Expected: [1,2]
```

**Hidden Test Cases (48):**
- Edge cases (empty array, single element)
- Duplicate values
- Negative numbers
- Large arrays (stress tests)

---

## 💻 Supported Languages

| Language | Version | Timeout | Memory |
|----------|---------|---------|--------|
| Python | 3.11 | 5s | 128MB |
| JavaScript | Node 18 | 5s | 128MB |
| Java | 17 | 5s | 128MB |
| C++ | 12 | 5s | 128MB |
| C | Latest | 5s | 128MB |
| Go | 1.21 | 5s | 128MB |
| Rust | 1.70 | 5s | 128MB |

---

## ✅ Verdicts Explained

| Verdict | Meaning | What to Do |
|---------|---------|-----------|
| **Accepted** | All test cases passed ✅ | Move to next problem |
| **Wrong Answer** | Output doesn't match | Review logic and test cases |
| **Compilation Error** | Code won't compile | Fix syntax errors |
| **Runtime Error** | Code crashed | Check for edge cases |
| **Time Limit Exceeded** | Too slow (>5s) | Optimize algorithm |
| **Memory Limit Exceeded** | Uses too much RAM | Use better data structures |

---

## 📊 Example Workflows

### Workflow 1: Solve a Problem

```
1. Click "Browse Problems"
2. Find "Two Sum" (Easy, Array)
3. Click to open
4. Read problem description
5. Select Python
6. Write solution:
   def twoSum(nums, target):
       seen = {}
       for i, num in enumerate(nums):
           complement = target - num
           if complement in seen:
               return [seen[complement], i]
           seen[num] = i
       return []
7. Click "Run Code"
   → ✅ Sample tests pass
8. Click "Submit"
   → ✅ All tests pass
9. View AI feedback
10. Celebrate! 🎉
```

### Workflow 2: Debug a Failed Submission

```
1. Write code that fails
2. Click "Run Code"
3. See which test cases fail
4. Click "Errors" tab
5. Review error message
6. Click "Feedback" tab for AI suggestions
7. Update code
8. Click "Run Code" again
9. Repeat until all tests pass
```

### Workflow 3: Search for a Problem

```
1. Click "Browse Problems"
2. Type "string" in search box
3. Click "Search"
4. Filter by "Medium" difficulty
5. Click problem to start
```

---

## 🔧 API Integration

### For Developers

**Run Code (Sample Tests):**
```bash
curl -X POST http://localhost:5000/api/interview/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sourceCode": "def solution(): pass",
    "language": "python",
    "questionId": "PROBLEM_ID"
  }'
```

**Submit Code (All Tests):**
```bash
curl -X POST http://localhost:5000/api/interview/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sourceCode": "def solution(): pass",
    "language": "python",
    "questionId": "PROBLEM_ID"
  }'
```

**Get Problems:**
```bash
curl http://localhost:5000/api/interview/problems \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: "Docker is not running"
**Solution:** Start Docker Desktop

### Issue: "Connection refused on port 5000"
**Solution:**
```bash
# Check if container is running
docker ps | grep nirmaan

# Start containers
docker-compose up -d

# Check logs
docker-compose logs backend
```

### Issue: "MongoDB connection failed"
**Solution:**
```bash
# Restart MongoDB container
docker-compose restart mongodb

# Verify connection
docker-compose logs mongodb
```

### Issue: "Problems list is empty"
**Solution:**
```bash
cd backend
node scripts/seed-interview-problems.js
```

### Issue: "Code execution timeout"
**Solution:**
- Your code is too slow (>5 seconds)
- Optimize your algorithm
- Try a more efficient approach

### Issue: "Memory limit exceeded"
**Solution:**
- Using too much memory (>128MB)
- Avoid creating very large arrays
- Use more efficient data structures

---

## 📚 Sample Problems Available

### Easy
- ✅ **Two Sum** - Array manipulation with hash tables
- ✅ **Reverse String** - In-place string manipulation
- ✅ **Merge Sorted Array** - Merging sorted sequences

### Medium
- ✅ **Longest Substring Without Repeating** - Sliding window technique

### Coming Soon
- Trees, Graphs, Dynamic Programming
- More medium and hard problems
- Company-specific interview questions

---

## 🎯 Tips & Tricks

### 1. **Use Run Code First**
Always test with sample cases before submitting full test suite.

### 2. **Check Error Messages**
Error tab shows exactly where your code failed.

### 3. **Review AI Feedback**
Get suggestions on optimization and best practices.

### 4. **Test Edge Cases**
Think about empty inputs, nulls, single elements.

### 5. **Optimize Before Submitting**
Use Run code to verify performance first.

---

## 📊 Performance Tips

| Issue | Solution |
|-------|----------|
| **Slow Code** | Use better algorithms (e.g., hash table instead of nested loops) |
| **Memory Issues** | Avoid large data structures; process data in chunks |
| **Repeated Errors** | Read the error message carefully; use AI feedback |
| **Compilation Errors** | Check syntax; verify function signatures |
| **Wrong Answer** | Trace through test cases manually |

---

## 🔐 Security

✅ Your code runs in:
- Isolated Docker containers
- No access to file system
- No internet access
- Network isolated
- Resource limited (5s, 128MB)

❌ Not allowed:
- File operations (read/write)
- Network calls
- Importing external libraries (only stdlib)
- Long-running processes

---

## 📈 Tracking Progress

**After Each Problem:**
- See if you solved it
- View your submission history
- Get performance metrics
- Read editorial solution
- Unlock harder problems

**Dashboard Shows:**
- Total problems solved
- Accuracy percentage
- Time statistics
- Category breakdown

---

## 🚀 Next Steps

1. **Solve 3 Easy problems** to get familiar
2. **Try 1 Medium problem** to build confidence
3. **Review solutions** to learn best practices
4. **Join leaderboard** and compete with others
5. **Practice regularly** - consistency is key

---

## 💡 Resources

- **Full Documentation:** `INTERVIEW_COMPLETE_GUIDE.md`
- **API Reference:** `http://localhost:5000/api/docs`
- **Sample Problems:** Run `seed-interview-problems.js`
- **Logs:** Check `backend/logs/`

---

## ❓ FAQ

**Q: Can I use external libraries?**
A: Only standard library modules are available.

**Q: What if my code fails?**
A: Use the Errors tab and AI feedback to debug.

**Q: How long can code run?**
A: Maximum 5 seconds per test case.

**Q: Is there a memory limit?**
A: Yes, 128MB per execution.

**Q: Can I see hidden test cases?**
A: No, but you can see your verdict and error message.

**Q: How do I improve?**
A: Review solutions, read editorials, practice consistently.

---

**Happy Coding! 🎉**

For issues or questions, check the logs or documentation.
