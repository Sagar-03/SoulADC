import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import ChatRoom from "./ChatRoom";
import "../student/chatstyles.css"; // ✅ Ensure CSS is imported

const socket = io("http://localhost:7001");

export default function Studentdoubt() {
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [firstMessage, setFirstMessage] = useState("");
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(
    JSON.parse(localStorage.getItem("activeChat")) || null
  );

  // ✅ Fetch user's open chats
  const fetchUserChats = async () => {
    if (!userName) return;
    const res = await axios.get(`http://localhost:7001/user-chats/${userName}`);
    setActiveChats(res.data);
  };

  // ✅ Socket listeners for live updates
  useEffect(() => {
    socket.on("receive_message", fetchUserChats);
    socket.on("chat_closed", fetchUserChats);
    return () => {
      socket.off("receive_message", fetchUserChats);
      socket.off("chat_closed", fetchUserChats);
    };
  }, [userName]);

  // ✅ Load chats whenever username changes
  useEffect(() => {
    if (userName) {
      localStorage.setItem("userName", userName);
      fetchUserChats();
    }
  }, [userName]);

  // ✅ Save selected chat persistently
  useEffect(() => {
    if (selectedChat)
      localStorage.setItem("activeChat", JSON.stringify(selectedChat));
    else localStorage.removeItem("activeChat");
  }, [selectedChat]);

  // ✅ Create new chat
  const createChat = async () => {
    if (!userName || !firstMessage.trim())
      return alert("Please enter your name and doubt before sending!");
    const res = await axios.post("http://localhost:7001/chat", {
      userName,
      firstMessage,
    });
    const chatObj = { _id: res.data.chatId };
    setSelectedChat(chatObj);
    setFirstMessage("");
    fetchUserChats();
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
    <div className="panel student-panel">
      <h2>Ask a Doubt 💭</h2>

      {/* ===== Doubt Form ===== */}
      <div className="student-form">
        <input
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <textarea
          placeholder="Type your doubt..."
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
        />

        <button onClick={createChat}>Send Doubt</button>
      </div>

      {/* ===== Active Doubts ===== */}
      {userName && (
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
                    <strong>{chat.userName}</strong>
                    <p>
                      {
                        chat.messages[chat.messages.length - 1]?.text ||
                        "No message"
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
