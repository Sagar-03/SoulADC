const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userName: String,
  messages: [
    {
      senderRole: { type: String, enum: ["user", "admin"], required: true },
      text: { type: String, default: "" },
      media: {
        type: {
          type: String,
          enum: ["image", "audio", "video", null],
          default: null,
        },
        url: { type: String, default: null },
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isClosed: { type: Boolean, default: false },
});

module.exports = mongoose.model("Chat", chatSchema);
  