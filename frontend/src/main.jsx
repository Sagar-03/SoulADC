// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Enhanced Chrome detection function
function isChrome() {
  const ua = navigator.userAgent.toLowerCase();
  const vendor = navigator.vendor.toLowerCase();
  
  // More robust Chrome detection
  const isChromeBrowser = ua.includes('chrome') && 
                          vendor.includes('google') && 
                          !ua.includes('edg') && 
                          !ua.includes('opr') &&
                          !ua.includes('brave');
  
  return isChromeBrowser;
}

// Double-check in case the index.html check was bypassed
if (!isChrome()) {
  document.body.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;">
      <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border-radius:20px;padding:50px;text-align:center;max-width:500px;">
        <div style="font-size:60px;margin-bottom:20px;">🚫</div>
        <h1>Access Denied</h1>
        <p style="margin-top:15px;font-size:18px;">This platform is only accessible on <b>Google Chrome</b>.</p>
        <a href="https://www.google.com/chrome/" target="_blank" 
           style="display:inline-block;margin-top:30px;background:white;color:#667eea;padding:15px 35px;text-decoration:none;border-radius:50px;font-weight:600;">
          Download Chrome
        </a>
      </div>
    </div>
  `;
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
