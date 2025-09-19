const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

//only admin can access this route  
router.get('/admin', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Welcome Admin' });
});

//only manager can access this route  
router.get('/manager', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Welcome Manager' });
}); 

//only user can access this route  
router.get('/user', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Welcome User' });
}); 
module.exports = router;