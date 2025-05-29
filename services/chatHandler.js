const Tour = require('../models/Tour');
const Region = require('../models/Region');
const Attraction = require('../models/Attraction');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

module.exports = (socket, io) => {
  socket.on('chatMessage', async (msg) => {
    try {
      const message = msg.trim().toLowerCase();
      let response = '';

      // Приветственное сообщение при подключении
      if (message === 'start') {
        response = 'Здравствуйте! Я чат-бот Краснодарского края. Могу помочь с турами, регионами, достопримечательностями, отелями или статусом брони. Напишите, например, "туры", "достопримечательности Сочи", "отели" или "статус брони".';
        socket.emit('botMessage', { text: response, sender: 'bot' });
        return;
      }

      // Проверка статуса брони
      if (message.includes('статус брони')) {
        const userId = socket.request.session.passport?.user;
        if (!userId) {
          response = 'Войдите в аккаунт, чтобы проверить статус брони. Перейдите на /auth/login.';
        } else {
          const bookings = await Booking.find({ userId }).populate('tourId', 'title').limit(3).lean();
          if (bookings.length > 0) {
            response = 'Ваши брони:\n' + bookings.map(b => 
              `- Тур: ${b.tourId.title}, Дата: ${new Date(b.tourDate).toLocaleDateString('ru-RU')}, Статус: ${b.status}, Оплата: ${b.paymentStatus}`
            ).join('\n');
          } else {
            response = 'У вас нет активных бронирований. Создайте бронь на /tours.';
          }
        }
      }
      // Обработка ключевых слов
      else if (message.includes('туры')) {
        const regionMatch = message.match(/туры\s+(.+)/i);
        if (regionMatch) {
          const region = regionMatch[1].trim();
          const tours = await Tour.find({ 'location.region': { $regex: region, $options: 'i' } }).limit(3).lean();
          if (tours.length > 0) {
            response = `Найдены туры в ${region}:\n` + tours.map(t => `- ${t.title} (${t.price} ₽)`).join('\n') + '\nПодробности на /tours';
          } else {
            response = `Туры в ${region} не найдены. Попробуйте другой регион, например, "туры Сочи".`;
          }
        } else {
          const tours = await Tour.find().limit(3).lean();
          response = 'Вот несколько туров:\n' + tours.map(t => `- ${t.title} (${t.price} ₽)`).join('\n') + '\nПодробности на /tours';
        }
      } else if (message.includes('достопримечательности')) {
        const regionMatch = message.match(/достопримечательности\s+(.+)/i);
        if (regionMatch) {
          const region = regionMatch[1].trim();
          const attractions = await Attraction.find({ 'location.region': { $regex: region, $options: 'i' } }).limit(3).lean();
          if (attractions.length > 0) {
            response = `Достопримечательности в ${region}:\n` + attractions.map(a => `- ${a.name}`).join('\n') + '\nПодробности на /attractions';
          } else {
            response = `Достопримечательности в ${region} не найдены. Попробуйте другой регион, например, "достопримечательности Сочи".`;
          }
        } else {
          const attractions = await Attraction.find().limit(3).lean();
          response = 'Вот несколько достопримечательностей:\n' + attractions.map(a => `- ${a.name}`).join('\n') + '\nПодробности на /attractions';
        }
      } else if (message.includes('отели')) {
        const regionMatch = message.match(/отели\s+(.+)/i);
        if (regionMatch) {
          const region = regionMatch[1].trim();
          const hotels = await Hotel.find({ 'location.region': { $regex: region, $options: 'i' } }).limit(3).lean();
          if (hotels.length > 0) {
            response = `Отели в ${region}:\n` + hotels.map(h => `- ${h.name} (рейтинг: ${h.rating})`).join('\n') + '\nПодробности на /hotels';
          } else {
            response = `Отели в ${region} не найдены. Попробуйте другой регион, например, "отели Сочи".`;
          }
        } else {
          const hotels = await Hotel.find().limit(3).lean();
          response = 'Вот несколько отелей:\n' + hotels.map(h => `- ${h.name} (рейтинг: ${h.rating})`).join('\n') + '\nПодробности на /hotels';
        }
      } else if (message.includes('регионы')) {
        const regions = await Region.find().limit(3).lean();
        response = 'Доступные регионы:\n' + regions.map(r => `- ${r.name}`).join('\n') + '\nПодробности на /regions';
      } else if (message.includes('привет') || message.includes('здравствуйте')) {
        response = 'Привет! Чем могу помочь? Напиши "туры", "достопримечательности", "отели", "регионы" или "статус брони".';
      } else {
        response = 'Извините, я не понял запрос. Попробуйте написать "туры", "достопримечательности Сочи", "отели", "регионы" или "статус брони".';
      }

      socket.emit('botMessage', { text: response, sender: 'bot' });
    } catch (error) {
      console.error('Ошибка в chatHandler:', error);
      socket.emit('botMessage', { text: 'Произошла ошибка. Попробуйте снова.', sender: 'bot' });
    }
  });

  // Отправка приветственного сообщения при подключении
  socket.emit('botMessage', { text: 'Здравствуйте! Я чат-бот Краснодарского края. Напишите, чем могу помочь!', sender: 'bot' });
};