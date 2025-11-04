import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { getAdminDashboardStats } from "../../Api/api";

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminDashboardStats();
      
      setStats(data.stats);
      setEnrollmentTrend(data.enrollmentTrend);
      setRevenueTrend(data.revenueTrend);
      setTopCourses(data.topCourses);
      setRecentStudents(data.recentStudents);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      
      // Fallback to dummy data if API fails
      setStats([
        { label: "Total Courses", value: 0 },
        { label: "Total Students", value: 0 },
        { label: "Active Enrollments", value: 0 },
        { label: "Revenue (₹)", value: "0" },
      ]);
      setEnrollmentTrend([]);
      setRevenueTrend([]);
      setTopCourses([]);
      setRecentStudents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold" style={{ color: "#5A3825" }}>
            Admin Dashboard
          </h2>
          <p className="text-muted">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="alert alert-warning mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}. Showing available data.
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {stats.map((s, i) => (
          <div className="col-md-3" key={i}>
            <div className="card shadow-sm text-center p-3 h-100">
              <h5 className="fw-bold" style={{ color: "#5A3825" }}>
                {s.label}
              </h5>
              <h3 style={{ color: "#8B5E3C" }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
              Enrollment Trend
            </h5>
            {enrollmentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="enrollments" stroke="#8B5E3C" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ height: "250px" }}>
                <p className="text-muted">No enrollment data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
              Revenue Trend (₹)
            </h5>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8B5E3C" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ height: "250px" }}>
                <p className="text-muted">No revenue data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Students & Top Courses */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
              Recent Enrollments
            </h5>
            {recentStudents.length > 0 ? (
              <ul className="list-group list-group-flush">
                {recentStudents.map((s, i) => (
                  <li className="list-group-item d-flex justify-content-between" key={i}>
                    <span>
                      <strong>{s.name}</strong> → {s.course}
                    </span>
                    <small className="text-muted">{s.date}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted p-4">
                <i className="fas fa-users fa-2x mb-3"></i>
                <p>No recent enrollments</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
              Top Courses
            </h5>
            {topCourses.length > 0 ? (
              <ul className="list-group list-group-flush">
                {topCourses.map((c, i) => (
                  <li className="list-group-item d-flex justify-content-between" key={i}>
                    <span>{c.title}</span>
                    <span className="fw-bold">{c.students} students</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted p-4">
                <i className="fas fa-graduation-cap fa-2x mb-3"></i>
                <p>No course data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
