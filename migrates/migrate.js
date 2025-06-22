const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');
const crypto = require('crypto');

// Подключение к базе данных
mongoose.connect('mongodb://localhost:27017/tourism-krasnodar', { // Исправлено имя базы данных
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

async function runMigration() {
  try {
    // Проверка и создание тестового пользователя
    let user = await User.findOne({ email: 'test2@example.com' }); // Изменен email
    if (!user) {
      user = new User({
        username: 'newuser',
        email: 'test3@example.com', // Уникальный email
        passwordHash: crypto.createHash('sha256').update('password123').digest('hex'), // Простой хэш для теста
        profile: {
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890',
        },
        role: 'user',
      });
      await user.save();
      console.log('User created:', user._id);
    } else {
      console.log('User already exists, skipping creation:', user._id);
    }

    // Создание тестового отеля
    let hotel = await Hotel.findOne({ name: 'Test Hotel' });
    if (!hotel) {
      hotel = new Hotel({
        name: 'Test Hotel',
        description: 'A test hotel for migration',
        location: {
          region: 'Test Region',
          coordinates: { lat: 40.7128, lng: -74.0060 },
        },
        rating: 4.5,
        amenities: ['Wi-Fi', 'Parking'],
        images: ['test-image.jpg'],
        capacity: 10,
        roomTypes: ['standard', 'standardWithAC', 'luxury'],
        basePrice: 5000,
      });
      await hotel.save();
      console.log('Hotel created:', hotel._id);
    } else {
      console.log('Hotel already exists, skipping creation:', hotel._id);
    }

    // Создание тестового тура
    let tour = await Tour.findOne({ title: 'Test Tour' });
    if (!tour) {
      tour = new Tour({
        title: 'Test Tour',
        description: 'A test tour for migration',
        type: 'passive',
        durationDays: 3,
        price: 15000,
        location: {
          region: 'Test Region',
          coordinates: { lat: 40.7128, lng: -74.0060 },
        },
        accommodation: {
          hotel: hotel._id,
          type: 'hotel',
          amenities: ['Breakfast'],
        },
        activities: [{ name: 'Sightseeing', durationHours: 4, equipmentRequired: false }],
        includedServices: ['Guide'],
        season: {
          start: new Date('2025-06-01'),
          end: new Date('2025-08-31'),
        },
        minGroupSize: 1,
        maxGroupSize: 10,
        hotelCapacity: 10,
        images: ['test-tour-image.jpg'],
      });
      await tour.save();
      console.log('Tour created:', tour._id);
    } else {
      console.log('Tour already exists, skipping creation:', tour._id);
    }

    // Создание тестового бронирования (закончилось вчера, 18 июня 2025)
    let booking = await Booking.findOne({ userId: user._id, tourId: tour._id });
    if (!booking) {
      booking = new Booking({
        userId: user._id,
        tourId: tour._id,
        hotelId: hotel._id,
        startDate: new Date('2025-06-16T00:00:00Z'),
        endDate: new Date('2025-06-18T00:00:00Z'),
        participants: 2,
        roomType: 'standard',
        status: 'confirmed',
        paymentStatus: 'completed',
        totalPrice: 30000, // Примерная цена (price * participants * durationDays)
      });
      await booking.save();
      console.log('Booking created:', booking._id);
    } else {
      console.log('Booking already exists, skipping creation:', booking._id);
    }

    // Обновление пользователя с бронированием
    const userBooking = user.bookings.find(b => b._id.toString() === booking._id.toString());
    if (!userBooking) {
      await User.findByIdAndUpdate(user._id, {
        $push: {
          bookings: {
            _id: booking._id,
            tourId: tour._id,
            hotelId: hotel._id,
            bookingDate: booking.bookingDate,
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: booking.status,
            participants: booking.participants,
            roomType: booking.roomType,
            paymentStatus: booking.paymentStatus,
            totalPrice: booking.totalPrice,
          },
        },
      });
      console.log('User bookings updated');
    } else {
      console.log('User booking already exists, skipping update');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

runMigration();