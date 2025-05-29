const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkAchievements } = require('../services/achievementService');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    await bookingController.createBooking(req, res);
    if (req.user) {
      await checkAchievements(req.user._id);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pay', authMiddleware, async (req, res, next) => {
  try {
    await bookingController.processPayment(req, res);
    if (req.user) {
      await checkAchievements(req.user._id);
    }
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware, bookingController.getUserBookings);
router.post('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.post('/clean-expired', bookingController.cleanExpiredBookings);
router.get('/tours/:id/availability', bookingController.getHotelAvailability);

module.exports = router;