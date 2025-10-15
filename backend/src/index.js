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
const multipartUploadRoutes = require('./routes/multipartUpload.js');

// ✅ Database connection
dBConnect();

const app = express();

// ✅ INCREASE TIMEOUT FOR LARGE FILE UPLOADS (2 hours = 7200000ms)
app.use((req, res, next) => {
  req.setTimeout(7200000); // 2 hours request timeout
  res.setTimeout(7200000); // 2 hours response timeout
  next();
});

// ✅ Middleware
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit

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
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH', 'OPTIONS'],
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
app.use("/api/multipart-upload", multipartUploadRoutes);

// ✅ Start server
const PORT = process.env.PORT || 7001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ SET SERVER TIMEOUT TO 2 HOURS
server.timeout = 7200000; // 2 hours
server.keepAliveTimeout = 7200000; // 2 hours
server.headersTimeout = 7200000; // 2 hours
