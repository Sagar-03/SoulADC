const axios = require("axios");

const GUMLET_API_BASE = "https://api.gumlet.com/v1";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getClient() {
  const apiKey = getRequiredEnv("GUMLET_API_KEY");

  return axios.create({
    baseURL: GUMLET_API_BASE,
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
}

async function createUploadAsset() {
  const sourceId = getRequiredEnv("GUMLET_SOURCE_ID");
  const client = getClient();

  const response = await client.post("/video/assets/upload", {
    source_id: sourceId,
  });

  const { upload_url, asset_id } = response.data || {};
  if (!upload_url || !asset_id) {
    throw new Error("Invalid response from Gumlet upload API");
  }

  return { upload_url, asset_id };
}

async function listAssets(params = {}) {
  const client = getClient();
  const response = await client.get("/video/assets", { params });
  return response.data;
}

async function getAsset(assetId) {
  if (!assetId) {
    throw new Error("assetId is required");
  }
  const client = getClient();
  const response = await client.get(`/video/assets/${assetId}`);
  return response.data;
}

async function deleteAsset(assetId) {
  if (!assetId) {
    throw new Error("assetId is required");
  }
  const client = getClient();
  await client.delete(`/video/assets/${assetId}`);
}

function getEmbedUrl(assetId) {
  if (!assetId) {
    return null;
  }
  const playerDomain = process.env.GUMLET_PLAYER_DOMAIN || "play.gumlet.io";
  return `https://${playerDomain}/embed/${assetId}`;
}

// ── Gumlet Multipart Upload ─────────────────────────────────────────────────

/**
 * Step 1 (multipart): Create an upload asset and initiate a multipart session.
 * POST /video/assets/upload  →  { upload_url, asset_id }
 * POST /video/assets/{asset_id}/multipart  →  { upload_id }
 */
async function initiateMultipartVideoUpload() {
  const sourceId = getRequiredEnv("GUMLET_SOURCE_ID");
  const client = getClient();

  // 1. Create the asset
  const createRes = await client.post("/video/assets/upload", { source_id: sourceId });
  const { asset_id } = createRes.data || {};
  if (!asset_id) throw new Error("Invalid response from Gumlet upload API");

  // 2. Initiate multipart on that asset
  const mpRes = await client.post(`/video/assets/${asset_id}/multipart`);
  const { upload_id } = mpRes.data || {};
  if (!upload_id) throw new Error("Gumlet did not return upload_id for multipart");

  return { asset_id, upload_id };
}

/**
 * Step 2 (multipart): Get a presigned URL for one part.
 * POST /video/assets/{asset_id}/multipart/sign  →  { signed_url }
 */
async function signVideoMultipartPart(assetId, uploadId, partNumber) {
  const client = getClient();
  const res = await client.post(`/video/assets/${assetId}/multipart/sign`, {
    upload_id: uploadId,
    part_number: partNumber,
  });
  const { signed_url } = res.data || {};
  if (!signed_url) throw new Error(`No signed_url returned for part ${partNumber}`);
  return { signed_url };
}

/**
 * Step 3 (multipart): Complete the multipart upload.
 * POST /video/assets/{asset_id}/multipart/complete
 * Body: { upload_id, parts: [{ part_number, etag }] }
 */
async function completeMultipartVideoUpload(assetId, uploadId, parts) {
  const client = getClient();
  await client.post(`/video/assets/${assetId}/multipart/complete`, {
    upload_id: uploadId,
    parts,
  });
}

/**
 * Abort a multipart upload.
 * DELETE /video/assets/{asset_id}/multipart
 * Body: { upload_id }
 */
async function abortMultipartVideoUpload(assetId, uploadId) {
  const client = getClient();
  await client.delete(`/video/assets/${assetId}/multipart`, {
    data: { upload_id: uploadId },
  });
}

module.exports = {
  createUploadAsset,
  listAssets,
  getAsset,
  deleteAsset,
  getEmbedUrl,
  initiateMultipartVideoUpload,
  signVideoMultipartPart,
  completeMultipartVideoUpload,
  abortMultipartVideoUpload,
};
