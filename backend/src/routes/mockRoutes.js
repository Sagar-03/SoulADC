const express = require('express');
const router = express.Router();
const mockController = require('../controllers/mockController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin routes
router.post('/create', protect, adminOnly, mockController.createMock);
router.get('/all', protect, adminOnly, mockController.getAllMocks);
router.get('/admin/:id', protect, adminOnly, mockController.getMockById);
router.put('/update/:id', protect, adminOnly, mockController.updateMock);
router.delete('/delete/:id', protect, adminOnly, mockController.deleteMock);
router.patch('/live/:id', protect, adminOnly, mockController.makeMockLive);
router.patch('/end/:id', protect, adminOnly, mockController.endMock);
router.get('/statistics/:id', protect, adminOnly, mockController.getMockStatistics);

// Student routes
router.get('/live', protect, mockController.getLiveMocks);
router.get('/past', protect, mockController.getPastMocks);
router.get('/missed', protect, mockController.getMissedMocks);
router.post('/start/:mockId', protect, mockController.startMockAttempt);
router.post('/submit/:attemptId', protect, mockController.submitMockAttempt);
router.patch('/fullscreen-exit/:attemptId', protect, mockController.updateFullscreenExit);
router.get('/result/:attemptId', protect, mockController.getMockResult);

module.exports = router;
