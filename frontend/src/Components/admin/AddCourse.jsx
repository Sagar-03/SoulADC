import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";
import { createCourse, getPresignUrl } from "../../Api/api";

const AddCourse = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMonths: "",
    weeks: "",
    price: "",
    cutPrice: "",
    thumbnail: null,
  });

  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setForm((f) => ({ ...f, [name]: file }));
      setPreview(URL.createObjectURL(file));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };


  // Upload thumbnail to S3 and get the key
  const uploadThumbnail = async (file) => {
    try {
      // Get presigned URL
      const { data: presignData } = await getPresignUrl(
        file.name,
        file.type,
        "thumbnails",
        null,
        null
      );

      // Upload to S3
      const response = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload thumbnail");
      }

      return presignData.s3Key;
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      throw error;
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let thumbnailKey = "";

      // Upload thumbnail to S3 if provided
      if (form.thumbnail) {
        thumbnailKey = await uploadThumbnail(form.thumbnail);
      }

      // Prepare course data
      const courseData = {
        title: form.title,
        description: form.description,
        durationMonths: parseInt(form.durationMonths),
        weeks: parseInt(form.weeks),
        price: parseFloat(form.price),
        cutPrice: form.cutPrice ? parseFloat(form.cutPrice) : null,
        thumbnail: thumbnailKey,
      };

      // Call API to create course
      const { data } = await createCourse(courseData);

      alert(`✅ Course "${form.title}" created successfully!`);
      navigate(`/admin/courses/${data._id}/manage`);
    } catch (err) {
      console.error("Error creating course:", err);
      alert("Failed to create course: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };



  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Add New Course
      </h3>

      <form
        onSubmit={handleSubmit}
        className="card shadow-sm p-4"
        style={{ borderRadius: "12px" }}
      >
        {/* Title */}
        <div className="mb-3">
          <label className="form-label">Course Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="form-control"
            required
            disabled={uploading}
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="form-control"
            rows="3"
            disabled={uploading}
          ></textarea>
        </div>

        {/* Duration + Weeks */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Duration (Months)</label>
            <input
              type="number"
              name="durationMonths"
              value={form.durationMonths}
              onChange={handleChange}
              className="form-control"
              required
              disabled={uploading}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Total Modules</label>
            <input
              type="number"
              name="weeks"
              value={form.weeks}
              onChange={handleChange}
              className="form-control"
              required
              disabled={uploading}
            />
          </div>
        </div>

        {/* Price Section */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Actual Price ($)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="form-control"
              required
              disabled={uploading}
              placeholder="Enter the actual selling price"
            />
            <div className="form-text">This is the price customers will pay</div>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Cut Price ($) - Optional</label>
            <input
              type="number"
              name="cutPrice"
              value={form.cutPrice}
              onChange={handleChange}
              className="form-control"
              disabled={uploading}
              placeholder="Enter original price to show discount"
            />
            <div className="form-text">Original price to show as strikethrough</div>
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className="mb-3">
          <label className="form-label">Course Thumbnail</label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="form-control"
            onChange={handleChange}
            disabled={uploading}
          />

          {preview && (
            <div className="mt-2">
              <img
                src={preview}
                alt="Thumbnail Preview"
                style={{ maxWidth: "200px", borderRadius: "8px" }}
              />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-success"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Course...
            </>
          ) : (
            "Create Course"
          )}
        </button>
      </form>
    </AdminLayout>
  );
};

export default AddCourse;
