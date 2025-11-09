import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaPrint, FaExpand, FaCompress } from "react-icons/fa";
import StudentLayout from "../student/StudentLayout";
import { api, getStreamUrl } from "../../Api/api";
import "./DocumentViewer.css";

const DocumentViewer = () => {
    const { courseId, documentId } = useParams();
    const navigate = useNavigate();
    const [documentData, setDocumentData] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [documentUrl, setDocumentUrl] = useState(null);
    const [fetchingDoc, setFetchingDoc] = useState(true);

    useEffect(() => {

        const fetchDocumentInfo = async () => {
            try {
                // Fetch course info first
                const courseResponse = await api.get(`/user/courses/${courseId}`);
                setCourse(courseResponse.data);

                // Find the document in the course data
                let foundDocument = null;
                for (const week of courseResponse.data.weeks) {
                    if (week.documents) {
                        foundDocument = week.documents.find(doc =>
                            (doc._id || doc.id) === documentId
                        );
                        if (foundDocument) {
                            foundDocument.weekNumber = week.weekNumber;
                            foundDocument.weekTitle = week.title;
                            break;
                        }
                    }
                }

                if (foundDocument) {
                    setDocumentData(foundDocument);
                } else {
                    setError("Document not found");
                }
            } catch (err) {
                console.error("Error fetching document:", err);
                setError("Failed to load document");
            } finally {
                setLoading(false);
            }
        };

        if (courseId && documentId) {
            fetchDocumentInfo();
        }

        // Cleanup function
        return () => {
            // Cleanup if needed
        };
    }, [courseId, documentId]);

    // Fetch document blob when documentData is available
    useEffect(() => {
        const fetchDocumentBlob = async () => {
            if (!documentData) return;
            
            try {
                setFetchingDoc(true);
                const response = await api.get(`/stream/${documentData._id || documentData.id}`, {
                    responseType: 'blob'
                });
                
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setDocumentUrl(url);
            } catch (error) {
                console.error('Error fetching document:', error);
                if (error.response?.status === 404) {
                    setError('Document file not found. The file may have been moved or deleted.');
                } else if (error.response?.status === 401) {
                    setError('You are not authorized to view this document.');
                } else if (error.response?.status === 403) {
                    setError('Access denied. You do not have permission to view this document.');
                } else {
                    setError(`Failed to load document: ${error.response?.data?.message || error.message}`);
                }
            } finally {
                setFetchingDoc(false);
            }
        };

        fetchDocumentBlob();

        // Cleanup function to revoke object URL
        return () => {
            if (documentUrl) {
                URL.revokeObjectURL(documentUrl);
            }
        };
    }, [documentData]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handlePrint = () => {
        // Simple print function - will print the whole page
        window.print();
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="document-viewer-loading">
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading document...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading document...</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (error || !documentData) {
        return (
            <StudentLayout>
                <div className="document-viewer-error">
                    <div className="text-center py-5">
                        <h3 className="text-muted mb-3">Document Not Available</h3>
                        <p className="text-muted mb-4">{error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/documents/${courseId}`)}
                        >
                            Back to Documents
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (fetchingDoc || !documentUrl) {
        return (
            <StudentLayout>
                <div className="document-viewer-loading">
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading document...</span>
                        </div>
                        <p className="mt-3 text-muted">Preparing document...</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <div className={`document-viewer-container ${isFullscreen ? 'fullscreen' : ''}`}>
            {!isFullscreen && (
                <StudentLayout>
                    <DocumentViewerContent
                        document={documentData}
                        course={course}
                        documentUrl={documentUrl}
                        isFullscreen={isFullscreen}
                        toggleFullscreen={toggleFullscreen}
                        handlePrint={handlePrint}
                        navigate={navigate}
                        courseId={courseId}
                    />
                </StudentLayout>
            )}

            {isFullscreen && (
                <DocumentViewerContent
                    document={documentData}
                    course={course}
                    documentUrl={documentUrl}
                    isFullscreen={isFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    handlePrint={handlePrint}
                    navigate={navigate}
                    courseId={courseId}
                />
            )}
        </div>
    );
};

const DocumentViewerContent = ({
    document: documentData,
    course,
    documentUrl,
    isFullscreen,
    toggleFullscreen,
    handlePrint,
    navigate,
    courseId
}) => {
    return (
        <div className="document-viewer">
            {/* Header */}
            <div className="document-header">
                <div className="document-header-left">
                    {!isFullscreen && (
                        <button
                            className="btn btn-outline-secondary me-3"
                            onClick={() => navigate(`/documents/${courseId}`)}
                        >
                            <FaArrowLeft className="me-2" />
                            Back to Documents
                        </button>
                    )}
                    <div className="document-info">
                        <h5 className="document-title">{documentData.title}</h5>
                        <p className="document-meta">
                            {course?.title} • Module {documentData.weekNumber}
                            {documentData.weekTitle && ` - ${documentData.weekTitle}`}
                        </p>
                    </div>
                </div>

                <div className="document-header-actions">
                    <button
                        className="btn btn-outline-primary me-2"
                        onClick={handlePrint}
                        title="Print Document"
                    >
                        <FaPrint />
                    </button>
                    <button
                        className="btn btn-outline-primary"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <FaCompress /> : <FaExpand />}
                    </button>
                </div>
            </div>

            {/* Document Viewer */}
            <div className="document-content">
                <iframe
                    id="documentFrame"
                    src={documentUrl}
                    className="document-iframe"
                    title={documentData.title}
                />
            </div>
        </div>
    );
};

export default DocumentViewer;