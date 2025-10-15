import React from 'react';
import "./CourseCurriculum.css";  // Import the external CSS file

const CourseCurriculum = () => {
  const curriculumData = [
    {
      weeks: 'Modules 1',
      title: 'Periodontology',
      subjects: ['Periodontology', 'TG', 'Odell Cases', 'Past Papers']
    },
    {
      weeks: 'Modules 2',
      title: 'Paediatric Dentistry and Orthodontics',
      subjects: ['Paediatric Dentistry and Orthodontics', 'TG', 'Dental Caries', 'Odell', 'Past Papers']
    },
    {
      weeks: 'Modules 3',
      title: 'Prosthodontics',
      subjects: ['Prosthodontics', 'TG', 'Odell', 'Past Papers']
    },
    {
      weeks: 'Modules 4',
      title: 'Oral Medicine and Radiology',
      subjects: ['Oral Medicine and Radiology', 'TG', 'Odell', 'Past Papers']
    },
    {
      weeks: 'Modules 5',
      title: 'Oral surgery',
      subjects: ['Oral surgery', 'TG', 'Odell', 'Past Papers']
    },
    {
      weeks: 'Modules 6',
      title: 'Operative and endodontics',
      subjects: ['Operative and endodontics', 'Odell', 'Code of Conduct', 'Past Papers']
    },
    {
      weeks: 'Modules 7',
      title: 'Infection control',
      subjects: ['Infection control', 'Health promotion ', 'TG Revision', 'Past Papers']
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
