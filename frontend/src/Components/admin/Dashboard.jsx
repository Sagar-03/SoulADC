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

const Dashboard = () => {
  /** ----------------------------------------------------
   * 1. HARDCODED DATA
   * ---------------------------------------------------- */
  const [stats] = useState([
    { label: "Total Courses", value: 12 },
    { label: "Total Students", value: 250 },
    { label: "Active Enrollments", value: 180 },
    { label: "Revenue ($)", value: "120,000" },
  ]);

  const enrollmentTrend = [
    { month: "Jan", enrollments: 20 },
    { month: "Feb", enrollments: 35 },
    { month: "Mar", enrollments: 50 },
    { month: "Apr", enrollments: 60 },
    { month: "May", enrollments: 80 },
  ];

  const revenueTrend = [
    { month: "Jan", revenue: 20000 },
    { month: "Feb", revenue: 35000 },
    { month: "Mar", revenue: 50000 },
    { month: "Apr", revenue: 65000 },
    { month: "May", revenue: 80000 },
  ];

  const topCourses = [
    { title: "ADC Part 1", students: 120 },
    { title: "Periodontology Special", students: 80 },
    { title: "10-Month Prep", students: 50 },
  ];

  const recentStudents = [
    { name: "Shivam Gupta", course: "ADC Part 1", date: "15 Sep" },
    { name: "Riya Sharma", course: "Periodontology", date: "14 Sep" },
    { name: "Amit Kumar", course: "10-Month Prep", date: "12 Sep" },
  ];

  /** ----------------------------------------------------
   * 2. BACKEND FETCH VERSION (commented for now)
   * ----------------------------------------------------
   useEffect(() => {
     fetch("http://localhost:5000/api/admin/dashboard")
       .then((res) => res.json())
       .then((data) => {
         setStats(data.stats);
         setEnrollmentTrend(data.enrollmentTrend);
         setRevenueTrend(data.revenueTrend);
         setTopCourses(data.topCourses);
         setRecentStudents(data.recentStudents);
       })
       .catch((err) => console.error("Error fetching dashboard data:", err));
   }, []);
   */

  return (
    <AdminLayout>
      <h2 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Admin Dashboard
      </h2>

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
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#8B5E3C" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
              Revenue Trend ($)
            </h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8B5E3C" />
              </BarChart>
            </ResponsiveContainer>
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
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm p-3 h-100">
            <h5 className="fw-bold mb-3" style={{ color: "#5A3825" }}>
              Top Courses
            </h5>
            <ul className="list-group list-group-flush">
              {topCourses.map((c, i) => (
                <li className="list-group-item d-flex justify-content-between" key={i}>
                  <span>{c.title}</span>
                  <span className="fw-bold">{c.students} students</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
