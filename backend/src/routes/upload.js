const express = require("express");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3.js");
const { v4: uuidv4 } = require("uuid");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/upload/presign
 * Query: fileName=name&fileType=video/mp4&folder=videos&weekNumber=1&dayNumber=1
 * Response: { uploadUrl, key }
 */
router.get("/presign", protect, adminOnly, async (req, res) => {
  try {
    const { fileName, fileType, folder, weekNumber, dayNumber } = req.query;

    // ✅ Validate
    if (!fileName || !fileType || !folder) {
      return res.status(400).json({ error: "fileName, fileType, folder are required" });
    }

    // ✅ Generate hierarchical S3 key with week and day structure
    let key;
    if (weekNumber && dayNumber) {
      // Create week/day folder structure: videos/week-1/day-1/filename
      key = `${folder}/week-${weekNumber}/day-${dayNumber}/${uuidv4()}-${fileName}`;
      console.log(`Creating S3 folder structure: ${key}`);
    } else {
      // Fallback to original structure if week/day not provided
      key = `${folder}/${uuidv4()}-${fileName}`;
      console.log(`Using fallback S3 structure: ${key}`);
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    // ✅ Generate presigned URL using AWS SDK v3
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes

    res.json({ uploadUrl, key });
  } catch (err) {
    console.error(" Presign error:", err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

module.exports = router;
