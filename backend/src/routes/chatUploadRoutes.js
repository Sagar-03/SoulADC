const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Chat = require("../models/Chat"); // 👈 import Chat model

const router = express.Router();

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
    const { chatId, senderRole } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/chat/${req.file.filename}`;

    // ✅ Save message to MongoDB
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    chat.messages.push({
      senderRole,
      text: "",
      media: { type: "image", url: fileUrl },
    });

    await chat.save();

    return res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error("❌ Image upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ✅ Upload audio
router.post("/chat-audio", upload.single("file"), async (req, res) => {
  try {
    const { chatId, senderRole } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/chat/${req.file.filename}`;

    // ✅ Save message to MongoDB
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    chat.messages.push({
      senderRole,
      text: "",
      media: { type: "audio", url: fileUrl },
    });

    await chat.save();

    return res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error("❌ Audio upload error:", err);
    res.status(500).json({ error: "Failed to upload audio" });
  }
});

module.exports = router;
