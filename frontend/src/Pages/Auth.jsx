import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./Auth.css";
import logo from "../assets/logo.png";
import { api } from "../Api/api";
import { setAuthData, getRedirectAfterLogin, clearRedirectAfterLogin } from "../utils/auth"; // 👈 use cookie-based utils

const Auth = ({ isOpen, onClose, defaultTab = "signIn" }) => {
  const [isLogin, setIsLogin] = useState(defaultTab === "signIn");
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

        if (data) {
          toast.success(data.message || "Registered successfully!");
          setIsLogin(true); // Switch to login
        } else {
          toast.error("Registration failed");
        }
      }
    } catch (err) {
      toast.error("Something went wrong, please try again.");
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
            <div className="form-header">
              <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
              <p>{isLogin ? "Sign in to continue" : "Join dental professionals"}</p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`tab-btn ${isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${!isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(false)}
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
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
