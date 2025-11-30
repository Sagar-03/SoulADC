import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../Api/api";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/pending-approvals");
      setApprovals(response.data);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      toast.error("Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approvalId, userName, courseTitle) => {
    const confirmApproval = window.confirm(
      `Are you sure you want to approve course access for ${userName} to "${courseTitle}"?`
    );

    if (!confirmApproval) return;

    try {
      setProcessing(approvalId);
      await api.post(`/admin/approve-payment/${userId}/${approvalId}`);
      toast.success(`✅ Course access approved for ${userName}`);
      
      // Remove from local state
      setApprovals(approvals.filter(a => a.approvalId !== approvalId));
    } catch (err) {
      console.error("Error approving payment:", err);
      toast.error(err.response?.data?.error || "Failed to approve payment");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (approval) => {
    setSelectedApproval(approval);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.warning("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(selectedApproval.approvalId);
      await api.post(
        `/admin/reject-payment/${selectedApproval.userId}/${selectedApproval.approvalId}`,
        { reason: rejectionReason }
      );
      toast.success(`❌ Payment rejected for ${selectedApproval.userName}`);
      
      // Remove from local state
      setApprovals(approvals.filter(a => a.approvalId !== selectedApproval.approvalId));
      setShowRejectModal(false);
      setSelectedApproval(null);
    } catch (err) {
      console.error("Error rejecting payment:", err);
      toast.error(err.response?.data?.error || "Failed to reject payment");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold" style={{ color: "#5A3825" }}>
          Pending Payment Approvals
        </h3>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchPendingApprovals}
          disabled={loading}
        >
          {loading ? <FaSpinner className="spinner-border spinner-border-sm" /> : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: "#A98C6A" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading pending approvals...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          No pending payment approvals at this time.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover shadow-sm bg-white">
            <thead style={{ background: "linear-gradient(145deg, #A98C6A, #7B563D)", color: "white" }}>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr key={approval.approvalId}>
                  <td className="fw-semibold">{approval.userName}</td>
                  <td>{approval.userEmail}</td>
                  <td>{approval.userPhone}</td>
                  <td>
                    <span className="badge bg-primary">{approval.courseTitle}</span>
                  </td>
                  <td className="fw-bold text-success">
                    ${approval.paymentAmount.toFixed(2)}
                  </td>
                  <td className="text-muted small">{formatDate(approval.paymentDate)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm d-flex align-items-center gap-1"
                        onClick={() => handleApprove(
                          approval.userId, 
                          approval.approvalId, 
                          approval.userName,
                          approval.courseTitle
                        )}
                        disabled={processing === approval.approvalId}
                      >
                        {processing === approval.approvalId ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <>
                            <FaCheckCircle /> Approve
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                        onClick={() => openRejectModal(approval)}
                        disabled={processing === approval.approvalId}
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Payment Approval</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  You are about to reject the payment approval for:
                </p>
                <div className="alert alert-warning">
                  <strong>Student:</strong> {selectedApproval?.userName}<br />
                  <strong>Course:</strong> {selectedApproval?.courseTitle}<br />
                  <strong>Amount:</strong> ${selectedApproval?.paymentAmount.toFixed(2)}
                </div>
                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">
                    Reason for Rejection <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="rejectionReason"
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Rejecting...
                    </>
                  ) : (
                    "Confirm Rejection"
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

export default PendingApprovals;
