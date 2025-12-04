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

// ✅ Optimized configuration for faster uploads (supports up to 50GB+ files)
const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB (S3 minimum)
const OPTIMAL_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB (optimal for large files)
const LARGE_FILE_CHUNK_SIZE = 50 * 1024 * 1024; // 50MB (for files > 1GB)
const MAX_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB (for very large files like 10GB+)
const MAX_PARTS = 10000; // S3 limit
const PRESIGN_EXPIRY = 7200; // 2 hours per part (for slower uploads)
const MAX_CONCURRENT_UPLOADS = 6; // Optimized for large files (adjust based on network)

/**
 * Calculate optimal chunk size based on file size
 * Ensures we stay within S3's 10,000 part limit while optimizing speed
 * Optimized for files up to 50GB+
 */
function calculateOptimalChunkSize(fileSize) {
  if (!fileSize || fileSize <= 0) {
    return OPTIMAL_CHUNK_SIZE;
  }

  const ONE_GB = 1024 * 1024 * 1024;
  const FIVE_GB = 5 * ONE_GB;

  // For files under 500MB, use standard chunk size (20MB)
  if (fileSize <= 500 * 1024 * 1024) {
    return OPTIMAL_CHUNK_SIZE;
  }

  // For files 500MB - 1GB, use 25MB chunks
  if (fileSize <= ONE_GB) {
    return 25 * 1024 * 1024;
  }

  // For files 1GB - 5GB, use 50MB chunks
  if (fileSize <= FIVE_GB) {
    return LARGE_FILE_CHUNK_SIZE;
  }

  // For files > 5GB (like 10GB videos), calculate to stay under part limit
  // Example: 10GB file = ~105 parts at 100MB chunks
  const calculatedChunkSize = Math.ceil(fileSize / (MAX_PARTS - 100)); // Buffer for safety
  
  // Ensure chunk size is at least MIN_CHUNK_SIZE
  const chunkSize = Math.max(calculatedChunkSize, MIN_CHUNK_SIZE);
  
  // For 10GB+ files, prefer larger chunks (75-100MB) for efficiency
  if (fileSize > FIVE_GB) {
    return Math.min(Math.max(chunkSize, 75 * 1024 * 1024), MAX_CHUNK_SIZE);
  }
  
  // Cap at MAX_CHUNK_SIZE for optimal performance
  return Math.min(chunkSize, MAX_CHUNK_SIZE);
}

/**
 * POST /api/multipart-upload/initiate
 * Body: { fileName, fileType, folder, fileSize, weekNumber, dayNumber }
 * Response: { uploadId, key, chunkSize, totalParts, maxConcurrentUploads }
 */
router.post("/initiate", protect, adminOnly, async (req, res) => {
  try {
    const { fileName, fileType, folder, fileSize, weekNumber, dayNumber } = req.body;

    // Validate
    if (!fileName || !fileType || !folder) {
      console.error("❌ Missing required fields:", { fileName: !!fileName, fileType: !!fileType, folder: !!folder });
      return res.status(400).json({ error: "fileName, fileType, folder are required" });
    }

    // Calculate optimal chunk size for this file
    const chunkSize = calculateOptimalChunkSize(fileSize);
    const totalParts = fileSize ? Math.ceil(fileSize / chunkSize) : 0;

    console.log(`📊 Upload optimization: fileSize=${fileSize}, chunkSize=${chunkSize}, totalParts=${totalParts}`);

    // Generate hierarchical S3 key with week and day structure
    let key;
    if (weekNumber && dayNumber) {
      key = `${folder}/week-${weekNumber}/day-${dayNumber}/${uuidv4()}-${fileName}`;
      console.log(`✨ Creating S3 folder structure: ${key}`);
    } else {
      key = `${folder}/${uuidv4()}-${fileName}`;
      console.log(`✨ Using fallback S3 structure: ${key}`);
    }

    // Initiate multipart upload
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
      // Add metadata for tracking
      Metadata: {
        'original-filename': fileName,
        'file-size': String(fileSize || 0),
      },
    });

    const multipartUpload = await s3.send(command);

    console.log(`✅ Multipart upload initiated: ${multipartUpload.UploadId} (${totalParts} parts)`);

    res.json({
      uploadId: multipartUpload.UploadId,
      key: key,
      chunkSize: chunkSize,
      totalParts: totalParts,
      maxConcurrentUploads: MAX_CONCURRENT_UPLOADS,
    });
  } catch (err) {
    console.error("❌ Multipart initiate error:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(500).json({ error: "Failed to initiate multipart upload", details: err.message });
  }
});

/**
 * POST /api/multipart-upload/presign-part
 * Body: { key, uploadId, partNumber }
 * Response: { uploadUrl, partNumber }
 */
router.post("/presign-part", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId, partNumber } = req.body;

    // Validate required fields (partNumber can be 0, so check explicitly)
    if (!key || !uploadId || partNumber === null || partNumber === undefined) {
      console.error("❌ Missing required fields:", { key: !!key, uploadId: !!uploadId, partNumber });
      return res.status(400).json({ error: "key, uploadId, and partNumber are required" });
    }

    // Convert partNumber to integer (AWS requires integer)
    const partNum = parseInt(partNumber, 10);
    if (isNaN(partNum) || partNum < 1 || partNum > MAX_PARTS) {
      console.error("❌ Invalid partNumber:", partNumber);
      return res.status(400).json({ error: `partNumber must be between 1 and ${MAX_PARTS}` });
    }

    const command = new UploadPartCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNum,
    });

    // Generate presigned URL for this part (1 hour expiry)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY });

    res.json({ 
      uploadUrl,
      partNumber: partNum 
    });
  } catch (err) {
    console.error("❌ Presign part error:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(500).json({ error: "Failed to generate presigned URL for part", details: err.message });
  }
});

/**
 * POST /api/multipart-upload/complete
 * Body: { key, uploadId, parts: [{ PartNumber, ETag }] }
 * Response: { success: true, location, key }
 */
router.post("/complete", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body;

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
      console.error("❌ Missing required fields for complete:", { key: !!key, uploadId: !!uploadId, partsIsArray: Array.isArray(parts) });
      return res.status(400).json({ error: "key, uploadId, and parts array are required" });
    }

    if (parts.length === 0) {
      console.error("❌ Parts array is empty");
      return res.status(400).json({ error: "Parts array cannot be empty" });
    }

    // Validate and convert parts to proper format, ensure proper sorting
    const formattedParts = parts
      .map(part => {
        const partNumber = parseInt(part.PartNumber, 10);
        if (isNaN(partNumber) || !part.ETag) {
          throw new Error(`Invalid part: PartNumber=${part.PartNumber}, ETag=${part.ETag}`);
        }
        return {
          PartNumber: partNumber,
          ETag: part.ETag.replace(/"/g, '').trim() // Normalize ETag format
        };
      })
      .sort((a, b) => a.PartNumber - b.PartNumber); // S3 requires parts in order

    console.log(`🔄 Completing multipart upload for ${key} with ${formattedParts.length} parts`);

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: formattedParts,
      },
    });

    const result = await s3.send(command);

    console.log(`✅ Multipart upload completed successfully: ${key}`);
    console.log(`📍 S3 Location: ${result.Location}`);

    res.json({
      success: true,
      location: result.Location,
      key: key,
      bucket: process.env.AWS_S3_BUCKET,
    });
  } catch (err) {
    console.error("❌ Complete multipart error:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(500).json({ error: "Failed to complete multipart upload", details: err.message });
  }
});

/**
 * POST /api/multipart-upload/abort
 * Body: { key, uploadId }
 * Response: { success: true, message }
 */
router.post("/abort", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId } = req.body;

    if (!key || !uploadId) {
      console.error("❌ Missing required fields for abort:", { key: !!key, uploadId: !!uploadId });
      return res.status(400).json({ error: "key and uploadId are required" });
    }

    console.log(`🛑 Aborting multipart upload for ${key}`);

    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      UploadId: uploadId,
    });

    await s3.send(command);

    console.log(`✅ Multipart upload aborted successfully: ${key}`);

    res.json({ 
      success: true,
      message: "Upload cancelled and cleaned up",
      key: key
    });
  } catch (err) {
    console.error("❌ Abort multipart error:", err);
    console.error("Error details:", err.message, err.stack);
    // Don't fail if upload was already completed or doesn't exist
    if (err.name === 'NoSuchUpload') {
      console.log("ℹ️ Upload already completed or doesn't exist");
      return res.json({ success: true, message: "Upload already completed or doesn't exist" });
    }
    res.status(500).json({ error: "Failed to abort multipart upload", details: err.message });
  }
});

/**
 * POST /api/multipart-upload/presign-parts-batch
 * Body: { key, uploadId, partNumbers: [1, 2, 3, ...] }
 * Response: { presignedUrls: [{ partNumber, uploadUrl }, ...] }
 * 
 * Generate multiple presigned URLs at once for parallel uploads
 */
router.post("/presign-parts-batch", protect, adminOnly, async (req, res) => {
  try {
    const { key, uploadId, partNumbers } = req.body;

    if (!key || !uploadId || !Array.isArray(partNumbers) || partNumbers.length === 0) {
      return res.status(400).json({ error: "key, uploadId, and partNumbers array are required" });
    }

    if (partNumbers.length > MAX_CONCURRENT_UPLOADS * 2) {
      return res.status(400).json({ 
        error: `Too many parts requested at once. Maximum: ${MAX_CONCURRENT_UPLOADS * 2}` 
      });
    }

    console.log(`📦 Generating ${partNumbers.length} presigned URLs for batch upload`);

    // Generate all presigned URLs in parallel
    const presignedUrls = await Promise.all(
      partNumbers.map(async (partNumber) => {
        const partNum = parseInt(partNumber, 10);
        
        if (isNaN(partNum) || partNum < 1 || partNum > MAX_PARTS) {
          throw new Error(`Invalid partNumber: ${partNumber}`);
        }

        const command = new UploadPartCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNum,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY });
        
        return {
          partNumber: partNum,
          uploadUrl: uploadUrl,
        };
      })
    );

    console.log(`✅ Generated ${presignedUrls.length} presigned URLs`);

    res.json({ presignedUrls });
  } catch (err) {
    console.error("❌ Batch presign error:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(500).json({ error: "Failed to generate presigned URLs", details: err.message });
  }
});

module.exports = router;
