import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaExpand, FaCompress } from "react-icons/fa";
import StudentLayout from "../student/StudentLayout";
import { api, getStreamUrl } from "../../Api/api";
import ScreenshotWarning from "../common/ScreenshotWarning";
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
    const [showScreenshotWarning, setShowScreenshotWarning] = useState(false);
    const [screenshotCount, setScreenshotCount] = useState(0);

    useEffect(() => {

        const fetchDocumentInfo = async () => {
            try {
             //   console.log('📄 Fetching document info for:', { courseId, documentId });
                
                // Fetch course info first
                const courseResponse = await api.get(`/user/courses/${courseId}`);
                setCourse(courseResponse.data);

                // Find the document in the course data
                let foundDocument = null;
                
                // First check "Other Documents"
                if (courseResponse.data.otherDocuments && courseResponse.data.otherDocuments.length > 0) {
                    foundDocument = courseResponse.data.otherDocuments.find(doc =>
                        (doc._id || doc.id) === documentId
                    );
                    if (foundDocument) {
                        foundDocument.weekNumber = null;
                        foundDocument.weekTitle = "Other Documents";
                        // console.log('✅ Found document in Other Documents:', {
                        //     title: foundDocument.title,
                        //     id: foundDocument._id || foundDocument.id,
                        //     s3Key: foundDocument.s3Key,
                        //     url: foundDocument.url,
                        //     type: foundDocument.type
                        // });
                    }
                }
                
                // If not found in other documents, check weeks
                if (!foundDocument) {
                    for (const week of courseResponse.data.weeks) {
                        if (week.documents) {
                            foundDocument = week.documents.find(doc =>
                                (doc._id || doc.id) === documentId
                            );
                            if (foundDocument) {
                                foundDocument.weekNumber = week.weekNumber;
                                foundDocument.weekTitle = week.title;
                                // console.log('✅ Found document in week:', {
                                //     title: foundDocument.title,
                                //     id: foundDocument._id || foundDocument.id,
                                //     s3Key: foundDocument.s3Key,
                                //     url: foundDocument.url,
                                //     type: foundDocument.type
                                // });
                                break;
                            }
                        }
                    }
                }

                if (foundDocument) {
                    setDocumentData(foundDocument);
                } else {
                    // console.error('❌ Document not found in course data');
                    setError("Document not found in course");
                }
            } catch (err) {
                // console.error("Error fetching document:", err);
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
            
            const docId = documentData._id || documentData.id;
            // console.log('🔄 Fetching document blob for ID:', docId);
            // console.log('📦 Document data:', {
            //     title: documentData.title,
            //     s3Key: documentData.s3Key,
            //     url: documentData.url,
            //     type: documentData.type
            // });
            
            try {
                setFetchingDoc(true);
                
                // Try fetching via stream endpoint
                const response = await api.get(`/stream/${docId}`, {
                    responseType: 'blob'
                });
                
                // console.log('✅ Document fetched successfully');
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setDocumentUrl(url);
                setFetchingDoc(false);
            } catch (error) {
                // console.error('❌ Error fetching document blob:', error);
                // console.error('Response:', error.response?.data);
                // console.error('Status:', error.response?.status);
                
                // Try fallback to direct URL if available
                if (documentData.url) {
                    // console.log('🔄 Trying fallback URL:', documentData.url);
                    try {
                        const fallbackResponse = await fetch(documentData.url);
                        if (fallbackResponse.ok) {
                            const blob = await fallbackResponse.blob();
                            const url = URL.createObjectURL(blob);
                            setDocumentUrl(url);
                         //   console.log('✅ Loaded document via fallback URL');
                            setFetchingDoc(false);
                            return;
                        }
                    } catch (fallbackError) {
                        // console.error('❌ Fallback URL also failed:', fallbackError);
                    }
                }
                
                // Set appropriate error message
                if (error.response?.status === 404) {
                    const errorData = error.response?.data;
                    const s3Key = errorData?.s3Key || documentData.s3Key || 'unknown';
                    setError(`Document file not found in storage.\n\nS3 Key: ${s3Key}\nDocument ID: ${docId}\n\nThe file may have been moved or deleted.`);
                } else if (error.response?.status === 401) {
                    setError('You are not authorized to view this document.');
                } else if (error.response?.status === 403) {
                    setError('Access denied. You do not have permission to view this document.');
                } else {
                    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
                    setError(`Failed to load document: ${errorMsg}\n\nDocument ID: ${docId}\nS3 Key: ${documentData.s3Key || 'unknown'}`);
                }
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

    // DRM protection will be implemented later
    // useEffect(() => {
    //     if (!documentUrl) return;
    //     // Protection logic removed for now
    // }, [documentUrl]);

    // Screenshot prevention
    useEffect(() => {
        let screenshotDetectionTimeout = null;

        const handleScreenshotAttempt = () => {
            setScreenshotCount(prev => prev + 1);
            setShowScreenshotWarning(true);
            
            // Log the attempt (you can send this to backend)
            // console.warn('Screenshot attempt detected at:', new Date().toISOString());
        };

        const handleKeyDown = (e) => {
            // Detect Print Screen key (works in some browsers)
            if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
                e.preventDefault();
                handleScreenshotAttempt();
                return;
            }

            // Detect Windows Snipping Tool (Win + Shift + S)
            if (e.key === 's' && e.shiftKey && e.metaKey) {
                e.preventDefault();
                handleScreenshotAttempt();
                return;
            }

            // Detect Mac screenshot shortcuts
            if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
                e.preventDefault();
                handleScreenshotAttempt();
                return;
            }
        };

        // Monitor clipboard for screenshot paste attempts
        const handleCopy = (e) => {
            // console.warn('Copy event detected');
            handleScreenshotAttempt();
        };

        // Detect window/tab switching (often used with screenshot tools)
        const handleVisibilityChange = () => {
            if (document.hidden) {
             //   console.log('Document hidden - potential screenshot tool usage');
                // Set a timeout to show warning if user was gone for screenshot
                screenshotDetectionTimeout = setTimeout(() => {
                    handleScreenshotAttempt();
                }, 100);
            } else {
                // Clear timeout if user returns quickly
                if (screenshotDetectionTimeout) {
                    clearTimeout(screenshotDetectionTimeout);
                }
            }
        };

        // Detect blur events (screenshot tools often cause blur)
        const handleBlur = () => {
            // console.log('Window blur detected');
            screenshotDetectionTimeout = setTimeout(() => {
                handleScreenshotAttempt();
            }, 100);
        };

        const handleFocus = () => {
            if (screenshotDetectionTimeout) {
                clearTimeout(screenshotDetectionTimeout);
            }
        };

        // Disable right-click
        const handleContextMenu = (e) => {
            e.preventDefault();
            handleScreenshotAttempt();
            return false;
        };

        // Add all event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('contextmenu', handleContextMenu);
            if (screenshotDetectionTimeout) {
                clearTimeout(screenshotDetectionTimeout);
            }
        };
    }, []);

    const handleReloadPage = () => {
        window.location.reload();
    };

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
                        <p className="text-muted mb-4" style={{ whiteSpace: 'pre-line' }}>{error || 'Document data not found.'}</p>
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
            {/* Screenshot Warning Modal */}
            <ScreenshotWarning 
                show={showScreenshotWarning}
                screenshotCount={screenshotCount}
                onReload={handleReloadPage}
            />

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