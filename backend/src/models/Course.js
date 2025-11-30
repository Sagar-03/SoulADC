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
  documents: [contentSchema], // Module-level documents
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  cutPrice: { type: Number, required: false }, // Original/discounted price
  thumbnail: { type: String , required: false},
  durationMonths: { type: Number, required: true, min: 1 }, // Course validity duration
  
  // Content can be stored directly OR reference shared content
  weeks: [weekSchema], // Direct content (legacy/standalone courses)
  sharedContentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SharedContent',
    default: null 
  }, // Reference to shared content
  
  isLive: { type: Boolean, default: false },
});

module.exports = mongoose.model("Course", courseSchema);
