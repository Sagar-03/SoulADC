import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAllDoubts, replyToDoubt, closeDoubt } from "../../Api/api";
import "../../Pages/Doubt.css";

const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
    withCredentials: true,
});

export default function AdminDoubtPanel() {
    const [doubts, setDoubts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState("");

    useEffect(() => {
        getAllDoubts().then((res) => setDoubts(res.data));

        socket.on("doubt_update", (updatedDoubt) => {
            setDoubts((prev) => {
                const exists = prev.find((d) => d._id === updatedDoubt._id);
                return exists
                    ? prev.map((d) => (d._id === updatedDoubt._id ? updatedDoubt : d))
                    : [updatedDoubt, ...prev];
            });
        });

        socket.on("doubt_closed", (id) =>
            setDoubts((prev) => prev.filter((d) => d._id !== id))
        );

        return () => {
            socket.off("doubt_update");
            socket.off("doubt_closed");
        };
    }, []);

    const sendReply = async () => {
        if (!reply.trim() || !selected) return;
        socket.emit("admin_reply", { doubtId: selected._id, message: reply });
        setReply("");
    };

    const handleClose = async (id) => {
        socket.emit("close_doubt", id);
    };

    return (
        <div className="dashboard admin-doubt">
            <h2>Admin Doubt Dashboard</h2>
            <div className="admin-layout">
                <div className="doubt-list">
                    {doubts.map((d) => (
                        <div
                            key={d._id}
                            className={`doubt-item ${selected?._id === d._id ? "active" : ""}`}
                            onClick={() => setSelected(d)}
                        >
                            <p><strong>{d.studentName}</strong></p>
                            <small>Status: {d.status}</small>
                        </div>
                    ))}
                </div>

                <div className="chat-area">
                    {selected ? (
                        <>
                            <div className="chat-box">
                                {selected.messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`msg ${msg.sender === "admin" ? "sent" : "received"
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                ))}
                            </div>
                            <div className="input-box">
                                <input
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Reply..."
                                />
                                <button onClick={sendReply}>Send</button>
                                <button
                                    className="close-btn"
                                    onClick={() => handleClose(selected._id)}
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="no-msg">Select a doubt to view messages</p>
                    )}
                </div>
            </div>
        </div>
    );
}
