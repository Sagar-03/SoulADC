import React, { useEffect, useState } from "react";
import { getAllChats, deleteChat } from "../../Api/api";
import "../student/chatstyles.css";
import ChatRoom from "../student/ChatRoom";
import AdminLayout from "./AdminLayout";

export default function Adminchat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const fetchChats = async () => {
    try {
      const res = await getAllChats();
      setChats(res.data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      // Set empty array on error to prevent UI issues
      setChats([]);
    }
  };

  useEffect(() => {
    fetchChats();
    const timer = setInterval(fetchChats, 4000);
    return () => clearInterval(timer);
  }, []);

  const deleteChatHandler = async (id, e) => {
    // Stop event from triggering parent click
    e.stopPropagation();

    if (window.confirm("Delete this chat permanently?")) {
      await deleteChat(id);
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
              <strong>{chat.userEmail || "Anonymous"}</strong>
              <p>{chat.messages[0]?.text?.slice(0, 60) || "No message yet"}</p>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => deleteChatHandler(chat._id, e)}
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
