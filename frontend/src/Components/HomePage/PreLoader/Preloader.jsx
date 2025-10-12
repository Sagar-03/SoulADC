import React, { useEffect, useState } from "react";
import "./Preloader.css";
import logo from "../../../assets/logo.svg"; // shield-only logo

const Preloader = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 3.2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3200);

    // Completely remove preloader after 4 seconds
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className={`preloader ${fadeOut ? "fade-out" : ""}`}>
      <div className="logo-container">
        <img src={logo} alt="Soul ADC Logo" className="logo-shield" />
        <div className="sun-glow"></div>
      </div>
    </div>
  );
};

export default Preloader;
