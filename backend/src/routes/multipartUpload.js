const express = require("express");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const s3 = require("../config/s3.js");
const { v4: uuidv4 } = require("uuid");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/multipart-upload/initiate
 * Body: { fileName, fileType, folder, weekNumber, dayNumber }
 * Response: { uploadId, key }
 */
router.post("/initiate", protect, adminOnly, async (req, res) => {
  try {
    const { fileName, fileType, folder, weekNumber, dayNumber } = req.body;

    // Validate
    if (!fileName || !fileType || !folder) {
      return res.status(400).json({ error: "fileName, fileType, folder are required" });
    }

    // Generate hierarchical S3 key with week and day structure
    let key;
    if (weekNumber && dayNumber) {
      key = `${folder}/week-${weekNumber}/day-${dayNumber}/${uuidv4()}-${fileName}`;
      console.log(`Creating S3 folder structure: ${key}`);
    } else {
      key = `${folder}/${uuidv4()}-${fileName}`;
      console.log(`Using fallback S3 structure: ${key}`);
    }

    // Initiate multipart upload
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const multipartUpload = await s3.send(command);

    res.json({
      uploadId: multipartUpload.UploadId,
      key: key,
    });
  } catch (err) {
    console.error("❌ Multipart initiate error:", err);
    res.status(500).json({ error: "Failed to initiate multipart upload" });
  }
});

/**
 * POST /api/multipart-upload/presign-part
 * Body: { key, uploadId, partNumber }
 * Response: { uploadUrl }
 */
router.post("/presign-part", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId, partNumber } = req.body;

    if (!key || !uploadId || !partNumber) {
      return res.status(400).json({ error: "key, uploadId, and partNumber are required" });
    }

    const command = new UploadPartCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    // Generate presigned URL for this part (expires in 2 hours for large files)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 7200 });

    res.json({ uploadUrl });
  } catch (err) {
    console.error("❌ Presign part error:", err);
    res.status(500).json({ error: "Failed to generate presigned URL for part" });
  }
});

/**
 * POST /api/multipart-upload/complete
 * Body: { key, uploadId, parts: [{ PartNumber, ETag }] }
 * Response: { success: true, location }
 */
router.post("/complete", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body;

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: "key, uploadId, and parts array are required" });
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    const result = await s3.send(command);

    res.json({
      success: true,
      location: result.Location,
      key: key,
    });
  } catch (err) {
    console.error("❌ Complete multipart error:", err);
    res.status(500).json({ error: "Failed to complete multipart upload" });
  }
});

/**
 * POST /api/multipart-upload/abort
 * Body: { key, uploadId }
 * Response: { success: true }
 */
router.post("/abort", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId } = req.body;

    if (!key || !uploadId) {
      return res.status(400).json({ error: "key and uploadId are required" });
    }

    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
    });

    await s3.send(command);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Abort multipart error:", err);
    res.status(500).json({ error: "Failed to abort multipart upload" });
  }
});

module.exports = router;
