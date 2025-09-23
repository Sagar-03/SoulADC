const express = require('express');
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// only admin can access this route  
router.get('/admin', protect, (req, res) => {
    res.status(200).json({ message: 'Welcome Admin' });
});

// only manager can access this route  


// only user can access this route  
router.get('/user', protect, (req, res) => {
    res.status(200).json({ message: 'Welcome User' });
}); 

module.exports = router;
