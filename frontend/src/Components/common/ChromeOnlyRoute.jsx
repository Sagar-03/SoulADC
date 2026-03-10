import React from "react";
import { isChrome, getBrowserName } from "../../utils/browserDetect";

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        fontFamily: "sans-serif",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "50px",
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>🌐</div>
        <h1 style={{ margin: "0 0 12px" }}>Chrome Required</h1>
        <p style={{ fontSize: "18px", margin: "0 0 8px" }}>
          You are using <strong>{browser}</strong>.
        </p>
        <p style={{ fontSize: "16px", opacity: 0.85 }}>
          This page is only accessible on <strong>Google Chrome</strong>.
          Please open it in Chrome to continue.
        </p>
        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginTop: "30px",
            background: "white",
            color: "#667eea",
            padding: "15px 35px",
            textDecoration: "none",
            borderRadius: "50px",
            fontWeight: "600",
          }}
        >
          Download Chrome
        </a>
      </div>
    </div>
  );
};

export default ChromeOnlyRoute;
