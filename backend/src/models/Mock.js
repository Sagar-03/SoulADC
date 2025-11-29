const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['text', 'oneWord', 'mcq'],
    default: 'mcq',
  },
  options: [{
    type: String,
  }],
  correctAnswer: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
  },
  orderIndex: {
    type: Number,
    default: 0,
  },
});

const mockSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  questions: [questionSchema],
  duration: {
    type: Number, // duration in minutes
    required: true,
    default: 60,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'live', 'ended'],
    default: 'draft',
  },
  liveAt: {
    type: Date,
  },
  endAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  showAnswersAfterEnd: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Calculate total marks before saving
mockSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

const Mock = mongoose.model('Mock', mockSchema);

module.exports = Mock;
