import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useNavigate, useParams } from "react-router-dom";
import { getCourses, updateCourse, getPresignUrl } from "../../Api/api";

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: null,
  });
  
  const [currentThumbnail, setCurrentThumbnail] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch course data on mount
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await getCourses(courseId);
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: data.price || "",
          thumbnail: null,
        });
        setCurrentThumbnail(data.thumbnail || "");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching course:", error);
        alert("Failed to fetch course details");
        navigate("/admin/courses");
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, navigate]);

  // Handle input changes
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let thumbnailKey = currentThumbnail;

      // Upload new thumbnail if provided
      if (form.thumbnail) {
        thumbnailKey = await uploadThumbnail(form.thumbnail);
      }

      // Update course
      const updateData = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        thumbnail: thumbnailKey,
      };

      await updateCourse(courseId, updateData);
      
      alert("✅ Course updated successfully!");
      navigate("/admin/courses");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course: " + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold" style={{ color: "#5A3825" }}>
          Edit Course
        </h3>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/admin/courses")}
        >
          ← Back to Courses
        </button>
      </div>

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
            disabled={updating}
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
            rows="4"
            disabled={updating}
          />
        </div>

        {/* Price */}
        <div className="mb-3">
          <label className="form-label">Price ($)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="form-control"
            required
            min="0"
            step="0.01"
            disabled={updating}
          />
        </div>

        {/* Current Thumbnail */}
        {currentThumbnail && !preview && (
          <div className="mb-3">
            <label className="form-label">Current Thumbnail</label>
            <div>
              <img
                src={`${import.meta.env.VITE_API_URL || "http://localhost:7001/api"}/stream/${currentThumbnail}`}
                alt="Current Thumbnail"
                style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* New Thumbnail Upload */}
        <div className="mb-3">
          <label className="form-label">
            {currentThumbnail ? "Update Thumbnail" : "Course Thumbnail"}
          </label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="form-control"
            onChange={handleChange}
            disabled={updating}
          />
          <div className="form-text">
            Leave empty to keep current thumbnail
          </div>

          {preview && (
            <div className="mt-2">
              <img
                src={preview}
                alt="New Thumbnail Preview"
                style={{ maxWidth: "200px", maxHeight: "150px", borderRadius: "8px" }}
              />
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={updating}
          >
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              "Update Course"
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/courses")}
            disabled={updating}
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default EditCourse;