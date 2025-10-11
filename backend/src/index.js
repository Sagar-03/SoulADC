const express = require('express');
const dotenv = require('dotenv').config();
const dBConnect = require('./config/dbConnect');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cors = require('cors');
const uploadRoutes = require('./routes/upload.js');
const streamRoutes = require('./routes/stream.js');

// Database connection
dBConnect();

const app = express();

// ✅ Log to verify on Render
console.log('CORS Origin allowed:', process.env.CORS_ORIGIN);

// ✅ Express middleware
app.use(express.json());

// ✅ CORS configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'https://souladc.com';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// ✅ Handle preflight OPTIONS requests globally
app.options('*', cors({
  origin: allowedOrigin,
  credentials: true,
}));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stream", streamRoutes);

// ✅ Start server
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
