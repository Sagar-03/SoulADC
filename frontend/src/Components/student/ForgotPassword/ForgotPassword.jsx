import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../Api/api";
import "../../../Pages/Auth.css";
import "./ForgotPassword.css";
import logo from "../../../assets/loginlogo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message || "Password reset link sent to your email!");
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send reset link. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" tabIndex={-1}>
      <div className="auth-modal forgot-password-modal">
        <button className="auth-close" onClick={() => navigate("/login")}>
          ×
        </button>

        {/* Left Panel */}
        <div className="auth-left-panel">
          <div className="brand-content">
            <img src={logo} alt="Logo" className="auth-logo" />
            <h1 className="brand-title">
              Reset Your <span className="highlight">Password</span>
            </h1>
            <p className="brand-subtitle">
              Don't worry! It happens to the best of us.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="form-header">
              <div className="forgot-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h2>Forgot Password?</h2>
              <p>Enter your registered email address and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email"
                  disabled={loading}
                />
              </div>

              {message && (
                <div className={`message-box ${success ? "success" : "error"}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {success ? (
                      <>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </>
                    )}
                  </svg>
                  <span>{message}</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="back-to-login">
              <button
                type="button"
                className="back-btn"
                onClick={() => navigate("/login")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
