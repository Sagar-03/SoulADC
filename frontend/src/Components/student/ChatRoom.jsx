import React, { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import io from "socket.io-client";
import { getChatById, uploadChatImage, uploadChatAudio, getChatSocketUrl } from "../../Api/api";
import "./chatstyles.css";

export default function ChatRoom({ chatId, senderRole, onBack, onDelete }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef(null);

  // ✅ Initialize socket connection and join chat & load messages
  useEffect(() => {
    const socketConnection = io(getChatSocketUrl());
    setSocket(socketConnection);

    socketConnection.emit("join_chat", chatId);

    getChatById(chatId).then((res) => {
      setMessages(res.data.messages);
      setIsClosed(res.data.isClosed);
    });

    socketConnection.on("receive_message", (msgs) => setMessages(msgs));
    socketConnection.on("chat_closed", () => setIsClosed(true));
    socketConnection.on("chat_deleted", (data) => {
      if (data.chatId === chatId) {
        // Chat was deleted by admin, go back to chat list
        toast.info("This chat has been deleted by an administrator.");
        onBack();
      }
    });

    return () => {
      socketConnection.off("receive_message");
      socketConnection.off("chat_closed");
      socketConnection.off("chat_deleted");
      socketConnection.disconnect();
    };
  }, [chatId]);

  // ✅ Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // ✅ Send text message
  const sendMessage = () => {
    if (text.trim() && !isClosed && socket) {
      socket.emit("send_message", { chatId, sender: senderRole, text });
      setText("");
    }
  };

  // ✅ Close chat (admin only)
  const closeChat = () => {
    if (socket) {
      socket.emit("close_chat", chatId);
      setIsClosed(true);
    }
  };

  // ✅ Upload photo (limit 5MB)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prevent duplicate uploads by checking if already uploading
    if (uploading) {
      console.log("Upload already in progress, ignoring duplicate request");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5 MB limit
      alert("Image size must be under 5MB");
      // Reset the input
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      console.log("Uploading image to chat:", chatId, "as", senderRole);
      const response = await uploadChatImage(chatId, senderRole, file);
      const data = response.data;
      
      if (data.success) {
        console.log("Image upload successful:", data.url);
        // Note: No need to emit socket message here since backend already saves the message
        // and the socket will broadcast the updated messages automatically
      } else {
        console.error("Image upload failed - server response:", data);
        alert("Image upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Image upload error - full error:", err);
      console.error("Error response:", err.response);
      const errorMessage = err.response?.data?.error || err.message || "Network error";
      alert("Image upload failed: " + errorMessage);
    } finally {
      setUploading(false);
      // Reset the file input after upload completes
      e.target.value = '';
    }
  };


  // ✅ Voice Recording (send as audio blob)
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorder.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        try {
          setUploading(true);
          console.log("Uploading audio to chat:", chatId, "as", senderRole);
          const response = await uploadChatAudio(chatId, senderRole, blob);
          const data = response.data;
          
          if (data.success) {
            console.log("Audio upload successful:", data.url);
            // Note: No need to emit socket message here since backend already saves the message
            // and the socket will broadcast the updated messages automatically
          } else {
            console.error("Audio upload failed - server response:", data);
            alert("Audio upload failed: " + (data.error || "Unknown error"));
          }
        } catch (err) {
          console.error("Audio upload error - full error:", err);
          console.error("Error response:", err.response);
          const errorMessage = err.response?.data?.error || err.message || "Network error";
          alert("Audio upload failed: " + errorMessage);
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied!");
    }
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
                      if (window.confirm("Delete this chat permanently?"))
                        onDelete(chatId);
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
            const isMyMessage = msg.senderRole === senderRole;
            const bubbleClass = isMyMessage ? "user" : "admin";

            return (
              <div key={index} className={`chat-bubble ${bubbleClass}`}>
                {/* Image Messages */}
                {msg.media?.type === "image" && msg.media?.url && (
                  <div className="chat-media-container">
                    <img
                      src={msg.media.url}
                      alt="attachment"
                      className="chat-image"
                      onClick={() => window.open(msg.media.url, '_blank')}
                      title="Click to view full size"
                    />
                    <div className="media-actions">
                      <button
                        className="media-action-btn view-btn"
                        onClick={() => window.open(msg.media.url, '_blank')}
                        title="View full size"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 5C7.59 5 4 8.59 4 13C4 17.41 7.59 21 12 21C16.41 21 20 17.41 20 13C20 8.59 16.41 5 12 5Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button
                        className="media-action-btn download-btn"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = msg.media.url;
                          link.download = `image-${Date.now()}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download image"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Support for legacy imageUrl field */}
                {msg.imageUrl && !msg.media?.url && (
                  <div className="chat-media-container">
                    <img
                      src={msg.imageUrl}
                      alt="attachment"
                      className="chat-image"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                      title="Click to view full size"
                    />
                    <div className="media-actions">
                      <button
                        className="media-action-btn view-btn"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                        title="View full size"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 5C7.59 5 4 8.59 4 13C4 17.41 7.59 21 12 21C16.41 21 20 17.41 20 13C20 8.59 16.41 5 12 5Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button
                        className="media-action-btn download-btn"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = msg.imageUrl;
                          link.download = `image-${Date.now()}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download image"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Audio Messages */}
                {msg.media?.type === "audio" && msg.media?.url && (
                  <div className="chat-audio-container">
                    <div className="audio-player">
                      <audio controls className="chat-audio" preload="metadata">
                        <source src={msg.media.url} type="audio/webm" />
                        <source src={msg.media.url} type="audio/mpeg" />
                        <source src={msg.media.url} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <span className="audio-label">🎤 Voice message</span>
                  </div>
                )}
                
                {/* Support for legacy audioUrl field */}
                {msg.audioUrl && !msg.media?.url && (
                  <div className="chat-audio-container">
                    <div className="audio-player">
                      <audio controls className="chat-audio" preload="metadata">
                        <source src={msg.audioUrl} type="audio/webm" />
                        <source src={msg.audioUrl} type="audio/mpeg" />
                        <source src={msg.audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <span className="audio-label">🎤 Voice message</span>
                  </div>
                )}

                {/* Text Messages */}
                {msg.text && <p>{msg.text}</p>}
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
            disabled={isClosed || uploading}
          />

          <label className="upload-btn image-upload-btn">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                fill="currentColor"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={isClosed || uploading}
            />
          </label>

          <button
            className={`mic-btn ${recording ? "recording" : ""}`}
            onClick={toggleRecording}
            disabled={isClosed || uploading}
            title={recording ? "Stop Recording" : "Start Voice Recording"}
          >
            {recording ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12V4C10 2.9 10.9 2 12 2ZM19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19ZM10 21H14V23H10V21Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          <button onClick={sendMessage} disabled={isClosed || uploading}>
            Send
          </button>
        </div>

        {uploading && <p className="uploading-text">Uploading...</p>}
      </div>
    </div>
  );
}
