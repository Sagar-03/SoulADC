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
// Official flow (no separate initiate step, no upload_id):
//   1. POST /video/assets/upload                              → { asset_id }
//   2. GET  /video/assets/{asset_id}/multipartupload/{n}/sign → { part_upload_url }
//      PUT  {part_upload_url}  (raw chunk bytes)              → ETag header
//   3. POST /video/assets/{asset_id}/multipartupload/complete
//      Body: { parts: [{ PartNumber, ETag }] }

/**
 * Step 1: Create an upload asset. Returns { asset_id } for use in subsequent steps.
 */
async function initiateMultipartVideoUpload() {
  const sourceId = getRequiredEnv("GUMLET_SOURCE_ID");
  const client = getClient();

  const createRes = await client.post("/video/assets/upload", { source_id: sourceId });
  const { asset_id } = createRes.data || {};
  if (!asset_id) throw new Error("Invalid response from Gumlet upload API");

  return { asset_id };
}

/**
 * Step 2: Get a presigned S3 URL for one part.
 * GET /video/assets/{asset_id}/multipartupload/{part_number}/sign
 * Returns { part_upload_url }
 */
async function signVideoMultipartPart(assetId, partNumber) {
  const client = getClient();
  const res = await client.get(
    `/video/assets/${assetId}/multipartupload/${partNumber}/sign`
  );
  const { part_upload_url } = res.data || {};
  if (!part_upload_url) throw new Error(`No part_upload_url returned for part ${partNumber}`);
  return { part_upload_url };
}

/**
 * Step 3: Complete the multipart upload.
 * POST /video/assets/{asset_id}/multipartupload/complete
 * Body: { parts: [{ PartNumber: number, ETag: string }] }
 */
async function completeMultipartVideoUpload(assetId, parts) {
  const client = getClient();
  await client.post(`/video/assets/${assetId}/multipartupload/complete`, { parts });
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
};
