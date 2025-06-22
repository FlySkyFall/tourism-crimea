const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');

async function migrateHotels() {
  try {
    // Подключение к базе данных (замените на вашу строку подключения)
    await mongoose.connect('mongodb://localhost:27017/tourism-krasnodar', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Starting migration of hotels collection...');

    // Находим все документы, где roomTypes отсутствует или не является массивом
    const hotels = await Hotel.find({ $or: [{ roomTypes: { $exists: false } }, { roomTypes: { $not: { $type: 'array' } } }] });

    if (hotels.length === 0) {
      console.log('No hotels need migration for roomTypes.');
      return;
    }

    console.log(`Found ${hotels.length} hotels to update.`);

    // Обновляем каждый документ
    for (const hotel of hotels) {
      hotel.roomTypes = ['standard', 'standardWithAC', 'luxury'];
      await hotel.save();
      console.log(`Updated hotel with ID: ${hotel._id}`);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

migrateHotels();