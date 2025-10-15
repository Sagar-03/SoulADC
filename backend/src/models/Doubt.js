const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["student", "admin"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const doubtSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  messages: [messageSchema],
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now, expires: "5d" }, // Auto-delete after 5 days
});

module.exports = mongoose.model("Doubt", doubtSchema);
