const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

exports.getHotels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const region = req.query.region ? req.query.region.trim() : '';

    console.log('Hotel filter params:', { page, search, region });

    const query = {};
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    if (region) {
      query['location.region'] = region;
    }

    const hotels = await Hotel.find(query)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalHotels = await Hotel.countDocuments(query);
    const totalPages = Math.ceil(totalHotels / limit);

    console.log('Hotels found:', hotels.length, 'Total:', totalHotels);

    res.render('hotels/index', {
      hotels,
      currentPage: page,
      totalPages,
      totalHotels,
      hotelsOnPage: hotels.length,
      currentSearch: search,
      currentRegion: region,
      error: hotels.length ? null : 'Нет отелей для выбранных фильтров',
    });
  } catch (error) {
    console.error('Ошибка в getHotels:', error.message, error.stack);
    res.render('hotels/index', {
      hotels: [],
      currentPage: 1,
      totalPages: 1,
      totalHotels: 0,
      currentSearch: '',
      currentRegion: '',
      error: `Ошибка загрузки отелей: ${error.message}`,
    });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('reviews.userId', 'username').lean();
    if (!hotel) {
      return res.status(404).render('error', { message: 'Отель не найден' });
    }
    const hasReviewed = req.user ? hotel.reviews.some(review => review.userId._id.toString() === req.user._id.toString()) : false;
    const hasActiveBooking = req.user
      ? await Booking.exists({
          userId: req.user._id,
          status: { $in: ['pending', 'confirmed'] },
          endDate: { $gt: new Date() }
        })
      : false;
    const roomTypeLabels = {
      standard: 'Обычный',
      standardWithAC: 'Обычный с кондиционером',
      luxury: 'Люкс',
    };
    res.render('hotels/hotel', {
      hotel,
      user: req.user || null,
      hasReviewed,
      hasActiveBooking,
      roomTypeLabels,
      error: null,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
    });
  } catch (error) {
    console.error('Ошибка в getHotelById:', error.message, error.stack);
    res.status(500).render('error', { message: 'Ошибка загрузки отеля' });
  }
};

exports.addReview = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).render('error', { message: 'Отель не найден' });
    }
    const existingReview = hotel.reviews.find(review => review.userId.toString() === req.user._id.toString());
    if (existingReview) {
      return res.status(400).render('hotels/hotel', {
        hotel: hotel.toObject(),
        user: req.user || null,
        hasReviewed: true,
        error: 'Вы уже оставили отзыв для этого отеля',
      });
    }
    const { rating, comment } = req.body;
    hotel.reviews.push({
      userId: req.user._id,
      rating: parseInt(rating),
      comment,
    });
    await hotel.save();
    res.redirect(`/hotels/${req.params.id}`);
  } catch (error) {
    console.error('Ошибка в addReview:', error.message, error.stack);
    res.status(500).render('hotels/hotel', {
      hotel: hotel ? hotel.toObject() : null,
      user: req.user || null,
      hasReviewed: false,
      error: 'Ошибка добавления отзыва',
    });
  }
};