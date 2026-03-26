import React from "react";
import ReactPlayer from "react-player";

const LivePlayer = ({ playbackUrl }) => {
  if (!playbackUrl) {
    return (
      <div className="live-player__fallback" role="status" aria-live="polite">
        Live stream is currently unavailable. Please check back shortly.
      </div>
    );
  }

  return (
    <div className="live-player__frame" role="region" aria-label="Live stream player">
      <ReactPlayer
        url={playbackUrl}
        controls
        playing
        muted={false}
        width="100%"
        height="100%"
        config={{
          file: {
            forceHLS: true,
            attributes: {
              controlsList: "nodownload",
              playsInline: true,
            },
          },
        }}
      />
    </div>
  );
};

export default LivePlayer;
