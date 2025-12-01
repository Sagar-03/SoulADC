import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMockById, updateMock } from '../../Api/api';
import AdminLayout from './AdminLayout';
import './MockStyles.css';

const EditMock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mockData, setMockData] = useState({
    title: '',
    description: '',
    duration: 60,
    questions: [],
    isPaid: false,
    price: 0,
    cutPrice: 0,
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
    orderIndex: 0,
    imageUrl: '',
    imageFile: null,
  });

  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    fetchMock();
  }, [id]);

  const fetchMock = async () => {
    try {
      setLoading(true);
      const response = await getMockById(id);
      const mock = response.data.mock;
      setMockData({
        title: mock.title,
        description: mock.description || '',
        duration: mock.duration,
        questions: mock.questions,
        isPaid: mock.isPaid || false,
        price: mock.price || 0,
        cutPrice: mock.cutPrice || 0,
      });
    } catch (error) {
      console.error('Error fetching mock:', error);
      toast.error('Failed to load mock');
      navigate('/admin/manage-mocks');
    } finally {
      setLoading(false);
    }
  };

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setCurrentQuestion({
        ...currentQuestion,
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      });
    }
  };

  const removeImage = () => {
    if (currentQuestion.imageUrl && currentQuestion.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentQuestion.imageUrl);
    }
    setCurrentQuestion({
      ...currentQuestion,
      imageFile: null,
      imageUrl: '',
    });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ''],
    });
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length <= 2) {
      toast.error('At least 2 options are required for MCQ');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const addOrUpdateQuestion = async () => {
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

    let imageUrl = currentQuestion.imageUrl;

    // Upload image if new file provided
    if (currentQuestion.imageFile) {
      try {
        const { uploadQuestionImage, getStreamUrl } = await import('../../Api/api');
        const response = await uploadQuestionImage(currentQuestion.imageFile);
        const s3Key = response.data.s3Key;
        // Store s3Key for database, but use stream URL for preview
        imageUrl = s3Key;
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
        return;
      }
    }

    const newQuestion = {
      ...currentQuestion,
      options: currentQuestion.questionType === 'mcq' 
        ? currentQuestion.options.filter(opt => opt.trim() !== '')
        : [],
      imageUrl,
      imageFile: undefined,
    };

    if (editingIndex !== null) {
      // Update existing question
      const updatedQuestions = [...mockData.questions];
      updatedQuestions[editingIndex] = newQuestion;
      setMockData({
        ...mockData,
        questions: updatedQuestions,
      });
      toast.success('Question updated');
      setEditingIndex(null);
    } else {
      // Add new question
      newQuestion.orderIndex = mockData.questions.length;
      setMockData({
        ...mockData,
        questions: [...mockData.questions, newQuestion],
      });
      toast.success('Question added');
    }

    // Reset current question
    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      orderIndex: 0,
      imageUrl: '',
      imageFile: null,
    });
  };

  const editQuestion = (index) => {
    const question = mockData.questions[index];
    setCurrentQuestion({
      ...question,
      options: question.questionType === 'mcq' 
        ? [...question.options, '', '', '', ''].slice(0, Math.max(4, question.options.length))
        : ['', '', '', ''],
      imageUrl: question.imageUrl || '',
      imageFile: null,
    });
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = mockData.questions.filter((_, i) => i !== index);
    setMockData({
      ...mockData,
      questions: updatedQuestions,
    });
    toast.info('Question removed');
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentQuestion({
        questionText: '',
        questionType: 'mcq',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1,
        orderIndex: 0,
      });
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    if (currentQuestion.imageUrl && currentQuestion.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentQuestion.imageUrl);
    }
    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      orderIndex: 0,
      imageUrl: '',
      imageFile: null,
    });
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
      setUpdating(true);
      await updateMock(id, mockData);
      toast.success('Mock updated successfully');
      navigate('/admin/manage-mocks');
    } catch (error) {
      console.error('Error updating mock:', error);
      toast.error(error.response?.data?.message || 'Failed to update mock');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading mock...</div>;
  }

  return (
    <AdminLayout>
      <div className="create-mock-container">
        <div className="create-mock-header">
          <h2>Edit Mock Exam</h2>
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

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={mockData.isPaid}
                onChange={(e) => setMockData({ ...mockData, isPaid: e.target.checked })}
              />
              {' '}This is a Paid Mock (Students with purchased courses get free access)
            </label>
            <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
              Note: All mocks are paid by default. Students who purchased any course can access all mocks for free.
            </small>
          </div>

          {mockData.isPaid && (
            <>
              <div className="form-group">
                <label>Price (AUD) *</label>
                <input
                  type="number"
                  name="price"
                  value={mockData.price}
                  onChange={(e) => setMockData({ ...mockData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 49.99"
                  required
                />
              </div>

              <div className="form-group">
                <label>Original Price (Cut Price) - Optional</label>
                <input
                  type="number"
                  name="cutPrice"
                  value={mockData.cutPrice}
                  onChange={(e) => setMockData({ ...mockData, cutPrice: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 99.99"
                />
                <small>Show discount by displaying original price</small>
              </div>
            </>
          )}
        </div>

        {/* Add/Edit Question Section */}
        <div className="form-section">
          <h3>{editingIndex !== null ? 'Edit Question' : 'Add Question'}</h3>
          
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
                <div key={index} className="option-input-wrapper">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="option-input"
                  />
                  {currentQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="remove-option-btn"
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="add-option-btn">
                + Add Option
              </button>
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

          <div className="form-group">
            <label>Question Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              id="question-image-upload"
            />
            {!currentQuestion.imageUrl ? (
              <label htmlFor="question-image-upload" className="upload-image-btn">
                📷 Upload Image
              </label>
            ) : (
              <div className="image-preview">
                <img src={currentQuestion.imageUrl} alt="Question" />
                <button type="button" onClick={removeImage} className="remove-image-btn">
                  ✕ Remove Image
                </button>
              </div>
            )}
            <small>Max size: 5MB. Supported formats: JPG, PNG, GIF</small>
          </div>

          <div className="question-actions">
            <button type="button" onClick={addOrUpdateQuestion} className="add-question-btn">
              {editingIndex !== null ? '✓ Update Question' : '+ Add Question'}
            </button>
            {editingIndex !== null && (
              <button type="button" onClick={cancelEdit} className="cancel-btn">
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        {mockData.questions.length > 0 && (
          <div className="form-section">
            <h3>Questions ({mockData.questions.length})</h3>
            <div className="questions-list">
              {mockData.questions.map((question, index) => (
                <div key={index} className={`question-card ${editingIndex === index ? 'editing' : ''}`}>
                  <div className="question-header">
                    <h4>Q{index + 1}. {question.questionText}</h4>
                    <div className="question-actions-btns">
                      <button
                        type="button"
                        onClick={() => editQuestion(index)}
                        className="edit-btn"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {question.imageUrl && (
                    <div className="question-image">
                      <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${question.imageUrl}`} alt="Question" />
                    </div>
                  )}
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
          <button type="submit" disabled={updating} className="submit-btn">
            {updating ? 'Updating...' : 'Update Mock'}
          </button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
};

export default EditMock;
