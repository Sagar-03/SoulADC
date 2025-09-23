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

  const [status, setStatus] = useState(null);           // "idle" | "uploading" | "saving" | "done" | "error"
  const [progress, setProgress] = useState({ video: 0, document: 0 });

  const courses = { "5 Month Course": 20, "10 Month Course": 40 };
  const days = [1, 2, 3, 4, 5, 6, 7];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setForm((f) => ({ ...f, [name]: files[0] }));
    else setForm((f) => ({ ...f, [name]: value }));
  };

  // Helper: pre-sign from backend
  const getPresign = async (file, folder) => {
    const qs = new URLSearchParams({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      folder,
    }).toString();

    const res = await fetch(`http://localhost:5000/api/upload/presign?${qs}`);
    if (!res.ok) throw new Error("Failed to presign");
    return res.json(); // { uploadUrl, key }
  };

  // Helper: upload to S3 (with progress)
  const putToS3WithProgress = (uploadUrl, file, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress(pct);
        }
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 PUT failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error during S3 upload"));
      xhr.send(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.week || !form.day) {
      return alert("Please select both week and day.");
    }
    if (!form.video && !form.document) {
      return alert("Please choose a Video and/or Document to upload.");
    }

    setStatus("uploading");
    setProgress({ video: 0, document: 0 });

    try {
      let videoKey = null;
      let docKey = null;

      // 1) VIDEO (optional)
      if (form.video) {
        const { uploadUrl, key } = await getPresign(form.video, "videos");
        await putToS3WithProgress(uploadUrl, form.video, (pct) =>
          setProgress((p) => ({ ...p, video: pct }))
        );
        videoKey = key;
      }

      // 2) DOCUMENT (optional)
      if (form.document) {
        const { uploadUrl, key } = await getPresign(form.document, "documents");
        await putToS3WithProgress(uploadUrl, form.document, (pct) =>
          setProgress((p) => ({ ...p, document: pct }))
        );
        docKey = key;
      }

      // 3) Save metadata
      setStatus("saving");
      const saveRes = await fetch("http://localhost:5000/api/admin/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: form.course,
          week: Number(form.week),
          day: Number(form.day),
          videoKey,
          docKey,
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson?.error || "Failed to save metadata");

      setStatus("done");
      alert(`✅ Uploaded to ${form.course} → Week ${form.week} → Day ${form.day}`);

      // Reset form
      setForm({ course: "5 Month Course", week: "", day: "", video: null, document: null });
      setProgress({ video: 0, document: 0 });
    } catch (err) {
      console.error(err);
      setStatus("error");
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Upload Course Content
      </h3>

      <form onSubmit={handleSubmit} className="card shadow-sm p-4" style={{ borderRadius: "12px" }}>
        {/* Select Course */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Course</label>
          <select className="form-select" name="course" value={form.course} onChange={handleChange} required>
            {Object.keys(courses).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Select Week */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Week</label>
          <select className="form-select" name="week" value={form.week} onChange={handleChange} required>
            <option value="">-- Select Week --</option>
            {Array.from({ length: courses[form.course] }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>

        {/* Select Day */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Day</label>
          <select className="form-select" name="day" value={form.day} onChange={handleChange} required>
            <option value="">-- Select Day --</option>
            {days.map((d) => (
              <option key={d} value={d}>Day {d}</option>
            ))}
          </select>
        </div>

        {/* Upload Video */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Upload Video (3–5 GB)</label>
          <input type="file" accept="video/*" className="form-control" name="video" onChange={handleChange} />
          {status === "uploading" && form.video && (
            <div className="form-text mt-1">Video upload: {progress.video}%</div>
          )}
        </div>

        {/* Upload Document */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Upload Document (.pdf/.doc/.docx)</label>
          <input type="file" accept=".pdf,.doc,.docx" className="form-control" name="document" onChange={handleChange} />
          {status === "uploading" && form.document && (
            <div className="form-text mt-1">Document upload: {progress.document}%</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary mt-3"
          style={{ backgroundColor: "#8B5E3C", border: "none" }}
          disabled={status === "uploading" || status === "saving"}
        >
          {status === "uploading" ? "Uploading…" : status === "saving" ? "Saving…" : "Save Content"}
        </button>
      </form>
    </AdminLayout>
  );
};

export default CourseUploadForm;
