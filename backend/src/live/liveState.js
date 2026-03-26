const liveState = {
  currentStream: null,
  updatedAt: null,
};

function setCurrentStream(streamData) {
  liveState.currentStream = {
    ...streamData,
    recording_playback_url: streamData.recording_playback_url || null,
  };
  liveState.updatedAt = new Date().toISOString();
  return liveState.currentStream;
}

function getCurrentStream() {
  return liveState.currentStream;
}

function updateRecordingPlaybackUrl(recordingPlaybackUrl) {
  if (!liveState.currentStream) {
    return null;
  }

  liveState.currentStream.recording_playback_url = recordingPlaybackUrl || null;
  liveState.updatedAt = new Date().toISOString();

  return liveState.currentStream;
}

module.exports = {
  setCurrentStream,
  getCurrentStream,
  updateRecordingPlaybackUrl,
};
