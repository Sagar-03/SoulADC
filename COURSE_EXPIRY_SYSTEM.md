# Course Expiry System Implementation

## Overview
This system allows administrators to set course duration (in months) and automatically expire user access after the specified period from their purchase date. Multiple courses can share the same content but differ in duration.

## Key Features

### 1. **Course Duration Management**
- Admins can set duration when creating/editing courses (e.g., 5 months, 10 months)
- Each course has its own `durationMonths` field
- Multiple courses can share content but have different expiry periods

### 2. **Automatic Expiry Calculation**
- When a user purchases a course, the expiry date is automatically calculated
- Expiry = Purchase Date + Course Duration (in months)
- Example: Purchase on Jan 1, 2024 + 5 months = Expires on Jun 1, 2024

### 3. **Access Control**
- Users can only access courses they've purchased and haven't expired
- API automatically checks expiry before allowing access
- Clear error messages when courses expire

## Database Schema Changes

### Course Model (`backend/src/models/Course.js`)
```javascript
{
  title: String,
  description: String,
  price: Number,
  cutPrice: Number,
  thumbnail: String,
  durationMonths: Number (required, minimum: 1),  // NEW FIELD
  weeks: [weekSchema],
  isLive: Boolean
}
```

### User Model (`backend/src/models/userModel.js`)
```javascript
purchasedCourses: [
  {
    courseId: ObjectId (ref: Course),      // NEW: Now stores object with details
    purchaseDate: Date,                     // NEW: When user bought the course
    expiryDate: Date,                       // NEW: When access expires
    isExpired: Boolean                      // NEW: Expiry status flag
  }
]
```

**MIGRATION REQUIRED**: Old structure was just `[ObjectId]`, now it's an array of objects.

## API Endpoints

### Admin Endpoints

#### Create Course
```
POST /api/admin/courses
Body: {
  title: string,
  description: string,
  durationMonths: number (required, min: 1),
  weeks: number,
  price: number,
  cutPrice: number (optional),
  thumbnail: string (optional)
}
```

#### Update Course
```
PUT /api/admin/courses/:id
Body: {
  title: string,
  description: string,
  durationMonths: number,
  price: number,
  cutPrice: number,
  thumbnail: string
}
```

### User Endpoints

#### Get Purchased Courses (with expiry info)
```
GET /api/user/purchased-courses
Response: [
  {
    ...courseData,
    purchaseDate: Date,
    expiryDate: Date,
    isExpired: boolean,
    daysRemaining: number
  }
]
```

#### Check Course Access
```
GET /api/user/courses/:id/access
Response: {
  hasAccess: boolean,
  reason: "valid" | "expired" | "not_purchased",
  purchaseDate: Date,
  expiryDate: Date,
  daysRemaining: number,
  isExpired: boolean,
  message: string
}
```

#### Get Course Content (Protected)
```
GET /api/user/courses/:id
Headers: { Authorization: Bearer <token> }
Response: {
  ...courseData,
  accessInfo: {
    purchaseDate: Date,
    expiryDate: Date,
    daysRemaining: number
  }
}
```

### Payment Flow

When a user completes payment:
1. Payment success handler fetches the course
2. Calculates `expiryDate = purchaseDate + course.durationMonths months`
3. Stores `{ courseId, purchaseDate, expiryDate, isExpired: false }` in user's purchasedCourses
4. Returns success with expiry information

## Middleware

### `checkCourseAccess` (`backend/src/middleware/courseAccessMiddleware.js`)
- Validates if user has purchased the course
- Checks if course access has expired
- Attaches access info to request object
- Returns appropriate error messages

Usage:
```javascript
router.get('/courses/:id', protect, checkCourseAccess, async (req, res) => {
  // req.courseAccess contains { purchaseDate, expiryDate, daysRemaining }
});
```

## Frontend Components

### AddCourse (`frontend/src/Components/admin/AddCourse.jsx`)
- Includes `durationMonths` input field
- Validates duration is at least 1 month
- Sends duration to backend on course creation

### EditCourse (`frontend/src/Components/admin/EditCourse.jsx`)
- Shows current course duration
- Allows admin to update duration
- Updates are applied to NEW purchases only (existing purchases retain their original expiry)

## Migration Guide

### Running the Migration Script

For existing data, run the migration script once:

```bash
cd backend
node src/utils/migrateCourseData.js
```

This script will:
1. Set `durationMonths = 12` for all existing courses without a duration
2. Convert old `purchasedCourses: [ObjectId]` to new structure with expiry dates
3. Set purchase date to 1 month ago (default for existing data)
4. Calculate expiry dates based on course duration

### Manual Migration (Alternative)

If you prefer manual migration:

1. **Update all courses:**
```javascript
db.courses.updateMany(
  { durationMonths: { $exists: false } },
  { $set: { durationMonths: 12 } }
)
```

2. **Check users that need migration:**
```javascript
db.users.find({
  purchasedCourses: { $exists: true, $ne: [] }
})
```

3. **Manually update user documents** - Use the migration script for this as it's complex

## Testing Checklist

- [ ] Create a new course with 5 months duration
- [ ] Create another course with 10 months duration (can reuse same content)
- [ ] Purchase a course and verify expiry date is correct
- [ ] Try accessing course content - should work
- [ ] Manually update expiry date to yesterday in database
- [ ] Try accessing course content again - should be blocked
- [ ] Check `/api/user/courses/:id/access` returns correct expiry info
- [ ] Verify video progress tracking still works with expiry checks
- [ ] Test payment flow end-to-end

## Usage Example: Creating Two Courses with Same Content

### Scenario
You want to offer the same course content with two different access durations:
- **Course A**: 5-month access for $99
- **Course B**: 10-month access for $149

### Steps

1. **Create Course A**
   - Title: "Web Development Bootcamp - 5 Month Access"
   - Duration: 5 months
   - Price: $99

2. **Create Course B**
   - Title: "Web Development Bootcamp - 10 Month Access"
   - Duration: 10 months
   - Price: $149

3. **Add Content to Course A**
   - Upload all weeks, days, videos, documents

4. **For Course B**
   - You can either:
     - **Option 1**: Upload the same content again (duplicate)
     - **Option 2**: Use the same S3 keys/references in both courses (courses can share S3 content)

5. **Students Purchase**
   - Student buys Course A on Jan 1 → Access expires Jun 1 (5 months)
   - Student buys Course B on Jan 1 → Access expires Nov 1 (10 months)

## Important Notes

⚠️ **Breaking Changes**:
- Old `purchasedCourses` structure (array of ObjectIds) is incompatible with new structure
- Migration MUST be run for existing users
- All courses MUST have `durationMonths` set

⚠️ **Behavior**:
- Expiry is calculated from purchase date, NOT from course creation date
- Changing a course's duration only affects NEW purchases
- Existing user purchases retain their original expiry dates
- Expired courses still appear in user's purchased courses but are inaccessible

📝 **Best Practices**:
- Set realistic course durations (3-12 months recommended)
- Clearly display expiry information to users
- Consider offering course renewal options for expired courses
- Monitor expiry dates and notify users before expiry

## Troubleshooting

### Issue: User can't access purchased course
- Check if course has expired: `GET /api/user/courses/:id/access`
- Verify purchase record exists in user's `purchasedCourses`
- Check `expiryDate` is in the future

### Issue: Migration script fails
- Ensure MongoDB connection string is correct in `.env`
- Check if courses exist before running user migration
- Verify no orphaned course references in user documents

### Issue: New courses don't have duration
- Ensure `durationMonths` is included in create course request
- Verify Course model has `durationMonths` field with `required: true`
- Check frontend form includes duration input

## Future Enhancements

Potential features to add:
- [ ] Email notifications before course expiry (7 days, 1 day)
- [ ] Course renewal/extension functionality
- [ ] Lifetime access option (durationMonths = null)
- [ ] Grace period after expiry
- [ ] Admin dashboard showing courses nearing expiry
- [ ] Bulk expiry date extension for specific users
- [ ] Course access history/logs
