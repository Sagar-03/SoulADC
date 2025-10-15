const express = require("express");
const dotenv = require("dotenv").config();
const dBConnect = require("./config/dbConnect");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cors = require("cors");
const uploadRoutes = require("./routes/upload.js");
const streamRoutes = require("./routes/stream.js");
const multipartUploadRoutes = require("./routes/multipartUpload.js");
const doubtRoutes = require("./routes/doubtRoutes.js");
const Doubt = require("./models/Doubt.js"); 
const http = require("http");
const { Server } = require("socket.io");

// ✅ Connect to Database
dBConnect();

const app = express();

// ✅ Timeouts (2 hours)
app.use((req, res, next) => {
  req.setTimeout(7200000);
  res.setTimeout(7200000);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ CORS Configuration
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
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/multipart-upload", multipartUploadRoutes);
app.use("/api/doubts", doubtRoutes); // ✅ Add Doubt API route

// ✅ Create HTTP + Socket.IO server
const PORT = process.env.PORT || 7001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// ✅ SOCKET.IO LOGIC
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // 🎓 Student sends a doubt
  socket.on("send_doubt", async ({ studentId, studentName, message }) => {
    try {
      let doubt = await Doubt.findOne({ studentId, status: "open" });
      if (!doubt) {
        doubt = new Doubt({
          studentId,
          studentName,
          messages: [{ sender: "student", message }],
        });
      } else {
        doubt.messages.push({ sender: "student", message });
      }
      await doubt.save();
      io.emit("doubt_update", doubt);
    } catch (err) {
      console.error("Error saving doubt:", err);
    }
  });

  // 🧑‍💼 Admin replies
  socket.on("admin_reply", async ({ doubtId, message }) => {
    try {
      const doubt = await Doubt.findById(doubtId);
      if (!doubt) return;
      doubt.messages.push({ sender: "admin", message });
      await doubt.save();
      io.emit("doubt_update", doubt);
    } catch (err) {
      console.error("Error replying:", err);
    }
  });

  // ✅ Admin closes a doubt
  socket.on("close_doubt", async (doubtId) => {
    try {
      await Doubt.findByIdAndUpdate(doubtId, { status: "closed" });
      io.emit("doubt_closed", doubtId);
    } catch (err) {
      console.error("Error closing doubt:", err);
    }
  });

  socket.on("disconnect", () => console.log("🔴 Disconnected:", socket.id));
});

// ✅ Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.timeout = 7200000;
server.keepAliveTimeout = 7200000;
server.headersTimeout = 7200000;
