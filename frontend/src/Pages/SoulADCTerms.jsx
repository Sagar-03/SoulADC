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
              The services provided by <strong>SoulADC</strong> are subject to the
              following Terms of Use ("TOU"). SoulADC reserves the right to
              modify or update these terms at any time without prior notice.
              Any such modifications, additions, or deletions shall be
              effective immediately upon posting on the official SoulADC
              platform.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">1. COURSE REGISTRATION</h2>
            <p>
              Applicants who register with SoulADC within the stipulated time
              will be provided with all course materials based on their selected
              module and will be able to attend all introductory classes from
              the beginning.
            </p>
            <p>
              Students enrolling in an ongoing course will also receive all
              module-based course materials; however, access to some previously
              conducted live sessions may not be available. Such candidates are
              responsible for managing their own pace to complete any missed
              content.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">
              2. COPYRIGHTS AND NON-DISCLOSURE BY THE CANDIDATE
            </h2>
            <p>
              All course materials are solely for the personal use of registered
              course attendees. It is strictly prohibited to transmit,
              reproduce, sell, share, or distribute any course materials in any
              form or by any means, including but not limited to photocopying,
              recording, or other electronic or mechanical methods, without the
              prior written consent of SoulADC Management.
            </p>
            <p>
              SoulADC grants candidates a limited, revocable, non-exclusive, and
              non-transferable license to access and use the program materials
              for personal, non-commercial use only. Candidates agree not to use
              any materials (including course booklets, mock examinations,
              handouts, videos, or virtual content) in any manner not expressly
              permitted under this agreement.
            </p>
            <ul className="terms-list">
              <li>
                Create derivative works from any materials provided during
                enrollment at SoulADC; or
              </li>
              <li>
                Resell, share, or reproduce any materials provided by SoulADC.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">
              3. FINANCIAL COMMITMENT AND DECLARATION
            </h2>
            <p>
              By submitting the enrollment form, the candidate declares that all
              information provided is accurate to the best of their knowledge.
              The candidate confirms full financial commitment to the total
              course fee amount indicated by SoulADC, irrespective of whether
              the full amount is paid at the time of registration.
            </p>
            <p>
              In the event that a course is cancelled by SoulADC, candidates may
              be offered an alternative course where possible, or a prorated
              refund may be provided at the sole discretion of SoulADC. By
              completing enrollment, the candidate confirms that they have
              read, understood, and agreed to all applicable terms and
              conditions listed on the enrollment form and the SoulADC website.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">
              4. CONFLICT OF INTEREST AND NON-COMPETITION
            </h2>
            <p>
              SoulADC adheres to strict conflict-of-interest standards and
              reserves the right to deny or discontinue services due to direct
              or indirect affiliations with competing entities.
            </p>
            <ul className="terms-list">
              <li>
                Candidates agree not to be employed by, associated with, or
                provide services to any competing organization.
              </li>
              <li>
                Indirect affiliation includes, but is not limited to, spouses or
                partners working with competing entities.
              </li>
              <li>
                Candidates agree that during their engagement with SoulADC and
                for two (2) years thereafter, they shall not participate in any
                competing activity or organization.
              </li>
              <li>
                Any violation will result in immediate termination of services
                without refund and may result in financial liability for losses
                incurred by SoulADC, as determined by management.
              </li>
            </ul>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">
              5. NO UNLAWFUL OR PROHIBITED USE
            </h2>
            <p>
              Candidates agree not to use SoulADC services for unlawful or
              prohibited purposes. Any attempt to damage, disable, overburden,
              impair systems, or gain unauthorized access to services,
              platforms, or materials is strictly prohibited.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">6. ELECTRONIC COMMUNICATIONS</h2>
            <p>
              Email is the primary mode of communication for SoulADC services.
              Candidates are responsible for regularly checking their
              registered email for updates, notifications, and responses.
            </p>
            <p>
              Candidates consent to receiving emails related to enrolled
              courses, SoulADC services, and ADC examination communications.
              Non-course-related communications may be opted out of at any time.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">7. USE OF SERVICES</h2>
            <p>
              Upon registration and full payment of course fees, candidates are
              entitled to attend all sessions included in their selected course
              package. Access to resources is granted only for the duration of
              the enrolled course. Credential sharing is strictly prohibited.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">8. PRIVACY NOTICE</h2>
            <p>
              SoulADC collects personal information solely for educational,
              operational, and service improvement purposes. Candidates consent
              to the use of their name, image, voice, or recordings for
              promotional purposes without additional consent or compensation.
              SoulADC does not sell personal information and only discloses it
              when legally required.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-heading">9. FINAL DECLARATION</h2>
            <p>
              By enrolling in a SoulADC ADC Exam Training Course module, the
              candidate expressly agrees to be bound by all published terms and
              conditions. All enrollment fees are strictly non-refundable once
              enrollment is completed.
            </p>
            <p>
              The candidate further waives any right to initiate legal action
              against SoulADC related to course content, delivery, or services,
              to the fullest extent permitted by law. SoulADC reserves the right
              to impose financial liability for losses resulting from a
              candidate’s actions, as reasonably assessed by management.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}
