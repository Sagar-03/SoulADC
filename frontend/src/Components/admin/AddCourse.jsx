import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";

const AddCourse = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMonths: "",
    weeks: "",
    price: "",
    thumbnail: null,
  });

  const [preview, setPreview] = useState(null);
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


  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Build FormData for file + text fields
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("durationMonths", form.durationMonths);
      formData.append("weeks", form.weeks);
      formData.append("price", form.price);
      if (form.thumbnail) {
        formData.append("thumbnail", form.thumbnail);
      }

      // Call centralized API
      const { data } = await createCourse(formData);

      alert(`✅ Course "${form.title}" created successfully!`);
      navigate(`/admin/courses/${data._id}/manage`);
    } catch (err) {
      console.error("Error creating course:", err);
      alert(err.response?.data?.error || err.message);
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
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Total Weeks</label>
            <input
              type="number"
              name="weeks"
              value={form.weeks}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="form-control"
            required
          />
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

        <button type="submit" className="btn btn-success">
          Create Course
        </button>
      </form>
    </AdminLayout>
  );
};

export default AddCourse;
