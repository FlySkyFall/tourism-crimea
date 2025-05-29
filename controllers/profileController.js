const User = require('../models/User');
const Booking = require('../models/Booking');

exports.getProfile = async (req) => {
  try {
    if (!req.user) {
      return {
        error: 'Войдите в аккаунт для просмотра профиля',
        redirect: '/auth/login'
      };
    }

    // Convert Mongoose document to plain object if necessary
    const user = req.user.toObject ? req.user.toObject() : req.user;
    console.log('User data prepared for profile:', user); // Debugging

    const bookings = await Booking.find({ userId: req.user._id })
      .populate('tourId')
      .lean();

    return {
      user,
      bookings,
      message: req.flash('success') || req.flash('error')
    };
  } catch (error) {
    console.error('Error in getProfile:', error.message, error.stack);
    throw error;
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Войдите в аккаунт для редактирования профиля');
      return res.redirect('/auth/login');
    }

    const { firstName, lastName, phone, preferences } = req.body;
    const preferencesArray = preferences ? preferences.split(',').map(p => p.trim()) : [];

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.phone': phone,
        'profile.preferences': preferencesArray,
        updatedAt: Date.now(),
      },
    });

    req.flash('success', 'Профиль успешно обновлён');
    res.redirect('/profile');
  } catch (error) {
    console.error('Error in updateProfile:', error.message, error.stack);
    req.flash('error', 'Ошибка при обновлении профиля');
    res.redirect('/profile');
  }
};