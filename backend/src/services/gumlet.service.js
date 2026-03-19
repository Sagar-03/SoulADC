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

module.exports = {
  createUploadAsset,
  listAssets,
  getAsset,
  deleteAsset,
  getEmbedUrl,
};
