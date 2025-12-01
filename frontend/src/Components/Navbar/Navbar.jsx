import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, getUserRole, getUser } from "../../utils/auth";
import { onAuthChange } from "../../utils/authEvents"; // ✅ new import

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const navigate = useNavigate();

  const updateAuthState = () => {
    const loggedIn = isAuthenticated();
    setIsLoggedIn(loggedIn);
    setUserRole(loggedIn ? getUserRole() : "user");
  };

  // ✅ Run on mount and listen for auth changes
  useEffect(() => {
    updateAuthState(); // initial check

    const unsubscribe = onAuthChange(() => {
      updateAuthState(); // refresh instantly when login/logout
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDashboardClick = () => {
    if (userRole === "admin") {
      navigate("/admin");
    } else {
      const user = getUser();
      // If user has purchased courses, go to course dashboard
      if (user?.purchasedCourses && user.purchasedCourses.length > 0) {
        navigate("/studentdashboard");
      } 
      // If user has purchased mocks, go to mock dashboard
      else if (user?.purchasedMocks && user.purchasedMocks.length > 0) {
        navigate("/student/mocks");
      } 
      // Otherwise, go to course dashboard as default
      else {
        navigate("/studentdashboard");
      }
    }
  };

  const handleMocksClick = () => {
    if (isLoggedIn) {
      if (userRole === "admin") {
        navigate("/admin/manage-mocks");
      } else {
        // Check if user has purchased mocks
        const user = getUser();
        if (user?.purchasedMocks && user.purchasedMocks.length > 0) {
          navigate("/student/mocks");
        } else {
          navigate("/mocks");
        }
      }
    } else {
      navigate("/mocks");
    }
  };

  const handleCoursesClick = () => {
    if (isLoggedIn) {
      if (userRole === "admin") {
        navigate("/admin/manage-courses");
      } else {
        // Check if user has purchased courses
        const user = getUser();
        if (user?.purchasedCourses && user.purchasedCourses.length > 0) {
          navigate("/studentdashboard");
        } else {
          navigate("/courses");
        }
      }
    } else {
      navigate("/courses");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white">
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" />
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            <li>
              <Link to="/" className="btn btn-enroll mx-3">
                Home
              </Link>
            </li>

            <li>
              <Link to="/about" className="btn btn-enroll mx-3">
                About
              </Link>
            </li>

            <li>
              <button
                onClick={handleCoursesClick}
                className="btn btn-enroll mx-3"
              >
                Courses
              </button>
            </li>

            {isLoggedIn && (
              <li>
                <button
                  onClick={handleDashboardClick}
                  className="btn btn-enroll mx-3"
                >
                  Dashboard
                </button>
              </li>
            )}

            <li>
              <button
                onClick={handleMocksClick}
                className="btn btn-enroll mx-3"
              >
                Mocks
              </button>
            </li>

            <li>
              <Link to="/ContactUs" className="btn btn-enroll mx-3">
                Contact
              </Link>
            </li>
          </ul>

          {/* Right Side */}
          <div className="d-flex">
            {isLoggedIn ? (
              <button className="btn btn-login me-2" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <>
                <button
                  className="btn btn-login me-2"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  className="btn btn-enroll"
                  onClick={() => navigate("/login")}
                >
                  Enroll Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
