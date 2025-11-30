import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useParams } from "react-router-dom";
import "./admin.css";
import { getStreamUrl, addWeek, addDay, getCourses, getPresignUrl, deleteContent, deleteWeekApi, deleteDayApi, saveContent, updateContentTitle, initiateMultipartUpload, getPresignedPartUrl, completeMultipartUpload, abortMultipartUpload } from "../../Api/api";

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

  // State for bulk operations
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSaveProgress, setBulkSaveProgress] = useState(0);

  // State for editing content title
  const [editingContentId, setEditingContentId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [updatingTitle, setUpdatingTitle] = useState(false);

  // Popup modal state
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editContext, setEditContext] = useState({ weekId: null, dayId: null, contentId: null });


  const fetchCourse = async () => {
    try {
      const { data } = await getCourses(id);
      console.log('📚 Fetched course data:', data);
      
      // Check if course uses shared content
      if (data.sharedContentId) {
        console.log('🔗 Course uses shared content:', data.sharedContent?.name);
        console.log('📖 Weeks from shared content:', data.weeks?.length || 0);
      } else {
        console.log('📖 Course has direct content, weeks:', data.weeks?.length || 0);
      }
      
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

  const handleAddDay = async (weekId) => {
    try {
      setError(null);
      await addDay(id, weekId); // from api.js
      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        New day has been successfully added to the week.
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
      `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);
    } catch (err) {
      setError("Failed to add day");
      console.error(err);
    }
  };


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 100MB for videos, 10MB for documents)

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

      const folder = activeType === "video" ? "videos" : "documents";
      const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for multipart upload
      let key;

      // Use multipart upload for files larger than 100MB
      if (file.size > MULTIPART_THRESHOLD) {
        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB - Using multipart upload`);
        
        // 1. Initiate multipart upload
        const initiateRes = await initiateMultipartUpload(
          file.name,
          file.type,
          folder,
          activeWeek.weekNumber,
          activeDay.dayNumber
        );
        
        const uploadId = initiateRes.data.uploadId;
        key = initiateRes.data.key;
        console.log("Multipart upload initiated:", { uploadId, key });

        try {
          // 2. Upload file in parts (5MB chunks)
          const PART_SIZE = 5 * 1024 * 1024; // 5MB per part
          const numParts = Math.ceil(file.size / PART_SIZE);
          const uploadedParts = [];

          for (let partNumber = 1; partNumber <= numParts; partNumber++) {
            const start = (partNumber - 1) * PART_SIZE;
            const end = Math.min(start + PART_SIZE, file.size);
            const partBlob = file.slice(start, end);

            // Get presigned URL for this part
            const partUrlRes = await getPresignedPartUrl(key, uploadId, partNumber);
            const partUploadUrl = partUrlRes.data.uploadUrl;

            // Upload part
            const response = await fetch(partUploadUrl, {
              method: 'PUT',
              body: partBlob,
              headers: {
                'Content-Type': file.type,
              },
            });

            if (!response.ok) {
              throw new Error(`Part ${partNumber} upload failed with status: ${response.status}`);
            }

            // Get ETag from response
            const etag = response.headers.get('ETag');
            uploadedParts.push({
              PartNumber: partNumber,
              ETag: etag,
            });

            // Update progress
            const progress = Math.round((partNumber / numParts) * 100);
            setUploadProgress(progress);
            console.log(`Uploaded part ${partNumber}/${numParts} (${progress}%)`);
          }

          // 3. Complete multipart upload
          await completeMultipartUpload(key, uploadId, uploadedParts);
          console.log("Multipart upload completed successfully");

        } catch (err) {
          // Abort multipart upload on error
          console.error("Multipart upload failed, aborting:", err);
          await abortMultipartUpload(key, uploadId);
          throw err;
        }

      } else {
        // Use regular single-part upload for smaller files
        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB - Using single-part upload`);
        
        const presignRes = await getPresignUrl(
          file.name,
          file.type,
          folder,
          activeWeek.weekNumber,
          activeDay.dayNumber
        );

        const uploadUrl = presignRes.data.uploadUrl;
        key = presignRes.data.key;
        console.log("Got presigned URL and key:", { uploadUrl, key });

        // Upload file to S3 with progress tracking
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
      }

      // 4. Save metadata in DB
      try {
        const saveRes = await saveContent(id, activeWeekId, activeDayId, {
          type: activeType,
          title: file.name.split(".")[0], // remove extension
          s3Key: key,
        });

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

  const handleEditTitle = (weekId, dayId, contentId, currentTitle) => {
    setShowEditPopup(false);
    setEditingContentId(null);
    setEditingTitle(currentTitle);
  };
  const handleEditTitlePopup = (weekId, dayId, contentId, currentTitle) => {
    setEditContext({ weekId, dayId, contentId });
    setEditingTitle(currentTitle);
    setShowEditPopup(true);
  };


  const handleSaveTitle = async (weekId, dayId, contentId) => {
    if (!editingTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }

    setUpdatingTitle(true);
    try {
      await updateContentTitle(id, weekId, dayId, contentId, editingTitle);
      setEditingContentId(null);
      setEditingTitle("");
      fetchCourse();
    } catch (err) {
      setError("Failed to update content title");
      console.error(err);
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditPopup(false);
    setEditingContentId(null);
    setEditingTitle("");
  };


  const deleteWeek = async (weekId) => {
    const week = course.weeks.find(w => w._id === weekId);
    const totalContent = week?.days?.reduce((total, day) => total + (day.contents?.length || 0), 0) || 0;

    const confirmMessage = `Are you sure you want to delete Module ${week?.weekNumber}?\n\nThis will permanently delete:\n• All 7 days in this week\n• ${totalContent} content items (videos/documents)\n• All associated files from cloud storage\n\nThis action cannot be undone.`;

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

  // Add file to upload queue instead of uploading immediately
  const addToUploadQueue = async () => {
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

      const folder = activeType === "video" ? "videos" : "documents";
      const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for multipart upload
      let key;

      // Use multipart upload for files larger than 100MB
      if (file.size > MULTIPART_THRESHOLD) {
        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB - Using multipart upload`);
        
        // 1. Initiate multipart upload
        const initiateRes = await initiateMultipartUpload(
          file.name,
          file.type,
          folder,
          activeWeek.weekNumber,
          activeDay.dayNumber
        );
        
        const uploadId = initiateRes.data.uploadId;
        key = initiateRes.data.key;
        console.log("Multipart upload initiated:", { uploadId, key });

        try {
          // 2. Upload file in parts (5MB chunks)
          const PART_SIZE = 5 * 1024 * 1024; // 5MB per part
          const numParts = Math.ceil(file.size / PART_SIZE);
          const uploadedParts = [];

          for (let partNumber = 1; partNumber <= numParts; partNumber++) {
            const start = (partNumber - 1) * PART_SIZE;
            const end = Math.min(start + PART_SIZE, file.size);
            const partBlob = file.slice(start, end);

            // Get presigned URL for this part
            const partUrlRes = await getPresignedPartUrl(key, uploadId, partNumber);
            const partUploadUrl = partUrlRes.data.uploadUrl;

            // Upload part
            const response = await fetch(partUploadUrl, {
              method: 'PUT',
              body: partBlob,
              headers: {
                'Content-Type': file.type,
              },
            });

            if (!response.ok) {
              throw new Error(`Part ${partNumber} upload failed with status: ${response.status}`);
            }

            // Get ETag from response
            const etag = response.headers.get('ETag');
            uploadedParts.push({
              PartNumber: partNumber,
              ETag: etag,
            });

            // Update progress
            const progress = Math.round((partNumber / numParts) * 100);
            setUploadProgress(progress);
            console.log(`Uploaded part ${partNumber}/${numParts} (${progress}%)`);
          }

          // 3. Complete multipart upload
          await completeMultipartUpload(key, uploadId, uploadedParts);
          console.log("Multipart upload completed successfully");

        } catch (err) {
          // Abort multipart upload on error
          console.error("Multipart upload failed, aborting:", err);
          await abortMultipartUpload(key, uploadId);
          throw err;
        }

      } else {
        // Use regular single-part upload for smaller files
        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB - Using single-part upload`);
        
        const presignRes = await getPresignUrl(
          file.name,
          file.type,
          folder,
          activeWeek.weekNumber,
          activeDay.dayNumber
        );

        const uploadUrl = presignRes.data.uploadUrl;
        key = presignRes.data.key;
        console.log("Got presigned URL and key:", { uploadUrl, key });

        // Upload file to S3 with progress tracking
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
      }

      // 3. Add to uploaded files queue instead of saving immediately
      const uploadedFile = {
        id: Date.now() + Math.random(), // Temporary ID
        file: file,
        weekId: activeWeekId,
        dayId: activeDayId,
        weekNumber: activeWeek.weekNumber,
        dayNumber: activeDay.dayNumber,
        type: activeType,
        s3Key: key,
        uploaded: true,
        saved: false
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Reset current file selection
      setFile(null);
      setActiveWeekId(null);
      setActiveDayId(null);
      setActiveType(null);
      setUploadProgress(0);

      // Clear file input
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');

    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Bulk save all uploaded files
  const bulkSaveFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setBulkSaving(true);
    setBulkSaveProgress(0);
    setError(null);

    try {
      const unsavedFiles = uploadedFiles.filter(file => !file.saved);

      for (let i = 0; i < unsavedFiles.length; i++) {
        const fileData = unsavedFiles[i];

        try {
          await saveContent(id, fileData.weekId, fileData.dayId, {
            type: fileData.type,
            title: fileData.file.name.split(".")[0], // remove extension
            s3Key: fileData.s3Key,
          });

          // Mark file as saved
          setUploadedFiles(prev =>
            prev.map(file =>
              file.id === fileData.id
                ? { ...file, saved: true }
                : file
            )
          );

          // Update progress
          setBulkSaveProgress(Math.round(((i + 1) / unsavedFiles.length) * 100));

        } catch (err) {
          console.error(`Failed to save ${fileData.file.name}:`, err);
          // Continue with other files even if one fails
        }
      }

      // Refresh course data to show saved content
      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        Successfully saved ${unsavedFiles.length} file(s) to the course.
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
      `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);

    } catch (err) {
      setError(`Bulk save failed: ${err.message}`);
      console.error(err);
    } finally {
      setBulkSaving(false);
      setBulkSaveProgress(0);
    }
  };

  // Remove file from upload queue
  const removeFromQueue = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Clear all uploaded files
  const clearUploadQueue = () => {
    if (confirm("Are you sure you want to clear all uploaded files? Files that haven't been saved will be lost.")) {
      setUploadedFiles([]);
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

        {/* Shared Content Warning */}
        {course.sharedContentId && (
          <div className="alert alert-info border-info mb-4" role="alert">
            <div className="d-flex align-items-start">
              <i className="bi bi-info-circle-fill me-2 mt-1" style={{ fontSize: "1.5rem" }}></i>
              <div>
                <h5 className="alert-heading mb-2">
                  <i className="bi bi-link-45deg me-1"></i>
                  This course uses shared content
                </h5>
                <p className="mb-2">
                  <strong>Shared Content:</strong> {course.sharedContent?.name}
                </p>
                <p className="mb-0">
                  This course's content is managed through shared content. Any changes to weeks, days, or content 
                  should be made in the <strong>Shared Content Manager</strong> to affect all linked courses.
                </p>
                <hr className="my-2" />
                <p className="mb-0 text-muted small">
                  <i className="bi bi-lightbulb me-1"></i>
                  <strong>Note:</strong> Editing here will only work if this course has its own direct content (not shared).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Bulk Upload Queue */}
        {uploadedFiles.length > 0 && (
          <div className="card mb-4 border-info">
            <div className="card-header bg-info text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-files me-2"></i>
                  Upload Queue ({uploadedFiles.length} files)
                </h5>
                <div className="d-flex gap-2">
                  {uploadedFiles.some(file => !file.saved) && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={bulkSaveFiles}
                      disabled={bulkSaving}
                    >
                      {bulkSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Saving... {bulkSaveProgress}%
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Save All ({uploadedFiles.filter(file => !file.saved).length})
                        </>
                      )}
                    </button>
                  )}
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={clearUploadQueue}
                    disabled={bulkSaving}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Clear All
                  </button>
                </div>
              </div>
              {bulkSaving && (
                <div className="mt-2">
                  <div className="progress">
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${bulkSaveProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="row">
                {uploadedFiles.map((fileData) => (
                  <div key={fileData.id} className="col-md-6 col-lg-4 mb-3">
                    <div className={`card border ${fileData.saved ? 'border-success' : 'border-warning'}`}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="card-title mb-1 text-truncate" title={fileData.file.name}>
                              <i className={`bi ${fileData.type === 'video' ? 'bi-camera-video text-primary' : 'bi-file-earmark-pdf text-danger'} me-2`}></i>
                              {fileData.file.name}
                            </h6>
                            <small className="text-muted">
                              Week {fileData.weekNumber}, Day {fileData.dayNumber} • {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                            </small>
                          </div>
                          {!bulkSaving && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeFromQueue(fileData.id)}
                              title="Remove from queue"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`badge ${fileData.saved ? 'bg-success' : 'bg-warning'}`}>
                            {fileData.saved ? (
                              <>
                                <i className="bi bi-check-circle me-1"></i>
                                Saved
                              </>
                            ) : (
                              <>
                                <i className="bi bi-clock me-1"></i>
                                Pending
                              </>
                            )}
                          </span>
                          <small className="text-muted text-capitalize">
                            {fileData.type}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Week Section */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Module (7 Days Auto-Created)
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Module Number</label>
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
                <label className="form-label">Module Title</label>
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
                  <i className="bi bi-plus"></i> Add Module
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
                        className="btn btn-success btn-sm"
                        onClick={() => handleAddDay(week._id)}
                        title="Add New Day to this Week"
                      >
                        <i className="bi bi-plus-circle"></i> Add Day
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteWeek(week._id)}
                        title="Delete Entire Week"
                      >
                        <i className="bi bi-trash"></i> Delete Module
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
                                        {editingContentId === content._id ? (
                                          // Edit mode
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="fw-semibold text-break" style={{ flex: 1, paddingRight: "8px" }}>
                                              <i className={`bi ${content.type === 'video' ? 'bi-play-circle text-primary' : 'bi-file-earmark-pdf text-info'} me-1`}></i>
                                              {content.title}
                                            </small>
                                            <div className="d-flex gap-1">
                                              <button
                                                className="btn btn-outline-primary btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleEditTitlePopup(week._id, day._id, content._id, content.title)}
                                                title="Edit title"
                                              >
                                                <i className="bi bi-pencil"></i>
                                              </button>
                                              <button
                                                className="btn btn-danger btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleDeleteContent(week._id, day._id, content._id)}
                                              >
                                                <i className="bi bi-trash"></i>
                                              </button>
                                            </div>
                                          </div>

                                        ) : (
                                          // View mode
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="fw-semibold text-break" style={{ flex: 1, paddingRight: "8px" }}>
                                              <i className={`bi ${content.type === 'video' ? 'bi-play-circle text-primary' : 'bi-file-earmark-pdf text-info'} me-1`}></i>
                                              {content.title}
                                            </small>
                                            <div className="d-flex gap-1">
                                              <button
                                                className="btn btn-outline-primary btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleEditTitlePopup(week._id, day._id, content._id, content.title)}
                                                title="Edit title"
                                              >
                                                <i className="bi bi-pencil"></i>
                                              </button>
                                              <button
                                                className="btn btn-danger btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleDeleteContent(week._id, day._id, content._id)}
                                              >
                                                <i className="bi bi-trash"></i>
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Content Preview */}
                                        {content.type === "video" && content.s3Key && (
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
                        <p className="text-muted mt-2">No day configured for this Module</p>
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
            <h5 className="text-muted mt-3">No Modules added yet</h5>
            <p className="text-muted">Start by adding your first Module above.</p>
          </div>
        )}

        {/* Upload Confirmation Modal */}
        {file && activeWeekId && activeDayId && activeType && (
          <div className="card border-success mt-4">
            <div className="card-header bg-success text-white">
              <h6 className="mb-0">
                <i className="bi bi-cloud-upload me-2"></i>
                Ready to Upload to Module {course.weeks.find(w => w._id === activeWeekId)?.days.find(d => d._id === activeDayId)?.dayNumber}
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>File:</strong> {file.name}<br />
                  <strong>Type:</strong> <span className="text-capitalize">{activeType}</span><br />
                  <strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB<br />
                  <strong>Module:</strong> {course.weeks.find(w => w._id === activeWeekId)?.weekNumber} -  {course.weeks.find(w => w._id === activeWeekId)?.days.find(d => d._id === activeDayId)?.dayNumber} part
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
                  onClick={addToUploadQueue}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-1"></i>
                      Add to Queue
                    </>
                  )}
                </button>
                <button
                  className="btn btn-primary"
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
                      Upload & Save Now
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
      {showEditPopup && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050
          }}
        >
          <div className="card shadow-lg" style={{ width: "400px", borderRadius: "12px" }}>
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Edit Content Title
              </h6>
              <button
                className="btn btn-sm btn-light"
                onClick={handleCancelEdit}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="card-body">
              <label className="form-label small text-muted mb-1">New Title</label>
              <input
                type="text"
                className="form-control"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Enter new title"
                disabled={updatingTitle}
              />
              <div className="mt-3 d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={updatingTitle}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={() =>
                    handleSaveTitle(editContext.weekId, editContext.dayId, editContext.contentId)
                  }
                  disabled={updatingTitle || !editingTitle.trim()}
                >
                  {updatingTitle ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default CourseContentManager;