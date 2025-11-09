const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Chat = require("../models/Chat"); // 👈 import Chat model

const router = express.Router();

// Store io instance
let ioInstance = null;

// Function to set io instance
const setIoInstance = (io) => {
  ioInstance = io;
};

// ✅ Create uploads/chat folder if missing
const uploadDir = path.join(process.cwd(), "uploads", "chat");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ✅ Upload image
router.post("/chat-image/:chatId/:senderRole", upload.single("file"), async (req, res) => {
  try {
    console.log("📸 Image upload request received");
    console.log("Chat ID:", req.params.chatId);
    console.log("Sender Role:", req.params.senderRole);
    console.log("File info:", req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : "No file");
    
    const { chatId, senderRole } = req.params;
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/chat/${req.file.filename}`;
    console.log("Generated file URL:", fileUrl);

    // ✅ Save message to MongoDB
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log("❌ Chat not found:", chatId);
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.messages.push({
      senderRole,
      text: "",
      media: { type: "image", url: fileUrl },
    });

    await chat.save();
    console.log("✅ Image upload successful:", fileUrl);

    // Broadcast updated messages via socket
    if (ioInstance) {
      ioInstance.to(chatId).emit("receive_message", chat.messages);
    }

    return res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error("❌ Image upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ✅ Upload audio
router.post("/chat-audio", upload.single("file"), async (req, res) => {
  try {
    console.log("🎵 Audio upload request received");
    console.log("Body:", req.body);
    console.log("File info:", req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : "No file");
    
    const { chatId, senderRole } = req.body;
    if (!req.file) {
      console.log("❌ No audio file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/chat/${req.file.filename}`;
    console.log("Generated audio file URL:", fileUrl);

    // ✅ Save message to MongoDB
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log("❌ Chat not found:", chatId);
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.messages.push({
      senderRole,
      text: "",
      media: { type: "audio", url: fileUrl },
    });

    await chat.save();
    console.log("✅ Audio upload successful:", fileUrl);

    // Broadcast updated messages via socket
    if (ioInstance) {
      ioInstance.to(chatId).emit("receive_message", chat.messages);
    }

    return res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error("❌ Audio upload error:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
});

module.exports = { router, setIoInstance };
