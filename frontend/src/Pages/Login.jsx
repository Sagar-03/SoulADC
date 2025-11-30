import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from 'react-toastify';
import "./Auth.css";
import logo from "../assets/loginlogo.png";
import { api } from "../Api/api";
import { setAuthData, getRedirectAfterLogin, clearRedirectAfterLogin } from "../utils/auth";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    agreeTerms: false,
  });
  const navigate = useNavigate();

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
          // ✅ Store auth data in cookies
          setAuthData(data.token, data.user, data.role);

          toast.success("Login successful!");

          // ✅ Redirect handling
          const redirectUrl = getRedirectAfterLogin();
          if (redirectUrl) {
            clearRedirectAfterLogin();
            navigate(redirectUrl);
          } else if (data.user.purchasedCourses?.length > 0) {
            navigate("/studentdashboard");
          } else if (data.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
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
      // Extract error message from server response
      let errorMessage = "Something went wrong, please try again.";

      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="auth-overlay" tabIndex={-1}>
      <div className="auth-modal">
        <button className="auth-close" onClick={() => navigate("/home")}>
          ×
        </button>

        {/* Left Panel */}
        <div className="auth-left-panel">
          <div className="brand-content">
            <img src={logo} alt="Logo" className="auth-logo" />
            {/* <h1 className="brand-title">
              Crack your<span className="highlight"> ADC Part 1</span> with Soul ADC
            </h1> */}
            <p className="brand-subtitle">
              Ignite your dental future with us
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="form-header">
              <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
              <p>{isLogin ? "Crack your ADC Part 1 with Soul ADC" : "Crack your ADC Part 1 with Soul ADC"}</p>

              {/* <p>{isLogin ? "Sign in to continue" : "Join dental professionals"}</p> */}
              {/* Crack your<span className="highlight"> ADC Part 1</span> with Soul ADC */}
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
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email"
                />
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter phone"
                  />
                </div>
              )}

              <div className="input-group">
                <div className="password-label-row">
                  <label htmlFor="password">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      className="forgot-password-btn"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm password"
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
                    I agree to <Link to="/tnc">Terms & Conditions</Link>

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

export default Login;
