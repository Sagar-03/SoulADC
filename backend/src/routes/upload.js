const express = require("express");
const s3 = require("../config/s3.js");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

/**
 * GET /api/upload/presign?fileName=name&fileType=video/mp4&folder=videos
 * Returns: { uploadUrl, key }
 */
router.get("/presign", async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.query;
    if (!fileName || !fileType || !folder) {
      return res.status(400).json({ error: "fileName, fileType, folder required" });
    }

    const key = `${folder}/${uuidv4()}-${fileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 60 * 15, // 15 minutes
      ContentType: fileType,
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("presign error:", err);
    res.status(500).json({ error: "Failed to generate pre-signed URL" });
  }
});

module.exports= router;
