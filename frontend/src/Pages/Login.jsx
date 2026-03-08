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
  { code: "+93", country: "Afghanistan" },
  { code: "+355", country: "Albania" },
  { code: "+213", country: "Algeria" },
  { code: "+1684", country: "American Samoa" },
  { code: "+376", country: "Andorra" },
  { code: "+1264", country: "Anguilla" },
  { code: "+244", country: "Angola" },
  { code: "+1268", country: "Antigua and Barbuda" },
  { code: "+54", country: "Argentina" },
  { code: "+374", country: "Armenia" },
  { code: "+297", country: "Aruba" },
  { code: "+61", country: "Australia" },
  { code: "+43", country: "Austria" },
  { code: "+994", country: "Azerbaijan" },
  { code: "+1242", country: "Bahamas" },
  { code: "+973", country: "Bahrain" },
  { code: "+880", country: "Bangladesh" },
  { code: "+1246", country: "Barbados" },
  { code: "+375", country: "Belarus" },
  { code: "+32", country: "Belgium" },
  { code: "+501", country: "Belize" },
  { code: "+229", country: "Benin" },
  { code: "+1441", country: "Bermuda" },
  { code: "+975", country: "Bhutan" },
  { code: "+591", country: "Bolivia" },
  { code: "+387", country: "Bosnia and Herzegovina" },
  { code: "+267", country: "Botswana" },
  { code: "+55", country: "Brazil" },
  { code: "+1284", country: "British Virgin Islands" },
  { code: "+673", country: "Brunei" },
  { code: "+359", country: "Bulgaria" },
  { code: "+226", country: "Burkina Faso" },
  { code: "+95", country: "Burma (Myanmar)" },
  { code: "+257", country: "Burundi" },
  { code: "+855", country: "Cambodia" },
  { code: "+237", country: "Cameroon" },
  { code: "+1", country: "Canada" },
  { code: "+238", country: "Cape Verde" },
  { code: "+1345", country: "Cayman Islands" },
  { code: "+236", country: "Central African Republic" },
  { code: "+235", country: "Chad" },
  { code: "+56", country: "Chile" },
  { code: "+86", country: "China" },
  { code: "+61", country: "Christmas Island" },
  { code: "+61", country: "Cocos (Keeling) Islands" },
  { code: "+57", country: "Colombia" },
  { code: "+269", country: "Comoros" },
  { code: "+242", country: "Republic of the Congo" },
  { code: "+243", country: "Democratic Republic of the Congo" },
  { code: "+682", country: "Cook Islands" },
  { code: "+506", country: "Costa Rica" },
  { code: "+385", country: "Croatia" },
  { code: "+53", country: "Cuba" },
  { code: "+357", country: "Cyprus" },
  { code: "+420", country: "Czech Republic" },
  { code: "+45", country: "Denmark" },
  { code: "+253", country: "Djibouti" },
  { code: "+1340", country: "Dominican Republic (USVI)" },
  { code: "+1767", country: "Dominica" },
  { code: "+1", country: "Dominican Republic" },
  { code: "+670", country: "East Timor (Timor-Leste)" },
  { code: "+593", country: "Ecuador" },
  { code: "+20", country: "Egypt" },
  { code: "+503", country: "El Salvador" },
  { code: "+240", country: "Equatorial Guinea" },
  { code: "+291", country: "Eritrea" },
  { code: "+372", country: "Estonia" },
  { code: "+251", country: "Ethiopia" },
  { code: "+500", country: "Falkland Islands (Islas Malvinas)" },
  { code: "+298", country: "Faroe Islands" },
  { code: "+679", country: "Fiji" },
  { code: "+358", country: "Finland" },
  { code: "+33", country: "France" },
  { code: "+689", country: "French Polynesia" },
  { code: "+241", country: "Gabon" },
  { code: "+220", country: "Gambia" },
  { code: "+995", country: "Georgia" },
  { code: "+49", country: "Germany" },
  { code: "+233", country: "Ghana" },
  { code: "+350", country: "Gibraltar" },
  { code: "+30", country: "Greece" },
  { code: "+299", country: "Greenland" },
  { code: "+1473", country: "Grenada" },
  { code: "+1671", country: "Guam" },
  { code: "+502", country: "Guatemala" },
  { code: "+224", country: "Guinea" },
  { code: "+245", country: "Guinea-Bissau" },
  { code: "+592", country: "Guyana" },
  { code: "+509", country: "Haiti" },
  { code: "+504", country: "Honduras" },
  { code: "+852", country: "Hong Kong" },
  { code: "+36",  country: "Hungary" },
  { code: "+354", country: "Iceland" },
];
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [failedLoginCount, setFailedLoginCount] = useState(0);
  const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Resend timer countdown
  React.useEffect(() => {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Show OTP screen immediately for better UX
    toast.info("Sending verification code...");
    setIsVerifyingEmail(true);
    setShowOTPVerification(true);
    setResendTimer(60);

    // Send OTP in background
    try {
      const { data } = await api.post("/auth/send-pre-registration-otp", {
        email: formData.email,
      });

      if (data.success) {
        toast.success("Verification code sent! Check your email.");
      } else {
        toast.warning("Code sent, but there may be a delay in delivery.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
      // Keep OTP screen open even if email fails - user can try resend
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
        toast.success("Email verified! Now complete your registration form.");
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

  const handleResendOTP = async () => {
    if (resendTimer > 0) {
      toast.info(`Please wait ${resendTimer} seconds before requesting a new code`);
      return;
    }

    try {
      const { data } = await api.post("/auth/send-pre-registration-otp", {
        email: formData.email,
      });

      toast.success(data.message || "New verification code sent!");
      setOtp("");
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // Check if this is admin login - skip device fingerprint for admin
        const isAdminLogin = formData.email === "admin@souladc.com" && formData.password === "souladc_admin_365";
        
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
          console.log('Login request sent with fingerprint:', deviceFingerprint?.substring(0, 15) + '...'); // Debug log
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
        // Check if email is verified
        if (!isEmailVerified) {
          toast.error("Please verify your email before registration");
          return;
        }

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

        if (data.success) {
          toast.success("Registration successful! Logging you in...");
          
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

      // Track failed login attempts (only for login, not registration)
      if (isLogin && (err.response?.status === 400 || err.response?.status === 401)) {
        const newFailedCount = failedLoginCount + 1;
        setFailedLoginCount(newFailedCount);
        
        // Show forgot password popup after first failed attempt
        if (newFailedCount === 1) {
          setShowForgotPasswordPopup(true);
        }
      }

      // Handle device lock error specifically
      if (err.response?.status === 403 || err.response?.data?.errorCode === 'DEVICE_LOCK_VIOLATION') {
        const errorDetails = err.response?.data?.details || "This account is locked to a specific device. Contact support to unlock your account.";
        toast.error(
          `${err.response?.data?.message || '🔒 Login blocked: Unauthorized device or IP.'}\n\n${errorDetails}`,
          { 
            autoClose: 10000,
            position: "top-center",
            style: { whiteSpace: 'pre-line' }
          }
        );
      } else {
        toast.error(error);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <>
      {/* Forgot Password Popup after Failed Login */}
      {showForgotPasswordPopup && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "450px",
              width: "90%",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            <button
              onClick={() => setShowForgotPasswordPopup(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                color: "#666",
              }}
            >
              ×
            </button>
            
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>🔒</div>
            <h3 style={{ marginBottom: "15px", color: "#333" }}>
              Login Failed
            </h3>
            <p style={{ color: "#666", marginBottom: "25px", lineHeight: "1.6" }}>
              Incorrect password. Would you like to reset your password or try again?
            </p>
            
            <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
              <button
                onClick={() => {
                  setShowForgotPasswordPopup(false);
                  navigate("/forgot-password");
                }}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #7B563D 0%, #6B4C3B 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Reset Password
              </button>
              
              <button
                onClick={() => {
                  setShowForgotPasswordPopup(false);
                  setFailedLoginCount(0);
                }}
                style={{
                  padding: "12px 24px",
                  background: "#f5f5f5",
                  color: "#333",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

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

                {/* OTP VERIFICATION OR FORM */}
                {showOTPVerification ? (
                  <>
                    <div className="form-header" style={{ marginTop: '20px' }}>
                      <h2>Verify Your Email</h2>
                      <p>Enter the 6-digit code sent to {formData.email}</p>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyEmailOTP();
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
                          }}
                        >
                          ← Back to Sign Up
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                <>
                  {/* FORM */}
                  <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && isEmailVerified && (
                      <div style={{
                        background: '#EFF6FF',
                        border: '1px solid #93C5FD',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '20px' }}>ℹ️</span>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          color: '#1E40AF',
                          lineHeight: '1.5'
                        }}>
                          Email verified! Now fill in your details and click "Create Account" to complete registration.
                        </p>
                      </div>
                    )}
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
                      <div style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        alignItems: 'stretch',
                        width: '100%'
                      }}>
                        <input
                          type="email"
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
                            background: isEmailVerified
                              ? '#10B981'
                              : formData.email
                                ? 'linear-gradient(145deg, #A98C6A, #7B563D)'
                                : '#b0b0b5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor:
                              isEmailVerified || !formData.email
                                ? 'not-allowed'
                                : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            opacity: !formData.email ? 0.8 : 1,
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
                            pattern="[0-9]{8,15}"
                            title="Please enter a valid phone number (8-15 digits)"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="input-group">
                      <label>Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleInputChange}
                          {...(!isLogin && {
                            pattern: ".{8,}",
                            title: "Password must be at least 8 characters long"
                          })}
                          required
                          style={{ paddingRight: '45px' }}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('password')}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 2l20 20"/>
                              <path d="M6.712 6.72C3.664 8.126 2 10.524 2 13s1.664 4.874 4.712 6.28l2.182-2.182C6.139 17.53 5 15.157 5 13s1.139-4.53 3.094-6.098L6.712 6.72z"/>
                              <path d="M21.288 17.28c1.047-1.404 1.712-3.802 1.712-6.28s-.665-4.876-1.712-6.28l-2.182 2.182C17.861 6.47 18 8.843 18 13s-.139 6.53-1.894 8.098l2.182 2.182z"/>
                              <circle cx="12" cy="13" r="2"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      {isLogin && (
                        <div style={{ textAlign: "right", marginTop: "8px" }}>
                          <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#7B563D",
                              fontSize: "13px",
                              cursor: "pointer",
                              fontWeight: "500",
                            }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>

                    {!isLogin && (
                      <div className="input-group">
                        <label>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            pattern=".{8,}"
                            title="Password must be at least 8 characters long"
                            required
                            style={{ paddingRight: '45px' }}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 2l20 20"/>
                                <path d="M6.712 6.72C3.664 8.126 2 10.524 2 13s1.664 4.874 4.712 6.28l2.182-2.182C6.139 17.53 5 15.157 5 13s1.139-4.53 3.094-6.098L6.712 6.72z"/>
                                <path d="M21.288 17.28c1.047-1.404 1.712-3.802 1.712-6.28s-.665-4.876-1.712-6.28l-2.182 2.182C17.861 6.47 18 8.843 18 13s-.139 6.53-1.894 8.098l2.182 2.182z"/>
                                <circle cx="12" cy="13" r="2"/>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </button>
                        </div>
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
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
