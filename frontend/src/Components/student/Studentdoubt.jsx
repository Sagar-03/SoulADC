import React, { useEffect, useState } from "react";
import { createChat, getUserChats, getChatSocketUrl } from "../../Api/api";
import { getUser, isAuthenticated } from "../../utils/auth";
import io from "socket.io-client";
import ChatRoom from "./ChatRoom";
import "../student/chatstyles.css"; // ✅ Ensure CSS is imported
import StudentLayout from "./StudentLayout";

const socket = io(getChatSocketUrl()); 

export default function Studentdoubt() {
  const [firstMessage, setFirstMessage] = useState("");
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(
    JSON.parse(localStorage.getItem("activeChat")) || null
  );
  const [user, setUser] = useState(null);

  // ✅ Fetch user's open chats
  const fetchUserChats = async () => {
    if (!user || !isAuthenticated()) return;
    try {
      const res = await getUserChats();
      setActiveChats(res.data);
    } catch (error) {
      console.error("Failed to fetch user chats:", error);
      setActiveChats([]);
    }
  };

  // ✅ Initialize user on component mount
  useEffect(() => {
    if (isAuthenticated()) {  
      const currentUser = getUser();
      setUser(currentUser);
    }
  }, []);

  // ✅ Socket listeners for live updates
  useEffect(() => {
    socket.on("receive_message", fetchUserChats);
    socket.on("chat_closed", fetchUserChats);
    socket.on("chat_deleted", (data) => {
      // If the deleted chat is currently selected, clear selection
      if (selectedChat && selectedChat._id === data.chatId) {
        setSelectedChat(null);
        localStorage.removeItem("activeChat");
      }
      // Refresh chat list
      fetchUserChats();
    });
    
    return () => {
      socket.off("receive_message", fetchUserChats);
      socket.off("chat_closed", fetchUserChats);
      socket.off("chat_deleted");
    };
  }, [user, selectedChat]);

  // ✅ Load chats whenever user changes
  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  // ✅ Save selected chat persistently
  useEffect(() => {
    if (selectedChat)
      localStorage.setItem("activeChat", JSON.stringify(selectedChat));
    else localStorage.removeItem("activeChat");
  }, [selectedChat]);

  // ✅ Create new chat
  const createChatHandler = async () => {
    if (!user || !isAuthenticated()) {
      return alert("Please log in to ask a doubt!");
    }
    if (!firstMessage.trim()) {
      return alert("Please enter your doubt before sending!");
    }
    try {
      const res = await createChat(firstMessage);
      const chatObj = { _id: res.data.chatId };
      setSelectedChat(chatObj);
      setFirstMessage("");
      fetchUserChats();
    } catch (error) {
      console.error("Failed to create chat:", error);
      alert("Failed to create doubt. Please try again.");
    }
  };

  // ✅ Return to chat list
  const handleBack = () => {
    setSelectedChat(null);
    fetchUserChats();
  };

  // ✅ Render ChatRoom if chat selected
  if (selectedChat)
    return (
      <ChatRoom
        chatId={selectedChat._id}
        senderRole="user"
        onBack={handleBack}
      />
    );

  // ✅ Render Student Dashboard
return (
  <StudentLayout>
    <div className="panel student-panel">
      <h2>Ask Your Doubt 💭</h2>

      {/* ===== Doubt Form ===== */}
      <div className="student-form">
        {user && <p className="user-info">Logged in as: <strong>{user.email}</strong></p>}
        
        <div className="form-row">
          <textarea
            placeholder="Type your doubt here... Ask anything about your courses, concepts, or assignments."
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            rows={4}
          />

          <button onClick={createChatHandler}>Send Doubt</button>
        </div>
      </div>

      {/* ===== Active Doubts ===== */}
      {user && (
        <>
          <h3 style={{ marginTop: "25px" }}>Your Active Doubts</h3>
          <div className="chat-list">
            {activeChats.length === 0 ? (
              <p style={{ color: "#777", textAlign: "center" }}>
                No active doubts yet.
              </p>
            ) : (
              activeChats.map((chat) => (
                <div
                  key={chat._id}
                  className="chat-item"
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-info">
                    <strong>{chat.userEmail}</strong>
                    <p>
                      {chat.messages[chat.messages.length - 1]?.text || "No message"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  </StudentLayout>
);

}
