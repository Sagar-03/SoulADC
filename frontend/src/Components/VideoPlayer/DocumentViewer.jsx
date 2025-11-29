import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaExpand, FaCompress } from "react-icons/fa";
import StudentLayout from "../student/StudentLayout";
import { api, getStreamUrl } from "../../Api/api";
import { setupBlurProtection, additionalProtection } from "../../utils/blurProtection";
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

    // Setup blur protection for document viewer
    useEffect(() => {
        if (!documentUrl) return;

        // Enhanced Print Screen detection via multiple methods
        const enhancedPrintScreenDetection = () => {
            let lastKeyTime = 0;
            
            const detectPrintScreen = (e) => {
                // Method 1: Direct key detection
                if (e.keyCode === 44 || e.which === 44 || e.code === 'PrintScreen' || e.key === 'PrintScreen') {
                    e.preventDefault();
                    console.warn("🚨 Print Screen detected on document viewer");
                    
                    // Store in session storage to persist across refresh
                    sessionStorage.setItem('blurProtectionActive', Date.now().toString());
                    sessionStorage.setItem('blurProtectionDuration', '30000');
                    
                    // Apply blur
                    const { applyBlur } = require('../../utils/blurProtection');
                    applyBlur(30000, "⚠️ Screenshot Detected - Document Protected for 30 Seconds");
                }
                
                // Method 2: Detect rapid key sequences
                const now = Date.now();
                if (now - lastKeyTime < 100) {
                    console.warn("Rapid key sequence detected on document");
                }
                lastKeyTime = now;
            };

            // Listen on both keydown and keyup
            window.addEventListener('keydown', detectPrintScreen, true);
            window.addEventListener('keyup', detectPrintScreen, true);
            
            return () => {
                window.removeEventListener('keydown', detectPrintScreen, true);
                window.removeEventListener('keyup', detectPrintScreen, true);
            };
        };

        const cleanupEnhanced = enhancedPrintScreenDetection();

        // Setup blur protection with document-specific options
        const cleanupBlurProtection = setupBlurProtection({
            allowedKeys: ["Space"], // Only allow Space key for scrolling
            printScreenDuration: 30000, // 30 seconds for Print Screen
            defaultDuration: 15000, // 15 seconds for other suspicious keys
            pauseContent: null, // No content to pause for documents
            showMessage: true
        });

        // Setup additional protection (context menu, dev tools detection)
        const cleanupAdditionalProtection = additionalProtection();

        return () => {
            cleanupEnhanced();
            cleanupBlurProtection();
            cleanupAdditionalProtection();
        };
    }, [documentUrl]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
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
                    src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="document-iframe"
                    title={documentData.title}
                />
            </div>
        </div>
    );
};

export default DocumentViewer;