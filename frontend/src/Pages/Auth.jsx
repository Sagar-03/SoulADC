import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./Auth.css";
import logo from "../assets/logo.png";
import { api } from "../Api/api";
import { setAuthData, getRedirectAfterLogin, clearRedirectAfterLogin } from "../utils/auth"; // 👈 use cookie-based utils

const Auth = ({ isOpen, onClose, defaultTab = "signIn" }) => {
  const [isLogin, setIsLogin] = useState(defaultTab === "signIn");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    agreeTerms: false,
  });
  const navigate = useNavigate();

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Resend timer countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Reset email verification if email is changed during signup
    if (name === "email" && !isLogin && isEmailVerified) {
      setIsEmailVerified(false);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const { data } = await api.post("/auth/send-pre-registration-otp", {
        email: formData.email,
      });

      if (data.success) {
        toast.success("Verification code sent! Check your email.");
        setIsVerifyingEmail(true);
        setShowOTPVerification(true);
        setResendTimer(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const { data } = await api.post("/auth/verify-pre-registration-otp", {
        email: formData.email,
        otp: otp,
      });

      if (data.success) {
        toast.success("Email verified successfully!");
        setIsEmailVerified(true);
        setIsVerifyingEmail(false);
        setShowOTPVerification(false);
        setOtp("");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid OTP";
      const attemptsRemaining = err.response?.data?.attemptsRemaining;
      
      if (attemptsRemaining !== undefined) {
        toast.error(`${errorMessage} (${attemptsRemaining} attempts remaining)`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // 🟢 LOGIN
        const { data } = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        if (data.token) {
          // ✅ Store in cookies
          setAuthData(data.token, data.user, data.role);

          toast.success("Login successful!");
          onClose();

          // ✅ Redirect logic
          const redirectUrl = getRedirectAfterLogin();
          if (redirectUrl) {
            clearRedirectAfterLogin();
            navigate(redirectUrl);
          } else if (data.user.purchasedCourses?.length > 0) {
            navigate("/studentdashboard");
          } else if (data.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/courses");
          }
        } else {
          toast.error(data.message || "Login failed");
        }
      } else {
        // 📝 SIGNUP
        // Check if email is verified
        if (!isEmailVerified) {
          toast.error("Please verify your email before registration");
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match!");
          return;
        }

        const { data } = await api.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        });

        if (data.success) {
          toast.success("Registration successful! You can now log in.");
          // Reset form and switch to login
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            name: "",
            phone: "",
            agreeTerms: false,
          });
          setIsEmailVerified(false);
          setIsLogin(true);
        } else {
          toast.error(data.message || "Registration failed");
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Something went wrong, please try again.";
      
      // Handle email not verified error during login
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        toast.error("Email not verified! Please check your email for the verification code.");
        setShowOTPVerification(true);
        setIsLogin(false);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const { data } = await api.post("/auth/verify-email-otp", {
        email: formData.email,
        otp: otp,
      });

      if (data.success) {
        toast.success("Email verified successfully! You can now log in.");
        setShowOTPVerification(false);
        setOtp("");
        setIsLogin(true); // Switch to login tab
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Verification failed. Please try again.";
      const attemptsRemaining = err.response?.data?.attemptsRemaining;
      
      if (attemptsRemaining !== undefined) {
        toast.error(`${errorMessage} (${attemptsRemaining} attempts remaining)`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) {
      toast.info(`Please wait ${resendTimer} seconds before requesting a new code`);
      return;
    }

    try {
      // Use different endpoint based on whether we're in pre-registration or post-registration verification
      const endpoint = isVerifyingEmail ? "/auth/send-pre-registration-otp" : "/auth/send-verification-otp";
      
      const { data } = await api.post(endpoint, {
        email: formData.email,
      });

      toast.success(data.message || "New verification code sent!");
      setOtp("");
      setResendTimer(60); // Reset timer to 60 seconds
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={handleOverlayClick} tabIndex={-1}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>×</button>

        {/* Left Panel */}
        <div className="auth-left-panel">
          <div className="brand-content">
            <img src={logo} alt="Logo" className="auth-logo" />
            <h1 className="brand-title">
              Become the <span className="highlight">Dentist</span> you dream to be
            </h1>
            <p className="brand-subtitle">
              Unlock your potential through excellence in dental education.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            {showOTPVerification ? (
              // OTP Verification Screen
              <>
                <div className="form-header">
                  <h2>Verify Your Email</h2>
                  <p>Enter the 6-digit code sent to {formData.email}</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (isVerifyingEmail) {
                    handleVerifyEmailOTP();
                  } else {
                    handleVerifyOTP(e);
                  }
                }} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="otp">Verification Code</label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      pattern="[0-9]{6}"
                      maxLength="6"
                      required
                      autoFocus
                      style={{ 
                        fontSize: '24px', 
                        letterSpacing: '8px', 
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                      Code expires in 10 minutes
                    </small>
                  </div>

                  <button type="submit" className="submit-btn">
                    Verify Email
                  </button>

                  <div className="auth-switch" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '10px' }}>
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      className="switch-btn"
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0}
                      style={{
                        opacity: resendTimer > 0 ? 0.5 : 1,
                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>

                  <div className="auth-switch" style={{ marginTop: '15px' }}>
                    <button
                      type="button"
                      className="switch-btn"
                      onClick={() => {
                        setShowOTPVerification(false);
                        setOtp("");
                        setIsVerifyingEmail(false);
                        if (!isLogin) {
                          // Stay on signup form
                        } else {
                          setIsLogin(true);
                        }
                      }}
                    >
                      ← Back to {isVerifyingEmail ? 'Sign Up' : 'Login'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Original Login/Signup Screen
              <>
                <div className="form-header">
                  <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
                  <p>{isLogin ? "Sign in to continue" : "Join dental professionals"}</p>
                </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`tab-btn ${isLogin ? "active" : ""}`}
                onClick={() => {
                  setIsLogin(true);
                  setIsEmailVerified(false);
                  setShowOTPVerification(false);
                  setIsVerifyingEmail(false);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${!isLogin ? "active" : ""}`}
                onClick={() => {
                  setIsLogin(false);
                  setIsEmailVerified(false);
                  setShowOTPVerification(false);
                  setIsVerifyingEmail(false);
                }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'stretch',
                  width: '100%'
                }}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isEmailVerified && !isLogin}
                    required
                    style={{ 
                      flex: '1',
                      minWidth: '0'
                    }}
                  />
                  {!isLogin && (
                    <button
                      type="button"
                      onClick={handleSendEmailOTP}
                      disabled={isEmailVerified || !formData.email}
                      className="verify-email-btn"
                      style={{
                        padding: '10px 16px',
                        backgroundColor: isEmailVerified ? '#10B981' : '#4F46E5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isEmailVerified || !formData.email ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        opacity: (!formData.email || isEmailVerified) ? 0.8 : 1,
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        minWidth: '120px'
                      }}
                    >
                      {isEmailVerified ? '✓ Verified' : 'Verify Email'}
                    </button>
                  )}
                </div>
                {!isLogin && isEmailVerified && (
                  <small style={{ color: '#10B981', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ✓ Email verified successfully
                  </small>
                )}
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    pattern="[0-9]{8,15}"
                    title="Please enter a valid phone number (8-15 digits)"
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  {...(!isLogin && {
                    pattern: ".{8,}",
                    title: "Password must be at least 8 characters long"
                  })}
                  required
                />
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    pattern=".{8,}"
                    title="Password must be at least 8 characters long"
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="checkbox-group">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="checkmark"></span>
                    I agree to <a href="#">Terms & Conditions</a>
                  </label>
                </div>
              )}

              <button type="submit" className="submit-btn">
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="auth-switch">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className="switch-btn"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
