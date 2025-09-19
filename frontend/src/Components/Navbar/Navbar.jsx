import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import Auth from "../../Pages/Auth";
import { Link } from "react-router-dom";

const Navbar = () => {
  // Track modal visibility + which tab (signIn / signUp)
  const [showAuth, setShowAuth] = useState(false);
  const [defaultTab, setDefaultTab] = useState("signIn");

  const openAuth = (mode) => {
    setDefaultTab(mode);
    setShowAuth(true);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white">
        <div className="container-fluid">

          {/* Logo Left */}
          <a className="navbar-brand" href="#">
            <img src={logo} alt="Logo" />
          </a>

          {/* Toggler for mobile */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav links center + buttons right */}
          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Center Nav links */}

            <ul className="navbar-nav mx-auto">
              <li><Link to="/" className="btn btn-enroll mx-3">Home</Link></li>
              <li><Link to="/about" className="btn btn-enroll mx-3">About</Link></li>
              <li><Link to="/courses" className="btn btn-enroll mx-3">Courses</Link></li>
              {/* <li><Link to="/mentors" className="btn btn-enroll mx-3">Mentors</Link></li> */}
              <li><Link to="/contact" className="btn btn-enroll mx-3">Contact</Link></li>
            </ul>


            {/* Buttons Right */}
            <div className="d-flex">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Auth popup */}
      <Auth
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultTab={defaultTab} // 👈 Pass which tab to open
      />
    </>
  );
};

export default Navbar;
