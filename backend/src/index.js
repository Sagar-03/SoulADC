const express = require('express');
const dotenv = require('dotenv').config() ;
const dBConnect = require('./config/dbConnect');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

//database connection
dBConnect();

const app = express();

//express middleware
app.use(express.json());

//cors
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true, // enable cookies/headers if needed
}));

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

//start the server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});