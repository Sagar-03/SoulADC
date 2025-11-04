import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getDocuments, deleteDocument } from "../../Api/api";

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      console.log(" Fetching all uploaded documents...");
      const { data } = await getDocuments();
      console.log(`Documents fetched: ${data.length}`);
      setDocuments(data);
    } catch (err) {
      console.error("Error loading documents:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      alert("🗑️ Document deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete document.");
    }
  };

  return (
    <AdminLayout>
      <div className="container">
        <h2 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
          Manage Documents
        </h2>
        <p className="text-muted mb-4">
          View and delete uploaded documents on the platform.
        </p>

        {/* Document List */}
        <div className="card shadow-sm p-3">
          <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
            Uploaded Documents
          </h5>
          {documents.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id}>
                      <td>{doc.title}</td>
                      <td>{doc.type.toUpperCase()}</td>
                      <td>{doc.uploadedBy?.name || "Unknown"}</td>
                      <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-info me-2"
                          onClick={() => setPreviewUrl(doc.url)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(doc._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted">No documents found.</p>
          )}
        </div>

        {/* Document Preview Modal */}
        {previewUrl && (
          <div
            className="modal fade show"
            style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Document Viewer</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setPreviewUrl("")}
                  ></button>
                </div>
                <div className="modal-body" style={{ height: "80vh" }}>
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="100%"
                    title="Document Preview"
                    style={{
                      border: "none",
                      pointerEvents: "none", // disable download/right-click
                    }}
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
