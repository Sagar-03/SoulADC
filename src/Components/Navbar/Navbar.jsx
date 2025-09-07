import {useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css"; // custom styles
import logo from "../../assets/logo.png"; // Import logo from src/assets
import Auth from "../../Pages/Auth";

const Navbar = () => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src={logo} alt="Logo" width="180" />
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end me-5" id="navbarNav">
            <ul className="navbar-nav me-3">
              <li className="nav-item mx-3">
                <a className="nav-link" href="#home">Home</a>
              </li>
              <li className="nav-item mx-3">
                <a className="nav-link" href="#about">About us</a>
              </li>
              <li className="nav-item mx-3">
                <a className="nav-link" href="#courses">Courses</a>
              </li>
              <li className="nav-item mx-3">
                <a className="nav-link" href="#contact">Contact us</a>
              </li>
            </ul>
            <button 
              onClick={() => setShowAuth(true)} 
              className="btn btn-signin"
              type="button"
              aria-label="Sign in"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Auth popup here */}
      <Auth isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};


export default Navbar;
