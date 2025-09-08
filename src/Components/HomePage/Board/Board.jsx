import React from 'react';
import './Board.css'; // external CSS file

const Board = () => {
  return (
    <div className="cta-body">
      <div className="container">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Start Your ADC Journey?</h2>
          <p className="cta-subtitle">
            Join hundreds of successful students who have cleared their ADC Part 1 with our expert guidance.
          </p>
          <div>
            <button className="cta-button">Enroll Now</button>
            <button className="cta-button">Download Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
