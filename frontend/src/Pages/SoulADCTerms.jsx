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
              The services provided by <strong>SoulADC</strong> are subject to the following Terms of Use ("TOU"). SoulADC reserves the right to modify or update the TOU at any time without notice to you. Any such modifications, additions, or deletions shall be effective immediately without notice thereof.
            </p>
            <p className="terms-note">
              * For applicants that register in the middle of the course or in less than 2 weeks prior to the course start date, please note that SoulADC may not have the course materials available for the first day of class.
                You will be responsible for your own pace of completing your content
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">COPYRIGHTS</h2>
            <p>
              All course materials are solely for the personal use of registered course attendees. It is strictly prohibited to transmit, reproduce, sell, or distribute any course materials in any form or by any means, including but not limited to photocopying, recording, or other electronic or mechanical methods, without the prior written consent of SoulADC Management.
            </p>
            <p>
              SoulADC grants you a limited, revocable, non-exclusive, non-transferable ability to access and/or use the program materials for your personal non-commercial use. You agree that you may not use any of the materials (course booklets, mock examinations, course handouts, videos, or virtual postings) in any manner, or for any purpose other than as expressly permitted by this Agreement. In particular, you may not:
            </p>
            <ul className="terms-list">
              <li>Create derivative work of any of the materials provided to you during your enrollment at SoulADC; and,</li>
              <li>Resell or reproduce in any way any of the materials provided to you by SoulADC.</li>
            </ul>
            <p>
              I hereby declare that the information provided in this form is accurate to the best of my knowledge. I confirm that by signing this form, I am financially committed to the entire amount indicated above, in section (2), whether the full amount is paid on the registration date or not. If the course is canceled by SoulADC, I understand that a replacement course will be offered, or will be reimbursed as a prorated refund. I further acknowledge that I have read and agreed with the terms and conditions associated with this enrollment as well as the terms and conditions listed below.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">CONFLICT OF INTEREST AND NON-COMPETITION</h2>
            <p>
              SoulADC adheres to a strict standard with regards to conflict of interest. SoulADC reserves the right to deny service on the basis of conflict of interest, such as affiliation directly or indirectly with entities deemed to be in conflict with SoulADC’s goals and objectives.
            </p>
            <ul className="terms-list">
              <li>
                Upon registration, candidates agree to not be directly or indirectly working with or associated with competing entities in a for-profit or not-for-profit manner. Examples of indirect affiliation include a spouse working for a competing entity.
              </li>
              <li>
                Candidates also agree to not affiliate, directly or indirectly, with activities or entities in competition with SoulADC for up to two years after the conclusion of services.
              </li>
              <li>
                Violation of conflict-of-interest and non-competition clauses will result in immediate denial or termination of service with no refund.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">NO UNLAWFUL OR PROHIBITED USE</h2>
            <p>
              As a condition of your use of the Services (“Services”), you must not use the Services for any purpose that is unlawful or prohibited by these terms, conditions, and notices. You must not use the Services in any manner that could damage, disable, overburden, or impair any SoulADC equipment or property. You must not attempt to gain unauthorized access to any Services, or attempt to obtain any materials or information through any means not intentionally made available through the Services or SoulADC staff.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">ELECTRONIC COMMUNICATIONS</h2>
            <p>
              Email is the primary form of communication for SoulADC services, and you are responsible to check your email address consistently to not miss course updates or answer to your queries. By enrolling in SoulADC’s services, you subscribe and agree to receive email communication, announcements, and/or updates pertaining to the course, other relevant courses, SoulADC’s service offerings, and/or exam process communications.
            </p>
            <p>
              You may choose to opt out of receiving non-course related email communications at any time by using the unsubscribe button in the email or contacting our office directly.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">USE OF SERVICES</h2>
            <p>
              Upon registration and complete payment of course fees, you are entitled to attendance of all offered sessions of the course. </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">PRIVACY NOTICE</h2>
            <p>
              SoulADC utilizes your personal information for the provision of products and services to you as well as for the purposes of managing business operations. By registering, you consent to SoulADC occasionally publishing, reproducing, digitalizing, displaying, and otherwise using your name, image, likeness, voice, and recordings for advertising or promotional purposes without further consent or payment.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">FINAL DECLARATION</h2>
            <p>
              By registering in SoulADC ADC exams-training courses, I declare that I am an Australian dental equivalency candidate registered/registering with the ADC as an equivalency applicant and am registering in these courses for the sole purpose of training in order to pass the ADC exams.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
