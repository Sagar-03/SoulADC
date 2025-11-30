# Quick Setup - Shared Content System

## ✅ What You Need

1. Your existing course ID
2. MongoDB connection working
3. Backend server

## 🚀 Three Simple Steps

### Step 1: Get Course ID

```bash
# In MongoDB shell or check admin panel
# Example ID: 6475a1b2c3d4e5f6g7h8i9j0
```

### Step 2: Run Conversion

```bash
cd backend
node src/utils/convertToSharedContent.js YOUR_COURSE_ID 5 10
```

Replace:
- `YOUR_COURSE_ID` with your actual course ID
- `5` = duration for first course (in months)
- `10` = duration for second course (in months)

### Step 3: Verify

Login as admin → Check courses → You'll see 2 new courses with same content but different durations!

## 📝 What Happens

✅ Creates shared content library from your course
✅ Creates Course 1: "Your Course - 5 Month Access"
✅ Creates Course 2: "Your Course - 10 Month Access"
✅ Both share same content
✅ Update content once → Both courses updated

## 💡 Key Benefits

- **Update once, apply everywhere**: Change a video → Changes in both courses
- **No duplication**: Same videos, different access periods
- **Easy pricing**: Set different prices for 5-month vs 10-month access

## ⚠️ Important

- Original course is NOT deleted (delete manually if needed)
- Both new courses reference the same content
- Editing content in either course updates BOTH

## 🎯 Example

```bash
# Your course ID: 647abc123
cd backend
node src/utils/convertToSharedContent.js 647abc123 5 10
```

Result:
- ✅ Shared Content: "Your Course - Shared Content"  
- ✅ Course 1: 5 months access at original price
- ✅ Course 2: 10 months access at 1.5x price

## 📚 Full Documentation

See `SHARED_CONTENT_GUIDE.md` for complete details, API reference, and troubleshooting.

## Need Help?

Common issues:
- **MONGO_URI undefined**: Check your `.env` file has `MONGO_URI=mongodb://...`
- **Course not found**: Verify course ID is correct
- **Permission denied**: Make sure you're in the `/backend` directory
