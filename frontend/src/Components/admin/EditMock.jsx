import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMockById, updateMock } from '../../Api/api';
import { getAuthToken } from '../../utils/auth';
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
    scenarios: [],
    isPaid: true,
    price: 0,
    cutPrice: 0,
  });

  const [currentScenario, setCurrentScenario] = useState({
    title: '',
    description: '',
    images: [], // Now stores S3 keys directly after upload
    orderIndex: 0,
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
    orderIndex: 0,
    images: [],
  });

  const [editingScenarioIndex, setEditingScenarioIndex] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  useEffect(() => {
    fetchMock();
  }, [id]);

  const fetchMock = async () => {
    try {
      setLoading(true);
      const response = await getMockById(id);
      const mock = response.data.mock;
      
      // Check if mock is live or ended - prevent editing
      if (mock.status === 'live' || mock.status === 'ended') {
        toast.error(`Cannot edit a ${mock.status} mock. Only draft mocks can be edited.`);
        navigate('/admin/manage-mocks');
        return;
      }
      
      setMockData({
        title: mock.title,
        description: mock.description || '',
        duration: mock.duration,
        scenarios: mock.scenarios || [],
        isPaid: mock.isPaid !== undefined ? mock.isPaid : true,
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

  const handleScenarioImagesChange = async (e) => {
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

    // Upload images immediately and show loading state
    const uploadingToast = toast.info('Uploading images...', { autoClose: false });
    
    try {
      const { uploadQuestionImage } = await import('../../Api/api');
      const uploadedKeys = [];
      
      for (const file of files) {
        // Show blob preview immediately
        const blobUrl = URL.createObjectURL(file);
        setCurrentScenario(prev => ({
          ...prev,
          images: [...prev.images, blobUrl],
        }));
        
        // Upload in background
        const response = await uploadQuestionImage(file);
        uploadedKeys.push(response.data.s3Key);
        
        // Replace blob URL with S3 key
        setCurrentScenario(prev => ({
          ...prev,
          images: prev.images.map(img => img === blobUrl ? response.data.s3Key : img),
        }));
        
        URL.revokeObjectURL(blobUrl);
      }
      
      toast.dismiss(uploadingToast);
      toast.success(`${uploadedKeys.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.dismiss(uploadingToast);
      toast.error('Failed to upload images');
    }
  };

  const removeScenarioImage = (index) => {
    const imageToRemove = currentScenario.images[index];
    
    // Revoke the object URL to prevent memory leak (only for blob URLs)
    if (imageToRemove && imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }
    
    const newImages = currentScenario.images.filter((_, i) => i !== index);

    setCurrentScenario({
      ...currentScenario,
      images: newImages,
    });
  };

  const handleQuestionImagesChange = async (e) => {
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

    // Upload images immediately and show loading state
    const uploadingToast = toast.info('Uploading images...', { autoClose: false });
    
    try {
      const { uploadQuestionImage } = await import('../../Api/api');
      const uploadedKeys = [];
      
      for (const file of files) {
        // Show blob preview immediately
        const blobUrl = URL.createObjectURL(file);
        setCurrentQuestion(prev => ({
          ...prev,
          images: [...prev.images, blobUrl],
        }));
        
        // Upload in background
        const response = await uploadQuestionImage(file);
        uploadedKeys.push(response.data.s3Key);
        
        // Replace blob URL with S3 key
        setCurrentQuestion(prev => ({
          ...prev,
          images: prev.images.map(img => img === blobUrl ? response.data.s3Key : img),
        }));
        
        URL.revokeObjectURL(blobUrl);
      }
      
      toast.dismiss(uploadingToast);
      toast.success(`${uploadedKeys.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading question images:', error);
      toast.dismiss(uploadingToast);
      toast.error('Failed to upload question images');
    }
  };

  const removeQuestionImage = (index) => {
    const imageToRemove = currentQuestion.images[index];
    
    // Revoke the object URL to prevent memory leak (only for blob URLs)
    if (imageToRemove && imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove);
    }
    
    const newImages = currentQuestion.images.filter((_, i) => i !== index);

    setCurrentQuestion({
      ...currentQuestion,
      images: newImages,
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

  const addQuestionToScenario = () => {
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

    // Check if any images are still uploading (blob URLs)
    const hasUploadingImages = currentQuestion.images.some(img => img.startsWith('blob:'));
    if (hasUploadingImages) {
      toast.warning('Please wait for images to finish uploading');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      orderIndex: editingQuestionIndex !== null ? currentQuestion.orderIndex : currentScenario.questions.length,
      options: currentQuestion.questionType === 'mcq' 
        ? currentQuestion.options.filter(opt => opt.trim() !== '')
        : [],
      images: currentQuestion.images || [],
    };

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...currentScenario.questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setCurrentScenario({
        ...currentScenario,
        questions: updatedQuestions,
      });
      toast.success('Question updated');
      setEditingQuestionIndex(null);
    } else {
      // Add new question
      setCurrentScenario({
        ...currentScenario,
        questions: [...currentScenario.questions, newQuestion],
      });
      toast.success('Question added to scenario');
    }

    // Reset current question
    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      orderIndex: 0,
      images: [],
    });
  };

  const editQuestionInScenario = (index) => {
    const question = currentScenario.questions[index];
    setCurrentQuestion({
      ...question,
      options: question.questionType === 'mcq' 
        ? [...question.options, '', '', '', ''].slice(0, Math.max(4, question.options.length))
        : ['', '', '', ''],
      images: question.images || [],
    });
    setEditingQuestionIndex(index);
    window.scrollTo({ 
      top: document.querySelector('.nested-section')?.offsetTop - 100 || 0, 
      behavior: 'smooth' 
    });
  };

  const removeQuestionFromScenario = (index) => {
    const updatedQuestions = currentScenario.questions.filter((_, i) => i !== index);
    setCurrentScenario({
      ...currentScenario,
      questions: updatedQuestions,
    });
    toast.info('Question removed from scenario');
    
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setCurrentQuestion({
        questionText: '',
        questionType: 'mcq',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1,
        orderIndex: 0,
        images: [],
      });
    }
  };

  const addOrUpdateScenario = () => {
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

    // Check if any images are still uploading (blob URLs)
    const hasUploadingImages = currentScenario.images.some(img => img.startsWith('blob:'));
    if (hasUploadingImages) {
      toast.warning('Please wait for images to finish uploading');
      return;
    }

    // All images are already S3 keys at this point
    const scenarioData = {
      title: currentScenario.title,
      description: currentScenario.description,
      images: currentScenario.images, // Already S3 keys
      orderIndex: editingScenarioIndex !== null ? currentScenario.orderIndex : mockData.scenarios.length,
      questions: currentScenario.questions,
    };

    if (editingScenarioIndex !== null) {
      // Update existing scenario
      const updatedScenarios = [...mockData.scenarios];
      updatedScenarios[editingScenarioIndex] = scenarioData;
      setMockData({
        ...mockData,
        scenarios: updatedScenarios,
      });
      toast.success('Scenario updated');
      setEditingScenarioIndex(null);
    } else {
      // Add new scenario
      setMockData({
        ...mockData,
        scenarios: [...mockData.scenarios, scenarioData],
      });
      toast.success('Scenario added to mock');
    }

    // Reset current scenario
    setCurrentScenario({
      title: '',
      description: '',
      images: [],
      orderIndex: 0,
      questions: [],
    });
  };

  const editScenario = (index) => {
    const scenario = mockData.scenarios[index];
    
    // Keep the original S3 keys for images (don't convert to display URLs)
    setCurrentScenario({
      title: scenario.title,
      description: scenario.description,
      images: scenario.images || [], // Keep original S3 keys
      orderIndex: scenario.orderIndex,
      questions: scenario.questions || [],
    });
    setEditingScenarioIndex(index);
    window.scrollTo({ top: document.querySelector('.form-section')?.offsetTop || 0, behavior: 'smooth' });
  };

  const cancelScenarioEdit = () => {
    setEditingScenarioIndex(null);
    setEditingQuestionIndex(null);
    // Clean up only blob URLs (not S3 keys)
    currentScenario.images.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    currentQuestion.images.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setCurrentScenario({
      title: '',
      description: '',
      images: [],
      orderIndex: 0,
      questions: [],
    });
    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      orderIndex: 0,
      images: [],
    });
  };

  const removeScenario = (index) => {
    const updatedScenarios = mockData.scenarios.filter((_, i) => i !== index);
    setMockData({
      ...mockData,
      scenarios: updatedScenarios,
    });
    toast.info('Scenario removed');
    
    if (editingScenarioIndex === index) {
      cancelScenarioEdit();
    }
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

        {/* Add/Edit Scenario Section */}
        <div className="form-section">
          <h3>{editingScenarioIndex !== null ? 'Edit Clinical Scenario' : 'Add Clinical Scenario'}</h3>
          
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
                {currentScenario.images.map((img, index) => {
                  // Display existing images from S3 or new blob URLs
                  let imageUrl;
                  if (img.startsWith('blob:') || img.startsWith('http')) {
                    imageUrl = img;
                  } else {
                    // It's an S3 key, encode it and add token
                    const token = getAuthToken();
                    const encodedKey = encodeURIComponent(img);
                    imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${encodedKey}${token ? `?token=${token}` : ''}`;
                  }
                  
                  return (
                    <div key={index} className="image-preview">
                      <img 
                        src={imageUrl} 
                        alt={`Scenario ${index + 1}`}
                        onError={(e) => {
                          console.error('Failed to load preview image:', img, 'URL:', imageUrl);
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23f0f0f0" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeScenarioImage(index)} 
                        className="remove-image-btn"
                        title="Remove this image"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
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
                  {currentQuestion.images.map((img, index) => {
                    const token = getAuthToken();
                    const isS3Key = !img.startsWith('blob:') && !img.startsWith('http');
                    const encodedKey = isS3Key ? encodeURIComponent(img) : img;
                    const imageUrl = isS3Key 
                      ? `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${encodedKey}${token ? `?token=${token}` : ''}`
                      : img;
                    return (
                      <div key={index} className="image-preview">
                        <img 
                          src={imageUrl} 
                          alt={`Question ${index + 1}`}
                          onError={(e) => {
                            console.error('Failed to load question image:', img, 'URL:', imageUrl);
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23f0f0f0" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeQuestionImage(index)} 
                          className="remove-image-btn"
                          title="Remove this image"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <small>Max size: 5MB per image. Supported formats: JPG, PNG, GIF</small>
            </div>

            <button type="button" onClick={addQuestionToScenario} className="add-question-btn">
              {editingQuestionIndex !== null ? '✓ Update Question' : '+ Add Question to Scenario'}
            </button>
            
            {editingQuestionIndex !== null && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingQuestionIndex(null);
                  setCurrentQuestion({
                    questionText: '',
                    questionType: 'mcq',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    marks: 1,
                    orderIndex: 0,
                    images: [],
                  });
                }} 
                className="cancel-btn"
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            )}

            {/* Questions in Current Scenario */}
            {currentScenario.questions.length > 0 && (
              <div className="current-scenario-questions">
                <h5>Questions in this Scenario ({currentScenario.questions.length})</h5>
                {currentScenario.questions.map((q, index) => (
                  <div key={index} className={`question-mini-card ${editingQuestionIndex === index ? 'editing' : ''}`}>
                    <span>Q{index + 1}. {q.questionText.substring(0, 50)}...</span>
                    <div className="question-mini-actions">
                      <button
                        type="button"
                        onClick={() => editQuestionInScenario(index)}
                        className="edit-btn-mini"
                        title="Edit question"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestionFromScenario(index)}
                        className="remove-btn-mini"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="question-actions">
            <button type="button" onClick={addOrUpdateScenario} className="add-scenario-btn">
              {editingScenarioIndex !== null ? '✓ Update Scenario' : '✓ Add Scenario to Mock'}
            </button>
            {editingScenarioIndex !== null && (
              <button type="button" onClick={cancelScenarioEdit} className="cancel-btn">
                Cancel Edit
              </button>
            )}
          </div>
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
                    <div className="scenario-actions-btns">
                      <button
                        type="button"
                        onClick={() => editScenario(sIndex)}
                        className="edit-btn"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => removeScenario(sIndex)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <p className="scenario-description">{scenario.description}</p>
                  
                  {scenario.images && scenario.images.length > 0 && (
                    <div className="scenario-images-display">
                      {scenario.images.map((img, imgIndex) => {
                        const token = getAuthToken();
                        // Check if it's a blob URL, full HTTP URL, or S3 key
                        let imageUrl;
                        if (img.startsWith('blob:') || img.startsWith('http')) {
                          imageUrl = img;
                        } else {
                          // It's an S3 key
                          imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${img}${token ? `?token=${token}` : ''}`;
                        }
                        
                        return (
                          <img 
                            key={imgIndex} 
                            src={imageUrl}
                            alt={`Scenario ${sIndex + 1} Image ${imgIndex + 1}`}
                            onError={(e) => {
                              console.error('Failed to load image:', imageUrl);
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
