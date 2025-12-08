const Mock = require('../models/Mock');
const MockAttempt = require('../models/MockAttempt');
const User = require('../models/userModel');
const { checkUserMockAccess } = require('../middleware/mockAccessMiddleware');

// Admin Controllers

// Create a new mock
exports.createMock = async (req, res) => {
  try {
    const { title, description, scenarios, questions, duration, isPaid, price, cutPrice } = req.body;

    // Handle the case where admin might not have a valid ObjectId
    let createdById = req.user.id;
    
    // If admin is using hardcoded credentials, find or create admin user
    if (createdById === 'admin') {
      const User = require('../models/userModel');
      let adminUser = await User.findOne({ email: 'admin@souladc.com' });
      
      if (!adminUser) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        adminUser = new User({
          name: 'Admin',
          email: 'admin@souladc.com',
          password: hashedPassword,
          role: 'admin'
        });
        await adminUser.save();
      }
      
      createdById = adminUser._id;
    }

    const mock = new Mock({
      title,
      description,
      scenarios: scenarios || [], // New scenario-based structure
      questions: questions || [], // Keep for backward compatibility
      duration: duration || 60,
      createdBy: createdById,
      status: 'draft',
      isPaid: isPaid !== undefined ? isPaid : true,
      price: price || 0,
      cutPrice: cutPrice || undefined,
    });

    await mock.save();

    res.status(201).json({
      success: true,
      message: 'Mock created successfully',
      mock,
    });
  } catch (error) {
    console.error('Error creating mock:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating mock',
      error: error.message,
    });
  }
};

// Get all mocks (Admin)
exports.getAllMocks = async (req, res) => {
  try {
    const mocks = await Mock.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      mocks,
    });
  } catch (error) {
    console.error('Error fetching mocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mocks',
      error: error.message,
    });
  }
};

// Get single mock
exports.getMockById = async (req, res) => {
  try {
    const { id } = req.params;
    const mock = await Mock.findById(id).populate('createdBy', 'name email');

    if (!mock) {
      return res.status(404).json({
        success: false,
        message: 'Mock not found',
      });
    }

    res.status(200).json({
      success: true,
      mock,
    });
  } catch (error) {
    console.error('Error fetching mock:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mock',
      error: error.message,
    });
  }
};

// Update mock
exports.updateMock = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const mock = await Mock.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!mock) {
      return res.status(404).json({
        success: false,
        message: 'Mock not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mock updated successfully',
      mock,
    });
  } catch (error) {
    console.error('Error updating mock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating mock',
      error: error.message,
    });
  }
};

// Delete mock
exports.deleteMock = async (req, res) => {
  try {
    const { id } = req.params;

    const mock = await Mock.findByIdAndDelete(id);

    if (!mock) {
      return res.status(404).json({
        success: false,
        message: 'Mock not found',
      });
    }

    // Also delete all attempts for this mock
    await MockAttempt.deleteMany({ mockId: id });

    res.status(200).json({
      success: true,
      message: 'Mock deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting mock:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting mock',
      error: error.message,
    });
  }
};

// Make mock live
exports.makeMockLive = async (req, res) => {
  try {
    const { id } = req.params;

    const mock = await Mock.findById(id);

    if (!mock) {
      return res.status(404).json({
        success: false,
        message: 'Mock not found',
      });
    }

    mock.status = 'live';
    mock.liveAt = new Date();
    await mock.save();

    res.status(200).json({
      success: true,
      message: 'Mock is now live',
      mock,
    });
  } catch (error) {
    console.error('Error making mock live:', error);
    res.status(500).json({
      success: false,
      message: 'Error making mock live',
      error: error.message,
    });
  }
};

// End mock
exports.endMock = async (req, res) => {
  try {
    const { id } = req.params;

    const mock = await Mock.findById(id);

    if (!mock) {
      return res.status(404).json({
        success: false,
        message: 'Mock not found',
      });
    }

    mock.status = 'ended';
    mock.endAt = new Date();
    await mock.save();

    // Auto-submit all in-progress attempts
    await MockAttempt.updateMany(
      { mockId: id, status: 'in-progress' },
      { status: 'auto-submitted', endTime: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Mock has ended',
      mock,
    });
  } catch (error) {
    console.error('Error ending mock:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending mock',
      error: error.message,
    });
  }
};

// Get mock statistics
exports.getMockStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const attempts = await MockAttempt.find({ mockId: id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    const mock = await Mock.findById(id);

    const statistics = {
      totalAttempts: attempts.length,
      submitted: attempts.filter(a => a.status === 'submitted' || a.status === 'auto-submitted').length,
      inProgress: attempts.filter(a => a.status === 'in-progress').length,
      averageMarks: attempts.length > 0 
        ? (attempts.reduce((sum, a) => sum + a.marksObtained, 0) / attempts.length).toFixed(2)
        : 0,
      averagePercentage: attempts.length > 0
        ? (attempts.reduce((sum, a) => sum + parseFloat(a.percentage), 0) / attempts.length).toFixed(2)
        : 0,
      attempts: attempts.map(a => ({
        studentName: a.studentId?.name || 'Unknown',
        studentEmail: a.studentId?.email || 'Unknown',
        marksObtained: a.marksObtained,
        totalMarks: a.totalMarks,
        percentage: a.percentage,
        status: a.status,
        startTime: a.startTime,
        endTime: a.endTime,
        exitFullscreenCount: a.exitFullscreenCount,
      })),
    };

    res.status(200).json({
      success: true,
      mock,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching mock statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mock statistics',
      error: error.message,
    });
  }
};

// Public Controllers

// Get all live mocks for public viewing (no auth required)
exports.getPublicMocks = async (req, res) => {
  try {
    const mocks = await Mock.find({ status: 'live' })
      .select('title description duration totalMarks scenarios questions isPaid price cutPrice status liveAt')
      .sort({ liveAt: -1 });

    // Map to include question count (support both scenario-based and legacy)
    const mocksWithCount = mocks.map(mock => {
      let questionCount = 0;
      if (mock.scenarios && mock.scenarios.length > 0) {
        questionCount = mock.scenarios.reduce((sum, scenario) => sum + scenario.questions.length, 0);
      } else if (mock.questions && mock.questions.length > 0) {
        questionCount = mock.questions.length;
      }

      return {
        _id: mock._id,
        title: mock.title,
        description: mock.description,
        duration: mock.duration,
        totalMarks: mock.totalMarks,
        isPaid: mock.isPaid,
        price: mock.price,
        cutPrice: mock.cutPrice,
        status: mock.status,
        liveAt: mock.liveAt,
        questions: { length: questionCount }
      };
    });

    res.status(200).json({
      success: true,
      mocks: mocksWithCount,
    });
  } catch (error) {
    console.error('Error fetching public mocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mocks',
      error: error.message,
    });
  }
};

// Student Controllers

// Get all live mocks for students
exports.getLiveMocks = async (req, res) => {
  try {
    const mocks = await Mock.find({ status: 'live' })
      .select('-questions.correctAnswer') // Don't send correct answers
      .sort({ liveAt: -1 });

    // Check if student has purchased any course
    const user = await User.findById(req.user.id);
    const hasPurchasedCourse = user.purchasedCourses && user.purchasedCourses.length > 0;

    // Check access and attempt status for each mock
    const mocksWithStatus = await Promise.all(
      mocks.map(async (mock) => {
        // Check if student has already attempted
        const attempt = await MockAttempt.findOne({
          mockId: mock._id,
          studentId: req.user.id,
        });

        // Students with purchased courses get free access to all mocks
        let hasAccess = hasPurchasedCourse;
        let isPurchased = hasPurchasedCourse;
        let isPending = false;
        
        // If student doesn't have a course, check if they purchased this specific mock
        if (!hasPurchasedCourse) {
          const purchasedMock = user.purchasedMocks.find(
            pm => pm.mockId.toString() === mock._id.toString()
          );
          hasAccess = !!purchasedMock;
          isPurchased = !!purchasedMock;
          
          // Check if mock purchase is pending approval
          if (!purchasedMock) {
            const pendingMock = user.pendingApprovals.find(
              pa => pa.mockId && pa.mockId.toString() === mock._id.toString() && 
                    pa.itemType === 'mock' && pa.status === 'pending'
            );
            isPending = !!pendingMock;
          }
        }

        return {
          ...mock.toObject(),
          hasAttempted: !!attempt,
          attemptStatus: attempt?.status || null,
          attemptId: attempt?._id || null,
          hasAccess: hasAccess,
          isPurchased: isPurchased,
          isPending: isPending,
          isLocked: !hasAccess,
          accessReason: hasPurchasedCourse ? 'course_access' : (isPurchased ? 'mock_purchased' : (isPending ? 'pending_approval' : 'locked')),
        };
      })
    );

    res.status(200).json({
      success: true,
      mocks: mocksWithStatus,
    });
  } catch (error) {
    console.error('Error fetching live mocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live mocks',
      error: error.message,
    });
  }
};

// Get past mocks for students
exports.getPastMocks = async (req, res) => {
  try {
    const attempts = await MockAttempt.find({ 
      studentId: req.user.id,
      status: { $in: ['submitted', 'auto-submitted'] }
    })
      .populate('mockId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    console.error('Error fetching past mocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching past mocks',
      error: error.message,
    });
  }
};

// Get missed mocks for students
exports.getMissedMocks = async (req, res) => {
  try {
    const endedMocks = await Mock.find({ status: 'ended' });

    const missedMocks = [];
    for (const mock of endedMocks) {
      const attempt = await MockAttempt.findOne({
        mockId: mock._id,
        studentId: req.user.id,
      });

      if (!attempt) {
        missedMocks.push(mock);
      }
    }

    res.status(200).json({
      success: true,
      mocks: missedMocks,
    });
  } catch (error) {
    console.error('Error fetching missed mocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching missed mocks',
      error: error.message,
    });
  }
};

// Start mock attempt
exports.startMockAttempt = async (req, res) => {
  try {
    const { mockId } = req.params;

    const mock = await Mock.findById(mockId);

    if (!mock) {
      return res.status(404).json({
        success: false,
        message: 'Mock not found',
      });
    }

    if (mock.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'This mock is not live',
      });
    }

    // Check if user has access to this mock
    // Students with purchased courses get free access
    const user = await User.findById(req.user.id);
    const hasPurchasedCourse = user.purchasedCourses && user.purchasedCourses.length > 0;
    
    let hasAccess = hasPurchasedCourse;
    
    // If no course purchased, check if mock was purchased individually
    if (!hasPurchasedCourse) {
      const purchasedMock = user.purchasedMocks.find(
        pm => pm.mockId.toString() === mockId.toString()
      );
      hasAccess = !!purchasedMock;
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase a course or this mock to attempt it',
        reason: 'not_purchased',
        price: mock.price,
        cutPrice: mock.cutPrice,
      });
    }

    // Check if already attempted
    const existingAttempt = await MockAttempt.findOne({
      mockId,
      studentId: req.user.id,
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this mock',
        attempt: existingAttempt,
      });
    }

    const attempt = new MockAttempt({
      mockId,
      studentId: req.user.id,
      startTime: new Date(),
      totalMarks: mock.totalMarks,
      status: 'in-progress',
    });

    await attempt.save();

    // Send mock without correct answers
    const mockData = mock.toObject();
    mockData.questions = mockData.questions.map(q => ({
      ...q,
      correctAnswer: undefined, // Remove correct answer
    }));

    res.status(200).json({
      success: true,
      message: 'Mock attempt started',
      attempt,
      mock: mockData,
    });
  } catch (error) {
    console.error('Error starting mock attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting mock attempt',
      error: error.message,
    });
  }
};

// Submit mock attempt
exports.submitMockAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;

    const attempt = await MockAttempt.findById(attemptId).populate('mockId');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    if (attempt.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'This attempt has already been submitted',
      });
    }

    const mock = attempt.mockId;

    // Evaluate answers
    const evaluatedAnswers = answers.map(ans => {
      const question = mock.questions.id(ans.questionId);
      
      if (!question) {
        return {
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: false,
          marksAwarded: 0,
        };
      }

      const isCorrect = ans.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

      return {
        questionId: ans.questionId,
        answer: ans.answer,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : 0,
      };
    });

    attempt.answers = evaluatedAnswers;
    attempt.endTime = new Date();
    attempt.status = 'submitted';
    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Mock submitted successfully',
      attempt,
    });
  } catch (error) {
    console.error('Error submitting mock attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting mock attempt',
      error: error.message,
    });
  }
};

// Update fullscreen exit count
exports.updateFullscreenExit = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await MockAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    if (attempt.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    attempt.exitFullscreenCount += 1;
    await attempt.save();

    res.status(200).json({
      success: true,
      exitCount: attempt.exitFullscreenCount,
    });
  } catch (error) {
    console.error('Error updating fullscreen exit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fullscreen exit',
      error: error.message,
    });
  }
};

// Get mock result
exports.getMockResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await MockAttempt.findById(attemptId).populate('mockId');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    if (attempt.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only show results if mock has ended and showAnswersAfterEnd is true
    if (attempt.mockId.status !== 'ended' && attempt.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Results not available yet',
      });
    }

    res.status(200).json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error('Error fetching mock result:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mock result',
      error: error.message,
    });
  }
};
