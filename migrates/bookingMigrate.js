const mongoose = require('mongoose');
const Booking = require('../models/Booking')
const Tour = require('../models/Tour');

async function migrateBookings() {
  try {
    await mongoose.connect('mongodb://localhost/tourism-krasnodar', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const bookings = await Booking.find({ tourDate: { $exists: false } });
    for (const booking of bookings) {
      const tour = await Tour.findById(booking.tourId);
      if (tour) {
        await Booking.updateOne(
          { _id: booking._id },
          { $set: { tourDate: tour.season.start } }
        );
        console.log(`Updated booking ${booking._id} with tourDate`);
      }
    }
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateBookings();