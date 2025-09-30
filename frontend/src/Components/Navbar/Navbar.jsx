import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import Auth from "../../Pages/Auth";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [defaultTab, setDefaultTab] = useState("signIn");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check login state
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [showAuth]);

  const openAuth = (mode) => {
    setDefaultTab(mode);
    setShowAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src={logo} alt="Logo" />
          </a>

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
              <li><Link to="/" className="btn btn-enroll mx-3">Home</Link></li>
              <li><Link to="/about" className="btn btn-enroll mx-3">About</Link></li>
              <li><Link to="/courses" className="btn btn-enroll mx-3">Courses</Link></li>
              <li><Link to="/contact" className="btn btn-enroll mx-3">Contact</Link></li>
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
                    onClick={() => openAuth("signIn")}
                  >
                    Login
                  </button>
                  <button
                    className="btn btn-enroll"
                    onClick={() => openAuth("signUp")}
                  >
                    Enroll Now
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth popup */}
      <Auth
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultTab={defaultTab}
      />
    </>
  );
};

export default Navbar;
