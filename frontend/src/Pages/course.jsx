import React, { useState } from "react";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/footer";
import CoursesPage from "../Components/CoursePage/CoursesPage"; // plural
import Auth from "./Auth";

const Course = () => {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div>
      <Navbar onSignInClick={() => setShowAuth(true)} />
      <CoursesPage />   {/* only this renders cards */}
      <Footer />
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default Course;
