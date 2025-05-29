const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Подключаем модель Hotel
require('../models/Hotel');

const Hotel = mongoose.model('Hotel');

async function migrate() {
  try {
    // Подключение к базе данных
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Проверяем общее количество отелей
    const totalHotels = await Hotel.countDocuments({});
    console.log(`Total hotels in database: ${totalHotels}`);

    // Поиск отелей без apiKey, с null или пустым apiKey
    const hotels = await Hotel.find({
      $or: [
        { apiKey: { $exists: false } },
        { apiKey: null },
        { apiKey: '' }
      ]
    });

    console.log(`Found ${hotels.length} hotels needing apiKey migration`);

    if (hotels.length > 0) {
      // Обновление каждой записи
      for (const hotel of hotels) {
        const apiKey = crypto.randomBytes(32).toString('hex');
        hotel.apiKey = apiKey;
        await hotel.save();
        console.log(`Updated hotel "${hotel.name}" (ID: ${hotel._id}) with apiKey: ${apiKey}`);
      }
      console.log('Migration completed: All hotels have apiKey');
    } else {
      console.log('No hotels found needing migration. Checking existing apiKeys...');
      // Дополнительная проверка отелей с apiKey
      const hotelsWithApiKey = await Hotel.find({ apiKey: { $exists: true, $ne: null, $ne: '' } }).select('name apiKey');
      console.log(`Hotels with existing apiKey: ${hotelsWithApiKey.length}`);
      hotelsWithApiKey.forEach(hotel => {
        console.log(`Hotel "${hotel.name}" (ID: ${hotel._id}) already has apiKey: ${hotel.apiKey}`);
      });
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

migrate();