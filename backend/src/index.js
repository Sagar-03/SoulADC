// ===================== IMPORTS =====================
const express = require("express");
const dotenv = require("dotenv").config();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

// ✅ Existing Imports (Don’t Touch)
const dBConnect = require("./config/dbConnect");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/upload.js");
const streamRoutes = require("./routes/stream.js");
const multipartUploadRoutes = require("./routes/multipartUpload.js");
// const doubtRoutes = require("./routes/doubtRoutes.js");
// const Doubt = require("./models/Chat.js");

// ✅ New Chat Model
const Chat = require("./models/Chat.js");
const { router: chatUploadRoutes, setIoInstance } = require("./routes/chatUploadRoutes");

// ===================== CONFIG =====================

// ✅ Connect to Database (existing logic)
dBConnect();

// ===================== APP + SERVER =====================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Set io instance for chat upload routes
setIoInstance(io);

// ===================== TIMEOUTS =====================
app.use((req, res, next) => {
  req.setTimeout(7200000);
  res.setTimeout(7200000);
  next();
});

// ===================== MIDDLEWARE =====================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ===================== CORS =====================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["https://souladc.com", "https://www.souladc.com", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("🚫 Blocked by CORS:", origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Content-Length"],
    optionsSuccessStatus: 200,
  })
);

// ===================== EXISTING ROUTES =====================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/multipart-upload", multipartUploadRoutes);
// app.use("/api/doubts", doubtRoutes);

// ===================== CHAT SOCKET.IO =====================

// Helper: Validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

io.on("connection", (socket) => {
  console.log("🟢 Chat connected:", socket.id);

  // Join chat room
  socket.on("join_chat", async (chatId) => {
    if (!isValidObjectId(chatId)) return;
    socket.join(chatId);

    const chat = await Chat.findById(chatId);
    if (chat) socket.emit("receive_message", chat.messages);
  });

  // Handle new message
  socket.on("send_message", async ({ chatId, sender, text, media, audioUrl }) => {
    if (!isValidObjectId(chatId)) return;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.isClosed) return;

    const messageData = { senderRole: sender, text: text || "" };
    
    // Handle media (image)
    if (media) {
      messageData.media = media;
    }
    
    // Handle audio (for backward compatibility)
    if (audioUrl) {
      messageData.media = { type: "audio", url: audioUrl };
    }

    chat.messages.push(messageData);
    await chat.save();

    io.to(chatId).emit("receive_message", chat.messages);
  });

  // Close chat
  socket.on("close_chat", async (chatId) => {
    if (!isValidObjectId(chatId)) return;

    const chat = await Chat.findById(chatId);
    if (!chat) return;

    chat.isClosed = true;
    await chat.save();
    io.to(chatId).emit("chat_closed");
  });

  socket.on("disconnect", () => {
    console.log("🔴 Chat disconnected:", socket.id);
  });
});

// ===================== CHAT REST ROUTES =====================

// Create new chat
app.post("/api/chat", async (req, res) => {
  try {
    const { userName, firstMessage } = req.body;

    const chat = new Chat({
      userName,
      messages: [{ senderRole: "user", text: firstMessage }],
    });

    await chat.save();
    res.json({ chatId: chat._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Get all chats (admin)
app.get("/api/chats", async (req, res) => {
  const chats = await Chat.find().sort({ createdAt: -1 });
  res.json(chats);
});

// Get single chat
app.get("/api/chat/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });
  const chat = await Chat.findById(id);
  res.json(chat);
});

// Get open chats for user
app.get("/api/user-chats/:userName", async (req, res) => {
  const { userName } = req.params;
  const chats = await Chat.find({ userName, isClosed: false });
  res.json(chats);
});

// Delete chat (admin)
app.delete("/api/chat/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });
  await Chat.findByIdAndDelete(id);
  res.json({ success: true });
});

app.use("/upload", chatUploadRoutes);
app.use("/uploads", express.static("uploads"));

// ===================== SERVER START =====================
const PORT = process.env.PORT || 7001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.timeout = 7200000;
server.keepAliveTimeout = 7200000;
server.headersTimeout = 7200000;
