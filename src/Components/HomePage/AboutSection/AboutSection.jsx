import React from 'react';
import './About.css'; // This line imports the stylesheet

const About = () => {
  // Card data to avoid repetition in JSX
  const features = [
    {
      icon: 'fa-solid fa-user-doctor',
      title: 'Expert Mentorship',
      description: 'Learn from ADC-qualified professionals who understand the examination inside out',
    },
    {
      icon: 'fa-solid fa-book-open',
      title: 'Comprehensive Curriculum',
      description: 'Complete Part 1 ADC preparation covering all essential topics and concepts',
    },
    {
      icon: 'fa-solid fa-bullseye',
      title: 'Focused Approach',
      description: 'Exclusively designed for Part 1 ADC with targeted 5-month intensive program',
    },
    {
      icon: 'fa-solid fa-users',
      title: 'Responsible Development',
      description: 'Building knowledgeable and responsible future Australian dentists',
    },
  ];

  return (
    <section className="mission-section">
      <div className="container">
        {/* Top Section: Button, Heading, and Sub-heading */}
        <button className="btn btn-mission">About Our Mission</button>
        <h1 className="main-heading">
          Empowering Future <span className="highlight">Australian Dentists</span>
        </h1>
        <p className="sub-heading">
          Discover expert guidance via our mentor/founder who have successfully cleared the Australian Dental Council (ADC) Examination. Gain a clear understanding of the concepts required by the ADC and master the knowledge you need to succeed in the exam.
        </p>

        {/* Bottom Section: Feature Cards Grid */}
        <div className="row justify-content-center">
          {features.map((feature, index) => (
            <div key={index} className="col-lg-3 col-md-3 mb-4 d-flex align-items-stretch">
              <div className="feature-card">
                <div className="icon-container">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
