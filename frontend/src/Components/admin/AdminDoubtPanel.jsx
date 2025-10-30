import React, { useEffect, useState } from "react";
import axios from "axios";
import "../student/chatstyles.css";
import ChatRoom from "../student/ChatRoom";
import AdminLayout from "./AdminLayout";

export default function Adminchat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const fetchChats = async () => {
    const res = await axios.get("http://localhost:7001/chats");
    setChats(res.data);
  };

  useEffect(() => {
    fetchChats();
    const timer = setInterval(fetchChats, 4000);
    return () => clearInterval(timer);
  }, []);

  const deleteChat = async (id, e) => {
    // Stop event from triggering parent click
    e.stopPropagation();

    if (window.confirm("Delete this chat permanently?")) {
      await axios.delete(`http://localhost:7001/chat/${id}`);
      fetchChats();
    }
  };

  if (selectedChat)
    return (
      <ChatRoom
        chatId={selectedChat._id}
        senderRole="admin"
        onBack={() => setSelectedChat(null)}
        onDelete={() => {
          fetchChats();
          setSelectedChat(null);
        }}
      />
    );

  return (
    <AdminLayout>
    <div className="panel">
      <h2>Your Doubt Dashboard</h2>
      <p>All doubts from the students will appear below (auto-refresh)</p>
      <div className="chat-list">
        {chats.length === 0 && (
          <p style={{ textAlign: "center", color: "#888" }}>No doubts yet...</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`chat-item ${chat.isClosed ? "closed" : ""}`}
            onClick={() => setSelectedChat(chat)}
          >
            <div className="chat-info">
              <strong>{chat.userName || "Anonymous"}</strong>
              <p>{chat.messages[0]?.text?.slice(0, 60) || "No message yet"}</p>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => deleteChat(chat._id, e)}
              title="Delete Chat"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
      </AdminLayout>
  );
}
