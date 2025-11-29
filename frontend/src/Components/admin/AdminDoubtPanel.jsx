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
      <div className="admin-doubt-panel">
        {/* Header Section */}
        <div className="admin-doubt-header">
          <div className="header-content">
            <h1 className="panel-title">Your Doubt Dashboard</h1>
            <p className="panel-subtitle">
              All doubts from the students will appear below (auto-refresh)
            </p>
          </div>
          {chats.length > 0 && (
            <button 
              className="delete-all-btn"
              onClick={deleteAllChatsHandler}
              title="Delete all chats permanently"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete All Chats
            </button>
          )}
        </div>

        {/* Chat List */}
        <div className="admin-chat-list">
          {chats.length === 0 ? (
            <div className="empty-state">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p className="empty-text">No doubts yet...</p>
              <p className="empty-subtext">Student doubts will appear here when submitted</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat._id}
                className={`admin-chat-card ${chat.isClosed ? "closed-chat" : ""}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-card-content">
                  <div className="chat-header-info">
                    <div className="user-avatar">
                      {(chat.userEmail || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-details">
                      <strong className="user-email">{chat.userEmail || "Anonymous"}</strong>
                      <p className="chat-preview">
                        {chat.messages[0]?.text?.slice(0, 80) || "No message yet"}
                        {chat.messages[0]?.text?.length > 80 && "..."}
                      </p>
                    </div>
                  </div>
                  <div className="chat-actions">
                    {chat.isClosed && (
                      <span className="status-badge closed-badge">Closed</span>
                    )}
                    {!chat.isClosed && (
                      <span className="status-badge active-badge">Active</span>
                    )}
                    <button
                      className="icon-delete-btn"
                      onClick={(e) => deleteChatHandler(chat._id, e)}
                      title="Delete this chat"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
