import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./InstagramReel.css";

const InstagramReel = () => {
  useEffect(() => {
    // Load embed script once
    if (document.getElementById("instagram-embed-script")) {
      if (window.instgrm) window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => {
      if (window.instgrm) window.instgrm.Embeds.process();
    };
    document.body.appendChild(script);
  }, []);

  return (
    <section className="instagram-section">
      <div className="container">
        <div className="row align-items-center g-5">

          {/* LEFT — Reel embed */}
          <div className="col-lg-5 col-md-12 instagram-reel-col d-flex justify-content-center">
            <div className="instagram-reel-wrapper">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/reel/DV3SwH1keKn/"
                data-instgrm-version="14"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* RIGHT — Caption */}
          <div className="col-lg-7 col-md-12 instagram-caption-col">
            <p className="instagram-section-label">Follow Our Journey</p>

            <h2 className="instagram-section-title">
              Stay Connected with<br />Soul ADC
            </h2>

            {/* Decorative pips */}
            <div className="instagram-pips">
              <div className="instagram-pip active" />
              <div className="instagram-pip active" />
              <div className="instagram-pip inactive" />
              <div className="instagram-pip inactive" />
            </div>

            <p className="instagram-section-desc">
              We share tips, student wins, study strategies, and behind-the-scenes
              moments from our ADC preparation community. Join thousands of future
              Australian dentists following their dreams — one post at a time.
            </p>

            <a
              href="https://www.instagram.com/souladc/"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-handle mb-3 d-inline-flex"
            >
              <span className="instagram-handle-dot" />
              @souladc
            </a>

            <br />

            <a
              href="https://www.instagram.com/reel/DV3SwH1keKn/"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-cta-btn mt-2"
            >
              {/* Instagram icon (inline SVG — no extra dependency) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm.003 1.44c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.47 2.47 0 0 1-.92-.598 2.47 2.47 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.843-.038 1.097-.046 3.233-.046zm0 2.452a4.108 4.108 0 1 0 0 8.215 4.108 4.108 0 0 0 0-8.215zm0 6.775a2.667 2.667 0 1 1 0-5.334 2.667 2.667 0 0 1 0 5.334zm5.23-6.937a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0z" />
              </svg>
              View on Instagram
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InstagramReel;
