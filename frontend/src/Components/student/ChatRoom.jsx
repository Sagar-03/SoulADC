import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./chatstyles.css";

const socket = io("http://localhost:7001");

export default function ChatRoom({ chatId, senderRole, onBack, onDelete }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const scrollRef = useRef(null);

  // ✅ Join chat & load messages
  useEffect(() => {
    console.log("Joining chat:", chatId, "as:", senderRole);
    socket.emit("join_chat", chatId);

    axios.get(`http://localhost:7001/chat/${chatId}`).then((res) => {
      console.log("Loaded chat data:", res.data);
      setMessages(res.data.messages);
      setIsClosed(res.data.isClosed);
    });

    socket.on("receive_message", (msgs) => {
      console.log("Received messages:", msgs);
      setMessages(msgs);
    });
    socket.on("chat_closed", () => setIsClosed(true));

    return () => {
      socket.off("receive_message");
      socket.off("chat_closed");
    };
  }, [chatId]);

  // ✅ Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ Send message
  const sendMessage = () => {
    if (text.trim() && !isClosed) {
      console.log("Sending message:", { chatId, sender: senderRole, text });
      socket.emit("send_message", { chatId, sender: senderRole, text });
      setText("");
    }
  };

  // ✅ Close chat (admin only)
  const closeChat = () => {
    socket.emit("close_chat", chatId);
    setIsClosed(true);
  };

  return (
    <div className="chat-overlay">
      <div className="chat-modal">
        {/* ===== Header ===== */}
        <div className="chat-header">
          <h3>{senderRole === "admin" ? "Chat with User" : "Chat with Admin"}</h3>
          <div className="chat-header-buttons">
            <button onClick={onBack}>← Back</button>
            {senderRole === "admin" && (
              <>
                <button onClick={closeChat}>Close Chat</button>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this chat permanently?")) {
                        onDelete(chatId);
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ===== Messages ===== */}
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((msg, index) => {
            // Determine if message is from current user (me) or other person
            const isMyMessage = msg.senderRole === senderRole;
            const bubbleClass = isMyMessage ? "user" : "admin";

            return (
              <div key={index} className={`chat-bubble ${bubbleClass}`}>
                {msg.text}
              </div>
            );
          })}
        </div>

        {/* ===== Closed Notice ===== */}
        {isClosed && (
          <div className="closed-banner">
            This chat has been closed by the admin.
          </div>
        )}

        {/* ===== Input Area ===== */}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isClosed}
          />
          <button onClick={sendMessage} disabled={isClosed}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
