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

// ✅ Database connection
dBConnect();

const app = express();


// ✅ Middleware
app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('API is running...');
// }); 

// ✅ CORS configuration
// ✅ CORS configuration (fixed version)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://souladc.com', 'https://www.souladc.com', 'http://localhost:5173'];

console.log('CORS allowed:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS:', origin);
      callback(null, false); // ← don’t throw an error — just block silently
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
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
app.listen(PORT, '0.0.0.0', () => {    // ← 👈 Important for Render
});
