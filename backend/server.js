require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/event', require('./routes/eventRoutes'));
app.use('/api/guests', require('./routes/guestRoutes'));
app.use('/api/checklist', require('./routes/checklistRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/bookings', require('./routes/consultantBookingRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/ideas', require('./routes/ideaRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Eventora API running on port ${PORT}`));