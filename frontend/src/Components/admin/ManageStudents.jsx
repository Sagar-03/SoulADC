import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";

const ManageStudents = () => {
  /** ----------------------------------------------------
   * 1. HARDCODED DATA
   * ---------------------------------------------------- */
  const [students, setStudents] = useState([
    { id: 1, name: "Shivam Gupta", email: "shivam@example.com", purchasedCourses: ["ADC Part 1"] },
    { id: 2, name: "Riya Sharma", email: "riya@example.com", purchasedCourses: ["Periodontology Special"] },
  ]);

  /** ----------------------------------------------------
   * 2. API FETCH VERSION
   * ---------------------------------------------------- */
  // useEffect(() => {
  //   fetch("http://localhost:5000/api/students")
  //     .then((res) => res.json())
  //     .then((data) => setStudents(data))
  //     .catch((err) => console.error("Error fetching students:", err));
  // }, []);

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Manage Students
      </h3>

      <table className="table table-striped shadow-sm bg-white">
        <thead style={{ background: "#8B5E3C", color: "white" }}>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Purchased Courses</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.purchasedCourses.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
};

export default ManageStudents;
