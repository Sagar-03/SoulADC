// main.jsx or App.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function isChrome() {
  const ua = navigator.userAgent;
  return ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR");
}

if (!isChrome()) {
  document.body.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;">
      <h1> Access Denied</h1>
      <p>This platform is only accessible on <b>Google Chrome</b>.</p>
    </div>
  `;
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
