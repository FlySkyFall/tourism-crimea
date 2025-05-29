const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const { checkAchievements } = require('../services/achievementService');

router.get('/', tourController.getTours);
router.get('/filter', tourController.filterTours);
router.get('/:id', tourController.getTourById);
router.get('/:id/availability', tourController.getTourAvailability);
router.post(
  '/:id/reviews',
  authMiddleware,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Оценка должна быть от 1 до 5'),
    body('comment').trim().notEmpty().withMessage('Комментарий обязателен').isLength({ max: 500 }).withMessage('Комментарий не должен превышать 500 символов'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('tours/tour', {
        tour: req.tour,
        user: req.user || null,
        error: errors.array()[0].msg,
      });
    }
    try {
      await tourController.addReview(req, res);
      if (req.user) {
        await checkAchievements(req.user._id);
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;