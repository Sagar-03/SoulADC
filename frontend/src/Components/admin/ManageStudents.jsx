import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { api } from "../../Api/api";
import { toast } from "react-toastify";

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [resettingDevice, setResettingDevice] = useState(null);

  // Fetch users from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/users");
      setStudents(response.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${userName}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(userId);
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully");
      
      // Remove from local state
      setStudents(students.filter(s => s.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err.response?.data?.error || "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const handleResetDeviceLock = async (userId, userName) => {
    const confirmReset = window.confirm(
      `Reset device lock for ${userName}?\n\nThis will allow them to login from a new device. Their current device registration will be cleared.`
    );

    if (!confirmReset) return;

    try {
      setResettingDevice(userId);
      const response = await api.post(`/admin/reset-device-lock/${userId}`);
      
      if (response.data.success) {
        toast.success(`Device lock reset for ${userName}`);
        // Refresh the student list to show updated device lock status
        fetchStudents();
      }
    } catch (err) {
      console.error("Error resetting device lock:", err);
      toast.error(err.response?.data?.message || "Failed to reset device lock");
    } finally {
      setResettingDevice(null);
    }
  };

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Manage Students
      </h3>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: "linear-gradient(145deg, #A98C6A, #7B563D)" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="alert alert-info">No students found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped shadow-sm bg-white">
            <thead style={{ background: "linear-gradient(145deg, #A98C6A, #7B563D)", color: "white" }}>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Purchased Courses</th>
                <th>Streak</th>
                <th>Device Lock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || "N/A"}</td>
                  <td>
                    {s.purchasedCourses && s.purchasedCourses.length > 0
                      ? s.purchasedCourses.join(", ")
                      : "No courses"}
                  </td>
                  <td>
                    <span className="badge bg-success">{s.streak || 0} days</span>
                  </td>
                  <td>
                    {s.registeredIp || s.deviceFingerprint ? (
                      <div className="d-flex flex-column" style={{ fontSize: "0.85rem" }}>
                        <span className="badge bg-warning text-dark mb-1">
                          🔒 Locked
                        </span>
                        {s.registeredIp && (
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                            IP: {s.registeredIp}
                          </small>
                        )}
                      </div>
                    ) : (
                      <span className="badge bg-secondary">🔓 Unlocked</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      {(s.registeredIp || s.deviceFingerprint) && (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleResetDeviceLock(s.id, s.name)}
                          disabled={resettingDevice === s.id}
                          title="Reset device lock to allow login from new device"
                        >
                          {resettingDevice === s.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                              Resetting...
                            </>
                          ) : (
                            "🔓 Reset Device"
                          )}
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(s.id, s.name)}
                        disabled={deleting === s.id}
                      >
                        {deleting === s.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageStudents;
