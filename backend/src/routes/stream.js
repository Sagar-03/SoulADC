const express =  require("express");
const  s3 = require("../config/s3.js");
const Course = require("../models/Course.js");

const router = express.Router();

/**
 * GET /api/stream/:contentId
 * (Authenticate student here if needed)
 */
router.get("/:contentId", async (req, res) => {
  try {
    const { contentId } = req.params;
    const range = req.headers.range;
    if (!range) return res.status(400).send("Requires Range header");

    // Find the content by subdocument _id
    const course = await Course.findOne({ "weeks.contents._id": contentId }).lean();
    if (!course) return res.status(404).send("Content not found");

    // Find the matching content + s3Key in the weeks
    let s3Key, mime = "video/mp4";
    outer: for (const w of course.weeks) {
      for (const c of w.contents) {
        if (String(c._id) === String(contentId)) {
          s3Key = c.s3Key;
          if (c.type === "pdf" || c.type === "document") mime = "application/pdf";
          break outer;
        }
      }
    }
    if (!s3Key) return res.status(404).send("S3 key missing");

    // Get file size
    const head = await s3.headObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    }).promise();

    const fileSize = head.ContentLength;
    const start = Number(range.replace(/\D/g, ""));
    const CHUNK = 1 * 1024 * 1024; // 1MB
    const end = Math.min(start + CHUNK, fileSize - 1);
    const contentLength = end - start + 1;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Range: `bytes=${start}-${end}`,
    };

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": mime,
      "Cache-Control": "private, max-age=0, must-revalidate",
    });

    const stream = s3.getObject(params).createReadStream();
    stream.on("error", (e) => {
      console.error("S3 stream error:", e);
      res.end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error("stream error:", err);
    res.status(500).send("Error streaming");
  }
});

module.exports = router;
