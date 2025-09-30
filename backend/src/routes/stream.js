const express = require("express");
const mongoose = require("mongoose");
const { HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const Course = require("../models/Course.js");
const s3 = require("../config/s3.js");

const router = express.Router();

// Enhanced CORS and security headers for video streaming
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Accept-Encoding, Content-Type');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Get video metadata endpoint
router.get("/info/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    let s3Key, contentInfo = null;

    // Check if identifier is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const course = await Course.findOne({
        $or: [
          { "weeks.contents._id": identifier },
          { "weeks.days.contents._id": identifier }
        ]
      }).lean();
      
      if (!course) return res.status(404).json({ error: "Content not found" });

      // Find the content info
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

    // Get metadata from S3
    const head = await s3.send(new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    }));

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

router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const range = req.headers.range;
    
    let s3Key, mime = "application/octet-stream";

    // Check if identifier is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const course = await Course.findOne({
        $or: [
          { "weeks.contents._id": identifier }, // Old structure support
          { "weeks.days.contents._id": identifier } // New day-based structure
        ]
      }).lean();
      
      if (!course) return res.status(404).send("Content not found");

      // Check old structure first (weeks.contents)
      outer: for (const w of course.weeks) {
        if (w.contents) {
          for (const c of w.contents) {
            if (String(c._id) === String(identifier)) {
              s3Key = c.s3Key;
              mime = c.type === "video" ? "video/mp4" : "application/pdf";
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
                  break outer;
                }
              }
            }
          }
        }
      }
    } else {
      s3Key = identifier;
    }

    if (!s3Key) return res.status(404).send("S3 key missing");

    // Get metadata from S3
    const head = await s3.send(new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    }));

    const fileSize = head.ContentLength;
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

      // Set appropriate headers for partial content
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length"
      });

      // Stream the requested range from S3
      const stream = await s3.send(new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Range: `bytes=${start}-${end}`,
      }));

      stream.Body.pipe(res);
    } else {
      // Handle non-range requests (full file)
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": mime,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000"
      });

      const stream = await s3.send(new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
      }));

      stream.Body.pipe(res);
    }
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Error streaming content");
  }
});

module.exports = router;
  