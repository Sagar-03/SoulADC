import React from "react";
import AdminLayout from "./AdminLayout";

const Dashboard = () => {
  // Hardcoded stats (replace with API later)
  const stats = [
    { label: "Total Courses", value: 12 },
    { label: "Total Students", value: 250 },
    { label: "Active Enrollments", value: 180 },
    { label: "Revenue (₹)", value: "1,20,000" },
  ];

  return (
    <AdminLayout>
      <h2 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Admin Dashboard
      </h2>

      <div className="row g-4">
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
    </AdminLayout>
  );
};

export default Dashboard;
