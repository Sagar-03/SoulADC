import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import logo from "../assets/logo.png";

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
        const res = await fetch("http://localhost:7001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();
        console.log("Login response:", data);

        if (res.ok && data.token) {
          // Save auth data
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("role", data.role);

          alert("Login successful!");

          // 🔥 Handle redirect after login
          const redirectUrl = localStorage.getItem("redirectAfterLogin");
          if (redirectUrl) {
            localStorage.removeItem("redirectAfterLogin");
            navigate(redirectUrl);
          } else if (data.user.purchasedCourses && data.user.purchasedCourses.length > 0) {
            // Purchased course → go to dashboard
            navigate("/studentdashboard");
          } else {
            // No purchased course → stay on site, navbar will show Logout
            navigate("/");
          }
        } else {
          alert(data.message || "Login failed");
        }
      } else {
        // 📝 SIGNUP
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match!");
          return;
        }

        const res = await fetch("http://localhost:7001/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message || "Registered successfully!");
          setIsLogin(true); // Switch to login tab
        } else {
          alert(data.message || "Registration failed");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Something went wrong, please try again.");
    }
  };

  return (
    <div className="auth-overlay" tabIndex={-1}>
      <div className="auth-modal">
        <button className="auth-close" onClick={() => navigate(-1)}>
          ×
        </button>

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
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password"
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

export default Login;
