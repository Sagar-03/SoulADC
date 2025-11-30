// models/SharedContent.js
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

/**
 * SharedContent Model
 * Allows multiple courses to reference the same content structure
 * Update content once, reflects in all courses using it
 */
const sharedContentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Web Development Content"
  description: String,
  weeks: [weekSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update timestamp on save
sharedContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("SharedContent", sharedContentSchema);
