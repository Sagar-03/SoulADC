
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/footer";
import Auth from "./Auth";
import Registration from "../Components/HomePage/RegisterSection/Register";
import About from "../Components/HomePage/AboutSection/AboutSection";
import CourseFeatures from "../Components/HomePage/CourseFeature/CourseFeatures";
import Highlights from "../Components/HomePage/Highlights/Highlights";
import CourseCurriculum from "../Components/HomePage/Coursecurriulam/CourseCurriculum";
import Board from "../Components/HomePage/Board/Board";
import MentorCard from "../Components/HomePage/Mentor/MentorCard";
import Preloader from "../Components/HomePage/PreLoader/Preloader";


// --- Homepage Component ---
const HomePage = () => {
  const [loadingDone, setLoadingDone] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handlePreloaderFinish = useCallback(() => setLoadingDone(true), []);
  const handleSignInClick = useCallback(() => setShowAuth(true), []);
  const handleAuthClose = useCallback(() => setShowAuth(false), []);
  
  return (
    <>
      {!loadingDone && <Preloader onFinish={handlePreloaderFinish} />}
      {loadingDone && (
        <div>
          <Navbar onSignInClick={handleSignInClick} />
          <Registration />
          <About />
          <MentorCard />
          <CourseFeatures />
          <Highlights />
          <CourseCurriculum />
          <Board />
          <Footer />
          {showAuth && <Auth onClose={handleAuthClose} />}
        </div>
      )}
    </>
  );
};

export default HomePage;
