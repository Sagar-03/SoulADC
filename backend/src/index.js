const express = require('express');
const dotenv = require('dotenv').config();
const dBConnect = require('./config/dbConnect');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');


const uploadRoutes = require('./routes/upload.js');
const adminnewRoutes = require("./routes/adminRoutes");
const streamRoutes = require('./routes/stream.js');




//database connection
dBConnect();

const app = express();

//express middleware
app.use(express.json());

//cors
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.CORS_ORIGIN
  ].filter(Boolean), // Remove any undefined values
  credentials: true, // enable cookies/headers if needed
}));

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stream", streamRoutes);


//start the server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});