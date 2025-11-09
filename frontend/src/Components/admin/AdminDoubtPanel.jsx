import React, { useEffect, useState } from "react";
import { getAllChats, deleteChat, deleteAllChats, getChatSocketUrl } from "../../Api/api";
import "../student/chatstyles.css";
import ChatRoom from "../student/ChatRoom";
import AdminLayout from "./AdminLayout";
import { io } from "socket.io-client";

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
    
    // Setup Socket.IO for real-time updates
    const socket = io(getChatSocketUrl());
    
    // Listen for admin-specific chat deletion events
    socket.on("admin_chat_deleted", (data) => {
      // If the deleted chat is currently selected, clear selection
      if (selectedChat && selectedChat._id === data.chatId) {
        setSelectedChat(null);
      }
      // Refresh chat list
      fetchChats();
    });

    // Listen for all chats deletion event
    socket.on("admin_all_chats_deleted", () => {
      setSelectedChat(null);
      fetchChats();
    });
    
    // Listen for new messages to update chat list
    socket.on("receive_message", fetchChats);
    socket.on("chat_closed", fetchChats);
    
    const timer = setInterval(fetchChats, 4000);
    
    return () => {
      clearInterval(timer);
      socket.off("admin_chat_deleted");
      socket.off("admin_all_chats_deleted");
      socket.off("receive_message");
      socket.off("chat_closed");
      socket.disconnect();
    };
  }, [selectedChat]);

  const deleteChatHandler = async (id, e) => {
    // Stop event from triggering parent click
    e.stopPropagation();

    if (window.confirm("Delete this chat permanently?")) {
      try {
        await deleteChat(id);
        // Clear selection if the deleted chat was selected
        if (selectedChat && selectedChat._id === id) {
          setSelectedChat(null);
        }
        // Fetch updated chat list
        fetchChats();
        alert("Chat deleted successfully!");
      } catch (error) {
        console.error("Failed to delete chat:", error);
        alert("Failed to delete chat. Please try again.");
      }
    }
  };

  const deleteAllChatsHandler = async () => {
    if (window.confirm("Are you sure you want to delete ALL chats permanently? This action cannot be undone!")) {
      try {
        const response = await deleteAllChats();
        setSelectedChat(null);
        fetchChats();
        alert(`Successfully deleted ${response.data.deletedCount} chats!`);
      } catch (error) {
        console.error("Failed to delete all chats:", error);
        alert("Failed to delete all chats. Please try again.");
      }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2>Your Doubt Dashboard</h2>
          <p>All doubts from the students will appear below (auto-refresh)</p>
        </div>
        {chats.length > 0 && (
          <button 
            onClick={deleteAllChatsHandler}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
          >
            🗑️ Delete All Chats
          </button>
        )}
      </div>
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
