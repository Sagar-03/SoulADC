import React, { useEffect, useState } from "react";
import "./Preloader.css";
import logo from "../../../assets/logo.svg"; // shield-only logo

const Preloader = ({ onFinish }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Start fade out after 5.5 seconds
        const fadeTimer = setTimeout(() => {
            setFadeOut(true);
        }, 5500);

        // Complete removal after 6.5 seconds (allowing for fade transition)
        const removeTimer = setTimeout(() => {
            setIsVisible(false);
            if (onFinish) onFinish();
        }, 6500);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [onFinish]);

    if (!isVisible) return null;

    return (
        <div className={`preloader ${fadeOut ? 'fade-out' : ''}`}>
            <div className="logo-container">
                <img src={logo} alt="Soul ADC Logo" className="logo-shield" />
                <div className="sun-glow"></div>
            </div>
            <div className="flash-overlay"></div>
        </div>
    );
};

export default Preloader;
