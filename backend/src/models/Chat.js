const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userName: String,
  messages: [
    {
      senderRole: String, // ✅ not "sender"
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  isClosed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", chatSchema);

