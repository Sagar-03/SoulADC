import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Navbar.css"; 
import logo from "../../assets/logo.png"; 
import Auth from "../../Pages/Auth";

const Navbar = () => {
  const [showAuth, setShowAuth] = useState(false);

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
              {/* <li className="nav-item mx-3">
                <a className="nav-link" href="#home">Home</a>
              </li> 
               <li className="nav-item mx-3">
                <a className="nav-link" href="#about">About</a>
              </li>
              <li className="nav-item mx-3">
                <a className="nav-link" href="#courses">Course</a>
              </li>
              <li className="nav-item mx-3">
                <a className="nav-link" href="#mentors">Mentors</a>
              </li>
              <li className="nav-item mx-3">
                <a className="nav-link" href="#contact">Contact</a>
              </li> */}
             <li> <button className="btn btn-enroll mx-3">Home</button></li>
             <li> <button className="btn btn-enroll mx-3">About</button></li>
             <li> <button className="btn btn-enroll mx-3">Courses</button></li>
             <li> <button className="btn btn-enroll mx-3">Mentors</button></li>
             <li> <button className="btn btn-enroll mx-3">Contact</button></li>
            </ul>

            {/* Buttons Right */}
            <div className="d-flex">
              <button className="btn btn-login me-2">Login</button>
              <button className="btn btn-enroll">Enroll Now</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth popup */}
      <Auth isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};

export default Navbar;
