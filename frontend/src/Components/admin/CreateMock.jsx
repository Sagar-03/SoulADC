import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createMock } from '../../Api/api';
import AdminLayout from './AdminLayout';
import './MockStyles.css';

const CreateMock = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mockData, setMockData] = useState({
    title: '',
    description: '',
    duration: 60,
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
    orderIndex: 0,
  });

  const handleInputChange = (e) => {
    setMockData({
      ...mockData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuestionChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      [e.target.name]: e.target.value,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (!currentQuestion.correctAnswer.trim()) {
      toast.error('Correct answer is required');
      return;
    }

    if (currentQuestion.questionType === 'mcq') {
      const filledOptions = currentQuestion.options.filter(opt => opt.trim() !== '');
      if (filledOptions.length < 2) {
        toast.error('Please provide at least 2 options for MCQ');
        return;
      }
    }

    const newQuestion = {
      ...currentQuestion,
      orderIndex: mockData.questions.length,
      options: currentQuestion.questionType === 'mcq' 
        ? currentQuestion.options.filter(opt => opt.trim() !== '')
        : [],
    };

    setMockData({
      ...mockData,
      questions: [...mockData.questions, newQuestion],
    });

    // Reset current question
    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      orderIndex: 0,
    });

    toast.success('Question added');
  };

  const removeQuestion = (index) => {
    const updatedQuestions = mockData.questions.filter((_, i) => i !== index);
    setMockData({
      ...mockData,
      questions: updatedQuestions,
    });
    toast.info('Question removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mockData.title.trim()) {
      toast.error('Mock title is required');
      return;
    }

    if (mockData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      setLoading(true);
      await createMock(mockData);
      toast.success('Mock created successfully');
      navigate('/admin/manage-mocks');
    } catch (error) {
      console.error('Error creating mock:', error);
      toast.error(error.response?.data?.message || 'Failed to create mock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="create-mock-container">
        <div className="create-mock-header">
          <h2>Create New Mock Exam</h2>
          <button onClick={() => navigate('/admin/manage-mocks')} className="back-btn">
            ← Back to Mocks
          </button>
        </div>

      <form onSubmit={handleSubmit} className="create-mock-form">
        {/* Basic Info */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Mock Title *</label>
            <input
              type="text"
              name="title"
              value={mockData.title}
              onChange={handleInputChange}
              placeholder="E.g., Physics Mock Test 1"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={mockData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the mock exam"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes) *</label>
            <input
              type="number"
              name="duration"
              value={mockData.duration}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>
        </div>

        {/* Add Question Section */}
        <div className="form-section">
          <h3>Add Question</h3>
          
          <div className="form-group">
            <label>Question Text *</label>
            <textarea
              name="questionText"
              value={currentQuestion.questionText}
              onChange={handleQuestionChange}
              placeholder="Enter your question here"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Question Type *</label>
            <select
              name="questionType"
              value={currentQuestion.questionType}
              onChange={handleQuestionChange}
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="text">Text Answer</option>
              <option value="oneWord">One Word Answer</option>
            </select>
          </div>

          {currentQuestion.questionType === 'mcq' && (
            <div className="form-group">
              <label>Options</label>
              {currentQuestion.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="option-input"
                />
              ))}
            </div>
          )}

          <div className="form-group">
            <label>Correct Answer *</label>
            {currentQuestion.questionType === 'mcq' ? (
              <select
                name="correctAnswer"
                value={currentQuestion.correctAnswer}
                onChange={handleQuestionChange}
              >
                <option value="">Select correct option</option>
                {currentQuestion.options
                  .filter(opt => opt.trim() !== '')
                  .map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                name="correctAnswer"
                value={currentQuestion.correctAnswer}
                onChange={handleQuestionChange}
                placeholder="Enter the correct answer"
              />
            )}
          </div>

          <div className="form-group">
            <label>Marks *</label>
            <input
              type="number"
              name="marks"
              value={currentQuestion.marks}
              onChange={handleQuestionChange}
              min="1"
            />
          </div>

          <button type="button" onClick={addQuestion} className="add-question-btn">
            + Add Question
          </button>
        </div>

        {/* Questions List */}
        {mockData.questions.length > 0 && (
          <div className="form-section">
            <h3>Questions Added ({mockData.questions.length})</h3>
            <div className="questions-list">
              {mockData.questions.map((question, index) => (
                <div key={index} className="question-card">
                  <div className="question-header">
                    <h4>Q{index + 1}. {question.questionText}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="question-details">
                    <span className="question-type">{question.questionType.toUpperCase()}</span>
                    <span className="question-marks">{question.marks} marks</span>
                  </div>
                  {question.questionType === 'mcq' && (
                    <div className="question-options">
                      {question.options.map((opt, i) => (
                        <div key={i} className={opt === question.correctAnswer ? 'correct-option' : ''}>
                          {i + 1}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="correct-answer">
                    Correct Answer: <strong>{question.correctAnswer}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Mock'}
          </button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
};

export default CreateMock;
