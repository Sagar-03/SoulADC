
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
import MentorCard from "../Components/HomePage/Mentor/MentorCard";
import Preloader from "../Components/HomePage/PreLoader/Preloader";


// --- Homepage Component ---
const HomePage = () => {
  const [loadingDone, setLoadingDone] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  return (
    <>
      {!loadingDone && <Preloader onFinish={() => setLoadingDone(true)} />}
      {loadingDone && (
        <div className="animate-fade-in">
          <Navbar onSignInClick={() => setShowAuth(true)} />
          <Registration />
          <About />
          <MentorCard />
          <CourseFeatures />
          <Highlights />
          <CourseCurriculum />
          <Board />
          <Footer />
          {showAuth && <Auth onClose={() => setShowAuth(false)} />}
        </div>
      )}
    </>
  );
};

export default HomePage;
