const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Проверка переменных окружения
if (!process.env.MONGO_URI) {
  console.error('Ошибка: MONGODB_URI не определен в .env');
  process.exit(1);
}
if (!process.env.TWO_GIS_API_KEY) {
  console.error('Ошибка: TWO_GIS_API_KEY не определен в .env');
  process.exit(1);
}

console.log('Переменные окружения загружены:', {
  MONGODB_URI: process.env.MONGO_URI,
  TWO_GIS_API_KEY: process.env.TWO_GIS_API_KEY ? '***скрыто***' : undefined,
});

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Подключено к MongoDB'))
  .catch(err => {
    console.error('Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  });

// Модели
const Hotel = require('./models/Hotel');
const Restaurant = require('./models/Restaurant');
const Attraction = require('./models/Attraction');
const Tour = require('./models/Tour');

// 2GIS API настройки
const TWO_GIS_API_KEY = process.env.TWO_GIS_API_KEY;
const BASE_URL = 'https://catalog.api.2gis.com/3.0/items';

// Города Крыма для поиска
const crimeaCities = [
  { name: 'Симферополь', lat: 44.9521, lng: 34.1024, radius: 50000 },
  { name: 'Ялта', lat: 44.4951, lng: 34.1663, radius: 30000 },
  { name: 'Севастополь', lat: 44.6166, lng: 33.5254, radius: 40000 },
  { name: 'Евпатория', lat: 45.1904, lng: 33.3669, radius: 30000 },
];

// Категории для поиска
const categories = [
  { query: 'отели', model: Hotel, target: 'hotels', count: 50 },
  { query: 'рестораны', model: Restaurant, target: 'restaurants', count: 50 },
  { query: 'достопримечательности', model: Attraction, target: 'attractions', count: 50 },
];

// Поиск мест через 2GIS API
async function fetchPlaces(category, city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(category.query)}&point=${city.lng},${city.lat}&radius=${city.radius}&key=${TWO_GIS_API_KEY}`;
  console.log(`Выполняется запрос: ${url}`);
  try {
    const response = await axios.get(url);
    console.log(`Ответ от 2GIS для ${category.query} в ${city.name}:`, {
      status: response.status,
      itemCount: response.data.result?.items?.length || 0,
    });
    if (!response.data.result?.items) {
      console.warn(`Нет данных для ${category.query} в ${city.name}`);
      return [];
    }
    return response.data.result.items.slice(0, Math.ceil(category.count / crimeaCities.length));
  } catch (err) {
    console.error(`Ошибка при запросе ${category.query} в ${city.name}:`, err.message);
    if (err.response) {
      console.error(`Статус: ${err.response.status}, Данные:`, err.response.data);
    }
    return [];
  }
}

// Сопоставление данных с моделями
function mapToHotel(data) {
  if (!data.point?.lat || !data.point?.lon) {
    console.warn(`Пропущен отель "${data.name || 'без названия'}": отсутствуют координаты`, data.point);
    return null;
  }
  const region = data.address?.components?.find(comp => comp.type === 'city')?.name || 'Крым';
  const roomTypes = data.rubric?.includes('люкс') ? ['luxury'] : ['standard'];
  return {
    name: data.name || 'Без названия',
    description: data.description || `Отель в ${region}`,
    location: {
      region,
      coordinates: {
        lat: parseFloat(data.point.lat),
        lng: parseFloat(data.point.lon),
      },
    },
    rating: data.reviews?.general_rating || 0,
    amenities: data.rubric?.includes('спа') ? ['spa', 'wifi'] : ['wifi'],
    images: data.photos?.slice(0, 3).map(photo => photo.url) || [],
    website: data.links?.find(link => link.type === 'website')?.url,
    capacity: Math.floor(Math.random() * 150) + 50,
    roomTypes,
    reviews: [],
  };
}

function mapToRestaurant(data) {
  if (!data.point?.lat || !data.point?.lon) {
    console.warn(`Пропущен ресторан "${data.name || 'без названия'}": отсутствуют координаты`, data.point);
    return null;
  }
  const region = data.address?.components?.find(comp => comp.type === 'city')?.name || 'Крым';
  const cuisine = data.rubric?.replace('ресторан_', '') || 'Европейская';
  return {
    name: data.name || 'Без названия',
    description: data.description || `Ресторан в ${region}`,
    location: {
      region,
      coordinates: {
        lat: parseFloat(data.point.lat),
        lng: parseFloat(data.point.lon),
      },
    },
    cuisine: cuisine.charAt(0).toUpperCase() + cuisine.slice(1),
    images: data.photos?.slice(0, 3).map(photo => photo.url) || [],
    website: data.links?.find(link => link.type === 'website')?.url,
    reviews: [],
  };
}

function mapToAttraction(data) {
  if (!data.point?.lat || !data.point?.lon) {
    console.warn(`Пропущена достопримечательность "${data.name || 'без названия'}": отсутствуют координаты`, data.point);
    return null;
  }
  const region = data.address?.components?.find(comp => comp.type === 'city')?.name || 'Крым';
  const category = data.rubric?.includes('музей') ? 'cultural' : data.rubric?.includes('парк') ? 'natural' : data.rubric?.includes('истори') ? 'historical' : 'other';
  return {
    name: data.name || 'Без названия',
    description: data.description || `Достопримечательность в ${region}`,
    location: {
      region,
      coordinates: {
        type: 'Point',
        coordinates: [parseFloat(data.point.lon), parseFloat(data.point.lat)],
      },
    },
    category,
    images: data.photos?.slice(0, 3).map(photo => photo.url) || [],
    website: data.links?.find(link => link.type === 'website')?.url,
  };
}

// Создание синтетического тура
async function createTour(hotel, restaurant, attraction) {
  const tourTypes = ['active', 'passive', 'camping', 'excursion', 'health'];
  const type = tourTypes[Math.floor(Math.random() * tourTypes.length)];
  const durationDays = Math.floor(Math.random() * 6) + 2; // 2–7 дней
  return {
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} тур по ${hotel.location.region}`,
    description: `Уникальный ${type} тур с посещением ${attraction.name} и питанием в ${restaurant.name}.`,
    type,
    durationDays,
    price: durationDays * 10000 + Math.floor(Math.random() * 5000), // 10,000–15,000 ₽/день
    location: hotel.location,
    accommodation: {
      hotel: hotel._id,
      type: 'hotel',
      amenities: hotel.amenities,
    },
    activities: [
      {
        name: `Посещение ${attraction.name}`,
        description: attraction.description,
        durationHours: 3,
        equipmentRequired: false,
      },
    ],
    excursions: [
      {
        name: `Экскурсия в ${attraction.name}`,
        description: `Подробное знакомство с ${attraction.name}.`,
        durationHours: 2,
        price: 2000,
      },
    ],
    includedServices: ['транспорт', 'гид', 'питание'],
    season: {
      start: new Date('2025-05-01'),
      end: new Date('2025-09-30'),
    },
    minGroupSize: 5,
    maxGroupSize: 20,
    hotelCapacity: hotel.capacity,
    images: [...hotel.images, ...attraction.images].slice(0, 5),
    isFeatured: Math.random() < 0.1,
    reviews: [],
  };
}

// Основная функция импорта
async function importData() {
  console.log('Начало импорта данных...');
  try {
    // Проверка подключения к MongoDB
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB не подключен');
    }
    console.log('MongoDB готов, начинаем импорт...');

    // Очистка коллекций (опционально, для тестирования)
    // console.log('Очистка коллекций...');
    // await Promise.all([
    //   Hotel.deleteMany({}),
    //   Restaurant.deleteMany({}),
    //   Attraction.deleteMany({}),
    //   Tour.deleteMany({}),
    // ]);
    // console.log('Коллекции очищены');

    // Импорт отелей, ресторанов, достопримечательностей
    for (const category of categories) {
      console.log(`Обработка категории: ${category.query}`);
      let places = [];
      for (const city of crimeaCities) {
        console.log(`Запрос данных для ${city.name}`);
        const results = await fetchPlaces(category, city);
        places = [...places, ...results];
      }

      console.log(`Найдено ${places.length} ${category.query}...`);

      if (places.length === 0) {
        console.warn(`Нет данных для категории ${category.query}, пропускаем...`);
        continue;
      }

      for (const place of places) {
        // Проверка на дубликаты
        const existing = await category.model.findOne({
          name: place.name,
          'location.region': place.address?.components?.find(comp => comp.type === 'city')?.name || 'Крым',
        });
        if (existing) {
          console.log(`Пропущен дубликат: ${place.name}`);
          continue;
        }

        let mappedData;
        if (category.target === 'hotels') {
          mappedData = mapToHotel(place);
        } else if (category.target === 'restaurants') {
          mappedData = mapToRestaurant(place);
        } else if (category.target === 'attractions') {
          mappedData = mapToAttraction(place);
        }

        if (!mappedData) {
          console.log(`Пропущен объект ${place.name}: недействительные данные`);
          continue;
        }

        await category.model.create(mappedData);
        console.log(`Добавлено: ${place.name} (${category.target})`);
      }
    }

    // Создание туров
    console.log('Создание туров...');
    const hotels = await Hotel.find().limit(50);
    const restaurants = await Restaurant.find().limit(50);
    const attractions = await Attraction.find().limit(50);

    console.log(`Доступно для туров: ${hotels.length} отелей, ${restaurants.length} ресторанов, ${attractions.length} достопримечательностей`);

    if (hotels.length === 0 || restaurants.length === 0 || attractions.length === 0) {
      console.error('Ошибка: Недостаточно данных для создания туров');
      return;
    }

    for (let i = 0; i < 50; i++) {
      const hotel = hotels[i % hotels.length];
      const restaurant = restaurants[i % restaurants.length];
      const attraction = attractions[i % attractions.length];

      const tour = await createTour(hotel, restaurant, attraction);
      await Tour.create(tour);
      console.log(`Добавлен тур: ${tour.title}`);
    }

    console.log('Импорт завершен успешно!');
  } catch (err) {
    console.error('Критическая ошибка импорта:', err.message);
    console.error('Стек ошибки:', err.stack);
  } finally {
    console.log('Завершение работы, отключение от MongoDB...');
    await mongoose.disconnect();
    console.log('Отключено от MongoDB');
  }
}

// Запуск импорта
console.log('Запуск скрипта импорта...');
importData();