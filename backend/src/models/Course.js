// models/Course.js
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ["video", "pdf", "document", "quiz"], required: true },
  title: String,
  s3Key: String,
  quizId: String,
});

const daySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true, min: 1 },
  title: String,
  contents: [contentSchema],
});

const weekSchema = new mongoose.Schema({
  weekNumber: Number,
  title: String,
  days: [daySchema],
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  thumbnail: { type: String , required: false},
  weeks: [weekSchema],
  isLive: { type: Boolean, default: false },
});

module.exports = mongoose.model("Course", courseSchema);
