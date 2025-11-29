const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answer: {
    type: String,
  },
  isCorrect: {
    type: Boolean,
  },
  marksAwarded: {
    type: Number,
    default: 0,
  },
});

const mockAttemptSchema = new mongoose.Schema({
  mockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mock',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [answerSchema],
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted'],
    default: 'in-progress',
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  exitFullscreenCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate marks and percentage before saving
mockAttemptSchema.pre('save', function(next) {
  if (this.answers && this.answers.length > 0) {
    this.marksObtained = this.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    if (this.totalMarks > 0) {
      this.percentage = ((this.marksObtained / this.totalMarks) * 100).toFixed(2);
    }
  }
  next();
});

const MockAttempt = mongoose.model('MockAttempt', mockAttemptSchema);

module.exports = MockAttempt;
