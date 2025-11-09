import React from 'react';
import './MentorCard.css';
import MentorImage from '../../../assets/Mentor.jpeg'
import { WiDayThunderstorm } from 'react-icons/wi';
import { Link } from "react-router-dom";


const MentorCard = () => {
  return (
    <div className="mentor-wrapper">
      <div className="mentor-card">
        {/* Left Side */}
        <div className="mentor-left">
          <h2 className="mentor-title">About Our Founder</h2>

          <div className="mentor-commitment">
            <h2 className="commitment-title">Dr. Chidambra Makker (Dr. Chi)
            </h2>
            <p className="commitment-description">
              With a Bachelor of Dental Surgery and an MBA in Hospital Management, Dr. Chidambra cleared her ADC Part 1 on her first attempt. In Australia, she has worked as a Practice Manager, Case Manager in Workers’ Compensation, Dental Assistant, and Receptionist — gaining a thorough understanding of the healthcare system, particularly in dentistry.
            </p>
            <p className="commitment-description">
              Having attempted the ADC Part 2 exam as well, she possesses strong conceptual knowledge and practical insights. Based in Australia, she recognised a gap in the ADC preparation offered by various institutions. This inspired her to mentor candidates who are either struggling or preparing for the exam for the first time.
            </p>
            <p className="commitment-description">
              She believes in making learning engaging and concept-driven, helping candidates not just pass the ADC exams by chance, but succeed through true understanding — paving the way to becoming confident, competent dentists in Australia and New Zealand.
            </p>

            {/* <ul className="commitment-list">
              <li>Personalized learning paths tailored to your needs</li>
              <li>Regular assessments and progress tracking</li>
              <li>Continuous support throughout your journey</li>
            </ul> */}
            <button
              as={Link}
              to="/courses"   
              variant="dark"
              className="mentor-button">
              Start Your Preparation Today
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="mentor-right">
          <img
            src={MentorImage}
            alt="Mentor"
            className="mentor-image"
          />
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
