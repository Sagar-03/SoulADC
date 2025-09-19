import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/home";
import CoursesPage from "./Pages/course";
// import About from "./Pages/about";
// import Contact from "./Pages/contact";
import Studentdashboard from "./Components/student/Studentdashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} /> {/* ✅ */}
        {/* <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} /> */}
        <Route path="/studentdashboard" element={<Studentdashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
