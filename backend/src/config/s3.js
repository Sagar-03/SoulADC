const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  requestHandler: {
    requestTimeout: 0, // No timeout for large uploads
    httpsAgent: {
      maxSockets: 100, // Increased for parallel uploads (5 parts x 20 files)
      keepAlive: true, // Reuse connections for speed
      keepAliveMsecs: 60000, // Keep connections alive for 60s
    },
  },
});

module.exports = s3;
