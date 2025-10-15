import React from "react";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/footer";
import "./Terms.css";

export default function SoulADCTerms() {
  return (
    <>
      <Navbar />
      <div className="terms-container">
        <div className="terms-wrapper">
          <h1 className="terms-heading">SoulADC Terms and Conditions</h1>

          <section className="terms-section">
            <p className="terms-intro">
              The services provided by <strong>SoulADC</strong> are subject to the following Terms of Use ("TOU"). SoulADC reserves the right to modify or update the TOU at any time without prior notice. Any such modifications, additions, or deletions shall be effective immediately upon posting on the official SoulADC platform.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">1. COURSE REGISTRATION</h2>
            <p>
              Applicants who register in the middle of a course or less than two (2) weeks prior to the course start date will be provided with the course materials; however, access to some previously conducted live sessions may not be available.
            </p>
            <p>
              Candidates are responsible for managing their own pace to complete any missed content.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">2. COPYRIGHTS AND NON-DISCLOSURE BY THE CANDIDATE</h2>
            <p>
              All course materials are solely for the personal use of registered course attendees. It is strictly prohibited to transmit, reproduce, sell, share, or distribute any course materials in any form or by any means, including but not limited to photocopying, recording, or other electronic or mechanical methods, without the prior written consent of SoulADC Management.
            </p>
            <p>
              SoulADC grants candidates a limited, revocable, non-exclusive, and non-transferable license to access and use the program materials for personal, non-commercial use only. Candidates agree not to use any materials (course booklets, mock examinations, course handouts, videos, or virtual postings) in any manner or for any purpose other than as expressly permitted by this Agreement.
            </p>
            <ul className="terms-list">
              <li>Create derivative works of any of the materials provided during their enrollment at SoulADC; or</li>
              <li>Resell, share, or reproduce in any way any materials provided by SoulADC.</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">3. FINANCIAL COMMITMENT AND DECLARATION</h2>
            <p>
              By submitting the enrollment form, the candidate declares that the information provided is accurate to the best of their knowledge. The candidate confirms full financial commitment to the total course fee amount indicated by SoulADC, regardless of whether the full amount is paid at the time of registration.
            </p>
            <p>
              If a course is canceled by SoulADC, a replacement course will be offered, or a prorated refund will be issued. The candidate confirms that they have read and agreed to all the terms and conditions associated with this enrollment, including those listed on the enrollment form and the SoulADC website.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">4. CONFLICT OF INTEREST AND NON-COMPETITION</h2>
            <p>
              SoulADC adheres to strict standards regarding conflict of interest and reserves the right to deny or discontinue service on the basis of a conflict of interest, including direct or indirect affiliation with entities deemed to be in competition with SoulADC’s goals and objectives.
            </p>
            <ul className="terms-list">
              <li>
                Upon registration, candidates agree not to be directly or indirectly employed by, associated with, or providing services to any competing entity, whether for-profit or not-for-profit.
              </li>
              <li>
                Indirect affiliation includes, but is not limited to, a spouse or partner working for a competing organization.
              </li>
              <li>
                Candidates further agree not to engage, directly or indirectly, with any competing activities or entities for up to two (2) years after the conclusion of services with SoulADC.
              </li>
              <li>
                Violation of the conflict-of-interest and non-competition clauses will result in immediate termination of services without refund.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">5. NO UNLAWFUL OR PROHIBITED USE</h2>
            <p>
              As a condition of using SoulADC’s services (“Services”), candidates agree not to use the Services for any purpose that is unlawful or prohibited by these terms, conditions, or notices. Candidates must not use the Services in any way that could damage, disable, overburden, or impair any SoulADC equipment, network, or property. Candidates must not attempt to gain unauthorized access to any Services, systems, or materials, or attempt to obtain any materials or information through means not intentionally made available by SoulADC staff.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">6. ELECTRONIC COMMUNICATIONS</h2>
            <p>
              Email is the primary mode of communication for SoulADC services. Candidates are responsible for checking their registered email regularly to ensure they do not miss course updates or responses to queries. By enrolling in SoulADC’s services, candidates agree to receive email communications, announcements, and updates related to the enrolled course, other relevant courses, SoulADC service offerings, and/or ADC examination process communications.
            </p>
            <p>
              Candidates may choose to opt out of receiving non-course-related communications at any time by using the unsubscribe link in the email or by contacting SoulADC directly.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">7. USE OF SERVICES</h2>
            <p>
              Upon registration and full payment of course fees, candidates are entitled to attend all sessions included in the enrolled course package. Access to SoulADC resources is granted solely for the duration of the enrolled course. Unauthorized sharing of login credentials or access with others is strictly prohibited.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">8. PRIVACY NOTICE</h2>
            <p>
              SoulADC collects and uses personal information for the purpose of providing educational services, managing business operations, and improving course delivery. By registering, candidates consent to SoulADC occasionally publishing, reproducing, digitizing, displaying, and otherwise using their name, image, likeness, voice, or recordings for promotional or advertising purposes without further consent or payment. SoulADC will not sell or disclose personal information to third parties except as required by law.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">9. FINAL DECLARATION</h2>
            <p>
              By registering for SoulADC’s ADC Exam Training Courses, the candidate declares that they are an Australian dental equivalency candidate registered or registering with the Australian Dental Council (ADC) as an equivalency applicant. The candidate confirms that they are enrolling solely for the purpose of training to prepare for and successfully pass the ADC examinations. Submission of the enrollment form and payment constitutes full acceptance of all the terms and conditions outlined herein.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
