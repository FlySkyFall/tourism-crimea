const Tour = require('../models/Tour');
const Region = require('../models/Region');
const Booking = require('../models/Booking');
const HotelAvailability = require('../models/HotelAvailability');
const mongoose = require('mongoose');

exports.getTours = async (req, res) => {
  try {
    console.log('getTours called with query:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'all';
    const search = req.query.search ? req.query.search.trim() : '';
    const region = req.query.region ? decodeURIComponent(req.query.region).trim() : '';
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : '';
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : '';
    const endDate = req.query.endDate ? new Date(req.query.endDate) : '';
    const sortBy = req.query.sortBy || '';
    const minDuration = req.query.minDuration ? parseInt(req.query.minDuration) : '';
    const maxDuration = req.query.maxDuration ? parseInt(req.query.maxDuration) : '';

    console.log('Tour filter params:', {
      page,
      type,
      search,
      region,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      sortBy,
      minDuration,
      maxDuration,
    });

    let amenities = [];
    if (req.query.amenities) {
      if (Array.isArray(req.query.amenities)) {
        amenities = req.query.amenities.map(item => decodeURIComponent(item).trim());
      } else if (typeof req.query.amenities === 'string') {
        amenities = req.query.amenities.split(',').map(item => decodeURIComponent(item).trim());
      }
      amenities = amenities.filter(amenity => amenity);
    }

    const query = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    if (region) {
      const regionExists = await Region.findOne({ name: region }).lean();
      if (!regionExists) {
        console.log(`Region "${region}" not found in Region collection`);
        return res.render('tours/index', {
          tours: [],
          regions: await Region.find({}).select('name').lean(),
          amenitiesList: await Tour.distinct('accommodation.amenities').sort(),
          currentPage: 1,
          totalPages: 1,
          totalTours: 0,
          error: `Регион "${region}" не найден`,
          currentType: type,
          currentSearch: search,
          currentRegion: region,
          currentMinPrice: minPrice,
          currentMaxPrice: maxPrice,
          currentStartDate: startDate ? startDate.toISOString().split('T')[0] : '',
          currentEndDate: endDate ? endDate.toISOString().split('T')[0] : '',
          currentSortBy: sortBy,
          currentMinDuration: minDuration,
          currentMaxDuration: maxDuration,
          currentAmenities: amenities.join(','),
        });
      }
      query['location.region'] = { $regex: `^${region}$`, $options: 'i' };
    }
    if (minPrice || minPrice === 0) {
      query.price = { ...query.price, $gte: minPrice || 0 };
    }
    if (maxPrice || maxPrice === 0) {
      query.price = { ...query.price, $lte: maxPrice || Infinity };
    }
    if (startDate && !isNaN(startDate)) {
      query['season.start'] = { $lte: startDate };
    }
    if (endDate && !isNaN(endDate)) {
      query['season.end'] = { $gte: endDate };
    }
    if (minDuration || minDuration === 0) {
      query.durationDays = { ...query.durationDays, $gte: minDuration || 0 };
    }
    if (maxDuration || maxDuration === 0) {
      query.durationDays = { ...query.durationDays, $lte: maxDuration || Infinity };
    }
    if (amenities.length > 0) {
      query['accommodation.amenities'] = { $all: amenities };
    }

    const sortOptions = {};
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      sortOptions[field] = direction === 'asc' ? 1 : -1;
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    const amenitiesList = await Tour.distinct('accommodation.amenities').sort();
    const tours = await Tour.find(query)
      .populate('accommodation.hotel')
      .populate({
        path: 'reviews',
        populate: { path: 'userId', select: 'username' }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTours = await Tour.countDocuments(query);
    const totalPages = Math.ceil(totalTours / limit);

    console.log('Tours with reviews:', tours.map(t => ({ _id: t._id, reviews: t.reviews })));

    const safeTours = tours.map(tour => {
      const reviewCount = tour.reviews ? tour.reviews.length : 0;
      const ratingSum = tour.reviews ? tour.reviews.reduce((acc, review) => acc + review.rating, 0) : 0;
      const calculatedRating = reviewCount ? (ratingSum / reviewCount).toFixed(1) : 0;
      const calculatedReviewsCount = reviewCount;

      return {
        ...tour,
        images: tour.images && tour.images.length ? tour.images : ['/images/default-tour.jpg'],
        price: tour.price || 0,
        discounts: tour.discounts || { groupDiscount: { enabled: false }, seasonalDiscount: { enabled: false }, hotDealDiscount: { enabled: false } },
        isHotDeal: tour.isHotDeal || false,
        location: tour.location || { region: 'Не указан' },
        durationDays: tour.durationDays || 1,
        type: tour.type || 'passive',
        rating: calculatedRating,
        reviewsCount: calculatedReviewsCount,
      };
    });

    const regions = await Region.find({}).select('name').lean();

    if (page > totalPages && totalPages > 0) {
      const redirectParams = new URLSearchParams();
      redirectParams.append('page', totalPages);
      if (type && type !== 'all') redirectParams.append('type', type);
      if (search) redirectParams.append('search', search);
      if (region) redirectParams.append('region', encodeURIComponent(region));
      if (minPrice) redirectParams.append('minPrice', minPrice);
      if (maxPrice) redirectParams.append('maxPrice', maxPrice);
      if (startDate) redirectParams.append('startDate', startDate.toISOString().split('T')[0]);
      if (endDate) redirectParams.append('endDate', endDate.toISOString().split('T')[0]);
      if (sortBy) redirectParams.append('sortBy', sortBy);
      if (minDuration) redirectParams.append('minDuration', minDuration);
      if (maxDuration) redirectParams.append('maxDuration', maxDuration);
      if (amenities.length > 0) redirectParams.append('amenities', amenities.join(','));
      return res.redirect(`/tours?${redirectParams.toString()}`);
    }

    console.log('Rendering tours/index with data:', { tours: safeTours.length, totalPages, currentPage: page });
    res.render('tours/index', {
      tours: safeTours,
      regions,
      amenitiesList,
      currentPage: page,
      totalPages,
      totalTours,
      toursOnPage: tours.length,
      currentType: type,
      currentSearch: search,
      currentRegion: region,
      currentMinPrice: minPrice,
      currentMaxPrice: maxPrice,
      currentStartDate: startDate ? startDate.toISOString().split('T')[0] : '',
      currentEndDate: endDate ? endDate.toISOString().split('T')[0] : '',
      currentSortBy: sortBy,
      currentMinDuration: minDuration,
      currentMaxDuration: maxDuration,
      currentAmenities: amenities.join(','),
      error: tours.length ? null : 'Нет туров для выбранных фильтров',
    });
  } catch (error) {
    console.error('Error in getTours:', error.message, error.stack);
    res.render('tours/index', {
      tours: [],
      regions: [],
      amenitiesList: [],
      currentPage: 1,
      totalPages: 1,
      totalTours: 0,
      error: `Ошибка загрузки туров: ${error.message}`,
      currentType: 'all',
      currentSearch: '',
      currentRegion: '',
      currentMinPrice: '',
      currentMaxPrice: '',
      currentStartDate: '',
      currentEndDate: '',
      currentSortBy: '',
      currentMinDuration: '',
      currentMaxDuration: '',
      currentAmenities: '',
    });
  }
};

exports.filterTours = async (req, res) => {
  try {
    console.log('filterTours called with query:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'all';
    let search = req.query.search ? decodeURIComponent(req.query.search).trim() : '';
    const region = req.query.region ? decodeURIComponent(req.query.region).trim() : '';
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : '';
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : '';
    const endDate = req.query.endDate ? new Date(req.query.endDate) : '';
    const sortBy = req.query.sortBy || '';
    const minDuration = req.query.minDuration ? parseInt(req.query.minDuration) : '';
    const maxDuration = req.query.maxDuration ? parseInt(req.query.maxDuration) : '';

    console.log('Filter tours params:', {
      page,
      type,
      search,
      region,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      sortBy,
      minDuration,
      maxDuration,
    });

    let amenities = [];
    if (req.query.amenities) {
      if (Array.isArray(req.query.amenities)) {
        amenities = req.query.amenities.map(item => decodeURIComponent(item).trim());
      } else if (typeof req.query.amenities === 'string') {
        amenities = req.query.amenities.split(',').map(item => decodeURIComponent(item).trim());
      }
      amenities = amenities.filter(amenity => amenity);
    }

    const query = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    if (region) {
      const regionExists = await Region.findOne({ name: region }).lean();
      if (!regionExists) {
        console.log(`Region "${region}" not found in Region collection`);
        return res.status(400).json({ error: `Регион "${region}" не найден` });
      }
      query['location.region'] = { $regex: `^${region}$`, $options: 'i' };
    }
    if (minPrice || minPrice === 0) {
      query.price = { ...query.price, $gte: minPrice || 0 };
    }
    if (maxPrice || maxPrice === 0) {
      query.price = { ...query.price, $lte: maxPrice || Infinity };
    }
    if (startDate && !isNaN(startDate)) {
      query['season.start'] = { $lte: startDate };
    }
    if (endDate && !isNaN(endDate)) {
      query['season.end'] = { $gte: endDate };
    }
    if (minDuration || minDuration === 0) {
      query.durationDays = { ...query.durationDays, $gte: minDuration || 0 };
    }
    if (maxDuration || maxDuration === 0) {
      query.durationDays = { ...query.durationDays, $lte: maxDuration || Infinity };
    }
    if (amenities.length > 0) {
      query['accommodation.amenities'] = { $all: amenities };
    }

    const sortOptions = {};
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      sortOptions[field] = direction === 'asc' ? 1 : -1;
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    const tours = await Tour.find(query)
      .populate('accommodation.hotel')
      .populate({
        path: 'reviews',
        populate: { path: 'userId', select: 'username' }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTours = await Tour.countDocuments(query);
    const totalPages = Math.ceil(totalTours / limit);

    console.log('Tours with reviews:', tours.map(t => ({ _id: t._id, reviews: t.reviews })));

    const safeTours = tours.map(tour => {
      const reviewCount = tour.reviews ? tour.reviews.length : 0;
      const ratingSum = tour.reviews ? tour.reviews.reduce((acc, review) => acc + review.rating, 0) : 0;
      const calculatedRating = reviewCount ? (ratingSum / reviewCount).toFixed(1) : 0;
      const calculatedReviewsCount = reviewCount;

      return {
        ...tour,
        images: tour.images && tour.images.length ? tour.images : ['/images/default-tour.jpg'],
        price: tour.price || 0,
        discounts: tour.discounts || { groupDiscount: { enabled: false }, seasonalDiscount: { enabled: false }, hotDealDiscount: { enabled: false } },
        isHotDeal: tour.isHotDeal || false,
        location: tour.location || { region: 'Не указан' },
        durationDays: tour.durationDays || 1,
        type: tour.type || 'passive',
        rating: calculatedRating,
        reviewsCount: calculatedReviewsCount,
      };
    });

    res.json({
      tours: safeTours,
      currentPage: page,
      totalPages,
      totalTours,
      toursOnPage: tours.length,
      currentType: type,
    });
  } catch (error) {
    console.error('Ошибка в filterTours:', error.message, error.stack);
    res.status(500).json({ error: `Ошибка загрузки туров: ${error.message}` });
  }
};

exports.getTourById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).render('error', { message: 'Неверный идентификатор тура' });
    }
    const tourId = req.params.id;
    console.log(`Fetching tour with ID: ${tourId}`);
    const tour = await Tour.findById(tourId)
      .populate('accommodation.hotel')
      .populate({
        path: 'reviews',
        populate: { path: 'userId', select: 'username' }
      })
      .lean();
    if (!tour) {
      console.log(`Tour not found for ID: ${tourId}`);
      return res.status(404).render('error', { message: 'Тур не найден' });
    }

    // Ручное вычисление рейтинга и количества отзывов
    const reviewCount = tour.reviews ? tour.reviews.length : 0;
    const ratingSum = tour.reviews ? tour.reviews.reduce((acc, review) => acc + review.rating, 0) : 0;
    tour.rating = reviewCount ? (ratingSum / reviewCount).toFixed(1) : 0;
    tour.reviewsCount = reviewCount;

    console.log('Tour data fetched with calculated virtuals:', tour);

    // Проверка и установка дефолтных значений для season
    if (!tour.season || !tour.season.start || !tour.season.end) {
      console.warn('Tour season data is missing or incomplete, setting defaults:', tour._id);
      tour.season = tour.season || {};
      tour.season.start = tour.season.start || new Date();
      tour.season.end = tour.season.end || new Date(Date.now() + 30 * 86400000);
    }

    // Проверка и установка дефолтных значений для location.coordinates
    if (!tour.location || !tour.location.coordinates || !tour.location.coordinates.lat || !tour.location.coordinates.lng) {
      console.warn('Tour location.coordinates are missing or incomplete, setting defaults:', tour._id);
      tour.location = tour.location || {};
      tour.location.coordinates = tour.location.coordinates || { lat: 44.7204, lng: 37.7716 }; // Координаты Краснодара по умолчанию
      tour.location.region = tour.location.region || 'Default Region';
    }

    const roomTypeLabels = {
      standard: 'Обычный',
      standardWithAC: 'Обычный с кондиционером',
      luxury: 'Люкс',
    };
    const hasReviewed = req.user ? tour.reviews.some(review => review.userId._id.toString() === req.user._id.toString()) : false;
    const hasActiveBooking = req.user
      ? await Booking.exists({
          userId: req.user._id,
          status: { $in: ['pending', 'confirmed'] },
          endDate: { $gt: new Date() }
        })
      : false;

    // Очистка данных и преобразование дат
    const safeTour = JSON.parse(JSON.stringify(tour).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>'));
    safeTour.season.start = new Date(safeTour.season.start);
    safeTour.season.end = new Date(safeTour.season.end);
    console.log('Safe tour data prepared for rendering:', safeTour);

    res.render('tours/tour', {
      tour: safeTour,
      user: req.user || null,
      roomTypeLabels,
      hasReviewed,
      hasActiveBooking,
      seasonStart: safeTour.season.start.toISOString().split('T')[0],
      seasonEnd: safeTour.season.end.toISOString().split('T')[0],
      error: null,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
    });
  } catch (error) {
    console.error('Ошибка в getTourById:', error.message, error.stack);
    res.status(500).render('error', { message: `Ошибка загрузки тура: ${error.message}` });
  }
};

exports.getTourAvailability = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Неверный идентификатор тура' });
    }
    const tour = await Tour.findById(req.params.id).populate('accommodation.hotel');
    if (!tour) {
      return res.status(404).json({ error: 'Тур не найден' });
    }

    const { type, season, minGroupSize, maxGroupSize, hotelCapacity, durationDays } = tour;
    const startDate = new Date(season.start);
    const endDate = new Date(season.end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = [];
    if (['passive', 'health'].includes(type) && tour.accommodation.hotel) {
      const availabilities = await HotelAvailability.find({
        hotelId: tour.accommodation.hotel._id,
        date: { $gte: today, $lte: endDate },
      });

      for (let d = new Date(startDate > today ? startDate : today); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d); // Сохраняем дату перед увеличением
        date.setHours(0, 0, 0, 0);
        let availableSlots = hotelCapacity;

        const availability = availabilities.find(a => a.date.getTime() === date.getTime());
        if (availability) {
          availableSlots = availability.availableSlots;
        } else {
          const newAvailability = new HotelAvailability({
            hotelId: tour.accommodation.hotel._id,
            date,
            availableSlots: hotelCapacity,
          });
          await newAvailability.save();
          availableSlots = hotelCapacity;
        }

        // Сдвигаем дату события на +1 день
        const shiftedDate = new Date(date);
        shiftedDate.setDate(date.getDate() + 1);
        events.push({
          start: shiftedDate.toISOString().split('T')[0],
          title: availableSlots >= minGroupSize ? `Доступно: ${availableSlots}` : 'Недоступно',
          color: availableSlots >= minGroupSize ? '#28a745' : '#dc3545',
          availableSlots,
        });
      }
    } else {
      const bookings = await Booking.find({
        tourId: tour._id,
        status: 'confirmed',
        startDate: { $gte: today, $lte: endDate },
      });

      for (let d = new Date(startDate > today ? startDate : today); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d); // Сохраняем дату перед увеличением
        date.setHours(0, 0, 0, 0);
        const bookedSlots = bookings
          .filter(b => {
            const tourStart = new Date(b.startDate).setHours(0, 0, 0, 0);
            const tourEnd = new Date(tourStart);
            tourEnd.setDate(tourEnd.getDate() + durationDays - 1);
            return date >= tourStart && date <= tourEnd;
          })
          .reduce((sum, b) => sum + b.participants, 0);

        const availableSlots = maxGroupSize - bookedSlots;
        // Сдвигаем дату события на +1 день
        const shiftedDate = new Date(date);
        shiftedDate.setDate(date.getDate() + 1);
        events.push({
          start: shiftedDate.toISOString().split('T')[0],
          title: availableSlots >= minGroupSize ? `Доступно: ${availableSlots}` : 'Недоступно',
          color: availableSlots >= minGroupSize ? '#28a745' : '#dc3545',
          availableSlots,
        });
      }
    }

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error in getTourAvailability:', error.message, error.stack);
    return res.status(500).json({ error: `Ошибка получения доступности: ${error.message}` });
  }
};

exports.addReview = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).render('error', { message: 'Тур не найден' });
    }
    const existingReview = tour.reviews.find(review => review.userId.toString() === req.user._id.toString());
    if (existingReview) {
      return res.status(400).render('tours/tour', {
        tour: tour.toObject(),
        user: req.user || null,
        hasReviewed: true,
        seasonStart: tour.season.start.toISOString().split('T')[0],
        seasonEnd: tour.season.end.toISOString().split('T')[0],
        error: 'Вы уже оставили отзыв для этого тура',
      });
    }
    const { rating, comment } = req.body;
    tour.reviews.push({
      userId: req.user._id,
      rating: parseInt(rating),
      comment,
    });
    await tour.save();
    console.log('Review saved, tour object:', tour.toObject({ virtuals: true }));

    // Ручное вычисление рейтинга и количества отзывов
    const reviewCount = tour.reviews.length;
    const ratingSum = tour.reviews.reduce((acc, r) => acc + r.rating, 0);
    const calculatedRating = reviewCount ? (ratingSum / reviewCount).toFixed(1) : 0;
    const calculatedReviewsCount = reviewCount;

    // Подготовка обновленного тура для рендеринга
    const updatedTour = await Tour.findById(req.params.id)
      .populate('accommodation.hotel')
      .populate({
        path: 'reviews',
        populate: { path: 'userId', select: 'username' }
      })
      .lean();
    updatedTour.rating = calculatedRating;
    updatedTour.reviewsCount = calculatedReviewsCount;
    console.log('Updated tour with calculated virtuals:', updatedTour);

    // Рендеринг страницы с обновленными данными вместо редиректа
    const roomTypeLabels = {
      standard: 'Обычный',
      standardWithAC: 'Обычный с кондиционером',
      luxury: 'Люкс',
    };
    const hasReviewed = req.user ? updatedTour.reviews.some(review => review.userId._id.toString() === req.user._id.toString()) : false;
    const hasActiveBooking = req.user
      ? await Booking.exists({
          userId: req.user._id,
          status: { $in: ['pending', 'confirmed'] }
        })
      : false;

    const safeTour = JSON.parse(JSON.stringify(updatedTour).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>'));
    safeTour.season.start = new Date(safeTour.season.start);
    safeTour.season.end = new Date(safeTour.season.end);

    res.render('tours/tour', {
      tour: safeTour,
      user: req.user || null,
      roomTypeLabels,
      hasReviewed,
      hasActiveBooking,
      seasonStart: safeTour.season.start.toISOString().split('T')[0],
      seasonEnd: safeTour.season.end.toISOString().split('T')[0],
      error: null,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
    });
  } catch (error) {
    console.error('Ошибка в addReview:', error.message, error.stack);
    res.status(500).render('tours/tour', {
      tour: tour ? tour.toObject() : null,
      user: req.user || null,
      hasReviewed: false,
      seasonStart: tour ? tour.season.start.toISOString().split('T')[0] : '',
      seasonEnd: tour ? tour.season.end.toISOString().split('T')[0] : '',
      error: 'Ошибка добавления отзыва',
    });
  }
};