import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getDocuments, deleteDocument } from "../../Api/api";
import "./admin.css";

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      console.log("Fetching all uploaded documents...");
      const response = await getDocuments();
      console.log("Full API response:", response);
      
      const documentsData = response.data?.documents || response.data || [];
      console.log(`Documents fetched: ${documentsData.length}`, documentsData);
      
      setDocuments(documentsData);
    } catch (err) {
      console.error("Error loading documents:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
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

  const getDocumentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      default:
        return '📄';
    }
  };

  return (
    <AdminLayout>
      <h2 className="mb-4 fw-bold" style={{ color: "#5A3825" }}>
        Manage Documents
      </h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-5">
          <h4 className="text-muted">📄 No Documents Found</h4>
          <p className="text-muted">No documents have been uploaded yet.</p>
          <small className="text-muted">Check the console for any errors.</small>
        </div>
      ) : (
        <div className="row g-4">
          {documents.map((doc) => (
            <div className="col-md-4 col-lg-3" key={doc._id}>
              <div className="card document-card h-100">
                {/* Document Icon/Type */}
                <div className="card-header text-center bg-light">
                  <div className="document-icon">
                    {getDocumentIcon(doc.type)}
                  </div>
                  <small className="text-muted">{doc.type.toUpperCase()}</small>
                </div>

                {/* Document Details */}
                <div className="card-body d-flex flex-column">
                  <h6 className="card-title fw-bold" style={{ color: "#5A3825" }}>
                    {doc.title}
                  </h6>
                  
                  <div className="document-meta mb-3 flex-grow-1">
                    <p className="text-muted small mb-1">
                      <strong>Uploaded by:</strong> {doc.uploadedBy?.name || "Unknown"}
                    </p>
                    <p className="text-muted small mb-0">
                      <strong>Date:</strong> {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-auto">
                    <button
                      className="btn btn-outline-primary btn-sm flex-fill"
                      onClick={() => setPreviewUrl(doc.url)}
                    >
                      👁️ View
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(doc._id)}
                      title="Delete Document"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </AdminLayout>
  );
};

export default AdminDocuments;
