const User = require("../models/userModel");
const Mock = require("../models/Mock");

/**
 * Middleware to check if user has valid access to a mock
 * Free mocks (isPaid = false) are accessible to all users
 * Paid mocks (isPaid = true) require purchase
 */
const checkMockAccess = async (req, res, next) => {
  try {
    const mockId = req.params.mockId || req.params.id;
    const userId = req.user.id;

    if (!mockId) {
      return res.status(400).json({ error: "Mock ID is required" });
    }

    // Find the mock
    const mock = await Mock.findById(mockId);
    if (!mock) {
      return res.status(404).json({ error: "Mock not found" });
    }

    // If mock is free, allow access
    if (!mock.isPaid) {
      req.mockAccess = {
        hasAccess: true,
        isFree: true,
        mock: mock
      };
      return next();
    }

    // Mock is paid, check if user has purchased it
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the purchased mock entry
    const purchasedMock = user.purchasedMocks.find(
      (pm) => pm.mockId.toString() === mockId.toString()
    );

    if (!purchasedMock) {
      return res.status(403).json({
        error: "Access denied. You need to purchase this mock to access it.",
        hasAccess: false,
        reason: "not_purchased",
        mock: {
          _id: mock._id,
          title: mock.title,
          description: mock.description,
          price: mock.price,
          cutPrice: mock.cutPrice,
          isPaid: mock.isPaid
        }
      });
    }

    // User has valid access - attach purchase info to request
    req.mockAccess = {
      hasAccess: true,
      isFree: false,
      purchaseDate: purchasedMock.purchaseDate,
      paymentAmount: purchasedMock.paymentAmount,
      mock: mock
    };

    next();
  } catch (error) {
    console.error("❌ Mock access check error:", error);
    res.status(500).json({ error: "Failed to verify mock access" });
  }
};

/**
 * Helper function to check if user has access to a mock (non-middleware version)
 * Returns { hasAccess: boolean, reason: string, isFree: boolean }
 */
const checkUserMockAccess = async (userId, mockId) => {
  try {
    const mock = await Mock.findById(mockId);
    if (!mock) {
      return { hasAccess: false, reason: "mock_not_found" };
    }

    // If mock is free, allow access
    if (!mock.isPaid) {
      return { hasAccess: true, reason: "free", isFree: true };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { hasAccess: false, reason: "user_not_found" };
    }

    const purchasedMock = user.purchasedMocks.find(
      (pm) => pm.mockId.toString() === mockId.toString()
    );

    if (!purchasedMock) {
      return { 
        hasAccess: false, 
        reason: "not_purchased",
        isFree: false,
        price: mock.price,
        cutPrice: mock.cutPrice
      };
    }

    return {
      hasAccess: true,
      reason: "purchased",
      isFree: false,
      purchaseDate: purchasedMock.purchaseDate,
      paymentAmount: purchasedMock.paymentAmount
    };
  } catch (error) {
    console.error("❌ Error checking mock access:", error);
    return { hasAccess: false, reason: "error", error: error.message };
  }
};

module.exports = { checkMockAccess, checkUserMockAccess };
