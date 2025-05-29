const mongoose = require('mongoose');
const Tour = require('../models/Tour');

async function migrateTours() {
  try {
    await mongoose.connect('mongodb://localhost/tourism-krasnodar', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const tours = await Tour.find({});
    for (const tour of tours) {
      const updates = {
        $unset: { difficultyLevel: '' },
      };
      if (['passive', 'health'].includes(tour.type)) {
        updates.$set = { hotelCapacity: tour.maxGroupSize + Math.floor(Math.random() * 50) };
      }
      await Tour.updateOne({ _id: tour._id }, updates);
      console.log(`Updated tour ${tour.title}`);
    }
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateTours();