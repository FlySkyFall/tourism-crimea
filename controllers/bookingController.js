const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const HotelAvailability = require('../models/HotelAvailability');
const mongoose = require('mongoose');

exports.createBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { tourId, hotelId, startDate, endDate, participants, roomType, tourDate } = req.body;

    if (!tourId && !hotelId) {
      return res.status(400).json({ error: 'Не указан tourId или hotelId' });
    }

    if (!mongoose.Types.ObjectId.isValid(tourId || hotelId)) {
      return res.status(400).json({ error: 'Неверный идентификатор тура или отеля' });
    }

    // Для туров используем tourDate, если startDate не предоставлен
    const effectiveStartDate = tourId ? (tourDate || startDate) : startDate;
    if (!effectiveStartDate) {
      return res.status(400).json({ error: 'Дата начала обязательна' });
    }

    if (!participants || participants < 1) {
      return res.status(400).json({ error: 'Количество участников должно быть больше 0' });
    }

    const selectedDate = new Date(effectiveStartDate);
    let bookingData = {
      userId: req.user._id,
      bookingDate: new Date(),
      startDate: selectedDate,
      participants,
      status: 'pending',
      paymentStatus: 'pending',
    };

    if (tourId) {
      const tour = await Tour.findById(tourId).populate('accommodation.hotel');
      if (!tour) {
        return res.status(404).json({ error: 'Тур не найден' });
      }

      // Проверка roomType для туров с отелем или санаторием
      if (['hotel', 'sanatorium'].includes(tour.accommodation.type)) {
        if (!roomType || !['standard', 'standardWithAC', 'luxury'].includes(roomType)) {
          return res.status(400).json({ error: 'Необходимо выбрать тип номера: обычный, обычный с кондиционером или люкс' });
        }
        if (tour.accommodation.hotel && !tour.accommodation.hotel.roomTypes.includes(roomType)) {
          return res.status(400).json({ error: `Тип номера "${roomType}" недоступен для этого отеля` });
        }
      } else if (roomType) {
        return res.status(400).json({ error: 'Тип номера не требуется для этого типа размещения' });
      }

      const seasonStart = new Date(tour.season.start);
      const seasonEnd = new Date(tour.season.end);

      if (selectedDate < seasonStart || selectedDate > seasonEnd) {
        return res.status(400).json({ 
          error: `Дата должна быть в пределах сезона: с ${seasonStart.toLocaleDateString('ru-RU')} по ${seasonEnd.toLocaleDateString('ru-RU')}` 
        });
      }

      const maxCapacity = ['passive', 'health'].includes(tour.type) ? tour.hotelCapacity : tour.maxGroupSize;
      if (participants > maxCapacity) {
        return res.status(400).json({ 
          error: `Количество участников не может превышать ${maxCapacity}` 
        });
      }

      const tourDates = [];
      for (let i = 0; i < tour.durationDays; i++) {
        const date = new Date(selectedDate);
        date.setDate(selectedDate.getDate() + i);
        tourDates.push(date);
      }

      // Рассчитываем endDate для тура
      const endDateObj = new Date(selectedDate);
      endDateObj.setDate(selectedDate.getDate() + tour.durationDays - 1);
      bookingData.endDate = endDateObj;

      // Проверка доступности для тура
      const availabilities = await HotelAvailability.find({
        hotelId: tour.accommodation.hotel?._id,
        date: { $in: tourDates.map(d => new Date(d.setHours(0, 0, 0, 0))) },
      });

      const missingDates = tourDates.filter(d => !availabilities.find(a => a.date.getTime() === new Date(d.setHours(0, 0, 0, 0)).getTime()));
      for (const date of missingDates) {
        const newAvailability = new HotelAvailability({
          hotelId: tour.accommodation.hotel?._id,
          date: new Date(date.setHours(0, 0, 0, 0)),
          availableSlots: tour.accommodation.hotel?.capacity || maxCapacity,
        });
        await newAvailability.save();
        availabilities.push(newAvailability);
      }

      for (const availability of availabilities) {
        if (availability.availableSlots < participants) {
          return res.status(400).json({ 
            error: `Недостаточно мест на ${new Date(availability.date).toLocaleDateString('ru-RU')}: доступно ${availability.availableSlots}` 
          });
        }
      }

      bookingData.tourId = tourId;
      bookingData.roomType = ['hotel', 'sanatorium'].includes(tour.accommodation.type) ? roomType : undefined;
      // Добавляем hotelId для туров с отелем или санаторием
      if (['hotel', 'sanatorium'].includes(tour.accommodation.type) && tour.accommodation.hotel?._id) {
        bookingData.hotelId = tour.accommodation.hotel._id;
      }
    } else if (hotelId) {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ error: 'Отель не найден' });
      }

      if (!endDate) {
        return res.status(400).json({ error: 'Дата окончания обязательна для бронирования отеля' });
      }

      if (!roomType || !['standard', 'standardWithAC', 'luxury'].includes(roomType)) {
        return res.status(400).json({ error: 'Необходимо выбрать тип номера: обычный, обычный с кондиционером или люкс' });
      }

      if (!hotel.roomTypes.includes(roomType)) {
        return res.status(400).json({ error: `Тип номера "${roomType}" недоступен для этого отеля` });
      }

      const endDateObj = new Date(endDate);
      if (endDateObj <= selectedDate) {
        return res.status(400).json({ error: 'Дата выезда должна быть позже даты заезда' });
      }

      if (participants > hotel.capacity) {
        return res.status(400).json({ error: `Количество гостей не может превышать ${hotel.capacity}` });
      }

      const hotelDates = [];
      for (let d = new Date(selectedDate); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        hotelDates.push(new Date(d.setHours(0, 0, 0, 0)));
      }

      const availabilities = await HotelAvailability.find({
        hotelId,
        date: { $in: hotelDates },
      });

      const missingDates = hotelDates.filter(d => !availabilities.find(a => a.date.getTime() === d.getTime()));
      for (const date of missingDates) {
        const newAvailability = new HotelAvailability({
          hotelId,
          date,
          availableSlots: hotel.capacity,
        });
        await newAvailability.save();
        availabilities.push(newAvailability);
      }

      for (const availability of availabilities) {
        if (availability.availableSlots < participants) {
          return res.status(400).json({ 
            error: `Недостаточно мест на ${new Date(availability.date).toLocaleDateString('ru-RU')}: доступно ${availability.availableSlots}` 
          });
        }
      }

      bookingData.hotelId = hotelId;
      bookingData.endDate = endDateObj;
      bookingData.roomType = roomType;
    }

    const activeBooking = await Booking.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (activeBooking) {
      return res.status(400).json({ error: 'У вас уже есть активное бронирование' });
    }

    const booking = new Booking(bookingData);
    await booking.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        bookings: {
          _id: booking._id,
          tourId: booking.tourId || undefined,
          hotelId: booking.hotelId || undefined,
          bookingDate: new Date(),
          startDate: selectedDate,
          endDate: booking.endDate,
          status: 'pending',
          participants,
          roomType: booking.roomType,
          paymentStatus: 'pending',
        },
      },
    });

    return res.status(201).json({ 
      message: 'Бронирование успешно создано. Пожалуйста, оплатите, чтобы подтвердить.',
      bookingId: booking._id
    });
  } catch (error) {
    console.error('Error in createBooking:', error.message, error.stack);
    return res.status(500).json({ error: `Ошибка бронирования: ${error.message}` });
  }
};

// Остальные методы (getUserBookings, processPayment, cancelBooking, getHotelAvailability, cleanExpiredBookings) остаются без изменений
exports.getUserBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const bookings = await Booking.find({ userId: req.user._id })
      .populate('tourId', 'title accommodation')
      .populate('hotelId', 'name')
      .lean();

    console.log('Fetched bookings:', bookings.map(b => ({ _id: b._id, tourId: b.tourId, hotelId: b.hotelId, status: b.status, paymentStatus: b.paymentStatus, roomType: b.roomType })));

    const invalidBookings = bookings.filter(b => !mongoose.Types.ObjectId.isValid(b._id));
    if (invalidBookings.length > 0) {
      console.warn('Invalid booking IDs found:', invalidBookings);
    }

    res.render('booking/list', {
      bookings,
      user: req.user,
      message: req.flash('success') || req.flash('error'),
    });
  } catch (error) {
    console.error('Error in getUserBookings:', error.message, error.stack);
    return res.status(500).json({ error: `Ошибка загрузки бронирований: ${error.message}` });
  }
};

exports.processPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const bookingId = req.params.id;
    console.log('Processing payment for bookingId:', bookingId, 'req.body:', req.body);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Неверный идентификатор бронирования' });
    }

    if (!req.body || !req.body.cardNumber || !req.body.cardHolder || !req.body.expiry || !req.body.cvv) {
      console.error('Missing payment data:', req.body);
      return res.status(400).json({ error: 'Все поля формы оплаты обязательны' });
    }

    const { cardNumber, cardHolder, expiry, cvv } = req.body;

    if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
      return res.status(400).json({ error: 'Некорректный номер карты' });
    }
    if (!cardHolder || cardHolder.trim().length < 2) {
      return res.status(400).json({ error: 'Укажите имя держателя карты' });
    }
    if (!expiry || !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
      return res.status(400).json({ error: 'Некорректный срок действия' });
    }
    if (!cvv || cvv.length !== 3 || !/^\d+$/.test(cvv)) {
      return res.status(400).json({ error: 'Некорректный CVV' });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id })
      .populate('tourId')
      .populate('hotelId');
    if (!booking) {
      return res.status(404).json({ error: 'Бронирование не найдено или не принадлежит вам' });
    }

    const isPaymentSuccessful = Math.random() > 0.1;

    if (isPaymentSuccessful) {
      booking.paymentStatus = 'completed';
      booking.status = 'confirmed';
      await booking.save();

      if (booking.tourId) {
        const tour = await Tour.findById(booking.tourId);
        const tourDates = [];
        for (let i = 0; i < tour.durationDays; i++) {
          const date = new Date(booking.startDate);
          date.setDate(booking.startDate.getDate() + i);
          tourDates.push(new Date(date.setHours(0, 0, 0, 0)));
        }

        await HotelAvailability.updateMany(
          { hotelId: tour.accommodation.hotel?._id, date: { $in: tourDates } },
          { $inc: { availableSlots: -booking.participants } }
        );
      } else if (booking.hotelId) {
        const hotelDates = [];
        for (let d = new Date(booking.startDate); d <= new Date(booking.endDate); d.setDate(d.getDate() + 1)) {
          hotelDates.push(new Date(d.setHours(0, 0, 0, 0)));
        }

        await HotelAvailability.updateMany(
          { hotelId: booking.hotelId, date: { $in: hotelDates } },
          { $inc: { availableSlots: -booking.participants } }
        );
      }

      await User.updateOne(
        { _id: req.user._id, 'bookings._id': bookingId },
        { $set: { 'bookings.$.status': 'confirmed', 'bookings.$.paymentStatus': 'completed' } }
      );

      return res.status(200).json({ 
        message: 'Оплата прошла успешно! Бронь подтверждена.',
        bookingId
      });
    } else {
      booking.paymentStatus = 'failed';
      await booking.save();

      await User.updateOne(
        { _id: req.user._id, 'bookings._id': bookingId },
        { $set: { 'bookings.$.paymentStatus': 'failed' } }
      );

      return res.status(400).json({ 
        error: 'Оплата отклонена. Попробуйте снова.',
        bookingId
      });
    }
  } catch (error) {
    console.error('Error in processPayment:', error.message, error.stack);
    return res.status(500).json({ error: `Ошибка обработки оплаты: ${error.message}` });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const bookingId = req.params.id;
    console.log('Attempting to cancel booking:', bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      console.log('Invalid bookingId:', bookingId);
      return res.status(400).json({ error: 'Неверный идентификатор бронирования' });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id })
      .populate('tourId')
      .populate('hotelId');
    if (!booking) {
      console.log('Booking not found or not owned by user:', { bookingId, userId: req.user._id });
      return res.status(404).json({ error: 'Бронирование не найдено или не принадлежит вам' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: 'Нельзя отменить подтверждённое бронирование' });
    }

    console.log('Found booking:', booking);

    if (booking.paymentStatus === 'completed') {
      if (booking.tourId) {
        const tour = await Tour.findById(booking.tourId);
        const tourDates = [];
        for (let i = 0; i < tour.durationDays; i++) {
          const date = new Date(booking.startDate);
          date.setDate(booking.startDate.getDate() + i);
          tourDates.push(new Date(date.setHours(0, 0, 0, 0)));
        }

        await HotelAvailability.updateMany(
          { hotelId: tour.accommodation.hotel?._id, date: { $in: tourDates } },
          { $inc: { availableSlots: booking.participants } }
        );
      } else if (booking.hotelId) {
        const hotelDates = [];
        for (let d = new Date(booking.startDate); d <= new Date(booking.endDate); d.setDate(d.getDate() + 1)) {
          hotelDates.push(new Date(d.setHours(0, 0, 0, 0)));
        }

        await HotelAvailability.updateMany(
          { hotelId: booking.hotelId, date: { $in: hotelDates } },
          { $inc: { availableSlots: booking.participants } }
        );
      }
    }

    booking.status = 'cancelled';
    await booking.save();
    console.log('Booking status updated to cancelled:', booking);

    const userUpdateResult = await User.updateOne(
      { _id: req.user._id, 'bookings._id': bookingId },
      { $set: { 'bookings.$.status': 'cancelled' } }
    );
    console.log('User bookings update result:', userUpdateResult);

    if (userUpdateResult.matchedCount === 0) {
      console.warn('No matching booking found in user.bookings for:', { bookingId, userId: req.user._id });
    }

    return res.status(200).json({ message: 'Бронирование успешно отменено' });
  } catch (error) {
    console.error('Error in cancelBooking:', error.message, error.stack);
    return res.status(500).json({ error: `Ошибка отмены бронирования: ${error.message}` });
  }
};

exports.getHotelAvailability = async (req, res) => {
  try {
    const hotelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ error: 'Неверный идентификатор отеля' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ error: 'Отель не найден' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1); // Доступность на год вперёд

    const availabilities = await HotelAvailability.find({
      hotelId,
      date: { $gte: today, $lte: endDate },
    });

    const events = [];
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d.setHours(0, 0, 0, 0));
      let availableSlots = hotel.capacity;

      const availability = availabilities.find(a => a.date.getTime() === date.getTime());
      if (availability) {
        availableSlots = availability.availableSlots;
      } else {
        const newAvailability = new HotelAvailability({
          hotelId,
          date,
          availableSlots: hotel.capacity,
        });
        await newAvailability.save();
        availableSlots = hotel.capacity;
      }

      events.push({
        start: date.toISOString().split('T')[0],
        availableSlots,
        title: availableSlots >= 1 ? `Доступно: ${availableSlots}` : 'Недоступно',
        color: availableSlots >= 1 ? '#28a745' : '#dc3545',
      });
    }

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error in getHotelAvailability:', error.message, error.stack);
    return res.status(500).json({ error: `Ошибка получения доступности: ${error.message}` });
  }
};

exports.cleanExpiredBookings = async (req, res) => {
  try {
    const currentDate = new Date();
    const expiredBookings = await Booking.aggregate([
      {
        $lookup: {
          from: 'tours',
          localField: 'tourId',
          foreignField: '_id',
          as: 'tour',
        },
      },
      {
        $lookup: {
          from: 'hotels',
          localField: 'hotelId',
          foreignField: '_id',
          as: 'hotel',
        },
      },
      {
        $match: {
          status: { $in: ['pending', 'confirmed'] },
        },
      },
      {
        $project: {
          tourId: 1,
          hotelId: 1,
          startDate: 1,
          endDate: 1,
          durationDays: { $arrayElemAt: ['$tour.durationDays', 0] },
          effectiveEndDate: {
            $cond: {
              if: { $eq: ['$hotelId', null] },
              then: {
                $dateAdd: {
                  startDate: '$startDate',
                  unit: 'day',
                  amount: '$durationDays',
                },
              },
              else: '$endDate',
            },
          },
        },
      },
      {
        $match: {
          effectiveEndDate: { $lte: currentDate },
        },
      },
    ]);

    const bookingIds = expiredBookings.map(b => b._id);
    console.log('Expired bookings to delete:', bookingIds);

    if (bookingIds.length > 0) {
      for (const booking of expiredBookings) {
        const bookingRecord = await Booking.findById(booking._id)
          .populate('tourId')
          .populate('hotelId');
        if (bookingRecord.paymentStatus === 'completed') {
          if (bookingRecord.tourId) {
            const tour = await Tour.findById(booking.tourId);
            const tourDates = [];
            for (let i = 0; i < tour.durationDays; i++) {
              const date = new Date(booking.startDate);
              date.setDate(booking.startDate.getDate() + i);
              tourDates.push(new Date(date.setHours(0, 0, 0, 0)));
            }

            await HotelAvailability.updateMany(
              { hotelId: tour.accommodation.hotel?._id, date: { $in: tourDates } },
              { $inc: { availableSlots: bookingRecord.participants } }
            );
          } else if (bookingRecord.hotelId) {
            const hotelDates = [];
            for (let d = new Date(booking.startDate); d <= new Date(booking.endDate); d.setDate(d.getDate() + 1)) {
              hotelDates.push(new Date(d.setHours(0, 0, 0, 0)));
            }

            await HotelAvailability.updateMany(
              { hotelId: bookingRecord.hotelId, date: { $in: hotelDates } },
              { $inc: { availableSlots: bookingRecord.participants } }
            );
          }
        }
      }

      await Booking.deleteMany({ _id: { $in: bookingIds } });
      await User.updateMany(
        { 'bookings._id': { $in: bookingIds } },
        { $pull: { bookings: { _id: { $in: bookingIds } } } }
      );
    }

    const message = bookingIds.length > 0 
      ? `Удалено ${bookingIds.length} истёкших бронирований`
      : 'Нет истёкших бронирований для удаления';

    if (res) {
      return res.status(200).json({ message });
    }
    console.log(message);
  } catch (error) {
    console.error('Error in cleanExpiredBookings:', error.message, error.stack);
    if (res) {
      return res.status(500).json({ error: `Ошибка очистки бронирований: ${error.message}` });
    }
  }
};