import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createMock } from '../../Api/api';
import { getAuthToken } from '../../utils/auth';
import AdminLayout from './AdminLayout';
import './MockStyles.css';

const CreateMock = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mockData, setMockData] = useState({
    title: '',
    description: '',
    duration: 60,
    scenarios: [],
    isPaid: true,
    price: '',
    cutPrice: '',
  });

  const [currentScenario, setCurrentScenario] = useState({
    tempId: null, // Temporary ID for folder organization
    title: '',
    description: '',
    images: [],
    imageFiles: [],
    orderIndex: 0,
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    tempId: null, // Temporary ID for folder organization
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
    orderIndex: 0,
    images: [],
    imageFiles: [],
  });

  const [editingScenarioIndex, setEditingScenarioIndex] = useState(null);

  const handleInputChange = (e) => {
    setMockData({
      ...mockData,
      [e.target.name]: e.target.value,
    });
  };

  // Generate a temporary unique ID for scenarios/questions before mock is created
  const generateTempId = () => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleQuestionChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      [e.target.name]: e.target.value,
    });
  };

  const handleScenarioChange = (e) => {
    setCurrentScenario({
      ...currentScenario,
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

  const handleScenarioImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image should be less than 5MB');
        return;
      }
    }

    // Limit to 3 images
    const maxImages = 3;
    const totalImages = currentScenario.images.length + files.length;
    if (totalImages > maxImages) {
      toast.error(`You can upload a maximum of ${maxImages} images per scenario`);
      return;
    }

    const newImageFiles = [...currentScenario.imageFiles, ...files];
    const newImageUrls = [...currentScenario.images, ...files.map(f => URL.createObjectURL(f))];

    setCurrentScenario({
      ...currentScenario,
      imageFiles: newImageFiles,
      images: newImageUrls,
    });
  };

  const removeScenarioImage = (index) => {
    const newImages = currentScenario.images.filter((_, i) => i !== index);
    const newImageFiles = currentScenario.imageFiles.filter((_, i) => i !== index);
    
    // Revoke the object URL to prevent memory leak
    if (currentScenario.images[index].startsWith('blob:')) {
      URL.revokeObjectURL(currentScenario.images[index]);
    }

    setCurrentScenario({
      ...currentScenario,
      images: newImages,
      imageFiles: newImageFiles,
    });
  };

  const handleQuestionImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image should be less than 5MB');
        return;
      }
    }

    // Limit to 3 images
    const maxImages = 3;
    const totalImages = currentQuestion.images.length + files.length;
    if (totalImages > maxImages) {
      toast.error(`You can upload a maximum of ${maxImages} images per question`);
      return;
    }

    const newImageFiles = [...currentQuestion.imageFiles, ...files];
    const newImageUrls = [...currentQuestion.images, ...files.map(f => URL.createObjectURL(f))];

    setCurrentQuestion({
      ...currentQuestion,
      imageFiles: newImageFiles,
      images: newImageUrls,
    });
  };

  const removeQuestionImage = (index) => {
    const newImages = currentQuestion.images.filter((_, i) => i !== index);
    const newImageFiles = currentQuestion.imageFiles.filter((_, i) => i !== index);
    
    // Revoke the object URL to prevent memory leak
    if (currentQuestion.images[index].startsWith('blob:')) {
      URL.revokeObjectURL(currentQuestion.images[index]);
    }

    setCurrentQuestion({
      ...currentQuestion,
      images: newImages,
      imageFiles: newImageFiles,
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

  const addQuestionToScenario = async () => {
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

    let uploadedImageKeys = [];

    // Upload question images if provided
    if (currentQuestion.imageFiles.length > 0) {
      try {
        const { uploadQuestionImage } = await import('../../Api/api');
        
        // Generate temp ID if not already set (for organizing uploads)
        const questionTempId = currentQuestion.tempId || generateTempId();
        const scenarioTempId = currentScenario.tempId || generateTempId();
        
        // Use a temp mockId since the mock isn't created yet
        const tempMockId = 'temp';
        
        for (const file of currentQuestion.imageFiles) {
          // Upload with organized structure: mock-questions/{tempMockId}/questions/{scenarioId}-{questionId}/
          const itemId = `${scenarioTempId}-${questionTempId}`;
          const response = await uploadQuestionImage(file, tempMockId, 'question', itemId);
          uploadedImageKeys.push(response.data.s3Key);
        }
        
        toast.success(`${uploadedImageKeys.length} image(s) uploaded successfully`);
      } catch (error) {
        console.error('Error uploading question images:', error);
        toast.error('Failed to upload question images');
        return;
      }
    }

    const newQuestion = {
      ...currentQuestion,
      tempId: currentQuestion.tempId || generateTempId(),
      orderIndex: currentScenario.questions.length,
      options: currentQuestion.questionType === 'mcq' 
        ? currentQuestion.options.filter(opt => opt.trim() !== '')
        : [],
      images: uploadedImageKeys,
    };

    setCurrentScenario({
      ...currentScenario,
      tempId: currentScenario.tempId || generateTempId(), // Ensure scenario has tempId
      questions: [...currentScenario.questions, newQuestion],
    });

    // Clean up blob URLs
    currentQuestion.images.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    // Reset current question
    setCurrentQuestion({
      tempId: null,
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      orderIndex: 0,
      images: [],
      imageFiles: [],
    });

    toast.success('Question added to scenario');
  };

  const removeQuestionFromScenario = (index) => {
    const updatedQuestions = currentScenario.questions.filter((_, i) => i !== index);
    setCurrentScenario({
      ...currentScenario,
      questions: updatedQuestions,
    });
    toast.info('Question removed from scenario');
  };

  const addScenario = async () => {
    if (!currentScenario.title.trim()) {
      toast.error('Scenario title is required');
      return;
    }

    if (!currentScenario.description.trim()) {
      toast.error('Scenario description is required');
      return;
    }

    if (currentScenario.questions.length === 0) {
      toast.error('Please add at least one question to the scenario');
      return;
    }

    let uploadedImageKeys = [];

    // Upload scenario images if provided
    if (currentScenario.imageFiles.length > 0) {
      try {
        const { uploadQuestionImage } = await import('../../Api/api');
        
        // Generate or use existing temp ID for the scenario
        const scenarioTempId = currentScenario.tempId || generateTempId();
        
        // Use a temp mockId since the mock isn't created yet
        const tempMockId = 'temp';
        
        for (const file of currentScenario.imageFiles) {
          // Upload with organized structure: mock-questions/{tempMockId}/scenarios/{scenarioId}/
          const response = await uploadQuestionImage(file, tempMockId, 'scenario', scenarioTempId);
          uploadedImageKeys.push(response.data.s3Key);
        }
        
        toast.success(`${uploadedImageKeys.length} image(s) uploaded successfully`);
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Failed to upload images');
        return;
      }
    }

    const newScenario = {
      tempId: currentScenario.tempId || generateTempId(),
      title: currentScenario.title,
      description: currentScenario.description,
      images: uploadedImageKeys,
      orderIndex: mockData.scenarios.length,
      questions: currentScenario.questions,
    };

    setMockData({
      ...mockData,
      scenarios: [...mockData.scenarios, newScenario],
    });

    // Clean up blob URLs
    currentScenario.images.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    // Reset current scenario
    setCurrentScenario({
      tempId: null,
      title: '',
      description: '',
      images: [],
      imageFiles: [],
      orderIndex: 0,
      questions: [],
    });

    toast.success('Scenario added to mock');
  };

  const removeScenario = (index) => {
    const updatedScenarios = mockData.scenarios.filter((_, i) => i !== index);
    setMockData({
      ...mockData,
      scenarios: updatedScenarios,
    });
    toast.info('Scenario removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mockData.title.trim()) {
      toast.error('Mock title is required');
      return;
    }

    if (mockData.scenarios.length === 0) {
      toast.error('Please add at least one scenario with questions');
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

        {/* Add Scenario Section */}
        <div className="form-section">
          <h3>Add Clinical Scenario</h3>
          
          <div className="form-group">
            <label>Scenario Title *</label>
            <input
              type="text"
              name="title"
              value={currentScenario.title}
              onChange={handleScenarioChange}
              placeholder="E.g., Clinical scenario 4"
            />
          </div>

          <div className="form-group">
            <label>Scenario Description *</label>
            <textarea
              name="description"
              value={currentScenario.description}
              onChange={handleScenarioChange}
              placeholder="Enter the clinical scenario description here..."
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Scenario Images (Max 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleScenarioImagesChange}
              style={{ display: 'none' }}
              id="scenario-images-upload"
            />
            {currentScenario.images.length < 3 && (
              <label htmlFor="scenario-images-upload" className="upload-image-btn">
                📷 Upload Images ({currentScenario.images.length}/3)
              </label>
            )}
            {currentScenario.images.length > 0 && (
              <div className="images-preview-grid">
                {currentScenario.images.map((img, index) => (
                  <div key={index} className="image-preview">
                    <img src={img} alt={`Scenario ${index + 1}`} />
                    <button 
                      type="button" 
                      onClick={() => removeScenarioImage(index)} 
                      className="remove-image-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <small>Max size: 5MB per image. Supported formats: JPG, PNG, GIF</small>
          </div>

          {/* Add Question to Scenario */}
          <div className="nested-section">
            <h4>Add Question to Scenario</h4>
            
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
              <label>Question Images (Max 3)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleQuestionImagesChange}
                style={{ display: 'none' }}
                id="question-images-upload"
              />
              {currentQuestion.images.length < 3 && (
                <label htmlFor="question-images-upload" className="upload-image-btn">
                  📷 Upload Images ({currentQuestion.images.length}/3)
                </label>
              )}
              {currentQuestion.images.length > 0 && (
                <div className="images-preview-grid">
                  {currentQuestion.images.map((img, index) => (
                    <div key={index} className="image-preview">
                      <img src={img} alt={`Question ${index + 1}`} />
                      <button 
                        type="button" 
                        onClick={() => removeQuestionImage(index)} 
                        className="remove-image-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <small>Max size: 5MB per image. Supported formats: JPG, PNG, GIF</small>
            </div>

            <button type="button" onClick={addQuestionToScenario} className="add-question-btn">
              + Add Question to Scenario
            </button>

            {/* Questions in Current Scenario */}
            {currentScenario.questions.length > 0 && (
              <div className="current-scenario-questions">
                <h5>Questions in this Scenario ({currentScenario.questions.length})</h5>
                {currentScenario.questions.map((q, index) => (
                  <div key={index} className="question-mini-card">
                    <span>Q{index + 1}. {q.questionText.substring(0, 50)}...</span>
                    <button
                      type="button"
                      onClick={() => removeQuestionFromScenario(index)}
                      className="remove-btn-mini"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={addScenario} className="add-scenario-btn">
            ✓ Add Scenario to Mock
          </button>
        </div>

        {/* Scenarios List */}
        {mockData.scenarios.length > 0 && (
          <div className="form-section">
            <h3>Scenarios Added ({mockData.scenarios.length})</h3>
            <div className="scenarios-list">
              {mockData.scenarios.map((scenario, sIndex) => (
                <div key={sIndex} className="scenario-card">
                  <div className="scenario-header">
                    <h4>Scenario {sIndex + 1}: {scenario.title}</h4>
                    <button
                      type="button"
                      onClick={() => removeScenario(sIndex)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <p className="scenario-description">{scenario.description}</p>
                  
                  {scenario.images && scenario.images.length > 0 && (
                    <div className="scenario-images-display">
                      {scenario.images.map((img, imgIndex) => {
                        const token = getAuthToken();
                        const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${img}${token ? `?token=${token}` : ''}`;
                        return (
                          <img 
                            key={imgIndex} 
                            src={imageUrl}
                            alt={`Scenario ${sIndex + 1} Image ${imgIndex + 1}`}
                            onError={(e) => {
                              console.error('Failed to load image:', img);
                              e.target.style.display = 'none';
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="scenario-questions">
                    <h5>{scenario.questions.length} Question(s)</h5>
                    {scenario.questions.map((question, qIndex) => (
                      <div key={qIndex} className="question-mini-preview">
                        <strong>Q{qIndex + 1}.</strong> {question.questionText}
                        {question.images && question.images.length > 0 && (
                          <span className="question-has-images" title={`${question.images.length} image(s)`}> 📷</span>
                        )}
                        <span className="question-marks-badge">{question.marks} marks</span>
                      </div>
                    ))}
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
