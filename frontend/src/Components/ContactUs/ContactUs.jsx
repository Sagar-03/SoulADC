import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import "./ContactUs.css";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/footer";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("Sending...");

    const serviceID = "service_kw8mqns";
    const templateID = "template_ce6gtuw";
    const publicKey = "xXOG9jc06N07BbFdD";

    const templateParams = {
      from_name: `${formData.firstName} ${formData.lastName}`,
      from_email: formData.email,
      from_phone: formData.phone,
      message: formData.message,
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey).then(
      () => {
        setStatus("✅ Message sent successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          message: "",
        });
      },
      (error) => {
        console.error("FAILED...", error);
        setStatus("❌ Failed to send message. Try again later.");
      }
    );
  };

  return (
    <>
        < Navbar /> 
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-content">
          <div className="contact-text">
            <h2 className="contact-title">Have any queries?</h2>
            <p className="contact-subtitle">
              Drop us a message below, and our team will get back to you shortly.
            </p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email ID"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <textarea
              name="message"
              rows="5"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>

            <button type="submit" className="contact-button">
              Submit
            </button>

            {status && <p className="form-status">{status}</p>}
          </form>
        </div>
      </div>
    </div>
    < Footer />
    </>
  );
};

export default ContactUs;
