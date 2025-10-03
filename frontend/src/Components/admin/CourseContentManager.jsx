import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useParams } from "react-router-dom";
import "./admin.css";
import { getStreamUrl, addWeek, getCourses, getPresignUrl, deleteContent, deleteWeekApi, deleteDayApi } from "../../Api/api";

const CourseContentManager = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [weekNumber, setWeekNumber] = useState("");
  const [weekTitle, setWeekTitle] = useState("");
  const [file, setFile] = useState(null);
  const [activeWeekId, setActiveWeekId] = useState(null);
  const [activeDayId, setActiveDayId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);


  const fetchCourse = async () => {
    try {
      const { data } = await getCourses(id);
      setCourse(data);
    } catch (err) {
      setError("Failed to fetch course details");
      console.error(err);
    }
  };


  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleAddWeek = async () => {
    if (!weekNumber || !weekTitle) {
      setError("Please provide both week number and title");
      return;
    }

    try {
      setError(null);
      await addWeek(id, weekNumber, weekTitle); // from api.js
      setWeekNumber("");
      setWeekTitle("");
      fetchCourse();
    } catch (err) {
      setError("Failed to add week");
      console.error(err);
    }
  };


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 100MB for videos, 10MB for documents)
      const maxSize = activeType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError(`File too large. Max size: ${activeType === "video" ? "100MB" : "10MB"}`);
        return;
      }

      // Validate file type
      const allowedTypes = activeType === "video"
        ? ["video/mp4", "video/webm", "video/mov", "video/avi"]
        : ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError(`Invalid file type. Allowed: ${activeType === "video" ? "MP4, WebM, MOV, AVI" : "PDF, DOC, DOCX"}`);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadContent = async () => {
    if (!file || !activeWeekId || !activeDayId || !activeType) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Find the active week and day to get their numbers
      const activeWeek = course.weeks.find(week => week._id === activeWeekId);
      const activeDay = activeWeek?.days.find(day => day._id === activeDayId);

      if (!activeWeek || !activeDay) {
        throw new Error("Could not find selected week or day");
      }

      console.log(`Uploading to Week ${activeWeek.weekNumber}, Day ${activeDay.dayNumber}`);

      // 1. Ask backend for presign with week and day information
      try {
        const presignRes = await getPresignUrl(
          file.name,
          file.type,
          activeType === "video" ? "videos" : "documents",
          activeWeek.weekNumber,
          activeDay.dayNumber
        );

        const { uploadUrl, key } = presignRes.data; // ✅ Axios returns data here
      } catch (err) {
        throw new Error("Failed to get upload URL: " + err.message);
      }

      // 2. Upload file to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // 3. Save metadata in DB
      try {
        const saveRes = await saveContent(activeCourseId, activeWeekId, activeDayId, {
          type: activeType,
          title: file.name.split(".")[0], // remove extension
          s3Key: key,
        });

        // Axios resolves to `data` automatically
        console.log("Content saved:", saveRes.data);
      } catch (err) {
        throw new Error("Failed to save content metadata: " + err.message);
      }


      // Reset form
      setFile(null);
      setActiveWeekId(null);
      setActiveDayId(null);
      setActiveType(null);
      setUploadProgress(0);

      // Clear file input
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');

      fetchCourse();

    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async (weekId, dayId, contentId) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      await deleteContent(id, weekId, dayId, contentId); // ✅ now this refers to the API function
      fetchCourse();
    } catch (err) {
      setError("Failed to delete content");
      console.error(err);
    }
  };

  const deleteWeek = async (weekId) => {
    const week = course.weeks.find(w => w._id === weekId);
    const totalContent = week?.days?.reduce((total, day) => total + (day.contents?.length || 0), 0) || 0;

    const confirmMessage = `Are you sure you want to delete Week ${week?.weekNumber}?\n\nThis will permanently delete:\n• All 7 days in this week\n• ${totalContent} content items (videos/documents)\n• All associated files from cloud storage\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setError(null);
      await deleteWeekApi(id, weekId); // use centralized API

      // Reset active selections if they belonged to the deleted week
      if (activeWeekId === weekId) {
        setActiveWeekId(null);
        setActiveDayId(null);
        setActiveType(null);
        setFile(null);
      }

      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      Week ${week?.weekNumber} has been successfully deleted.
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);

    } catch (err) {
      setError("Failed to delete week");
      console.error(err);
    }
  };


  const deleteDay = async (weekId, dayId) => {
    const week = course.weeks.find(w => w._id === weekId);
    const day = week?.days.find(d => d._id === dayId);
    const contentCount = day?.contents?.length || 0;

    const confirmMessage = `Are you sure you want to delete Day ${day?.dayNumber}?\n\nThis will permanently delete:\n• ${contentCount} content items (videos/documents)\n• All associated files from cloud storage\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setError(null);
      await deleteDayApi(id, weekId, dayId); // centralized API call

      // Reset active selections if they belonged to the deleted day
      if (activeWeekId === weekId && activeDayId === dayId) {
        setActiveDayId(null);
        setActiveType(null);
        setFile(null);
      }

      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      Day ${day?.dayNumber} has been successfully deleted.
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);

    } catch (err) {
      setError("Failed to delete day");
      console.error(err);
    }
  };


  const cancelUpload = () => {
    setFile(null);
    setActiveWeekId(null);
    setActiveDayId(null);
    setActiveType(null);
    setUploadProgress(0);
    setError(null);

    // Clear file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

  if (!course) return (
    <AdminLayout>
      <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="container-fluid">
        <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
          Manage "{course.title}" - Day-wise Content
        </h3>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Add Week Section */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Week (7 Days Auto-Created)
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Week Number</label>
                <input
                  type="number"
                  placeholder="e.g., 1"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(e.target.value)}
                  className="form-control"
                  min="1"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Week Title</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Anatomy"
                  value={weekTitle}
                  onChange={(e) => setWeekTitle(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  onClick={handleAddWeek}
                  className="btn btn-success w-100"
                  disabled={!weekNumber || !weekTitle}
                >
                  <i className="bi bi-plus"></i> Add Week
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Weeks */}
        {course.weeks && course.weeks.length > 0 ? (
          <div className="row">
            {course.weeks.map((week, weekIndex) => (
              <div key={week._id} className="col-12 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center week-header">
                    <h5 className="mb-0">
                      <i className="bi bi-calendar-week me-2"></i>
                      Week {week.weekNumber}: {week.title}
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark">
                        {week.days?.length || 0} days
                      </span>
                      <span className="badge bg-info text-white">
                        {week.days?.reduce((total, day) => total + (day.contents?.length || 0), 0) || 0} items
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteWeek(week._id)}
                        title="Delete Entire Week"
                      >
                        <i className="bi bi-trash"></i> Delete Week
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Days Grid */}
                    {week.days && week.days.length > 0 ? (
                      <div className="row">
                        {week.days.map((day, dayIndex) => (
                          <div key={day._id} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 border-2">
                              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 fw-bold">
                                  <i className="bi bi-calendar-day me-2"></i>
                                  Day {day.dayNumber}
                                </h6>
                                <div className="d-flex align-items-center gap-1">
                                  <span className="badge bg-secondary">
                                    {day.contents?.length || 0} items
                                  </span>
                                  <button
                                    className="btn btn-outline-danger btn-sm p-1"
                                    onClick={() => deleteDay(week._id, day._id)}
                                    title="Delete Day"
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="card-body p-3">
                                <h6 className="text-muted small mb-2">{day.title}</h6>

                                {/* Day Content */}
                                {day.contents && day.contents.length > 0 ? (
                                  <div className="mb-3">
                                    {day.contents.map((content) => (
                                      <div key={content._id} className="mb-2 p-2 border rounded">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <small className="fw-semibold">
                                            <i className={`bi ${content.type === 'video' ? 'bi-play-circle text-primary' : 'bi-file-earmark-pdf text-info'} me-1`}></i>
                                            x        {content.title}
                                          </small>
                                          <button
                                            className="btn btn-danger btn-sm p-1"
                                            style={{ fontSize: "0.7rem" }}
                                            onClick={() => handleDeleteContent(week._id, day._id, content._id)}
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>

                                        {/* Content Preview */}
                                        {content.type === "video" && (
                                          <video
                                            src={getStreamUrl(content.s3Key)}
                                            controls
                                            className="w-100"
                                            style={{ maxHeight: "120px", fontSize: "0.8rem" }}
                                            preload="metadata"
                                          />
                                        )}

                                        {content.type === "pdf" && (
                                          <a
                                            href={getStreamUrl(content.s3Key)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-info btn-sm w-100"
                                            style={{ fontSize: "0.7rem" }}
                                          >
                                            <i className="bi bi-eye me-1"></i>
                                            View PDF
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted small mb-3">No content yet</p>
                                )}

                                {/* Upload Section for Each Day */}
                                <div className="border-top pt-2">
                                  <small className="text-muted d-block mb-2">Add content:</small>

                                  {/* Upload Type Buttons */}
                                  <div className="d-flex gap-1 mb-2">
                                    <button
                                      className={`btn btn-sm ${activeWeekId === week._id && activeDayId === day._id && activeType === "video" ? "btn-primary" : "btn-outline-primary"}`}
                                      onClick={() => {
                                        setActiveWeekId(week._id);
                                        setActiveDayId(day._id);
                                        setActiveType("video");
                                        setFile(null);
                                        setError(null);
                                      }}
                                      disabled={uploading}
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      <i className="bi bi-camera-video me-1"></i>
                                      Video
                                    </button>
                                    <button
                                      className={`btn btn-sm ${activeWeekId === week._id && activeDayId === day._id && activeType === "pdf" ? "btn-info" : "btn-outline-info"}`}
                                      onClick={() => {
                                        setActiveWeekId(week._id);
                                        setActiveDayId(day._id);
                                        setActiveType("pdf");
                                        setFile(null);
                                        setError(null);
                                      }}
                                      disabled={uploading}
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      <i className="bi bi-file-earmark-pdf me-1"></i>
                                      Doc
                                    </button>
                                  </div>

                                  {/* File Input (only show for active day) */}
                                  {activeWeekId === week._id && activeDayId === day._id && activeType && (
                                    <div className="mb-2">
                                      <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="form-control form-control-sm"
                                        accept={activeType === "video" ? "video/*" : ".pdf,.doc,.docx"}
                                        disabled={uploading}
                                        style={{ fontSize: "0.7rem" }}
                                      />
                                      <div className="form-text" style={{ fontSize: "0.6rem" }}>
                                        {activeType === "video"
                                          ? "MP4, WebM (Max: 100MB)"
                                          : "PDF, DOC (Max: 10MB)"
                                        }
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <i className="bi bi-calendar-x display-6 text-muted"></i>
                        <p className="text-muted mt-2">No days configured for this week</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x display-1 text-muted"></i>
            <h5 className="text-muted mt-3">No weeks added yet</h5>
            <p className="text-muted">Start by adding your first week above.</p>
          </div>
        )}

        {/* Upload Confirmation Modal */}
        {file && activeWeekId && activeDayId && activeType && (
          <div className="card border-success mt-4">
            <div className="card-header bg-success text-white">
              <h6 className="mb-0">
                <i className="bi bi-cloud-upload me-2"></i>
                Ready to Upload to Day {course.weeks.find(w => w._id === activeWeekId)?.days.find(d => d._id === activeDayId)?.dayNumber}
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>File:</strong> {file.name}<br />
                  <strong>Type:</strong> <span className="text-capitalize">{activeType}</span><br />
                  <strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB<br />
                  <strong>Week:</strong> {course.weeks.find(w => w._id === activeWeekId)?.weekNumber} - Day {course.weeks.find(w => w._id === activeWeekId)?.days.find(d => d._id === activeDayId)?.dayNumber}
                </div>
                <div>
                  <i className={`bi ${activeType === 'video' ? 'bi-camera-video' : 'bi-file-earmark-pdf'} display-4 text-muted`}></i>
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Uploading...</small>
                    <small className="text-muted">{uploadProgress}%</small>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={uploadContent}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-1"></i>
                      Confirm Upload
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={cancelUpload}
                  disabled={uploading}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CourseContentManager;