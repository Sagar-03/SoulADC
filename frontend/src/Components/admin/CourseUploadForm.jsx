import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

const CourseUploadForm = () => {
  const [form, setForm] = useState({
    course: "5 Month Course",
    week: "",
    day: "",
    video: null,
    document: null,
  });

  // Hardcoded courses with weeks & days
  const courses = {
    "5 Month Course": 20,
    "10 Month Course": 40,
  };

  const days = [1, 2, 3, 4, 5, 6, 7]; // one week = 7 days

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Hardcoded simulation
    console.log("Uploading content:", form);

    alert(
      `✅ Uploaded to ${form.course} → Week ${form.week} → Day ${form.day}`
    );

    // Reset form
    setForm({ course: "5 Month Course", week: "", day: "", video: null, document: null });

    /** -------------------------------------------------
     * Backend Code (Uncomment later)
     ---------------------------------------------------
     const formData = new FormData();
     formData.append("course", form.course);
     formData.append("week", form.week);
     formData.append("day", form.day);
     if (form.video) formData.append("video", form.video);
     if (form.document) formData.append("document", form.document);

     fetch("http://localhost:5000/api/admin/upload", {
       method: "POST",
       body: formData,
     })
       .then((res) => res.json())
       .then((data) => console.log("Uploaded:", data))
       .catch((err) => console.error("Error:", err));
     */
  };

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Upload Course Content
      </h3>

      <form
        onSubmit={handleSubmit}
        className="card shadow-sm p-4"
        style={{ borderRadius: "12px" }}
      >
        {/* Select Course */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Course</label>
          <select
            className="form-select"
            name="course"
            value={form.course}
            onChange={handleChange}
            required
          >
            {Object.keys(courses).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Select Week */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Week</label>
          <select
            className="form-select"
            name="week"
            value={form.week}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Week --</option>
            {Array.from(
              { length: courses[form.course] },
              (_, i) => i + 1
            ).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>

        {/* Select Day */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Day</label>
          <select
            className="form-select"
            name="day"
            value={form.day}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Day --</option>
            {days.map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Video */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Upload Video</label>
          <input
            type="file"
            accept="video/*"
            className="form-control"
            name="video"
            onChange={handleChange}
          />
        </div>

        {/* Upload Document */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Upload Document</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="form-control"
            name="document"
            onChange={handleChange}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary mt-3"
          style={{ backgroundColor: "#8B5E3C", border: "none" }}
        >
          Save Content
        </button>
      </form>
    </AdminLayout>
  );
};

export default CourseUploadForm;
