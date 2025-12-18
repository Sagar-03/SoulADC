import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaGraduationCap, FaUserMd, FaChartLine, FaUsers, FaPlay, FaBookOpen, FaAward, FaTrophy } from "react-icons/fa";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/footer";
import "./About.css";

const About = () => {
  return (
    <div className="premium-about-page">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="premium-hero">
        <Container>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <div className="hero-badge">
                <FaGraduationCap className="me-2" />
                Excellence in ADC Preparation
              </div>
              <h1 className="hero-title">
                <span className="brand-highlight">Soul ADC</span>
              </h1>
              <p className="hero-subtitle">
                Igniting your dental future with concept-driven, structured learning
                that transforms complex concepts into clear understanding.
              </p>
              {/* <div className="hero-stats">
                <div className="stat-item">
                  <FaTrophy className="stat-icon" />
                  <div>
                    <h4>98%</h4>
                    <p>Success Rate</p>
                  </div>
                </div>
                <div className="stat-item">
                  <FaUsers className="stat-icon" />
                  <div>
                    <h4>500+</h4>
                    <p>Students</p>
                  </div>
                </div>
                <div className="stat-item">
                  <FaAward className="stat-icon" />
                  <div>
                    <h4>5+</h4>
                    <p>Years Experience</p>
                  </div>
                </div>
              </div> */}
            </Col>
            <Col lg={6}>
              <div className="hero-visual">
                <div className="cards-grid">
                  <div className="floating-card">
                    <FaBookOpen className="card-icon" />
                    <h6>Comprehensive Resources</h6>
                  </div>
                  <div className="floating-card">
                    <FaPlay className="card-icon" />
                    <h6>Interactive Learning</h6>
                  </div>
                  <div className="floating-card">
                    <FaChartLine className="card-icon" />
                    <h6>Progress Tracking</h6>
                  </div>
                  <div className="floating-card">
                    <FaChartLine className="card-icon" />
                    <h6>Mock Papers</h6>
                  </div>
                  <div className="floating-card">
                    <FaChartLine className="card-icon" />
                    <h6>Past Paper Discussion</h6>
                  </div>
                  <div className="floating-card">
                    <FaUsers className="card-icon" />
                    <h6>Personal Mentoring</h6>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* About Soul ADC */}
      <section className="about-section container py-5">
        <h2 className="section-title">
          About <span className="highlight">Soul ADC</span>
        </h2>

        <p>
          <strong>Soul ADC</strong> is a comprehensive learning platform designed to help dentists from around
          the world prepare confidently for the <strong>Australian Dental Council (ADC) Part 1 Examination.</strong>
        </p>

        <p>
          Our goal is to make your preparation journey structured, engaging, and concept-driven —
          so that you don’t just pass, but truly <strong>understand</strong> and <strong>master</strong> every subject.
        </p>

        <p>
          Led by <strong>Dr. Chidambra Makker</strong>, who cleared the ADC Part 1 on her first attempt and has
          hands-on experience across multiple roles in Australian dental practice, Soul ADC provides both
          <strong> academic excellence</strong> and <strong> practical insight.</strong>
        </p>

        <ul className="about-list mt-4">
          <li>
            <strong>Subject-wise mentor videos</strong> explaining concepts through pictures, videos, and concise notes.
          </li>
          <li>
            <strong>Comprehensive resources</strong> including research papers, reference books, and structured Therapeutic Guidelines sessions.
          </li>
          <li>
            <strong>Weekly live interactive classes</strong> focusing on past papers and the official ADC question bank.
          </li>
          <li>
            <strong>Odell case discussions</strong> organized subject-wise in weekly modules.
          </li>
          <li>
            <strong>Free mock exams and progress tracking</strong> to monitor your growth.
          </li>
          <li>
            <strong>Dedicated study group and personalized feedback</strong> for continuous support.
          </li>
        </ul>

        <p className="mt-4">
          Our teaching approach combines <strong>visual, auditory, and reading-based methods</strong>, ensuring that every
          learner benefits — regardless of their preferred learning style. Soul ADC believes that every candidate has
          potential; all they need is the right direction, clear concepts, and consistent guidance to succeed.
        </p>
      </section>

      {/* ADC Assessment Process */}
      <section id="adc-process" className="adc-process-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="adc-main-title">
              ADC Assessment
            </h2>
            <h2 className="adc-main-title-highlight">
              Process
            </h2>
            <p className="adc-description mx-auto mt-4">
              The Australian Dental Council ensures overseas-qualified practitioners have the<br />
              competence to safely practise in Australia through a three-step journey.
            </p>
          </div>

          {/* Steps Section */}
          <div className="adc-steps-container">
            {/* Step 1 */}
            <div className="adc-step-wrapper">
              <div className="adc-step-number">1</div>
              <div className="adc-step-card">
                <div className="adc-icon-box blue-gradient">
                  <i className="bi bi-clipboard-check"></i>
                </div>
                <h5 className="adc-step-title">Initial Assessment</h5>
                <p className="adc-step-description">
                  Verification of your academic credentials and professional background to confirm eligibility.
                </p>
              </div>
            </div>

            {/* Connecting Line */}
            <div className="adc-connector-line"></div>

            {/* Step 2 */}
            <div className="adc-step-wrapper">
              <div className="adc-step-number">2</div>
              <div className="adc-step-card highlighted">
                <div className="adc-icon-box orange-gradient">
                  <i className="bi bi-journal-text"></i>
                </div>
                <h5 className="adc-step-title">Written Examination</h5>
                <p className="adc-step-description">
                  A comprehensive test of theoretical and clinical dental science knowledge.
                </p>
                <div className="adc-additional-info">
                  The exam covers all major dental disciplines including oral medicine, oral surgery, orthodontics, and more.
                </div>
              </div>
            </div>

            {/* Connecting Line */}
            <div className="adc-connector-line"></div>

            {/* Step 3 */}
            <div className="adc-step-wrapper">
              <div className="adc-step-number">3</div>
              <div className="adc-step-card">
                <div className="adc-icon-box green-gradient">
                  <i className="bi bi-person-check"></i>
                </div>
                <h5 className="adc-step-title">Practical Examination</h5>
                <p className="adc-step-description">
                  Evaluation of hands-on clinical and technical skills in simulated dental practice settings.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Text and Button */}
          <div className="text-center mt-5">
            <p className="adc-footer-text">
              We at <span className="highlight-text">Soul ADC</span> assist you in your written examination
            </p>

            <a
              href="https://www.adc.org.au/files/assessment/handbooks/ADC_Assessment_Process_New.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="adc-pdf-button"
            >
              View Official Process PDF
              <i className="bi bi-box-arrow-up-right ms-2"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="promise-section py-5">
        <div className="container">
          <h2 className="section-title text-black">Our Promise</h2>
          <p className="text-black mt-3">
            At Soul ADC, we are dedicated to making your ADC journey less overwhelming and more structured.
            Every concept is taught with clarity and purpose — helping you connect theory to real-world dental practice.
            Our goal is not just to help you pass, but to prepare you to become a confident and successful dentist in
            Australia or New Zealand.
          </p>

          <div className="why-souladc mt-4">
            <h3 className="fw-bold mb-3">Why Soul ADC?</h3>
            <ul>
              <li>Concept-based, not rote-based learning.</li>
              <li>Visual, auditory, and reading-based learning for better understanding.</li>
              <li>Mentor who has personally cleared the ADC exam.</li>
              <li>Live past paper discussions.</li>
              <li>Structured weekly learning plan with continuous support.</li>
              <li>Access from anywhere in the world.</li>
              <li>Access to study group.</li>
              <li>Track your progress and take free mock exams.</li>
              <li>Personalized responses to all your queries.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* About Mentor */}
      <section className="mentor-section container py-5">
        <h2 className="section-title">
          About <span className="highlight">Our Mentor</span>
        </h2>
        <p>
          <strong>Dr. Chidambra Makker (Dr. Chi)</strong> — with a Bachelor of Dental Surgery and an MBA in Hospital
          Management, Dr. Chidambra cleared her ADC Part 1 on her first attempt. In Australia, she has worked as a
          Practice Manager, Case Manager in Workers’ Compensation, Dental Assistant, and Receptionist — gaining a
          thorough understanding of the healthcare system, particularly in dentistry.
        </p>
        <p>
          Having attempted the ADC Part 2 exam as well, she possesses strong conceptual knowledge and practical insights.
          Based in Australia, she recognized a gap in the ADC preparation offered by various institutions. This inspired
          her to mentor candidates who are either struggling or preparing for the exam for the first time.
        </p>
        <p>
          She believes in making learning engaging and concept-driven, helping candidates not just pass the ADC exams by
          chance, but succeed through true understanding — paving the way to becoming confident, competent dentists in
          Australia and New Zealand.
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default About;
