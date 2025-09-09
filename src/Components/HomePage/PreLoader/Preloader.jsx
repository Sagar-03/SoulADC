import React, { useEffect, useState } from "react";
import "./Preloader.css"; 
import logo from "../../../assets/logo.svg"; // shield-only logo

const Preloader = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 6000); // 6 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className="preloader">
      <div className="logo-container">
        <img src={logo} alt="Soul ADC Logo" className="logo-shield" />
        <div className="sun-glow"></div>
      </div>
    </div>
  );
};

export default Preloader;
