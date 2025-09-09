import React from 'react';
import './MentorCard.css';
import MentorImage from '../../../assets/Mentor.jpeg'
import { WiDayThunderstorm } from 'react-icons/wi';

const MentorCard = () => {
  return (
    <div className="mentor-wrapper">
      <div className="mentor-card">
        {/* Left Side */}
        <div className="mentor-left">
          <h2 className="mentor-title">About Mentor</h2>

          <div className="mentor-commitment">
            <h2 className="commitment-title">Our Commitment to Your Success</h2>
            <p className="commitment-description">
              We believe in providing guidance to those who believe in becoming responsible and knowledgeable Australian Dentists. Our comprehensive approach ensures you're not just prepared for the exam, but equipped for a successful dental career in Australia.
            </p>
            <ul className="commitment-list">
              <li>Personalized learning paths tailored to your needs</li>
              <li>Regular assessments and progress tracking</li>
              <li>Continuous support throughout your journey</li>
            </ul>
            <button className="mentor-button">
              Start Your Preparation Today
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="mentor-right">
          <img
            src= {MentorImage}
            alt="Mentor"
            className="mentor-image"
          
          />
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
