const mongoose = require('mongoose');
const Tour = require('../models/Tour');

mongoose.connect('mongodb://localhost:27017/tourism-krasnodar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateTours() {
  try {
    console.log('Starting migration...');
    const tours = await Tour.find();
    for (const tour of tours) {
      if (!tour.route) {
        if (tour.type === 'excursion') {
          // Для экскурсионных туров устанавливаем минимальный маршрут (координаты из location)
          tour.route = [{ lat: tour.location.coordinates.lat, lng: tour.location.coordinates.lng }];
        } else {
          // Для других типов оставляем пустой массив
          tour.route = [];
        }
        await tour.save({ validateBeforeSave: false }); // Отключаем валидацию при сохранении
        console.log(`Updated tour ${tour._id} with route: ${JSON.stringify(tour.route)}`);
      }
    }
    console.log('Migration completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Migration failed:', error);
    mongoose.connection.close();
  }
}

migrateTours();