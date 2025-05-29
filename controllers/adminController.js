const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');

exports.getAdminDashboard = (req, res) => {
  res.render('admin/dashboard', {
    user: req.user,
    message: req.flash('success') || req.flash('error'),
  });
};

exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.find().lean();
    res.render('admin/tours', {
      tours,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getTours:', error.message, error.stack);
    req.flash('error', 'Ошибка загрузки туров');
    res.redirect('/admin');
  }
};

exports.getNewTour = (req, res) => {
  res.render('admin/tour-form', {
    user: req.user,
    tour: null,
    message: req.flash('success') || req.flash('error'),
  });
};

exports.createTour = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      durationDays,
      price,
      'location.region': locationRegion,
      'location.coordinates.lat': locationLat,
      'location.coordinates.lng': locationLng,
      'accommodation.name': accommodationName,
      'accommodation.type': accommodationType,
      minGroupSize,
      maxGroupSize,
      'season.start': seasonStart,
      'season.end': seasonEnd,
    } = req.body;

    console.log('Creating tour with data:', {
      title,
      description,
      type,
      durationDays,
      price,
      location: { region: locationRegion, coordinates: { lat: locationLat, lng: locationLng } },
      accommodation: { name: accommodationName, type: accommodationType },
      minGroupSize,
      maxGroupSize,
      season: { start: seasonStart, end: seasonEnd },
    });

    const tour = new Tour({
      title,
      description,
      type,
      durationDays,
      price,
      location: {
        region: locationRegion,
        coordinates: {
          lat: parseFloat(locationLat),
          lng: parseFloat(locationLng),
        },
      },
      accommodation: {
        name: accommodationName,
        type: accommodationType,
      },
      minGroupSize,
      maxGroupSize,
      season: {
        start: new Date(seasonStart),
        end: new Date(seasonEnd),
      },
    });

    await tour.save();
    req.flash('success', 'Тур успешно создан');
    res.redirect('/admin/tours');
  } catch (error) {
    console.error('Error in createTour:', error.message, error.stack);
    req.flash('error', `Ошибка создания тура: ${error.message}`);
    res.redirect('/admin/tours/new');
  }
};

exports.getEditTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    console.log('Fetching tour with ID:', tourId);
    if (!mongoose.Types.ObjectId.isValid(tourId)) {
      console.log('Invalid tour ID:', tourId);
      req.flash('error', 'Неверный идентификатор тура');
      return res.redirect('/admin/tours');
    }
    const tour = await Tour.findById(tourId).lean();
    if (!tour) {
      console.log('Tour not found for ID:', tourId);
      req.flash('error', 'Тур не найден');
      return res.redirect('/admin/tours');
    }
    console.log('Tour found:', tour);
    res.render('admin/tour-form', {
      tour,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getEditTour:', error.message, error.stack);
    req.flash('error', 'Ошибка загрузки тура');
    res.redirect('/admin/tours');
  }
};

exports.updateTour = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      durationDays,
      price,
      'location.region': locationRegion,
      'location.coordinates.lat': locationLat,
      'location.coordinates.lng': locationLng,
      'accommodation.name': accommodationName,
      'accommodation.type': accommodationType,
      minGroupSize,
      maxGroupSize,
      'season.start': seasonStart,
      'season.end': seasonEnd,
    } = req.body;

    console.log('Updating tour with data:', {
      title,
      description,
      type,
      durationDays,
      price,
      location: { region: locationRegion, coordinates: { lat: locationLat, lng: locationLng } },
      accommodation: { name: accommodationName, type: accommodationType },
      minGroupSize,
      maxGroupSize,
      season: { start: seasonStart, end: seasonEnd },
    });

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      req.flash('error', 'Тур не найден');
      return res.redirect('/admin/tours');
    }

    tour.title = title;
    tour.description = description;
    tour.type = type;
    tour.durationDays = durationDays;
    tour.price = price;
    tour.location = {
      region: locationRegion,
      coordinates: {
        lat: parseFloat(locationLat),
        lng: parseFloat(locationLng),
      },
    };
    tour.accommodation = {
      name: accommodationName,
      type: accommodationType,
    };
    tour.minGroupSize = minGroupSize;
    tour.maxGroupSize = maxGroupSize;
    tour.season = {
      start: new Date(seasonStart),
      end: new Date(seasonEnd),
    };

    await tour.save();
    req.flash('success', 'Тур успешно обновлён');
    res.redirect('/admin/tours');
  } catch (error) {
    console.error('Error in updateTour:', error.message, error.stack);
    req.flash('error', `Ошибка обновления тура: ${error.message}`);
    res.redirect(`/admin/tours/${req.params.id}/edit`);
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    console.log('Deleting tour with ID:', tourId);
    const tour = await Tour.findById(tourId);
    if (!tour) {
      req.flash('error', 'Тур не найден');
      return res.redirect('/admin/tours');
    }
    await tour.deleteOne();
    req.flash('success', 'Тур успешно удалён');
    res.redirect('/admin/tours');
  } catch (error) {
    console.error('Error in deleteTour:', error.message, error.stack);
    req.flash('error', 'Ошибка удаления тура');
    res.redirect('/admin/tours');
  }
};

exports.getTourReviews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash('error', 'Неверный идентификатор тура');
      return res.redirect('/admin/tours');
    }
    const tour = await Tour.findById(req.params.id).populate('reviews.userId', 'username').lean();
    if (!tour) {
      req.flash('error', 'Тур не найден');
      return res.redirect('/admin/tours');
    }
    res.render('admin/reviews', {
      tour,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getTourReviews:', error.message, error.stack);
    req.flash('error', 'Ошибка загрузки отзывов');
    res.redirect('/admin/tours');
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { tourId, reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tourId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      req.flash('error', 'Неверный идентификатор');
      return res.redirect('/admin/tours');
    }
    const tour = await Tour.findById(tourId);
    if (!tour) {
      req.flash('error', 'Тур не найден');
      return res.redirect('/admin/tours');
    }
    tour.reviews = tour.reviews.filter(review => review._id.toString() !== reviewId);
    await tour.save();
    req.flash('success', 'Отзыв успешно удалён');
    res.redirect(`/admin/tours/${tourId}/reviews`);
  } catch (error) {
    console.error('Error in deleteReview:', error.message, error.stack);
    req.flash('error', 'Ошибка удаления отзыва');
    res.redirect(`/admin/tours/${req.params.tourId}/reviews`);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('tourId', 'title')
      .populate('userId', 'username email')
      .lean();
    res.render('admin/bookings', {
      bookings,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getBookings:', error.message, error.stack);
    req.flash('error', 'Ошибка загрузки бронирований');
    res.redirect('/admin');
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash('error', 'Бронирование не найдено');
      return res.redirect('/admin/bookings');
    }
    booking.status = 'confirmed';
    await booking.save();
    await User.updateOne(
      { _id: booking.userId, 'bookings._id': booking._id },
      { $set: { 'bookings.$.status': 'confirmed' } }
    );
    req.flash('success', 'Бронирование подтверждено');
    res.redirect('/admin/bookings');
  } catch (error) {
    console.error('Error in confirmBooking:', error.message, error.stack);
    req.flash('error', 'Ошибка подтверждения бронирования');
    res.redirect('/admin/bookings');
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash('error', 'Бронирование не найдено');
      return res.redirect('/admin/bookings');
    }
    booking.status = 'cancelled';
    await booking.save();
    await User.updateOne(
      { _id: booking.userId, 'bookings._id': booking._id },
      { $set: { 'bookings.$.status': 'cancelled' } }
    );
    req.flash('success', 'Бронирование отменено');
    res.redirect('/admin/bookings');
  } catch (error) {
    console.error('Error in cancelBooking:', error.message, error.stack);
    req.flash('error', 'Ошибка отмены бронирования');
    res.redirect('/admin/bookings');
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render('admin/users', {
      users,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getUsers:', error.message, error.stack);
    req.flash('error', 'Ошибка загрузки пользователей');
    res.redirect('/admin');
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Пользователь не найден');
      return res.redirect('/admin/users');
    }
    user.role = role;
    await user.save();
    req.flash('success', 'Роль пользователя обновлена');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error in updateUserRole:', error.message, error.stack);
    req.flash('error', 'Ошибка обновления роли');
    res.redirect('/admin/users');
  }
};

// Управление постами сообщества
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .lean();
    res.render('admin/posts', {
      posts,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getPosts:', error.message, error.stack);
    req.flash('error', 'Ошибка загрузки постов');
    res.redirect('/admin');
  }
};

exports.togglePostVisibility = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      req.flash('error', 'Неверный идентификатор поста');
      return res.redirect('/admin/posts');
    }
    const post = await Post.findById(postId);
    if (!post) {
      req.flash('error', 'Пост не найден');
      return res.redirect('/admin/posts');
    }
    post.isHidden = !post.isHidden;
    await post.save();
    req.flash('success', `Пост ${post.isHidden ? 'скрыт' : 'восстановлен'}`);
    res.redirect('/admin/posts');
  } catch (error) {
    console.error('Error in togglePostVisibility:', error.message, error.stack);
    req.flash('error', 'Ошибка изменения видимости поста');
    res.redirect('/admin/posts');
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    console.log('Deleting post with ID:', postId);
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      req.flash('error', 'Неверный идентификатор поста');
      return res.redirect('/admin/posts');
    }
    const post = await Post.findById(postId);
    if (!post) {
      req.flash('error', 'Пост не найден');
      return res.redirect('/admin/posts');
    }
    await post.deleteOne();
    req.flash('success', 'Пост успешно удалён');
    res.redirect('/admin/posts');
  } catch (error) {
    console.error('Error in deletePost:', error.message, error.stack);
    req.flash('error', 'Ошибка удаления поста');
    res.redirect('/admin/posts');
  }
};