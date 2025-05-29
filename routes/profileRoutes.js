const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const UserAchievement = require('../models/UserAchievement');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // Получаем достижения пользователя
    const userAchievements = await UserAchievement.find({ user: req.user._id })
      .populate('achievement')
      .lean();

    // Получаем данные профиля
    const profileData = await profileController.getProfile(req);

    // Обрабатываем случай неавторизованного пользователя
    if (profileData.error && profileData.redirect) {
      req.flash('error', profileData.error);
      return res.redirect(profileData.redirect);
    }

    // Рендерим шаблон один раз
    res.render('profile', {
      ...profileData,
      userAchievements,
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  } catch (error) {
    console.error('Error in profile route:', error.message, error.stack);
    res.status(500).render('error', { message: 'Ошибка загрузки профиля' });
  }
});

router.post('/', authMiddleware, profileController.updateProfile);

module.exports = router;