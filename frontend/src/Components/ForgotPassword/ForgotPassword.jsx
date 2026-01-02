import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "../../Api/api";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const navigate = useNavigate();

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      toast.error("OTP expired. Please request a new one.");
      setStep(1);
    }
  }, [timeLeft, timerActive]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/send-reset-otp", { email });
      toast.success(data.message);
      setStep(2);
      setTimeLeft(600); // Reset timer to 10 minutes
      setTimerActive(true);
      setAttemptsRemaining(5);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      toast.success(data.message);
      setResetToken(data.resetToken);
      setStep(3);
      setTimerActive(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid OTP";
      toast.error(errorMsg);
      
      if (error.response?.data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(error.response.data.attemptsRemaining);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password-with-token", {
        resetToken,
        email,
        newPassword,
      });
      toast.success(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/send-reset-otp", { email });
      toast.success("New OTP sent to your email");
      setTimeLeft(600);
      setTimerActive(true);
      setOtp("");
      setAttemptsRemaining(5);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-container">
        <button className="close-btn" onClick={() => navigate("/login")}>
          ×
        </button>

        <div className="forgot-password-content">
          <h2>Reset Your Password</h2>
          
          {/* Progress Indicator */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? "active" : ""}`}>
              <div className="step-number">1</div>
              <span>Email</span>
            </div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>
              <div className="step-number">2</div>
              <span>Verify OTP</span>
            </div>
            <div className={`step ${step >= 3 ? "active" : ""}`}>
              <div className="step-number">3</div>
              <span>New Password</span>
            </div>
          </div>

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="forgot-password-form">
              <p className="instruction">
                Enter your registered email address to receive a 6-digit OTP
              </p>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="forgot-password-form">
              <p className="instruction">
                Enter the 6-digit OTP sent to <strong>{email}</strong>
              </p>
              
              <div className="timer-display">
                <span className="timer-icon">⏱</span>
                <span className={`timer-text ${timeLeft < 60 ? "warning" : ""}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="input-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  className="otp-input"
                />
              </div>

              {attemptsRemaining < 5 && (
                <p className="attempts-warning">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                </p>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="resend-section">
                <p>Didn't receive the OTP?</p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="resend-btn"
                  disabled={loading || timeLeft > 540} // Allow resend after 1 minute
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="back-btn"
              >
                ← Change Email
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="forgot-password-form">
              <p className="instruction">
                Create a new password for your account
              </p>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="back-to-login">
            <button onClick={() => navigate("/login")}>
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
