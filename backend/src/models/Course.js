// models/Course.js
const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ["video", "pdf", "document", "quiz"], required: true },
  title: String,
  s3Key: String,
  quizId: String,
});

const weekSchema = new mongoose.Schema({
  weekNumber: Number,
  title: String,
  contents: [contentSchema],
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  thumbnail: String,
  weeks: [weekSchema],
});

module.exports = mongoose.model("Course", courseSchema);
