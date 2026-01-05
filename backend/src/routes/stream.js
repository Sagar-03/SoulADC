const express = require("express");
const mongoose = require("mongoose");
const { HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const Course = require("../models/Course.js");
const s3 = require("../config/s3.js");
const { protect, protectStream } = require("../middleware/authMiddleware");

const router = express.Router();

// Get video metadata endpoint
router.get("/info/:identifier", protectStream, async (req, res) => {
  try {
    const { identifier } = req.params;
    let s3Key, contentInfo = null;

    // Check if identifier is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const course = await Course.findOne({
        $or: [
          { "weeks.contents._id": identifier },
          { "weeks.days.contents._id": identifier },
          { "weeks.documents._id": identifier },
          { "otherDocuments._id": identifier }
        ]
      }).lean();

      if (!course) return res.status(404).json({ error: "Content not found" });

      // Check "other documents" first
      if (course.otherDocuments) {
        for (const doc of course.otherDocuments) {
          if (String(doc._id) === String(identifier)) {
            s3Key = doc.s3Key;
            contentInfo = {
              id: doc._id,
              title: doc.title,
              type: doc.type,
              category: 'other',
              isDocument: true
            };
            break;
          }
        }
      }

      // Find the content info in weeks if not found in other documents
      if (!contentInfo) {
        outer: for (const w of course.weeks) {
          if (w.contents) {
            for (const c of w.contents) {
              if (String(c._id) === String(identifier)) {
                s3Key = c.s3Key;
                contentInfo = {
                  id: c._id,
                  title: c.title,
                  type: c.type,
                  weekNumber: w.weekNumber,
                  weekTitle: w.title
                };
                break outer;
              }
            }
          }

          if (w.days) {
            for (const d of w.days) {
              if (d.contents) {
                for (const c of d.contents) {
                  if (String(c._id) === String(identifier)) {
                    s3Key = c.s3Key;
                    contentInfo = {
                      id: c._id,
                      title: c.title,
                      type: c.type,
                      weekNumber: w.weekNumber,
                      weekTitle: w.title,
                      dayNumber: d.dayNumber,
                      dayTitle: d.title
                    };
                    break outer;
                  }
                }
              }
            }
          }

          // Check module-level documents (weeks.documents)
          if (w.documents) {
            for (const doc of w.documents) {
              if (String(doc._id) === String(identifier)) {
                s3Key = doc.s3Key;
                contentInfo = {
                  id: doc._id,
                  title: doc.title,
                  type: doc.type,
                  weekNumber: w.weekNumber,
                  weekTitle: w.title,
                  isDocument: true
                };
                break outer;
              }
            }
          }
        }
      }
    } else {
      s3Key = identifier;
      contentInfo = {
        id: identifier,
        title: "Video Content",
        type: "video"
      };
    }

    if (!s3Key) return res.status(404).json({ error: "S3 key missing" });

    // Get metadata from S3 with proper error handling
    let head;
    try {
      head = await s3.send(new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
      }));
    } catch (s3Error) {
      console.error(`S3 file not found for info: ${s3Key}`, s3Error.message);
      return res.status(404).json({
        error: "File not found in storage",
        s3Key: s3Key,
        details: "The requested file does not exist in our storage system"
      });
    }

    const response = {
      ...contentInfo,
      fileSize: head.ContentLength,
      contentType: head.ContentType,
      lastModified: head.LastModified,
      streamUrl: `/api/stream/${identifier}`
    };

    res.json(response);
  } catch (err) {
    console.error("Video info error:", err);
    res.status(500).json({ error: "Error fetching video information" });
  }
});

router.get("/:identifier", protectStream, async (req, res) => {
  try {
    let { identifier } = req.params;
    // Decode the identifier in case it's URL encoded
    identifier = decodeURIComponent(identifier);
    console.log(`📥 Stream request for identifier: ${identifier}`);
    
    const range = req.headers.range;

    let s3Key, mime = "application/octet-stream";

    // Check if identifier is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      console.log(`🔍 Searching for content with ID: ${identifier}`);
      
      // First, try to find in direct course content
      let course = await Course.findOne({
        $or: [
          { "otherDocuments._id": identifier }, // Other documents (course-level)
          { "weeks.contents._id": identifier }, // Old structure support
          { "weeks.days.contents._id": identifier }, // New day-based structure
          { "weeks.documents._id": identifier } // Module-level documents
        ]
      }).lean();

      // If not found in course, try SharedContent
      if (!course) {
        console.log(`🔍 Not found in Course, checking SharedContent...`);
        const SharedContent = require("../models/SharedContent");
        
        const sharedContent = await SharedContent.findOne({
          $or: [
            { "otherDocuments._id": identifier }, // Other documents
            { "weeks.contents._id": identifier },
            { "weeks.days.contents._id": identifier },
            { "weeks.documents._id": identifier }
          ]
        }).lean();

        if (sharedContent) {
          console.log(`✅ Found in SharedContent: ${sharedContent.title || 'Shared Content'}`);
          
          // Check otherDocuments first
          if (sharedContent.otherDocuments) {
            for (const doc of sharedContent.otherDocuments) {
              if (String(doc._id) === String(identifier)) {
                s3Key = doc.s3Key;
                mime = doc.type === "pdf" ? "application/pdf" : "application/octet-stream";
                console.log(`✅ Found document in SharedContent otherDocuments: ${doc.title}, s3Key: ${s3Key}`);
                break;
              }
            }
          }
          
          // Search in SharedContent structure
          if (!s3Key) {
            outer: for (const w of sharedContent.weeks || []) {
            if (w.contents) {
              for (const c of w.contents) {
                if (String(c._id) === String(identifier)) {
                  s3Key = c.s3Key;
                  mime = c.type === "video" ? "video/mp4" : "application/pdf";
                  console.log(`✅ Found content in SharedContent weeks.contents: ${c.title}, s3Key: ${s3Key}`);
                  break outer;
                }
              }
            }

            if (w.days) {
              for (const d of w.days) {
                if (d.contents) {
                  for (const c of d.contents) {
                    if (String(c._id) === String(identifier)) {
                      s3Key = c.s3Key;
                      mime = c.type === "video" ? "video/mp4" : "application/pdf";
                      console.log(`✅ Found content in SharedContent weeks.days.contents: ${c.title}, s3Key: ${s3Key}`);
                      break outer;
                    }
                  }
                }
              }
            }

            if (w.documents) {
              for (const doc of w.documents) {
                if (String(doc._id) === String(identifier)) {
                  s3Key = doc.s3Key;
                  mime = doc.type === "pdf" ? "application/pdf" : "application/octet-stream";
                  console.log(`✅ Found document in SharedContent weeks.documents: ${doc.title}, s3Key: ${s3Key}`);
                  break outer;
                }
              }
            }
          }
          }
        }
      }

      if (!course && !s3Key) {
        console.error(`❌ No course or SharedContent found containing content ID: ${identifier}`);
        return res.status(404).json({
          error: "Content not found",
          message: "No course or shared content contains a document/content with this ID",
          identifier: identifier
        });
      }
      
      if (course) {
        console.log(`✅ Found course: ${course.title} (${course._id})`);

        // Check otherDocuments first (course-level)
        if (course.otherDocuments) {
          for (const doc of course.otherDocuments) {
            if (String(doc._id) === String(identifier)) {
              s3Key = doc.s3Key;
              mime = doc.type === "pdf" ? "application/pdf" : "application/octet-stream";
              console.log(`✅ Found document in course otherDocuments: ${doc.title}, s3Key: ${s3Key}`);
              break;
            }
          }
        }

        // Check old structure first (weeks.contents)
        if (!s3Key) {
          outer: for (const w of course.weeks) {
          if (w.contents) {
            for (const c of w.contents) {
              if (String(c._id) === String(identifier)) {
                s3Key = c.s3Key;
                mime = c.type === "video" ? "video/mp4" : "application/pdf";
                console.log(`✅ Found content in weeks.contents: ${c.title}, s3Key: ${s3Key}`);
                break outer;
              }
            }
          }

          // Check new day-based structure (weeks.days.contents)
          if (w.days) {
            for (const d of w.days) {
              if (d.contents) {
                for (const c of d.contents) {
                  if (String(c._id) === String(identifier)) {
                    s3Key = c.s3Key;
                    mime = c.type === "video" ? "video/mp4" : "application/pdf";
                    console.log(`✅ Found content in weeks.days.contents: ${c.title}, s3Key: ${s3Key}`);
                    break outer;
                  }
                }
              }
            }
          }

          // Check module-level documents (weeks.documents)
          if (w.documents) {
            for (const doc of w.documents) {
              if (String(doc._id) === String(identifier)) {
                s3Key = doc.s3Key;
                mime = doc.type === "pdf" ? "application/pdf" : "application/octet-stream";
                console.log(`✅ Found document in weeks.documents: ${doc.title}, s3Key: ${s3Key}`);
                break outer;
              }
            }
          }
        }
        }
      }
    } else {
      s3Key = identifier;
      console.log(`📁 Using identifier as S3 key directly: ${s3Key}`);
      // Set mime type for images
      if (s3Key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        mime = `image/${s3Key.split('.').pop().toLowerCase()}`;
        console.log(`🖼️ Detected image file, mime type: ${mime}`);
      }
    }

    if (!s3Key) {
      console.error(`❌ S3 key not found for identifier: ${identifier}`);
      return res.status(404).json({
        error: "S3 key missing",
        message: "Content found but S3 key is missing",
        identifier: identifier
      });
    }

    // Get metadata from S3 with proper error handling
    let head, fileSize;
    try {
      head = await s3.send(new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
      }));
      fileSize = head.ContentLength;
    } catch (s3Error) {
      console.error(`❌ S3 file not found: ${s3Key}`, s3Error.message);
      console.error(`📍 Requested identifier: ${identifier}`);
      
      // Extract prefix from s3Key for better debugging
      const keyParts = s3Key.split('/');
      const prefix = keyParts.slice(0, -1).join('/') + '/';
      
      // List available files for debugging
      console.log(`🔍 Checking available S3 files in ${prefix}:`);
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_BUCKET,
          Prefix: prefix,
          MaxKeys: 20
        });
        const listResult = await s3.send(listCommand);
        if (listResult.Contents && listResult.Contents.length > 0) {
          console.log(`📂 Found ${listResult.Contents.length} files:`);
          listResult.Contents.forEach(obj => {
            console.log(`  - ${obj.Key}`);
          });
        } else {
          console.log(`⚠️ No files found in ${prefix}`);
        }
      } catch (listError) {
        console.error('❌ Error listing S3 objects:', listError.message);
      }
      
      return res.status(404).json({
        error: "File not found in storage",
        message: "The requested document file does not exist in our storage system",
        s3Key: s3Key,
        identifier: identifier,
        // details: {
        //   bucket: process.env.AWS_S3_BUCKET,
        //   key: s3Key,
        //   suggestion: "The file may have been moved, renamed, or deleted from S3"
        // }
      });
    }
    mime = head.ContentType || mime;

    // Handle range requests for video streaming
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`,
          'Accept-Ranges': 'bytes'
        }).end();
        return;
      }

      const contentLength = end - start + 1;

      // Set appropriate headers for partial content with security measures
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length"
      };

      // Add security headers for PDF documents
      if (mime === "application/pdf") {
        headers["Content-Disposition"] = "inline; filename=\"document.pdf\"";
        headers["X-Frame-Options"] = "SAMEORIGIN";
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Referrer-Policy"] = "no-referrer";
      }

      res.writeHead(206, headers);

      // Stream the requested range from S3
      try {
        const stream = await s3.send(new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
          Range: `bytes=${start}-${end}`,
        }));

        stream.Body.pipe(res);
      } catch (streamError) {
        console.error(`Error streaming range ${start}-${end} for file: ${s3Key}`, streamError.message);
        return res.status(500).json({ error: "Error streaming file content" });
      }
    } else {
      // Handle non-range requests (full file) with security measures
      const headers = {
        "Content-Length": fileSize,
        "Content-Type": mime,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000"
      };

      // Add security headers for PDF documents
      if (mime === "application/pdf") {
        headers["Content-Disposition"] = "inline; filename=\"document.pdf\"";
        headers["X-Frame-Options"] = "SAMEORIGIN";
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Referrer-Policy"] = "no-referrer";
      }

      res.writeHead(200, headers);

      try {
        const stream = await s3.send(new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: s3Key,
        }));

        stream.Body.pipe(res);
      } catch (streamError) {
        console.error(`Error streaming full file: ${s3Key}`, streamError.message);
        return res.status(500).json({ error: "Error streaming file content" });
      }
    }
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Error streaming content");
  }
});

// Debug route to list S3 objects (only enable in development)
router.get("/debug/s3-objects", async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Debug endpoint not available in production" });
    }

    const { prefix = '', maxKeys = 100 } = req.query;

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
      MaxKeys: parseInt(maxKeys)
    });

    const response = await s3.send(command);

    const objects = response.Contents?.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified
    })) || [];

    res.json({
      bucket: process.env.AWS_S3_BUCKET,
      prefix: prefix,
      count: objects.length,
      objects: objects
    });
  } catch (err) {
    console.error("S3 debug list error:", err);
    res.status(500).json({ error: "Error listing S3 objects" });
  }
});

// Debug route to check database s3Keys
router.get("/debug/db-keys", async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Debug endpoint not available in production" });
    }

    const courses = await Course.find({}).lean();
    const allKeys = [];

    courses.forEach(course => {
      course.weeks?.forEach(week => {
        // Check old structure (weeks.contents)
        week.contents?.forEach(content => {
          allKeys.push({
            courseId: course._id,
            courseTitle: course.title,
            weekNumber: week.weekNumber,
            contentId: content._id,
            contentTitle: content.title,
            s3Key: content.s3Key || 'MISSING',
            type: content.type,
            structure: 'old-weeks.contents'
          });
        });

        // Check new day-based structure (weeks.days.contents)
        week.days?.forEach(day => {
          day.contents?.forEach(content => {
            allKeys.push({
              courseId: course._id,
              courseTitle: course.title,
              weekNumber: week.weekNumber,
              dayNumber: day.dayNumber,
              contentId: content._id,
              contentTitle: content.title,
              s3Key: content.s3Key || 'MISSING',
              type: content.type,
              structure: 'new-weeks.days.contents'
            });
          });
        });

        // Check week-level documents (weeks.documents)
        week.documents?.forEach(doc => {
          allKeys.push({
            courseId: course._id,
            courseTitle: course.title,
            weekNumber: week.weekNumber,
            documentId: doc._id,
            documentTitle: doc.title,
            s3Key: doc.s3Key || 'MISSING',
            type: doc.type,
            structure: 'weeks.documents'
          });
        });
      });
    });

    // Find the specific document the user is trying to access
    const searchDocId = '692c95d148220552d7cbeaff';
    const foundDoc = allKeys.find(k => 
      (k.documentId && k.documentId.toString() === searchDocId) ||
      (k.contentId && k.contentId.toString() === searchDocId)
    );

    res.json({
      totalKeys: allKeys.length,
      keys: allKeys,
      missingS3Keys: allKeys.filter(k => k.s3Key === 'MISSING').length,
      searchedDocId: searchDocId,
      foundDocument: foundDoc || 'NOT FOUND IN DATABASE'
    });
  } catch (err) {
    console.error("DB keys debug error:", err);
    res.status(500).json({ error: "Error fetching database keys" });
  }
});

module.exports = router;
