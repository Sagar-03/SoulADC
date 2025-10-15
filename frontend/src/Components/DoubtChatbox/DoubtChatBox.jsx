import React from "react";

export default function DoubtChatBox({ messages, userType }) {
  return (
    <div className="chat-box">
      {messages.length === 0 ? (
        <p className="no-msg">No messages yet.</p>
      ) : (
        messages.map((msg, i) => (
          <div
            key={i}
            className={`msg ${msg.sender === userType ? "sent" : "received"}`}
          >
            <span>{msg.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
