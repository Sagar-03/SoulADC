const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
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
            console.log("Decoded Token:", decoded);
            next();
        } catch (err) {
            console.error(err);
            return res.status(400).json({ message: 'Token is not valid' });
        }
    } else {
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }
};

module.exports = verifyToken;