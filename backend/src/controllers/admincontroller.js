// Admin controller - basic structure for future implementation

const getAdminStats = async (req, res) => {
  try {
    // You can implement admin statistics here later
    const stats = {
      totalUsers: 0,
      totalCourses: 0,
      totalEnrollments: 0,
      revenue: 0
    };
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin stats", error: error.message });
  }
};

module.exports = { getAdminStats };
