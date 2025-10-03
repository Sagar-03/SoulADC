import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "../../utils/auth"; // 👈 use cookie-based utils

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // ✅ Check login state on mount
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLogout = () => {
    logout(); // clears cookies
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

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
              <Link to="/courses" className="btn btn-enroll mx-3">
                Courses
              </Link>
            </li>
            <li>
              <Link to="/contact" className="btn btn-enroll mx-3">
                Contact
              </Link>
            </li>
          </ul>

          {/* Buttons Right */}
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
