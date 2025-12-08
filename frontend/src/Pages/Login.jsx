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
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

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
        // Check if this is admin login - skip device fingerprint for admin
        const isAdminLogin = formData.email === "admin@souladc.com" && formData.password === "admin123";
        
        let deviceFingerprint = null;
        
        // Get device fingerprint for login security (only for non-admin users)
        if (!isAdminLogin) {
          deviceFingerprint = await getDeviceFingerprint();
          
          console.log('🔍 Device Fingerprint Generated:', deviceFingerprint); // Debug log
          
          if (!deviceFingerprint) {
            toast.warning("Unable to verify device. Please ensure JavaScript is enabled and try again.");
          }
        } else {
          console.log('🔓 Admin login detected - skipping device fingerprint check');
        }

        const { data } = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
          deviceFingerprint: deviceFingerprint, // Include device fingerprint (null for admin)
        });

        if (deviceFingerprint) {
          console.log('📤 Login request sent with fingerprint:', deviceFingerprint?.substring(0, 15) + '...'); // Debug log
        }

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

        // Register the user
        const { data } = await api.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          countryCode: formData.countryCode,
          phone: formData.countryCode + formData.phone,
        });

        if (data) {
          toast.success(data.message || "Registered successfully!");
          
          // Automatically log in the user after registration with device fingerprint
          try {
            const deviceFingerprint = await getDeviceFingerprint();
            
            const loginResponse = await api.post("/auth/login", {
              email: formData.email,
              password: formData.password,
              deviceFingerprint: deviceFingerprint,
            });

            if (loginResponse.data.token) {
              setAuthData(loginResponse.data.token, loginResponse.data.user, loginResponse.data.role);
              toast.success("Welcome! Your account is now secured to this device.");
              
              // Navigate to home or dashboard
              if (loginResponse.data.user.purchasedCourses?.length > 0) {
                navigate("/studentdashboard");
              } else {
                navigate("/");
              }
            }
          } catch (loginErr) {
            console.error("Auto-login after registration failed:", loginErr);
            // If auto-login fails, just switch to login form
            setIsLogin(true);
            toast.info("Please login to continue");
          }
        } else {
          toast.error("Registration failed");
        }
      }
    } catch (err) {
      let error = "Something went wrong, please try again.";

      if (err.response?.data?.message) {
        error = err.response.data.message;
      }

      // Handle device lock error specifically
      if (err.response?.status === 403 || err.response?.data?.errorCode === 'DEVICE_LOCK_VIOLATION') {
        toast.error(
          "🔒 Login blocked: Unauthorized device or IP. Please contact support to unlock your account.",
          { 
            autoClose: 8000,
            position: "top-center"
          }
        );
      } else {
        toast.error(error);
      }
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
