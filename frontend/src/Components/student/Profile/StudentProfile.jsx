import React, { useState, useEffect } from "react";
import { getUser } from "../../../utils/auth";
import StudentLayout from "../StudentLayout";
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import "./StudentProfile.css";

const StudentProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Here you can add API call to update user profile
    console.log("Saving profile data:", formData);
    setIsEditing(false);
    // You might want to update the user data in cookies/state here
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <StudentLayout>
        <div className="loading-container">
          <div className="spinner-border" style={{ color: "#8B5E3C" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container-fluid profile-container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card profile-card fade-in">
              <div className="card-body p-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="card-title mb-0" style={{ color: "#8B5E3C", fontWeight: "600" }}>
                    <FaUser className="me-2" />
                    My Profile
                  </h2>
                  {!isEditing ? (
                    <button
                      className="btn profile-btn profile-btn-primary btn-sm d-flex align-items-center"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaEdit className="me-1" />
                      Edit
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn profile-btn profile-btn-success btn-sm d-flex align-items-center"
                        onClick={handleSave}
                      >
                        <FaSave className="me-1" />
                        Save
                      </button>
                      <button
                        className="btn profile-btn profile-btn-secondary btn-sm d-flex align-items-center"
                        onClick={handleCancel}
                      >
                        <FaTimes className="me-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Content */}
                <div className="row">
                  <div className="col-12">
                    {/* Profile Avatar */}
                    <div className="text-center mb-4">
                      <div className="rounded-circle profile-avatar d-inline-flex align-items-center justify-content-center text-white">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-4">
                      {/* Name Field */}
                      <div className="mb-4">
                        <label className="profile-label">
                          <FaUser className="profile-icon" />
                          Full Name
                        </label>
                        {isEditing ? (
                          <div className="profile-field">
                            <input
                              type="text"
                              className="profile-input w-100"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                            />
                          </div>
                        ) : (
                          <div className="profile-field">
                            {user.name || "Not provided"}
                          </div>
                        )}
                      </div>

                      {/* Email Field */}
                      <div className="mb-4">
                        <label className="profile-label">
                          <FaEnvelope className="profile-icon" />
                          Email Address
                        </label>
                        {isEditing ? (
                          <div className="profile-field">
                            <input
                              type="email"
                              className="profile-input w-100"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="Enter your email address"
                            />
                          </div>
                        ) : (
                          <div className="profile-field">
                            {user.email || "Not provided"}
                          </div>
                        )}
                      </div>

                      {/* Phone Field */}
                      {/* <div className="mb-4">
                        <label className="profile-label">
                          <FaPhone className="profile-icon" />
                          Phone Number
                        </label>
                        {isEditing ? (
                          <div className="profile-field">
                            <input
                              type="tel"
                              className="profile-input w-100"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        ) : (
                          <div className="profile-field">
                            {user.phone || "Not provided"}
                          </div>
                        )}
                      </div> */}

                      {/* Additional Info */}
                      <div className="mb-4">
                        <label className="profile-label">
                          Account Type
                        </label>
                        <div className="profile-field">
                          <span className="badge bg-success profile-badge">Student</span>
                        </div>
                      </div>

                      {/* Course Information */}
                      {/* {user.purchasedCourses && user.purchasedCourses.length > 0 && (
                        <div className="mb-4">
                          <label className="profile-label">
                            Enrolled Courses
                          </label>
                          <div className="profile-field">
                            <span className="badge bg-primary profile-badge me-2">
                              {user.purchasedCourses.length} Course(s) Enrolled
                            </span>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;