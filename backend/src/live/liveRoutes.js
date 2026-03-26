const express = require("express");
const axios = require("axios");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  setCurrentStream,
  getCurrentStream,
  updateRecordingPlaybackUrl,
} = require("./liveState");

const router = express.Router();

const GUMLET_LIVE_ENDPOINT = "https://api.gumlet.com/v1/video/live/assets";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function normalizePlaybackUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  return url.trim();
}

router.post("/create-stream", protect, adminOnly, async (req, res) => {
  try {
    const gumletApiKey = getRequiredEnv("GUMLET_API_KEY");

    const {
      live_source_id = process.env.GUMLET_LIVE_SOURCE_ID,
      resolution = process.env.GUMLET_LIVE_DEFAULT_RESOLUTION || "1080p",
      title = `SoulADC Live ${new Date().toISOString()}`,
      mp4_access = true,
      orientation = process.env.GUMLET_LIVE_DEFAULT_ORIENTATION || "landscape",
    } = req.body || {};

    if (!live_source_id) {
      return res.status(400).json({
        success: false,
        message: "live_source_id is required",
      });
    }

    const gumletResponse = await axios.post(
      GUMLET_LIVE_ENDPOINT,
      {
        live_source_id,
        resolution,
        title,
        mp4_access,
        orientation,
      },
      {
        headers: {
          Authorization: `Bearer ${gumletApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const payload = gumletResponse.data || {};

    const streamData = {
      live_asset_id: payload.live_asset_id || payload.asset_id || null,
      stream_url: payload.stream_url || null,
      stream_key: payload.stream_key || null,
      playback_url: normalizePlaybackUrl(
        payload.output?.playback_url || payload.playback_url
      ),
      recording_playback_url: normalizePlaybackUrl(
        payload.output?.recording_playback_url || payload.recording_playback_url
      ),
      title,
      resolution,
      orientation,
      mp4_access,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    if (!streamData.stream_url || !streamData.stream_key || !streamData.playback_url) {
      return res.status(502).json({
        success: false,
        message: "Invalid response from Gumlet live asset API",
        gumlet_response: payload,
      });
    }

    setCurrentStream(streamData);

    return res.status(201).json({
      success: true,
      ...streamData,
    });
  } catch (error) {
    console.error("Failed to create Gumlet live stream:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Unable to create live stream",
      error: error.response?.data || error.message,
    });
  }
});

router.get("/current", async (req, res) => {
  try {
    const currentStream = getCurrentStream();

    if (!currentStream || !currentStream.playback_url) {
      return res.json({
        success: true,
        active: false,
        message: "No active live stream available",
        playback_url: null,
      });
    }

    return res.json({
      success: true,
      active: true,
      playback_url: currentStream.playback_url,
      live_asset_id: currentStream.live_asset_id,
      recording_playback_url: currentStream.recording_playback_url || null,
      updatedAt: currentStream.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch current stream:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch current stream",
    });
  }
});

router.patch("/recording", protect, adminOnly, (req, res) => {
  const { recording_playback_url } = req.body || {};

  if (!recording_playback_url || typeof recording_playback_url !== "string") {
    return res.status(400).json({
      success: false,
      message: "recording_playback_url is required",
    });
  }

  const updatedStream = updateRecordingPlaybackUrl(recording_playback_url.trim());

  if (!updatedStream) {
    return res.status(404).json({
      success: false,
      message: "No stream session exists to attach recording",
    });
  }

  return res.json({
    success: true,
    recording_playback_url: updatedStream.recording_playback_url,
  });
});

module.exports = router;
