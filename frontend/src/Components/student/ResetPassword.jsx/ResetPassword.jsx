import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../Api/api";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match!");
      return;
    }

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      alert(data.message);
      navigate("/login");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>

        {message && <p className="status-msg">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
