
import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/footer";
import Auth from "./Auth";
import Registration from "../Components/HomePage/RegisterSection/Register";
import Feature from "../Components/HomePage/FeatureSection/FeatureSection";
import About from "../Components/HomePage/AboutSection/About";
import logo from "../assets/logo.png";
import CourseFeatures from "../Components/HomePage/CourseFeature/CourseFeatures";
import Highlights from "../Components/HomePage/Highlights/Highlights";
import CourseCurriculum from "../Components/HomePage/Coursecurriulam/CourseCurriculum";
import Board from "../Components/HomePage/Board/Board";

// --- Logo Animation Component ---
const LogoAnimation = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),   // Logo appears
      setTimeout(() => setStage(2), 1200),  // Sun starts glowing
      setTimeout(() => setStage(3), 2000),  // Sun intensifies
      setTimeout(() => setStage(4), 3000),  // Light spreads across screen
      setTimeout(() => setStage(5), 4500),  // Full brightness
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const logoUrl = logo;

  return (
    <>
      <style>{`
        @keyframes sunPulse {
          0% { 
            box-shadow: 
              0 0 10px 5px rgba(255, 223, 0, 0.3),
              0 0 20px 10px rgba(255, 193, 7, 0.2),
              0 0 30px 15px rgba(255, 152, 0, 0.1);
          }
          50% { 
            box-shadow: 
              0 0 20px 10px rgba(255, 223, 0, 0.8),
              0 0 40px 20px rgba(255, 193, 7, 0.6),
              0 0 60px 30px rgba(255, 152, 0, 0.4);
          }
          100% { 
            box-shadow: 
              0 0 15px 8px rgba(255, 223, 0, 0.5),
              0 0 30px 15px rgba(255, 193, 7, 0.3),
              0 0 45px 22px rgba(255, 152, 0, 0.2);
          }
        }
        
        @keyframes sunIntense {
          0% { 
            box-shadow: 
              0 0 30px 15px rgba(255, 223, 0, 0.6),
              0 0 60px 30px rgba(255, 193, 7, 0.4),
              0 0 90px 45px rgba(255, 152, 0, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 50px 25px rgba(255, 223, 0, 1),
              0 0 100px 50px rgba(255, 193, 7, 0.8),
              0 0 150px 75px rgba(255, 152, 0, 0.6);
          }
          100% { 
            box-shadow: 
              0 0 40px 20px rgba(255, 223, 0, 0.8),
              0 0 80px 40px rgba(255, 193, 7, 0.6),
              0 0 120px 60px rgba(255, 152, 0, 0.4);
          }
        }

        .sun-glow {
          animation: sunPulse 2s ease-in-out infinite;
        }
        
        .sun-intense {
          animation: sunIntense 1.5s ease-in-out infinite;
        }

        .brightness-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 248, 220, 0.1) 20%,
            rgba(255, 235, 180, 0.3) 40%,
            rgba(255, 223, 130, 0.5) 60%,
            rgba(255, 215, 80, 0.7) 80%,
            rgba(255, 205, 30, 0.9) 100%
          );
          opacity: 0;
          transition: opacity 2s ease-out;
          pointer-events: none;
        }

        .brightness-overlay.active {
          opacity: 1;
        }

        .light-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300vw;
          height: 300vh;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 248, 220, 0.6) 10%,
            rgba(255, 235, 180, 0.4) 25%,
            rgba(255, 223, 130, 0.2) 45%,
            rgba(255, 215, 80, 0.1) 65%,
            transparent 85%
          );
          transform: translate(-50%, -50%) scale(0);
          transition: transform 2.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 1s ease-out;
          opacity: 0;
        }

        .light-rays.spread {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }

        .logo-container {
          position: relative;
          display: block;
          transition: opacity 1s ease-in-out, transform 1s ease-in-out;
        }

        .logo-image {
          width: 12rem; /* 48 = w-48 */
          height: auto;
          display: block;
          position: relative;
          z-index: 30;
        }

        @media (min-width: 768px) {
          .logo-image {
            width: 16rem; /* 64 = w-64 */
          }
        }

        .final-brightness {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 248, 220, 0.8) 25%,
            rgba(255, 235, 180, 0.7) 50%,
            rgba(255, 223, 130, 0.8) 75%,
            rgba(255, 255, 255, 0.9) 100%
          );
          opacity: 0;
          transition: opacity 1.5s ease-in;
        }

        .final-brightness.active {
          opacity: 1;
        }
      `}</style>
      <div className="fixed inset-0 bg-gray-900 z-50 overflow-hidden">
        {/* Light rays that spread from center */}
        <div className={`light-rays ${stage >= 4 ? 'spread' : ''}`} />
        
        {/* Brightness overlay */}
        <div className={`brightness-overlay ${stage >= 4 ? 'active' : ''}`} />
        
        {/* Final brightness layer */}
        <div className={`final-brightness ${stage >= 5 ? 'active' : ''}`} />
        
        {/* Logo container - absolutely positioned at center */}
        <div 
          className={`logo-container ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Logo image - placed first so it's behind the animations */}
          <img src={logoUrl} alt="Soul ADC Logo" className="logo-image" />
          
          {/* Sun glow effect positioned at center of logo - on top of logo */}
          <div
            className={`absolute w-12 h-12 rounded-full bg-yellow-400 transition-all duration-500 ${
              stage >= 2 ? (stage >= 3 ? 'sun-intense opacity-100' : 'sun-glow opacity-100') : 'opacity-0'
            }`}
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 40,
              filter: 'blur(4px)'
            }}
          />
          
          {/* Additional sun core for more intensity - on top of glow */}
          <div
            className={`absolute w-8 h-8 rounded-full bg-white transition-all duration-500 ${
              stage >= 3 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 30px 15px rgba(255, 255, 255, 0.9), 0 0 60px 30px rgba(255, 223, 0, 0.7)',
              zIndex: 50,
              filter: 'blur(1px)'
            }}
          />
          
          {/* Brightest center core */}
          <div
            className={`absolute w-4 h-4 rounded-full bg-white transition-all duration-500 ${
              stage >= 3 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 20px 10px rgba(255, 255, 255, 1)',
              zIndex: 60
            }}
          />
        </div>
      </div>
    </>
  );
};

// --- Homepage Component ---
const HomePage = () => {
  const [showAuth, setShowAuth] = useState(false);
  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 1.5s ease-in-out;
        }
      `}</style>
      <Navbar onSignInClick={() => setShowAuth(true)} />
      <Registration />
      <Feature />
      <About />
      <CourseFeatures />
      <Highlights />
      <CourseCurriculum />
      <Board />
      <Footer />
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </div>
  );
};

// --- Main App Component (Entry Point) ---
const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans">
      {loading ? <LogoAnimation /> : <HomePage />}
    </div>
  );
};

export default Home;
