import React from 'react';
import "./Coursecurriculum.css";  // Import the external CSS file

const CourseCurriculum = () => {
  const curriculumData = [
    {
      weeks: 'Weeks 1-4',
      title: 'Foundation & Basic Sciences',
      subjects: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology']
    },
    {
      weeks: 'Weeks 5-8',
      title: 'Clinical Dentistry Fundamentals',
      subjects: ['Oral Medicine', 'Periodontics', 'Endodontics', 'Oral Surgery']
    },
    {
      weeks: 'Weeks 9-12',
      title: 'Restorative & Prosthetics',
      subjects: ['Operative Dentistry', 'Prosthodontics', 'Dental Materials', 'Occlusion']
    },
    {
      weeks: 'Weeks 13-16',
      title: 'Specialized Areas',
      subjects: ['Pediatric Dentistry', 'Orthodontics', 'Oral Radiology', 'Ethics']
    },
    {
      weeks: 'Weeks 17-20',
      title: 'Exam Preparation & Review',
      subjects: ['Mock Tests', 'Case Studies', 'Final Review', 'Exam Strategy']
    }
  ];

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
      fill="currentColor" className="bi bi-check-circle-fill me-2"
      viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 
      0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 
      0 0 0-1.06 1.06L6.97 11.03a.75.75 
      0 0 0 1.079-.02l3.992-4.99a.75.75 
      0 0 0-.01-1.05z"/>
    </svg>
  );

  return (
    <div className="container py-5 curriculum-container">
      <h2 className="text-center mb-5 curriculum-title">Course Curriculum</h2>
      {curriculumData.map((section, index) => (
        <div className="curriculum-card" key={index}>
          <div className="d-flex align-items-center">
            <div className="week-badge">{index + 1}</div>
            <div>
              <p className="card-subtitle-section">{section.weeks}</p>
              <h3 className="card-title-section">{section.title}</h3>
            </div>
          </div>
          <div className="row subjects-grid">
            {section.subjects.map((subject, sIndex) => (
              <div className="col-md-3 col-sm-6 mb-3" key={sIndex}>
                <div className="subject-item">
                  <CheckIcon />
                  <span>{subject}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseCurriculum;
