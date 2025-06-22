const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = mongoose.model('Booking');
const Hotel = mongoose.model('Hotel');
const Tour = mongoose.model('Tour');
const User = mongoose.model('User');
const logger = require('../utils/logger');

// Middleware для проверки API-ключа отеля
const authenticateHotel = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const hotel = await Hotel.findOne({ apiKey }).select('_id');
    if (!hotel) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    req.hotelId = hotel._id; // Сохраняем hotelId для использования в маршруте
    next();
  } catch (error) {
    logger.error(`Hotel authentication error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/hotel/bookings - Получить бронирования отеля
router.get('/bookings', authenticateHotel, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const hotelId = req.hotelId;

    let query = { hotelId }; // Ищем бронирования, где hotelId совпадает

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate);
      }
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'email profile.firstName profile.lastName')
      .populate('tourId', 'title accommodation')
      .populate('hotelId', 'name')
      .lean();

    // Формируем ответ
    const response = bookings.map(booking => {
      const isTourBooking = booking.tourId && ['hotel', 'sanatorium'].includes(booking.tourId.accommodation?.type);
      return {
        bookingId: booking._id,
        startDate: booking.startDate,
        endDate: booking.endDate || null,
        roomType: booking.roomType || null,
        participants: booking.participants,
        user: {
          firstName: booking.userId?.profile?.firstName || 'N/A',
          lastName: booking.userId?.profile?.lastName || 'N/A',
          email: booking.userId?.email || 'N/A'
        },
        tour: isTourBooking ? { title: booking.tourId.title } : null
      };
    });

    res.json(response);
  } catch (error) {
    logger.error(`Error fetching bookings for hotel ${req.hotelId}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;