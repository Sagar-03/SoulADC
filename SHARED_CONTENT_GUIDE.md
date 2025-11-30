# Shared Content System - Complete Guide

## Overview

The **Shared Content System** allows multiple courses to reference the same content library. When you update content in the shared library, it automatically reflects in ALL courses using it. This is perfect for offering the same course with different durations/prices.

## Key Concept

```
Shared Content (1) ←─┬─→ Course A (5 months, $99)
                      └─→ Course B (10 months, $149)
```

- **ONE** shared content library contains all weeks/days/videos
- **MULTIPLE** courses reference this library
- Each course has its own: title, price, duration
- Update content once → Changes appear in all courses

## Quick Start: Converting Your Existing Course

### Step 1: Get Your Course ID

Login as admin and view your course, or check MongoDB:

```bash
# Using MongoDB shell
mongosh
use your_database_name
db.courses.find({}, { _id: 1, title: 1 })
```

Copy the course ID (e.g., `6475a1b2c3d4e5f6g7h8i9j0`)

### Step 2: Run Conversion Script

```bash
cd backend
node src/utils/convertToSharedContent.js <your-course-id> 5 10
```

**Example:**
```bash
node src/utils/convertToSharedContent.js 6475a1b2c3d4e5f6g7h8i9j0 5 10
```

This creates:
- ✅ Shared content library with all your course content
- ✅ Course 1: "Your Course - 5 Month Access"
- ✅ Course 2: "Your Course - 10 Month Access"

### Step 3: Verify

1. Login as admin
2. View courses list - you should see 2 new courses
3. Open each course - both should show the same content
4. Update content in one → Should appear in both

## Managing Shared Content

### Option 1: Via Admin API (Recommended)

When you edit content through the admin panel for ANY course using shared content, it updates the shared library automatically.

### Option 2: Direct Shared Content Management

#### List all shared content:
```http
GET /api/admin/shared-content
Authorization: Bearer <admin-token>
```

#### Get specific shared content:
```http
GET /api/admin/shared-content/:id
Authorization: Bearer <admin-token>
```

#### Update shared content:
```http
PUT /api/admin/shared-content/:id
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Updated Name",
  "description": "Updated Description"
}
```

#### Add week to shared content:
```http
POST /api/admin/shared-content/:id/weeks
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "weekNumber": 5,
  "title": "Week 5: Advanced Topics"
}
```

#### Add content to shared content:
```http
POST /api/admin/shared-content/:contentId/weeks/:weekId/days/:dayId/contents
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "type": "video",
  "title": "Lesson Title",
  "s3Key": "videos/lesson.mp4"
}
```

#### Get courses using shared content:
```http
GET /api/admin/shared-content/:id/courses
Authorization: Bearer <admin-token>
```

## Manual Setup (Alternative Method)

If you prefer not to use the conversion script:

### Step 1: Create Shared Content

```http
POST /api/admin/shared-content
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Web Development Bootcamp Content",
  "description": "Complete curriculum for web development"
}
```

Response:
```json
{
  "_id": "shared_content_id_here",
  "name": "Web Development Bootcamp Content",
  ...
}
```

### Step 2: Add Content to Shared Library

Add weeks, days, and content items as usual through admin panel or API.

### Step 3: Create Courses Referencing Shared Content

```http
POST /api/admin/courses
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "title": "Web Dev Bootcamp - 5 Month Access",
  "description": "Learn web development",
  "durationMonths": 5,
  "price": 99,
  "sharedContentId": "shared_content_id_here"
}
```

Repeat for second course with different duration:

```http
POST /api/admin/courses
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "title": "Web Dev Bootcamp - 10 Month Access",
  "description": "Learn web development with extended access",
  "durationMonths": 10,
  "price": 149,
  "sharedContentId": "shared_content_id_here"
}
```

## How It Works Behind the Scenes

### Database Structure

**SharedContent Collection:**
```javascript
{
  _id: ObjectId,
  name: "Course Content",
  description: "Description",
  weeks: [
    {
      weekNumber: 1,
      title: "Week 1",
      days: [
        {
          dayNumber: 1,
          title: "Day 1",
          contents: [
            { type: "video", title: "Lesson 1", s3Key: "..." }
          ]
        }
      ]
    }
  ]
}
```

**Course Collection:**
```javascript
{
  _id: ObjectId,
  title: "Course - 5 Months",
  durationMonths: 5,
  price: 99,
  sharedContentId: ObjectId (reference to SharedContent),
  weeks: [] // Empty - uses shared content
}
```

### API Behavior

When user requests course content:
1. API fetches the course
2. If `sharedContentId` exists, also fetch SharedContent
3. Merge: Use course's metadata (title, price, duration) + SharedContent's weeks
4. Return combined data to user

## Benefits

✅ **Single Source of Truth**: Update content once, applies everywhere
✅ **Easy Maintenance**: No need to duplicate content across courses
✅ **Storage Efficient**: Same S3 files used by multiple courses
✅ **Flexible Pricing**: Same content, different durations/prices
✅ **No Duplication**: Videos stored once in S3

## Important Notes

### Content Updates
- Updating content in shared library → **Affects ALL courses using it**
- Deleting content from shared library → **Removes from ALL courses**
- Be careful when modifying shared content

### Course Independence
Each course maintains its own:
- Title and description
- Price and cutPrice
- Duration (durationMonths)
- Thumbnail
- Live status (isLive)

### Mixed Approach
You can have:
- Courses with shared content (`sharedContentId` set)
- Standalone courses with direct content (`weeks` array populated)
- Both types coexisting in the same system

### Deleting Shared Content
You **cannot** delete shared content if courses are using it. First:
1. Remove courses using the shared content, OR
2. Update courses to use direct content instead

## Troubleshooting

### Issue: Content doesn't update in course

**Solution**: 
- Verify `sharedContentId` is set correctly in course
- Check shared content exists: `GET /api/admin/shared-content/:id`
- Clear cache if applicable

### Issue: Want to "unlink" a course from shared content

**Solution**:
1. Fetch the shared content
2. Copy `weeks` array to course's `weeks` field
3. Set course's `sharedContentId` to null
4. Now course has its own independent content

**API Call:**
```javascript
// Pseudo-code
const course = await Course.findById(courseId).populate('sharedContentId');
course.weeks = course.sharedContentId.weeks; // Copy content
course.sharedContentId = null; // Unlink
await course.save();
```

### Issue: Two courses showing different content

**Cause**: They're probably not using shared content (they have their own `weeks` arrays)

**Fix**: Convert both to use shared content using the migration script

## Best Practices

1. **Naming Convention**: Name shared content clearly
   - ✅ "Web Development Bootcamp - Shared Content"
   - ❌ "Course 1"

2. **Test Before Deleting**: When updating shared content, test in one course before assuming it's everywhere

3. **Backup**: Export shared content structure before major changes

4. **Documentation**: Keep track of which courses use which shared content

5. **Gradual Rollout**: When creating new content, test in one course first

## Example Workflow

### Scenario: You want to add a new week to both courses

1. **Check if courses use shared content:**
   ```http
   GET /api/admin/courses/courseId1
   GET /api/admin/courses/courseId2
   ```
   Both should have same `sharedContentId`

2. **Add week to shared content:**
   ```http
   POST /api/admin/shared-content/sharedContentId/weeks
   Body: { "weekNumber": 6, "title": "Week 6" }
   ```

3. **Verify in both courses:**
   - Open Course 1 → Should see Week 6
   - Open Course 2 → Should also see Week 6

4. **Done!** Week appears in both courses automatically.

## Migration from Direct Content

If you have existing courses with direct content:

```bash
# Convert Course A to shared content
node src/utils/convertToSharedContent.js <courseA_id> 5 10

# This creates shared content + 2 new courses
# Original course remains (can be deleted manually)
```

Or manually:
1. Create SharedContent
2. Copy weeks from course to SharedContent
3. Update course to reference SharedContent
4. Clear course's weeks array

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/shared-content` | GET | List all shared content |
| `/api/admin/shared-content` | POST | Create new shared content |
| `/api/admin/shared-content/:id` | GET | Get specific shared content |
| `/api/admin/shared-content/:id` | PUT | Update shared content metadata |
| `/api/admin/shared-content/:id` | DELETE | Delete shared content (if unused) |
| `/api/admin/shared-content/:id/weeks` | POST | Add week to shared content |
| `/api/admin/shared-content/:id/courses` | GET | Get courses using this content |
| `/api/admin/courses` | POST | Create course (with `sharedContentId`) |

## Next Steps

1. ✅ Run conversion script with your existing course ID
2. ✅ Verify both new courses show the same content
3. ✅ Test updating content through admin panel
4. ✅ Set appropriate prices for each duration
5. ✅ Delete original course if no longer needed
6. ✅ Make courses live when ready

Need help? Check the troubleshooting section or review API responses for error details.
