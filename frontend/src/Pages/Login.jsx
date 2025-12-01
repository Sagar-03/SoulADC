import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Auth.css";
import logo from "../assets/loginlogo.png";
import { api } from "../Api/api";
import CourseApprovalNotification from "../Components/Notifications/CourseApprovalNotification";
import {
  setAuthData,
  getRedirectAfterLogin,
  clearRedirectAfterLogin,
  getUser,
} from "../utils/auth";

const countryCodes = [
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+91", country: "India" },
  { code: "+971", country: "UAE" },
  { code: "+974", country: "Qatar" },
];

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [userRole, setUserRole] = useState(null); // Track user role

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    countryCode: "+61",
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
        const { data } = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        if (data.token) {
          setAuthData(data.token, data.user, data.role);
          toast.success("Login successful!");

          if (data.notifications?.length > 0) {
            const approvalNotifications = data.notifications.filter(
              (n) => (n.type === "course_approved" || n.type === "mock_approved") && !n.isRead
            );

            if (approvalNotifications.length > 0) {
              setNotifications(approvalNotifications);
              setShowNotification(true);
              setUserRole(data.role); // Save role for notification redirect
              return;
            }
          }

          const redirectUrl = getRedirectAfterLogin();

          // Admin should never be redirected to payment pages
          if (data.role === "admin") {
            clearRedirectAfterLogin(); // Clear any saved redirect
            navigate("/admin");
          } 
          // If there's a saved redirect and user is not admin, use it
          else if (redirectUrl) {
            clearRedirectAfterLogin();
            navigate(redirectUrl);
          } 
          // Students with purchased courses or mocks go to dashboard
          else if (data.user.purchasedCourses?.length > 0 || data.user.purchasedMocks?.length > 0) {
            if (data.user.purchasedCourses?.length > 0) {
              navigate("/studentdashboard");
            } else {
              navigate("/student/mocks");
            }
          } 
          // Default to home
          else {
            navigate("/");
          }
        } else {
          toast.error(data.message || "Login failed");
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match!");
          return;
        }

        const { data } = await api.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          countryCode: formData.countryCode,
          phone: formData.countryCode + formData.phone,
        });

        if (data) {
          toast.success(data.message || "Registered successfully!");
          setIsLogin(true);
        } else {
          toast.error("Registration failed");
        }
      }
    } catch (err) {
      let error = "Something went wrong, please try again.";

      if (err.response?.data?.message) {
        error = err.response.data.message;
      }

      toast.error(error);
    }
  };

  return (
    <>
      {showNotification && notifications.length > 0 && (
        <CourseApprovalNotification
          notifications={notifications}
          onClose={() => {
            setShowNotification(false);
            
            // Admin should never be redirected to payment pages
            if (userRole === "admin") {
              clearRedirectAfterLogin();
              navigate("/admin");
            } else {
              const redirectUrl = getRedirectAfterLogin();
              if (redirectUrl) {
                clearRedirectAfterLogin();
                navigate(redirectUrl);
              } else {
                // Redirect based on what user purchased
                const user = getUser();
                if (user?.purchasedCourses?.length > 0) {
                  navigate("/studentdashboard");
                } else if (user?.purchasedMocks?.length > 0) {
                  navigate("/student/mocks");
                } else {
                  navigate("/");
                }
              }
            }
          }}
        />
      )}

      {!showNotification && (
        <div className="auth-overlay" tabIndex={-1}>
          <div className="auth-modal">
          <button className="auth-close" onClick={() => navigate("/home")}>
            ×
          </button>

          {/* LEFT PANEL */}
          <div className="auth-left-panel">
            <div className="brand-content">
              <img src={logo} alt="Logo" className="auth-logo" />
              <p className="brand-subtitle">
                Ignite your dental future with us
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="auth-right-panel">
            <div className="auth-form-container">
              <div className="form-header">
                <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
                <p>
                  {isLogin
                    ? "Crack your ADC Part 1 with Soul ADC"
                    : "Join dental professionals"}
                </p>
              </div>

              {/* TABS */}
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

              {/* FORM */}
              <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="input-group">
                    <label>Phone Number</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        style={{ width: "140px", flexShrink: 0 }}
                      >
                        {countryCodes.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} ({item.country})
                          </option>
                        ))}
                      </select>

                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter phone number"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
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
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
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
      )}
    </>
  );
};

export default Login;
