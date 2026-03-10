import React from "react";
import { isChrome, getBrowserName } from "../../utils/browserDetect";
import logo from "../../assets/logo.png";

// Wrap any route with <ChromeOnlyRoute> to restrict it to Chrome only.
// All other routes remain accessible on every browser.
//
// Usage in App.jsx:
//   <Route
//     path="/some-restricted-page"
//     element={
//       <ChromeOnlyRoute>
//         <SomeComponent />
//       </ChromeOnlyRoute>
//     }
//   />

const ChromeOnlyRoute = ({ children }) => {
  if (isChrome()) return children;

  const browser = getBrowserName();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7f3ef",
        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
        padding: "1.5rem",
      }}
    >
      {/* Logo */}
      <img
        src={logo}
        alt="Soul ADC"
        style={{ height: "75px", marginBottom: "2rem", objectFit: "contain" }}
      />

      {/* Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(123, 86, 61, 0.1)",
          padding: "2.5rem 2rem",
          textAlign: "center",
          maxWidth: "480px",
          width: "100%",
          border: "1px solid #f0e9e0",
        }}
      >
        {/* Icon badge */}
        <div
          style={{
            width: "72px",
            height: "72px",
            background: "linear-gradient(145deg, #A98C6A, #7B563D)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "'Lora', serif",
            fontWeight: 700,
            color: "#4B4237",
            fontSize: "1.75rem",
            margin: "0 0 0.5rem",
          }}
        >
          Chrome Required
        </h2>

        {/* Browser pill */}
        <span
          style={{
            display: "inline-block",
            background: "#EFEBE5",
            color: "#7B563D",
            border: "1px solid #DCD8D2",
            borderRadius: "50px",
            padding: "4px 14px",
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "1.25rem",
          }}
        >
          You are currently using {browser}
        </span>

        <p
          style={{
            color: "#706354",
            fontSize: "0.97rem",
            lineHeight: "1.65",
            margin: "0 0 1.75rem",
          }}
        >
          This page is only accessible on{" "}
          <strong style={{ color: "#7B563D" }}>Google Chrome</strong> to ensure
          the best and most secure learning experience.
        </p>

        {/* Divider */}
        <div
          style={{
            borderTop: "1px solid #f0e9e0",
            margin: "0 0 1.5rem",
          }}
        />

        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            background: "linear-gradient(145deg, #A98C6A, #7B563D)",
            color: "#fff",
            padding: "12px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.97rem",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          Download Chrome
        </a>

        <p
          style={{
            marginTop: "1rem",
            color: "#aaa",
            fontSize: "0.8rem",
          }}
        >
          Already have Chrome?{" "}
          <span style={{ color: "#7B563D", fontWeight: 500 }}>
            Copy this URL and open it in Chrome.
          </span>
        </p>
      </div>

      <p
        style={{
          marginTop: "1.5rem",
          color: "#b0a090",
          fontSize: "0.78rem",
        }}
      >
        © 2026 Soul ADC. All rights reserved.
      </p>
    </div>
  );
};

export default ChromeOnlyRoute;
