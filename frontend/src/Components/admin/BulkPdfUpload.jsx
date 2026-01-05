import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { getCourses, getPresignUrl, saveWeekDocument, saveOtherDocument } from "../../Api/api";
import "./admin.css";

const BulkPdfUpload = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data.courses || []);
      } catch (err) {
        setError("Failed to fetch courses");
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const selectedCourseData = courses.find(course => course._id === selectedCourse);
  const selectedWeekData = selectedCourseData?.weeks.find(week => week._id === selectedWeek);

  const validateAndSetFiles = (selectedFiles) => {
    // Filter only PDF files
    const pdfFiles = selectedFiles.filter(file => file.type === "application/pdf");

    if (pdfFiles.length !== selectedFiles.length) {
      setError("Only PDF files are allowed. Non-PDF files have been filtered out.");
    } else {
      setError(null);
    }

    // No file size limit - accept all PDF files
    setFiles(pdfFiles);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndSetFiles(selectedFiles);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const uploadSingleFile = async (file, weekNumber, weekId) => {
    try {
      // Determine folder path
      const folderPath = weekNumber !== null 
        ? `documents/week-${weekNumber}` 
        : `documents/other`;
      
      // 1. Get presigned URL (dayNumber not needed for module-level documents)
      const presignRes = await getPresignUrl(
        file.name,
        file.type,
        folderPath, // Upload to week folder or other folder
        weekNumber,
        null // no day subfolder
      );

      const { uploadUrl, key } = presignRes.data;

      // 2. Upload to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
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

      // 3. Save metadata in database at module/week level or course level
      if (weekId === 'other') {
        // Save to course-level "other documents"
        await saveOtherDocument(selectedCourse, {
          type: "pdf",
          title: file.name.split(".")[0], // remove extension
          s3Key: key,
        });
      } else {
        // Save to week/module documents
        await saveWeekDocument(selectedCourse, weekId, {
          type: "pdf",
          title: file.name.split(".")[0], // remove extension
          s3Key: key,
        });
      }

      return { success: true, fileName: file.name };
    } catch (err) {
      console.error(`Failed to upload ${file.name}:`, err);
      return { success: false, fileName: file.name, error: err.message };
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedCourse || !selectedWeek || files.length === 0) {
      setError("Please select course, module and choose PDF files to upload");
      return;
    }

    setUploading(true);
    setUploadProgress({});
    setUploadResults([]);
    setError(null);

    const results = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        const result = await uploadSingleFile(
          file,
          selectedWeek === 'other' ? null : selectedWeekData.weekNumber,
          selectedWeek
        );
        results.push(result);
        setUploadResults([...results]);
      }

      // Show summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (failed === 0) {
        setError(null);
        alert(`Success! ${successful} PDF files uploaded successfully to module documents.`);
      } else {
        setError(`Upload completed with ${failed} failures out of ${files.length} files.`);
      }

      // Reset form on success
      if (failed === 0) {
        setFiles([]);
        setSelectedCourse("");
        setSelectedWeek("");
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(`Bulk upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    // If all files are removed, also clear the input
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
          Bulk PDF Upload to Course Documents
        </h3>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Selection Form */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-gear me-2"></i>
              Select Destination
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {/* Course Selection */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Course</label>
                <select
                  className="form-select"
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedWeek("");
                  }}
                  disabled={uploading}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Selection */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Module</label>
                <select
                  className="form-select"
                  value={selectedWeek}
                  onChange={(e) => {
                    setSelectedWeek(e.target.value);
                  }}
                  disabled={!selectedCourse || uploading}
                >
                  <option value="">Select Module</option>
                  {selectedCourseData?.weeks.map(week => (
                    <option key={week._id} value={week._id}>
                      Week {week.weekNumber}: {week.title}
                    </option>
                  ))}
                  <option value="other">📋 Other Documents</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* File Selection */}
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-files me-2"></i>
              Select PDF Files
            </h5>
          </div>
          <div className="card-body">
            {/* Drag and Drop Zone */}
            <div
              className={`file-drop-zone ${isDragOver ? 'dragover' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
              <h5 className="text-muted">Drag and drop PDF files here</h5>
              <p className="text-muted mb-3">or click to browse files</p>
              <button type="button" className="btn btn-outline-primary">
                <i className="bi bi-folder me-2"></i>
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            <div className="form-text mt-2">
              <i className="bi bi-info-circle me-1"></i>
              Select multiple PDF files. You can drag files directly or use the file browser.
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Selected Files ({files.length})
                  </h6>
                  {!uploading && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setFiles([])}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Clear All
                    </button>
                  )}
                </div>
                <div className="row">
                  {files.map((file, index) => (
                    <div key={index} className="col-md-6 col-lg-4 mb-3">
                      <div className="file-list-item p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                            <strong className="d-block text-truncate" title={file.name}>
                              {file.name}
                            </strong>
                            <small className="text-muted">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </small>
                          </div>
                          {!uploading && (
                            <button
                              className="btn btn-outline-danger btn-sm ms-2"
                              onClick={() => removeFile(index)}
                              style={{ minWidth: '32px' }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          )}
                        </div>
                        {uploadProgress[file.name] !== undefined && (
                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted">Uploading...</small>
                              <small className="text-muted">{uploadProgress[file.name]}%</small>
                            </div>
                            <div className="progress-file">
                              <div
                                className="progress-bar"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Confirmation & Progress */}
        {files.length > 0 && selectedCourse && selectedWeek && (
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-cloud-upload me-2"></i>
                Upload Summary
              </h5>
            </div>
            <div className="card-body">
              <div className="upload-summary-card">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h6 className="mb-2">
                      <i className="bi bi-info-circle me-2"></i>
                      Ready to upload {files.length} PDF file{files.length > 1 ? 's' : ''} to:
                    </h6>
                    <div className="ms-3">
                      <p className="mb-1">
                        <strong>Course:</strong> {selectedCourseData?.title}
                      </p>
                      <p className="mb-0">
                        <strong>Module:</strong> Week {selectedWeekData?.weekNumber} - {selectedWeekData?.title}
                      </p>
                      <p className="mb-0 text-muted mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Documents will be available in the module's Documents section
                      </p>
                    </div>
                    {uploading && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Overall Progress</span>
                          <span className="text-muted">
                            {uploadResults.length}/{files.length} completed
                          </span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ width: `${(uploadResults.length / files.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-4 text-center">
                    <i className="bi bi-files display-1 text-success mb-3"></i>
                    <div>
                      <button
                        className="btn btn-success btn-lg me-2"
                        onClick={handleBulkUpload}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-upload me-2"></i>
                            Upload All
                          </>
                        )}
                      </button>
                      {!uploading && (
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setFiles([]);
                            setSelectedCourse("");
                            setSelectedWeek("");
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                Upload Results
                <span className="badge bg-light text-dark ms-2">
                  {uploadResults.filter(r => r.success).length}/{uploadResults.length} successful
                </span>
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {uploadResults.map((result, index) => (
                  <div key={index} className="col-md-6 col-lg-4 mb-3">
                    <div
                      className={`card h-100 ${result.success ? "result-item-success" : "result-item-error"
                        }`}
                    >
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                          <i className={`bi ${result.success ? "bi-check-circle text-success" : "bi-x-circle text-danger"} me-2`}></i>
                          <strong className="flex-grow-1 text-truncate" title={result.fileName}>
                            {result.fileName}
                          </strong>
                        </div>
                        {!result.success && (
                          <small className="text-muted d-block">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            {result.error}
                          </small>
                        )}
                        <div className="mt-2">
                          <span className={`badge ${result.success ? "bg-success" : "bg-danger"}`}>
                            {result.success ? "Success" : "Failed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BulkPdfUpload;