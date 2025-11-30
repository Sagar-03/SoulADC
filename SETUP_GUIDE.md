# Quick Setup Guide - Course Expiry System

## Prerequisites
- Existing SoulADC application running
- Access to MongoDB database
- Node.js environment

## Step-by-Step Setup

### 1. Update Dependencies (if needed)
```bash
cd backend
npm install
```

### 2. Run Database Migration
This updates existing courses and user purchases to support expiry system:

```bash
cd backend
node src/utils/migrateCourseData.js
```

Expected output:
```
🚀 Starting database migration for course expiry feature
✅ Connected to MongoDB
🔄 Starting course migration...
📚 Found X courses without duration
✅ Updated course: Course Name - Duration: 12 months
...
✅ Course migration completed!
...
🎉 Migration completed successfully!
```

### 3. Restart Backend Server
```bash
cd backend
npm start
```

### 4. Restart Frontend
```bash
cd frontend
npm run dev
```

## Verify Installation

### Test 1: Check Course Creation
1. Login as admin
2. Go to "Add Course"
3. You should see "Duration (Months)" field
4. Create a test course with 5 months duration
5. Verify course is created successfully

### Test 2: Check Existing Courses
1. Go to admin dashboard
2. View existing courses
3. All should now have duration = 12 months (default)
4. Edit a course to change duration

### Test 3: Check User Access
1. As a user, check your purchased courses:
   ```
   GET /api/user/purchased-courses
   ```
2. Response should include:
   - `purchaseDate`
   - `expiryDate`
   - `isExpired`
   - `daysRemaining`

### Test 4: Check Course Access Endpoint
```bash
# Replace with actual course ID and token
curl -X GET "http://localhost:7001/api/user/courses/{courseId}/access" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "hasAccess": true,
  "reason": "valid",
  "purchaseDate": "2024-01-01T00:00:00.000Z",
  "expiryDate": "2024-06-01T00:00:00.000Z",
  "daysRemaining": 123,
  "isExpired": false,
  "message": "You have active access to this course"
}
```

## Creating Your Two Courses

Since you mentioned you have content uploaded and want two courses with different durations:

### Option 1: Duplicate Content (Recommended)

1. **Create Course 1 (5 months)**
   - Title: "Your Course - 5 Month Access"
   - Duration: 5 months
   - Price: $X
   - Upload all content

2. **Create Course 2 (10 months)**
   - Title: "Your Course - 10 Month Access"  
   - Duration: 10 months
   - Price: $Y
   - Upload the same content again

### Option 2: Update Existing Course

If you already have one course with content:

1. **Keep existing course as is**
2. **Edit it to set duration:**
   - Go to Edit Course
   - Set "Duration (Months)" to 5 (or your preference)
   - Save

3. **Create second course:**
   - Create new course with 10 months duration
   - Re-upload the same content

## Common Issues & Solutions

### Issue: Migration script doesn't run
**Solution**: 
```bash
# Check MongoDB connection
# Verify .env file has MONGO_URI
cd backend
cat .env | grep MONGO_URI

# Run with explicit error logging
node src/utils/migrateCourseData.js 2>&1 | tee migration.log
```

### Issue: "durationMonths is required" error
**Solution**: All courses MUST have duration. Run migration script to add default duration to existing courses.

### Issue: Users can't access purchased courses
**Possible causes**:
1. Migration didn't run - old data structure
2. Course expired - check expiry date
3. Not actually purchased - verify `purchasedCourses` array

**Debug**:
```javascript
// In MongoDB shell
db.users.findOne({ email: "user@example.com" }, { purchasedCourses: 1 })
```

### Issue: Frontend doesn't show duration field
**Solution**: 
1. Clear browser cache
2. Rebuild frontend: `npm run build`
3. Restart dev server

## Rollback (if needed)

If you need to revert changes:

1. **Database Rollback**:
```javascript
// Remove durationMonths from courses
db.courses.updateMany({}, { $unset: { durationMonths: "" } })

// Revert user purchases to old structure (COMPLEX - use backup)
// Better to restore from backup if available
```

2. **Code Rollback**: Use git to revert to previous commit

## Next Steps

1. ✅ Test course creation with different durations
2. ✅ Test user purchase flow
3. ✅ Verify expiry checking works
4. ✅ Test video progress tracking
5. ✅ Update user-facing pages to show expiry info
6. ✅ Consider adding expiry notifications

## Support

If you encounter issues:
1. Check `backend/logs` for error messages
2. Verify MongoDB connection
3. Ensure all models are up to date
4. Test with Postman/curl for API issues

## Files Modified

### Backend
- `src/models/Course.js` - Added durationMonths field
- `src/models/userModel.js` - Updated purchasedCourses structure
- `src/middleware/courseAccessMiddleware.js` - NEW: Expiry validation
- `src/routes/paymentRoutes.js` - Calculate expiry on purchase
- `src/routes/userRoutes.js` - Added expiry checks and endpoint
- `src/routes/adminRoutes.js` - Support duration in create/update
- `src/utils/migrateCourseData.js` - NEW: Migration script

### Frontend
- `src/Components/admin/AddCourse.jsx` - Already had duration field ✓
- `src/Components/admin/EditCourse.jsx` - Added duration field

### Documentation
- `COURSE_EXPIRY_SYSTEM.md` - Complete system documentation
- `SETUP_GUIDE.md` - This file
