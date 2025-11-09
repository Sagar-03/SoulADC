const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    let authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(400).json({ message: 'Token is not valid' });
        }
    } else {
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }
};

// Modified protect middleware for streaming routes that accepts token from query params
const protectStream = (req, res, next) => {
    let token;
    let authHeader = req.headers.authorization || req.headers.Authorization;

    // First try to get token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // If no token in header, try query parameter
    else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(400).json({ message: 'Token is not valid' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Admins only' });
    }
};

module.exports = { protect, adminOnly, protectStream };
