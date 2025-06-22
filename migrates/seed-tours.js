const mongoose = require('mongoose');
const Tour = require('../models/Tour');

mongoose.connect('mongodb://localhost:27017/tourism-krasnodar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const toursData = [
  {
    title: 'Экскурсия по Красной Поляне',
    description: 'Путешествие по живописным местам Красной Поляны с остановками у водопадов и гор.',
    type: 'excursion',
    durationDays: 2,
    price: 5000,
    location: {
      region: 'Краснодарский край',
      coordinates: { lat: 43.6763, lng: 40.2784 },
    },
    route: [
      { lat: 43.6763, lng: 40.2784 }, // Начало в Красной Поляне
      { lat: 43.6850, lng: 40.2900 }, // Водопад
      { lat: 43.6950, lng: 40.3000 }, // Гора
      { lat: 43.6763, lng: 40.2784 }, // Возвращение
    ],
    accommodation: {
      type: 'none',
    },
    season: {
      start: new Date('2025-06-01'),
      end: new Date('2025-09-30'),
    },
    minGroupSize: 2,
    maxGroupSize: 15,
    images: [],
    isHotDeal: false,
    discounts: {},
  },
  {
    title: 'Экскурсия по Сочи',
    description: 'Обзорная экскурсия по городу Сочи с посещением Олимпийского парка и набережной.',
    type: 'excursion',
    durationDays: 1,
    price: 3000,
    location: {
      region: 'Краснодарский край',
      coordinates: { lat: 43.5855, lng: 39.7231 },
    },
    route: [
      { lat: 43.5855, lng: 39.7231 }, // Центр Сочи
      { lat: 43.6010, lng: 39.7290 }, // Олимпийский парк
      { lat: 43.5770, lng: 39.7170 }, // Набережная
      { lat: 43.5855, lng: 39.7231 }, // Возвращение
    ],
    accommodation: {
      type: 'none',
    },
    season: {
      start: new Date('2025-06-01'),
      end: new Date('2025-09-30'),
    },
    minGroupSize: 2,
    maxGroupSize: 10,
    images: ['/images/sochi.jpg'],
    isHotDeal: true,
    discounts: {
      hotDealDiscount: { enabled: true, percentage: 10 },
    },
  },
];

async function seedTours() {
  try {
    console.log('Seeding tours...');
    await Tour.deleteMany({ type: 'excursion' }); // Удаляем существующие экскурсионные туры
    const createdTours = await Tour.insertMany(toursData);
    console.log('Tours seeded successfully:', createdTours.map(t => t._id));
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding failed:', error);
    mongoose.connection.close();
  }
}

seedTours();