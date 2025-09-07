import React, { useState } from "react";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/footer";
import Auth from "./Auth";
import Registration from "../Components/HomePage/RegisterSection/Register";
import Feature from "../Components/HomePage/FeatureSection/FeatureSection";
import About from "../Components/HomePage/AboutSection/About";
export const Home = () => {

  return (
    <div>
      <Navbar onSignInClick={() => setShowAuth(true)} />
      <Registration />
      <Feature />
      <About />
      <Footer />
    </div>
  );
};

export default Home;
