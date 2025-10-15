import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { getStudentDoubts, sendStudentDoubt } from "../../Api/api";
import { getCookie } from "../../utils/cookies";
import "../../Pages/Doubt.css";

const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
  withCredentials: true,
});

export default function StudentDoubtPanel({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const userId = currentUser?._id; // Use user id (MongoDB _id)
  const userName = currentUser?.name || "Student";

  useEffect(() => {
    // Fetch existing doubts from API
    if (userId) {
      getStudentDoubts(userId).then((res) => {
        if (res.data.length > 0) setMessages(res.data[0].messages);
      });
    }

    // Listen for live updates
    socket.on("doubt_update", (doubt) => {
      if (doubt.userId === userId) setMessages(doubt.messages);
    });

    socket.on("doubt_closed", (id) => {
      setMessages([]);
    });

    return () => {
      socket.off("doubt_update");
      socket.off("doubt_closed");
    };
  }, [userId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    socket.emit("send_doubt", { studentId: userId, studentName: userName, message });
    setMessage("");
  };

  return (
    <div className="dashboard student-doubt">
      <h2>Your Doubt Section</h2>
      <div className="chat-box">
        {messages.length === 0 ? (
          <p className="no-msg">No messages yet.</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`msg ${msg.sender === "student" ? "sent" : "received"}`}
            >
              {msg.message}
            </div>
          ))
        )}
      </div>

      <div className="input-box">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your doubt..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
