const Tour = require('../models/Tour');
const Region = require('../models/Region');
const Booking = require('../models/Booking');
const HotelAvailability = require('../models/HotelAvailability');
const mongoose = require('mongoose');

exports.getTours = async (req, res) => {
  try {
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
        amenities = req.query.amenities.map(item => item.trim());
      } else if (typeof req.query.amenities === 'string') {
        amenities = req.query.amenities.split(',').map(item => item.trim());
      }
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
          amenitiesList: await Tour.distinct('accommodation.amenities'),
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
    if (minPrice) {
      query.price = { ...query.price, $gte: minPrice };
    }
    if (maxPrice) {
      query.price = { ...query.price, $lte: maxPrice };
    }
    if (startDate && !isNaN(startDate)) {
      query['season.start'] = { $lte: startDate };
    }
    if (endDate && !isNaN(endDate)) {
      query['season.end'] = { $gte: endDate };
    }
    if (minDuration) {
      query.durationDays = { ...query.durationDays, $gte: minDuration };
    }
    if (maxDuration) {
      query.durationDays = { ...query.durationDays, $lte: maxDuration };
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

    const amenitiesList = await Tour.distinct('accommodation.amenities');
    const tours = await Tour.find(query)
      .populate('accommodation.hotel')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTours = await Tour.countDocuments(query);
    const totalPages = Math.ceil(totalTours / limit);

    console.log('Tours found:', tours.length, 'Total:', totalTours, 'Query:', JSON.stringify(query, null, 2));

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

    res.render('tours/index', {
      tours,
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
    console.error('Ошибка в getTours:', error.message, error.stack);
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
        amenities = req.query.amenities.map(item => item.trim());
      } else if (typeof req.query.amenities === 'string') {
        amenities = req.query.amenities.split(',').map(item => item.trim());
      }
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
    if (minPrice) {
      query.price = { ...query.price, $gte: minPrice };
    }
    if (maxPrice) {
      query.price = { ...query.price, $lte: maxPrice };
    }
    if (startDate && !isNaN(startDate)) {
      query['season.start'] = { $lte: startDate };
    }
    if (endDate && !isNaN(endDate)) {
      query['season.end'] = { $gte: endDate };
    }
    if (minDuration) {
      query.durationDays = { ...query.durationDays, $gte: minDuration };
    }
    if (maxDuration) {
      query.durationDays = { ...query.durationDays, $lte: maxDuration };
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
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    const totalTours = await Tour.countDocuments(query);
    const totalPages = Math.ceil(totalTours / limit);

    console.log('Tours found:', tours.length, 'Total:', totalTours, 'Query:', JSON.stringify(query, null, 2));

    res.json({
      tours,
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
    const tour = await Tour.findById(req.params.id).populate('accommodation.hotel').populate('reviews.userId', 'username').lean();
    if (!tour) {
      return res.status(404).render('error', { message: 'Тур не найден' });
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
          status: { $in: ['pending', 'confirmed'] }
        })
      : false;
    res.render('tours/tour', {
      tour,
      user: req.user || null,
      roomTypeLabels,
      hasReviewed,
      hasActiveBooking,
      seasonStart: tour.season.start.toISOString().split('T')[0],
      seasonEnd: tour.season.end.toISOString().split('T')[0],
      error: null,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
    });
  } catch (error) {
    console.error('Ошибка в getTourById:', error.message, error.stack);
    res.status(500).render('error', { message: 'Ошибка загрузки тура' });
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
        const date = new Date(d.setHours(0, 0, 0, 0));
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

        events.push({
          start: date.toISOString().split('T')[0],
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
        const date = new Date(d.setHours(0, 0, 0, 0));
        const bookedSlots = bookings
          .filter(b => {
            const tourStart = new Date(b.startDate).setHours(0, 0, 0, 0);
            const tourEnd = new Date(tourStart);
            tourEnd.setDate(tourEnd.getDate() + durationDays - 1);
            return date >= tourStart && date <= tourEnd;
          })
          .reduce((sum, b) => sum + b.participants, 0);

        const availableSlots = maxGroupSize - bookedSlots;
        events.push({
          start: date.toISOString().split('T')[0],
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
    res.redirect(`/tours/${req.params.id}`);
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