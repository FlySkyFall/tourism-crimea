const mongoose = require('mongoose');
const cron = require('node-cron');
const bookingController = require('../controllers/bookingController');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB for booking cleanup');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Запуск задачи каждую ночь в 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('Running cleanExpiredBookings task');
  await bookingController.cleanExpiredBookings();
});