const mongoose = require('mongoose');
const Tour = require('../models/Tour');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');

async function initAvailability() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tourism-krasnodar', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const tours = await Tour.find();
    for (const tour of tours) {
      const maxCapacity = ['passive', 'health'].includes(tour.type) ? tour.hotelCapacity : tour.maxGroupSize;
      const seasonStart = new Date(tour.season.start);
      const seasonEnd = new Date(tour.season.end);

      const currentDate = new Date(seasonStart);
      while (currentDate <= seasonEnd) {
        const date = new Date(currentDate.setHours(0, 0, 0, 0));
        const existingAvailability = await Availability.findOne({ tourId: tour._id, date });
        if (!existingAvailability) {
          await Availability.create({
            tourId: tour._id,
            date,
            availableSlots: maxCapacity,
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Учёт существующих подтверждённых бронирований
      const bookings = await Booking.find({ tourId: tour._id, paymentStatus: 'completed' });
      for (const booking of bookings) {
        const tourDates = [];
        for (let i = 0; i < tour.durationDays; i++) {
          const date = new Date(booking.tourDate);
          date.setDate(booking.tourDate.getDate() + i);
          tourDates.push(new Date(date.setHours(0, 0, 0, 0)));
        }

        await Availability.updateMany(
          { tourId: tour._id, date: { $in: tourDates } },
          { $inc: { availableSlots: -booking.participants } }
        );
      }
    }

    console.log('Availability initialized successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error in initAvailability:', error.message, error.stack);
    mongoose.disconnect();
  }
}

initAvailability();