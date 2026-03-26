import React, { useCallback, useEffect, useMemo, useState } from "react";
import LivePlayer from "./LivePlayer";
import { getCookie } from "../utils/cookies";
import { getUserRole } from "../utils/auth";
import AdminLayout from "../Components/admin/AdminLayout";
import "./live.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7001/api";

const defaultCreatePayload = {
  live_source_id: import.meta.env.VITE_GUMLET_LIVE_SOURCE_ID || "",
  resolution: "1080p",
  title: "SoulADC Live Session",
  mp4_access: true,
  orientation: "landscape",
};

const LivePageContent = () => {
  const [loading, setLoading] = useState(true);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState("");
  const [creatingStream, setCreatingStream] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createPayload, setCreatePayload] = useState(defaultCreatePayload);
  const [obsCredentials, setObsCredentials] = useState(null);

  const isAdmin = useMemo(() => getUserRole() === "admin", []);

  const fetchCurrentStream = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/live/current`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch current stream");
      }

      setPlaybackUrl(data.playback_url || "");
      setStreamActive(Boolean(data.active && data.playback_url));
    } catch (err) {
      setError(err.message || "Unable to load live stream");
      setPlaybackUrl("");
      setStreamActive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentStream();
  }, [fetchCurrentStream]);

  const onCreateInputChange = (event) => {
    const { name, value } = event.target;
    setCreatePayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createStream = async () => {
    const token = getCookie("token");

    if (!token) {
      setCreateError("Admin authentication required to create live stream.");
      return;
    }

    setCreatingStream(true);
    setCreateError("");

    try {
      const response = await fetch(`${API_BASE_URL}/live/create-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createPayload,
          mp4_access: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create live stream");
      }

      setObsCredentials({
        stream_url: data.stream_url,
        stream_key: data.stream_key,
        playback_url: data.playback_url,
        live_asset_id: data.live_asset_id,
      });

      setPlaybackUrl(data.playback_url || "");
      setStreamActive(Boolean(data.playback_url));
    } catch (err) {
      setCreateError(err.message || "Failed to create stream credentials");
    } finally {
      setCreatingStream(false);
    }
  };

  return (
    <div className="live-page">
      <div className="live-page__container">
        <header className="live-page__header">
          <h1>Live Class</h1>
          <span className="live-page__badge" aria-live="polite">
            {streamActive ? "LIVE" : "OFFLINE"}
          </span>
        </header>

        <p className="live-page__subtitle">Watch the ongoing Gumlet live session here.</p>

        {loading ? (
          <div className="live-page__message">Loading live stream...</div>
        ) : error ? (
          <div className="live-page__message live-page__message--error">{error}</div>
        ) : !playbackUrl ? (
          <div className="live-page__message">No active stream right now. Please check back later.</div>
        ) : (
          <LivePlayer playbackUrl={playbackUrl} />
        )}

        <button className="live-page__refresh" type="button" onClick={fetchCurrentStream}>
          Refresh Stream Status
        </button>

        {isAdmin && (
          <section className="live-admin" aria-label="Admin live stream controls">
            <h2>Admin Stream Controls</h2>

            <div className="live-admin__grid">
              <label>
                Live Source ID
                <input
                  name="live_source_id"
                  value={createPayload.live_source_id}
                  onChange={onCreateInputChange}
                  placeholder="Gumlet live_source_id"
                />
              </label>

              <label>
                Resolution
                <input
                  name="resolution"
                  value={createPayload.resolution}
                  onChange={onCreateInputChange}
                  placeholder="1080p"
                />
              </label>

              <label>
                Orientation
                <input
                  name="orientation"
                  value={createPayload.orientation}
                  onChange={onCreateInputChange}
                  placeholder="landscape"
                />
              </label>

              <label className="live-admin__full">
                Stream Title
                <input
                  name="title"
                  value={createPayload.title}
                  onChange={onCreateInputChange}
                  placeholder="Session title"
                />
              </label>
            </div>

            <button
              type="button"
              className="live-admin__create"
              onClick={createStream}
              disabled={creatingStream}
            >
              {creatingStream ? "Generating OBS Credentials..." : "Create Stream"}
            </button>

            {createError && <div className="live-page__message live-page__message--error">{createError}</div>}

            {obsCredentials && (
              <div className="live-admin__credentials">
                <h3>OBS Settings</h3>
                <p>Service: Custom</p>
                <p>Server: {obsCredentials.stream_url}</p>
                <p>Stream Key: {obsCredentials.stream_key}</p>
                <p>Playback URL: {obsCredentials.playback_url}</p>
                <p>Live Asset ID: {obsCredentials.live_asset_id}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

const LivePage = () => {
  const isAdmin = useMemo(() => getUserRole() === "admin", []);

  if (isAdmin) {
    return (
      <AdminLayout>
        <LivePageContent />
      </AdminLayout>
    );
  }

  return <LivePageContent />;
};

export default LivePage;
