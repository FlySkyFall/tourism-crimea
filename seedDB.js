const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Achievement = require('./models/Achievement');
const Region = require('./models/Region');
const Hotel = require('./models/Hotel');
const Attraction = require('./models/Attraction');
const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
const Tour = require('./models/Tour');
const Booking = require('./models/Booking');
const Post = require('./models/Post');
const Review = require('./models/Review');
const UserAchievement = require('./models/UserAchievement');
const HotelAvailability = require('./models/HotelAvailability');

// Данные пользователей
const usersData = [
  {
    username: 'ivan_petrov',
    email: 'ivan.petrov@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Иван', lastName: 'Петров', phone: '+79991234567', preferences: ['excursion', 'beach'] },
  },
  {
    username: 'anna_smirnova',
    email: 'anna.smirnova@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Анна', lastName: 'Смирнова', phone: '+79997654321', preferences: ['health', 'cultural'] },
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    profile: { firstName: 'Админ', lastName: 'Крым', phone: '+79990000000', preferences: [] },
  },
  {
    username: 'maria_ivanova',
    email: 'maria.ivanova@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Мария', lastName: 'Иванова', phone: '+79991112233', preferences: ['active', 'camping'] },
  },
  {
    username: 'dmitry_kuznetsov',
    email: 'dmitry.kuznetsov@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Дмитрий', lastName: 'Кузнецов', phone: '+79993334455', preferences: ['excursion', 'historical'] },
  },
  {
    username: 'elena_sokolova',
    email: 'elena.sokolova@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Елена', lastName: 'Соколова', phone: '+79995556677', preferences: ['passive', 'beach'] },
  },
  {
    username: 'alexey_morozov',
    email: 'alexey.morozov@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Алексей', lastName: 'Морозов', phone: '+79997778899', preferences: ['active', 'health'] },
  },
  {
    username: 'olga_popova',
    email: 'olga.popova@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Ольга', lastName: 'Попова', phone: '+79998889900', preferences: ['cultural', 'excursion'] },
  },
  {
    username: 'sergey_volkov',
    email: 'sergey.volkov@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Сергей', lastName: 'Волков', phone: '+79990001122', preferences: ['camping', 'active'] },
  },
  {
    username: 'natalia_kovaleva',
    email: 'natalia.kovaleva@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'user',
    profile: { firstName: 'Наталья', lastName: 'Ковалёва', phone: '+79992223344', preferences: ['health', 'passive'] },
  },
];

// Данные достижений
const achievementsData = [
  { name: 'Новичок', description: 'Создайте свой первый пост', condition: 'create_post_1', icon: '/images/achievements/newbie.png' },
  { name: 'Путешественник', description: 'Посетите 3 региона', condition: 'visit_regions_3', icon: '/images/achievements/traveler.png' },
  { name: 'Энтузиаст', description: 'Забронируйте 5 туров', condition: 'book_tours_5', icon: '/images/achievements/enthusiast.png' },
  { name: 'Комментатор', description: 'Оставьте 10 комментариев', condition: 'comment_10', icon: '/images/achievements/commentator.png' },
  { name: 'Историк', description: 'Посетите 5 исторических достопримечательностей', condition: 'visit_attractions_5', icon: '/images/achievements/historian.png' },
  { name: 'Кемпер', description: 'Завершите кемпинг-тур', condition: 'complete_camping_1', icon: '/images/achievements/camper.png' },
  { name: 'Гурман', description: 'Оставьте отзывы на 3 ресторана', condition: 'review_restaurants_3', icon: '/images/achievements/gourmet.png' },
  { name: 'Релаксер', description: 'Завершите оздоровительный тур', condition: 'complete_health_1', icon: '/images/achievements/relaxer.png' },
  { name: 'Активный турист', description: 'Завершите 3 активных тура', condition: 'complete_active_3', icon: '/images/achievements/active.png' },
  { name: 'Фотограф', description: 'Добавьте 5 фото в посты', condition: 'upload_photos_5', icon: '/images/achievements/photographer.png' },
];

// Данные регионов
const regionsData = [
  { name: 'Ялта', description: 'Южный берег Крыма с дворцами и набережной', attractions: ['Ливадийский дворец', 'Ай-Петри'], climate: 'Средиземноморский', bestSeason: 'Май-Сентябрь', coordinates: { lat: 44.4952, lng: 34.1663 }, images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'] },
  { name: 'Алушта', description: 'Курортный город с горами и пляжами', attractions: ['Демерджи', 'Долина Привидений'], climate: 'Средиземноморский', bestSeason: 'Июнь-Сентябрь', coordinates: { lat: 44.6764, lng: 34.4108 }, images: ['https://commons.wikimedia.org/wiki/File:Alushta_Beach.jpg'] },
  { name: 'Севастополь', description: 'Город-герой с историческими памятниками', attractions: ['Херсонес', 'Панорама'], climate: 'Умеренный', bestSeason: 'Апрель-Октябрь', coordinates: { lat: 44.6167, lng: 33.5254 }, images: ['https://commons.wikimedia.org/wiki/File:Chersonesos_Sevastopol.jpg'] },
  { name: 'Симферополь', description: 'Столица Крыма, транспортный узел', attractions: ['Неаполь Скифский'], climate: 'Континентальный', bestSeason: 'Весна-Осень', coordinates: { lat: 44.9570, lng: 34.1108 }, images: ['https://commons.wikimedia.org/wiki/File:Simferopol_Center.jpg'] },
  { name: 'Керчь', description: 'Древний город с античными памятниками', attractions: ['Аджимушкайские каменоломни', 'Царский курган'], climate: 'Умеренный', bestSeason: 'Май-Октябрь', coordinates: { lat: 45.3531, lng: 36.4754 }, images: ['https://commons.wikimedia.org/wiki/File:Kerch_Mithridates.jpg'] },
  { name: 'Феодосия', description: 'Город с галереей Айвазовского и пляжами', attractions: ['Генуэзская крепость', 'Кара-Даг'], climate: 'Средиземноморский', bestSeason: 'Июнь-Сентябрь', coordinates: { lat: 45.0319, lng: 35.3824 }, images: ['https://commons.wikimedia.org/wiki/File:Feodosia_Aivazovsky_Gallery.jpg'] },
  { name: 'Евпатория', description: 'Песчаные пляжи и санатории', attractions: ['Караимские кенассы'], climate: 'Средиземноморский', bestSeason: 'Июнь-Сентябрь', coordinates: { lat: 45.1904, lng: 33.3669 }, images: ['https://commons.wikimedia.org/wiki/File:Evpatoria_Beach.jpg'] },
  { name: 'Судак', description: 'Город с Генуэзской крепостью и вином', attractions: ['Генуэзская крепость', 'Новый Свет'], climate: 'Средиземноморский', bestSeason: 'Май-Октябрь', coordinates: { lat: 44.8492, lng: 34.9747 }, images: ['https://commons.wikimedia.org/wiki/File:Sudak_Fortress.jpg'] },
  { name: 'Бахчисарай', description: 'Исторический центр с ханским дворцом', attractions: ['Ханский дворец', 'Чуфут-Кале'], climate: 'Континентальный', bestSeason: 'Апрель-Октябрь', coordinates: { lat: 44.7552, lng: 33.8518 }, images: ['https://commons.wikimedia.org/wiki/File:Bakhchisaray_Palace.jpg'] },
  { name: 'Алупка', description: 'Живописный город с Воронцовским дворцом', attractions: ['Воронцовский дворец'], climate: 'Средиземноморский', bestSeason: 'Май-Сентябрь', coordinates: { lat: 44.4198, lng: 34.0489 }, images: ['https://commons.wikimedia.org/wiki/File:Vorontsov_Palace.jpg'] },
];

// Данные отелей
const hotelsData = [
  {
    name: 'Villa Elena Hotel',
    description: 'Роскошный отель в Ялте с видом на море',
    location: { region: 'Ялта', coordinates: { lat: 44.4935, lng: 34.1598 } },
    rating: 4.8,
    amenities: ['Wi-Fi', 'Спа', 'Бассейн', 'Ресторан'],
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    website: 'https://villaelena.ru',
    capacity: 100,
    roomTypes: ['standard', 'standardWithAC', 'luxury'],
    reviews: [],
  },
  {
    name: 'Mriya Resort & Spa',
    description: 'Курорт с аквапарком и спа в Ялте',
    location: { region: 'Ялта', coordinates: { lat: 44.3987, lng: 33.9524 } },
    rating: 4.9,
    amenities: ['Wi-Fi', 'Аквапарк', 'Спа', 'Бассейн'],
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    website: 'https://mriyaresort.com',
    capacity: 400,
    roomTypes: ['standard', 'standardWithAC', 'luxury'],
    reviews: [],
  },
  {
    name: 'Bristol Hotel',
    description: 'Уютный отель в центре Ялты',
    location: { region: 'Ялта', coordinates: { lat: 44.4942, lng: 34.1668 } },
    rating: 4.5,
    amenities: ['Wi-Fi', 'Ресторан', 'Парковка'],
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    website: 'https://bristol-yalta.ru',
    capacity: 150,
    roomTypes: ['standard', 'standardWithAC'],
    reviews: [],
  },
  {
    name: 'Riviera Sunrise Resort',
    description: 'Отель с пляжем в Алуште',
    location: { region: 'Алушта', coordinates: { lat: 44.6712, lng: 34.4087 } },
    rating: 4.7,
    amenities: ['Wi-Fi', 'Спа', 'Бассейн', 'Пляж'],
    images: ['https://commons.wikimedia.org/wiki/File:Alushta_Beach.jpg'],
    website: 'https://rivierasunrise.ru',
    capacity: 200,
    roomTypes: ['standard', 'luxury'],
    reviews: [],
  },
  {
    name: 'Aquamarine Resort',
    description: 'Современный отель в Севастополе',
    location: { region: 'Севастополь', coordinates: { lat: 44.6023, lng: 33.4967 } },
    rating: 4.6,
    amenities: ['Wi-Fi', 'Аквапарк', 'Спа'],
    images: ['https://commons.wikimedia.org/wiki/File:Chersonesos_Sevastopol.jpg'],
    website: 'https://aquamarine-resort.ru',
    capacity: 300,
    roomTypes: ['standard', 'standardWithAC', 'luxury'],
    reviews: [],
  },
  {
    name: 'Palmira Palace',
    description: 'Курорт с оздоровительными программами',
    location: { region: 'Ялта', coordinates: { lat: 44.4365, lng: 34.1352 } },
    rating: 4.8,
    amenities: ['Wi-Fi', 'Спа', 'Бассейн'],
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    website: 'https://palmira-palace.ru',
    capacity: 250,
    roomTypes: ['standard', 'luxury'],
    reviews: [],
  },
  {
    name: 'Krym Hotel',
    description: 'Бюджетный отель в Симферополе',
    location: { region: 'Симферополь', coordinates: { lat: 44.9492, lng: 34.1035 } },
    rating: 4.2,
    amenities: ['Wi-Fi', 'Ресторан'],
    images: ['https://commons.wikimedia.org/wiki/File:Simferopol_Center.jpg'],
    website: 'https://krym-hotel.ru',
    capacity: 100,
    roomTypes: ['standard'],
    reviews: [],
  },
  {
    name: 'Kerch Panorama',
    description: 'Отель с видом на море в Керчи',
    location: { region: 'Керчь', coordinates: { lat: 45.3521, lng: 36.4702 } },
    rating: 4.5,
    amenities: ['Wi-Fi', 'Ресторан', 'Пляж'],
    images: ['https://commons.wikimedia.org/wiki/File:Kerch_Mithridates.jpg'],
    website: 'https://kerch-panorama.ru',
    capacity: 90,
    roomTypes: ['standard', 'standardWithAC'],
    reviews: [],
  },
  {
    name: 'Golden Resort',
    description: 'Семейный отель в Алуште',
    location: { region: 'Алушта', coordinates: { lat: 44.6789, lng: 34.4123 } },
    rating: 4.6,
    amenities: ['Wi-Fi', 'Бассейн', 'Детский клуб'],
    images: ['https://commons.wikimedia.org/wiki/File:Alushta_Beach.jpg'],
    website: 'https://golden-resort.ru',
    capacity: 150,
    roomTypes: ['standard', 'luxury'],
    reviews: [],
  },
  {
    name: 'Feodosia Grand',
    description: 'Отель рядом с пляжем в Феодосии',
    location: { region: 'Феодосия', coordinates: { lat: 45.0332, lng: 35.3845 } },
    rating: 4.5,
    amenities: ['Wi-Fi', 'Ресторан', 'Пляж'],
    images: ['https://commons.wikimedia.org/wiki/File:Feodosia_Aivazovsky_Gallery.jpg'],
    website: 'https://feodosia-grand.ru',
    capacity: 130,
    roomTypes: ['standard', 'standardWithAC', 'luxury'],
    reviews: [],
  },
];

// Данные достопримечательностей
const attractionsData = [
  {
    name: 'Ливадийский дворец',
    description: 'Исторический дворец Романовых в Ялте',
    location: { region: 'Ялта', coordinates: { type: 'Point', coordinates: [34.1432, 44.4678] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Livadia_Palace_Yalta.jpg'],
    website: 'http://ливдия-дворец.рф',
  },
  {
    name: 'Ай-Петри',
    description: 'Горный пик с канатной дорогой',
    location: { region: 'Ялта', coordinates: { type: 'Point', coordinates: [34.0517, 44.4509] } },
    category: 'natural',
    images: ['https://commons.wikimedia.org/wiki/File:Ay-Petri_Peak.jpg'],
  },
  {
    name: 'Херсонес Таврический',
    description: 'Античный город в Севастополе',
    location: { region: 'Севастополь', coordinates: { type: 'Point', coordinates: [33.4933, 44.6112] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Chersonesos_Taurica.jpg'],
    website: 'https://chersonesos-sev.ru',
  },
  {
    name: 'Генуэзская крепость',
    description: 'Средневековая крепость в Судаке',
    location: { region: 'Судак', coordinates: { type: 'Point', coordinates: [34.9747, 44.8492] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Sudak_Fortress.jpg'],
  },
  {
    name: 'Ханский дворец',
    description: 'Резиденция крымских ханов в Бахчисарае',
    location: { region: 'Бахчисарай', coordinates: { type: 'Point', coordinates: [33.8518, 44.7552] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Bakhchisaray_Palace.jpg'],
    website: 'http://handvorec.ru',
  },
  {
    name: 'Кара-Даг',
    description: 'Вулканический массив в Феодосии',
    location: { region: 'Феодосия', coordinates: { type: 'Point', coordinates: [35.2301, 44.9335] } },
    category: 'natural',
    images: ['https://commons.wikimedia.org/wiki/File:Kara-Dag_Feodosia.jpg'],
  },
  {
    name: 'Воронцовский дворец',
    description: 'Архитектурный памятник в Алупке',
    location: { region: 'Алупка', coordinates: { type: 'Point', coordinates: [34.0489, 44.4198] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Vorontsov_Palace.jpg'],
  },
  {
    name: 'Неаполь Скифский',
    description: 'Археологический памятник в Симферополе',
    location: { region: 'Симферополь', coordinates: { type: 'Point', coordinates: [34.1023, 44.9456] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Neapolis_Scythian.jpg'],
  },
  {
    name: 'Аджимушкайские каменоломни',
    description: 'Подземный музей в Керчи',
    location: { region: 'Керчь', coordinates: { type: 'Point', coordinates: [36.4684, 45.3505] } },
    category: 'historical',
    images: ['https://commons.wikimedia.org/wiki/File:Adzhimushkay_Kerch.jpg'],
  },
  {
    name: 'Долина Привидений',
    description: 'Скальные образования в Алуште',
    location: { region: 'Алушта', coordinates: { type: 'Point', coordinates: [34.4012, 44.7512] } },
    category: 'natural',
    images: ['https://commons.wikimedia.org/wiki/File:Demerdzhi_Alushta.jpg'],
  },
];

// Данные ресторанов
const restaurantsData = [
  {
    name: 'Крымский дворик',
    description: 'Ресторан крымской кухни в Ялте',
    location: { region: 'Ялта', coordinates: { lat: 44.4952, lng: 34.1663 } },
    cuisine: 'Крымская',
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    reviews: [],
  },
  {
    name: 'La Fontana',
    description: 'Итальянская кухня на набережной Ялты',
    location: { region: 'Ялта', coordinates: { lat: 44.4968, lng: 34.1689 } },
    cuisine: 'Итальянская',
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    website: 'https://lafontana-yalta.ru',
    reviews: [],
  },
  {
    name: 'Шалаш',
    description: 'Ресторан с видом на море в Алуште',
    location: { region: 'Алушта', coordinates: { lat: 44.6764, lng: 34.4108 } },
    cuisine: 'Европейская',
    images: ['https://commons.wikimedia.org/wiki/File:Alushta_Beach.jpg'],
    reviews: [],
  },
  {
    name: 'Таврида',
    description: 'Ресторан в центре Севастополя',
    location: { region: 'Севастополь', coordinates: { lat: 44.6167, lng: 33.5254 } },
    cuisine: 'Русская',
    images: ['https://commons.wikimedia.org/wiki/File:Chersonesos_Sevastopol.jpg'],
    reviews: [],
  },
  {
    name: 'Золотая рыбка',
    description: 'Рыбный ресторан в Феодосии',
    location: { region: 'Феодосия', coordinates: { lat: 45.0319, lng: 35.3824 } },
    cuisine: 'Морская',
    images: ['https://commons.wikimedia.org/wiki/File:Feodosia_Aivazovsky_Gallery.jpg'],
    reviews: [],
  },
  {
    name: 'Казбек',
    description: 'Кавказская кухня в Симферополе',
    location: { region: 'Симферополь', coordinates: { lat: 44.9570, lng: 34.1108 } },
    cuisine: 'Кавказская',
    images: ['https://commons.wikimedia.org/wiki/File:Simferopol_Center.jpg'],
    reviews: [],
  },
  {
    name: 'Морской бриз',
    description: 'Ресторан на пляже в Евпатории',
    location: { region: 'Евпатория', coordinates: { lat: 45.1904, lng: 33.3669 } },
    cuisine: 'Европейская',
    images: ['https://commons.wikimedia.org/wiki/File:Evpatoria_Beach.jpg'],
    reviews: [],
  },
  {
    name: 'Винный погреб',
    description: 'Ресторан с дегустацией вин в Судаке',
    location: { region: 'Судак', coordinates: { lat: 44.8492, lng: 34.9747 } },
    cuisine: 'Крымская',
    images: ['https://commons.wikimedia.org/wiki/File:Sudak_Fortress.jpg'],
    reviews: [],
  },
  {
    name: 'Ханский очаг',
    description: 'Ресторан крымскотатарской кухни в Бахчисарае',
    location: { region: 'Бахчисарай', coordinates: { lat: 44.7552, lng: 33.8518 } },
    cuisine: 'Крымскотатарская',
    images: ['https://commons.wikimedia.org/wiki/File:Bakhchisaray_Palace.jpg'],
    reviews: [],
  },
  {
    name: 'Панорама',
    description: 'Ресторан с видом на море в Керчи',
    location: { region: 'Керчь', coordinates: { lat: 45.3531, lng: 36.4754 } },
    cuisine: 'Европейская',
    images: ['https://commons.wikimedia.org/wiki/File:Kerch_Mithridates.jpg'],
    reviews: [],
  },
];

// Данные категорий
const categoriesData = [
  { name: 'Активный отдых', description: 'Походы и приключения', icon: '/icons/active.png', subcategories: ['hiking', 'climbing'] },
  { name: 'Пляжный отдых', description: 'Релакс на море', icon: '/icons/passive.png', subcategories: ['beach', 'swimming'] },
  { name: 'Кемпинг', description: 'Жизнь в палатках', icon: '/icons/camping.png', subcategories: ['camping', 'nature'] },
  { name: 'Экскурсии', description: 'История и культура', icon: '/icons/excursion.png', subcategories: ['historical', 'cultural'] },
  { name: 'Оздоровление', description: 'Спа и санатории', icon: '/icons/health.png', subcategories: ['spa', 'wellness'] },
  { name: 'Гастрономия', description: 'Кулинарные туры', icon: '/icons/food.png', subcategories: ['wine', 'local'] },
  { name: 'Морские прогулки', description: 'Яхты и катера', icon: '/icons/sea.png', subcategories: ['yacht', 'boat'] },
  { name: 'Приключения', description: 'Экстремальный отдых', icon: '/icons/adventure.png', subcategories: ['diving', 'paragliding'] },
  { name: 'Детский отдых', description: 'Семейные туры', icon: '/icons/family.png', subcategories: ['kids', 'family'] },
  { name: 'Фототуры', description: 'Фотосессии в Крыму', icon: '/icons/photo.png', subcategories: ['photo', 'scenic'] },
];

// Данные туров
const toursData = [
  {
    title: 'Поход на Ай-Петри',
    description: 'Однодневный поход на вершину Ай-Петри',
    type: 'active',
    durationDays: 1,
    price: 3500,
    location: { region: 'Ялта', coordinates: { lat: 44.4509, lng: 34.0517 } },
    accommodation: { type: 'none', amenities: [] },
    activities: [{ name: 'Поход', description: 'Тrekking на вершину', durationHours: 4, equipmentRequired: true }],
    excursions: [],
    includedServices: ['Гид', 'Перекус'],
    season: { start: new Date('2025-04-01'), end: new Date('2025-10-31') },
    minGroupSize: 4,
    maxGroupSize: 15,
    images: ['https://commons.wikimedia.org/wiki/File:Ay-Petri_Peak.jpg'],
    isFeatured: true,
    reviews: [],
  },
  {
    title: 'Пляжный отдых в Феодосии',
    description: 'Недельный релакс на золотых пляжах',
    type: 'passive',
    durationDays: 7,
    price: 45000,
    location: { region: 'Феодосия', coordinates: { lat: 45.0332, lng: 35.3845 } },
    accommodation: { type: 'hotel', amenities: ['Бассейн', 'Пляж'] },
    activities: [{ name: 'Пляжный отдых', description: 'Релакс', durationHours: 24, equipmentRequired: false }],
    excursions: [{ name: 'Галерея Айвазовского', description: 'Музей', durationHours: 1.5, price: 800 }],
    includedServices: ['Проживание', 'Завтраки'],
    season: { start: new Date('2025-06-01'), end: new Date('2025-09-30') },
    minGroupSize: 1,
    maxGroupSize: 10,
    images: ['https://commons.wikimedia.org/wiki/File:Feodosia_Aivazovsky_Gallery.jpg'],
    isFeatured: true,
    reviews: [],
  },
  {
    title: 'Кемпинг в Кара-Даге',
    description: 'Трёхдневный кемпинг в заповеднике',
    type: 'camping',
    durationDays: 3,
    price: 15000,
    location: { region: 'Феодосия', coordinates: { lat: 44.9335, lng: 35.2301 } },
    accommodation: { type: 'camping', amenities: ['Палатки', 'Костёр'] },
    activities: [{ name: 'Кемпинг', description: 'Ночёвка в палатках', durationHours: 12, equipmentRequired: true }],
    excursions: [],
    includedServices: ['Гид', 'Снаряжение'],
    season: { start: new Date('2025-05-01'), end: new Date('2025-09-30') },
    minGroupSize: 4,
    maxGroupSize: 12,
    images: ['https://commons.wikimedia.org/wiki/File:Kara-Dag_Feodosia.jpg'],
    isFeatured: false,
    reviews: [],
  },
  {
    title: 'Экскурсия по дворцам Ялты',
    description: 'Посещение Ливадийского и Воронцовского дворцов',
    type: 'excursion',
    durationDays: 1,
    price: 5000,
    location: { region: 'Ялта', coordinates: { lat: 44.4678, lng: 34.1432 } },
    accommodation: { type: 'none', amenities: [] },
    activities: [{ name: 'Экскурсия', description: 'Осмотр дворцов', durationHours: 4, equipmentRequired: false }],
    excursions: [{ name: 'Ливадийский дворец', description: 'История', durationHours: 2, price: 1000 }],
    includedServices: ['Гид', 'Входные билеты'],
    season: { start: new Date('2025-04-01'), end: new Date('2025-10-31') },
    minGroupSize: 5,
    maxGroupSize: 20,
    images: ['https://commons.wikimedia.org/wiki/File:Livadia_Palace_Yalta.jpg'],
    isFeatured: true,
    reviews: [],
  },
  {
    title: 'Оздоровительный тур в Mriya Resort',
    description: 'Недельный спа-тур',
    type: 'health',
    durationDays: 7,
    price: 70000,
    location: { region: 'Ялта', coordinates: { lat: 44.3987, lng: 33.9524 } },
    accommodation: { type: 'sanatorium', amenities: ['Спа', 'Бассейн'] },
    activities: [{ name: 'Спа', description: 'Массажи и процедуры', durationHours: 2, equipmentRequired: false }],
    excursions: [{ name: 'Никитский сад', description: 'Прогулка', durationHours: 2, price: 1500 }],
    includedServices: ['Проживание', 'Питание', 'Спа'],
    season: { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
    minGroupSize: 2,
    maxGroupSize: 10,
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    isFeatured: true,
    reviews: [],
  },
  {
    title: 'Винный тур в Судаке',
    description: 'Дегустация вин и экскурсия',
    type: 'excursion',
    durationDays: 1,
    price: 6000,
    location: { region: 'Судак', coordinates: { lat: 44.8492, lng: 34.9747 } },
    accommodation: { type: 'none', amenities: [] },
    activities: [{ name: 'Дегустация', description: 'Крымские вина', durationHours: 2, equipmentRequired: false }],
    excursions: [{ name: 'Генуэзская крепость', description: 'История', durationHours: 1, price: 500 }],
    includedServices: ['Гид', 'Дегустация'],
    season: { start: new Date('2025-04-01'), end: new Date('2025-10-31') },
    minGroupSize: 5,
    maxGroupSize: 20,
    images: ['https://commons.wikimedia.org/wiki/File:Sudak_Fortress.jpg'],
    isFeatured: false,
    reviews: [],
  },
  {
    title: 'Кемпинг на мысе Фиолент',
    description: 'Двухдневный кемпинг у моря',
    type: 'camping',
    durationDays: 2,
    price: 12000,
    location: { region: 'Севастополь', coordinates: { lat: 44.5132, lng: 33.4756 } },
    accommodation: { type: 'camping', amenities: ['Палатки'] },
    activities: [{ name: 'Кемпинг', description: 'Ночёвка у моря', durationHours: 12, equipmentRequired: true }],
    excursions: [],
    includedServices: ['Гид', 'Снаряжение'],
    season: { start: new Date('2025-05-01'), end: new Date('2025-09-30') },
    minGroupSize: 4,
    maxGroupSize: 12,
    images: ['https://commons.wikimedia.org/wiki/File:Chersonesos_Sevastopol.jpg'],
    isFeatured: false,
    reviews: [],
  },
  {
    title: 'Морская прогулка в Ялте',
    description: 'Яхтенная прогулка вдоль побережья',
    type: 'passive',
    durationDays: 1,
    price: 8000,
    location: { region: 'Ялта', coordinates: { lat: 44.4952, lng: 34.1663 } },
    accommodation: { type: 'none', amenities: [] },
    activities: [{ name: 'Прогулка', description: 'Осмотр побережья', durationHours: 3, equipmentRequired: false }],
    excursions: [],
    includedServices: ['Яхта', 'Напитки'],
    season: { start: new Date('2025-05-01'), end: new Date('2025-09-30') },
    minGroupSize: 2,
    maxGroupSize: 10,
    images: ['https://commons.wikimedia.org/wiki/File:Yalta_Embankment.jpg'],
    isFeatured: true,
    reviews: [],
  },
  {
    title: 'Поход на Демерджи',
    description: 'Поход по Долине Привидений',
    type: 'active',
    durationDays: 1,
    price: 4000,
    location: { region: 'Алушта', coordinates: { lat: 44.7512, lng: 34.4012 } },
    accommodation: { type: 'none', amenities: [] },
    activities: [{ name: 'Поход', description: 'Тrekking', durationHours: 4, equipmentRequired: true }],
    excursions: [],
    includedServices: ['Гид', 'Перекус'],
    season: { start: new Date('2025-04-01'), end: new Date('2025-10-31') },
    minGroupSize: 4,
    maxGroupSize: 15,
    images: ['https://commons.wikimedia.org/wiki/File:Demerdzhi_Alushta.jpg'],
    isFeatured: false,
    reviews: [],
  },
  {
    title: 'Исторический тур по Керчи',
    description: 'Посещение Аджимушкайских каменоломен',
    type: 'excursion',
    durationDays: 1,
    price: 4000,
    location: { region: 'Керчь', coordinates: { lat: 45.3505, lng: 36.4684 } },
    accommodation: { type: 'none', amenities: [] },
    activities: [{ name: 'Экскурсия', description: 'Подземный музей', durationHours: 2, equipmentRequired: false }],
    excursions: [{ name: 'Царский курган', description: 'Античный памятник', durationHours: 1, price: 500 }],
    includedServices: ['Гид', 'Входные билеты'],
    season: { start: new Date('2025-04-01'), end: new Date('2025-10-31') },
    minGroupSize: 5,
    maxGroupSize: 20,
    images: ['https://commons.wikimedia.org/wiki/File:Adzhimushkay_Kerch.jpg'],
    isFeatured: false,
    reviews: [],
  },
];

// Данные постов
const postsData = [
  { title: 'Мой тур в Ялту', content: 'Невероятные виды на Ай-Петри!', region: 'Ялта', image: '/images/yaltapost.jpg', comments: [] },
  { title: 'Кемпинг в Кара-Даге', content: 'Звёзды над заповедником!', region: 'Феодосия', image: '/images/karadagpost.jpg', comments: [] },
  { title: 'Воронцовский дворец', content: 'Архитектура поражает!', region: 'Алупка', image: '/images/vorontsovpost.jpg', comments: [] },
  { title: 'Херсонес в Севастополе', content: 'История оживает!', region: 'Севастополь', image: '/images/chersonesospost.jpg', comments: [] },
  { title: 'Пляжи Феодосии', content: 'Идеальный отдых у моря', region: 'Феодосия', image: '/images/feodosiapost.jpg', comments: [] },
  { title: 'Генуэзская крепость', content: 'Средневековье в Судаке', region: 'Судак', image: '/images/sudakpost.jpg', comments: [] },
  { title: 'Ханский дворец', content: 'Культура Бахчисарая', region: 'Бахчисарай', image: '/images/bakhchisaraypost.jpg', comments: [] },
  { title: 'Демерджи и привидения', content: 'Мистическая Алушта', region: 'Алушта', image: '/images/demerdzhipost.jpg', comments: [] },
  { title: 'Керчь историческая', content: 'Аджимушкай и курганы', region: 'Керчь', image: '/images/kerchpost.jpg', comments: [] },
  { title: 'Симферопольские прогулки', content: 'Столица Крыма', region: 'Симферополь', image: '/images/simferopolpost.jpg', comments: [] },
];

// Данные отзывов
const reviewsData = [
  { rating: 5, title: 'Отличный тур!', comment: 'Всё организовано на высоте', pros: 'Гид, маршрут', cons: 'Нет', visitDate: new Date('2025-04-01'), images: [] },
  { rating: 4, title: 'Хороший отдых', comment: 'Пляжи супер, но трансфер долгий', pros: 'Пляж', cons: 'Транспорт', visitDate: new Date('2025-04-05'), images: [] },
  { rating: 5, title: 'Кемпинг мечты', comment: 'Природа невероятная', pros: 'Виды, гид', cons: 'Нет', visitDate: new Date('2025-04-10'), images: [] },
  { rating: 3, title: 'Средний тур', comment: 'Ожидал большего', pros: 'Дворец', cons: 'Цена', visitDate: new Date('2025-04-15'), images: [] },
  { rating: 5, title: 'Спа-тур супер', comment: 'Полный релакс', pros: 'Спа, еда', cons: 'Нет', visitDate: new Date('2025-04-20'), images: [] },
  { rating: 4, title: 'Винный тур', comment: 'Вина отличные, но мало времени', pros: 'Дегустация', cons: 'Тайминг', visitDate: new Date('2025-04-25'), images: [] },
  { rating: 5, title: 'Море и яхта', comment: 'Незабываемо!', pros: 'Виды, яхта', cons: 'Нет', visitDate: new Date('2025-05-01'), images: [] },
  { rating: 4, title: 'Поход на Демерджи', comment: 'Красиво, но тяжело', pros: 'Природа', cons: 'Сложность', visitDate: new Date('2025-05-05'), images: [] },
  { rating: 5, title: 'История Керчи', comment: 'Очень познавательно', pros: 'Гид, история', cons: 'Нет', visitDate: new Date('2025-05-10'), images: [] },
  { rating: 4, title: 'Фиолент', comment: 'Красивый кемпинг', pros: 'Море', cons: 'Снаряжение', visitDate: new Date('2025-05-15'), images: [] },
];

// Данные бронирований
const bookingsData = [
  { bookingDate: new Date('2025-04-01'), startDate: new Date('2025-06-01'), status: 'confirmed', paymentStatus: 'completed', participants: 2, roomType: 'standard' },
  { bookingDate: new Date('2025-04-05'), startDate: new Date('2025-06-15'), status: 'pending', paymentStatus: 'pending', participants: 1, roomType: 'luxury' },
  { bookingDate: new Date('2025-04-10'), startDate: new Date('2025-07-01'), status: 'confirmed', paymentStatus: 'completed', participants: 3, roomType: 'standardWithAC' },
  { bookingDate: new Date('2025-04-15'), startDate: new Date('2025-07-15'), status: 'confirmed', paymentStatus: 'completed', participants: 2, roomType: 'standard' },
  { bookingDate: new Date('2025-04-20'), startDate: new Date('2025-08-01'), status: 'pending', paymentStatus: 'pending', participants: 1, roomType: 'luxury' },
  { bookingDate: new Date('2025-04-25'), startDate: new Date('2025-06-10'), status: 'confirmed', paymentStatus: 'completed', participants: 4, roomType: 'standard' },
  { bookingDate: new Date('2025-05-01'), startDate: new Date('2025-07-10'), status: 'confirmed', paymentStatus: 'completed', participants: 2, roomType: 'standardWithAC' },
  { bookingDate: new Date('2025-05-05'), startDate: new Date('2025-08-15'), status: 'pending', paymentStatus: 'pending', participants: 1, roomType: 'luxury' },
  { bookingDate: new Date('2025-05-10'), startDate: new Date('2025-06-20'), status: 'confirmed', paymentStatus: 'completed', participants: 3, roomType: 'standard' },
  { bookingDate: new Date('2025-05-15'), startDate: new Date('2025-07-20'), status: 'confirmed', paymentStatus: 'completed', participants: 2, roomType: 'standardWithAC' },
];

// Данные достижений пользователей
const userAchievementsData = [
  { awardedAt: new Date('2025-04-01') },
  { awardedAt: new Date('2025-04-05') },
  { awardedAt: new Date('2025-04-10') },
  { awardedAt: new Date('2025-04-15') },
  { awardedAt: new Date('2025-04-20') },
  { awardedAt: new Date('2025-04-25') },
  { awardedAt: new Date('2025-05-01') },
  { awardedAt: new Date('2025-05-05') },
  { awardedAt: new Date('2025-05-10') },
  { awardedAt: new Date('2025-05-15') },
];

async function seedDatabase() {
  let connectionOpened = false;

  try {
    // Проверяем состояние соединения
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/tourist_platform', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      connectionOpened = true;
      console.log('MongoDB подключён.');
    } else {
      console.log('Используется существующее соединение с MongoDB.');
    }

    // Очистка всех коллекций
    await Promise.all([
      User.deleteMany({}),
      Achievement.deleteMany({}),
      Region.deleteMany({}),
      Hotel.deleteMany({}),
      Attraction.deleteMany({}),
      Restaurant.deleteMany({}),
      Category.deleteMany({}),
      Tour.deleteMany({}),
      Booking.deleteMany({}),
      Post.deleteMany({}),
      Review.deleteMany({}),
      UserAchievement.deleteMany({}),
      HotelAvailability.deleteMany({}),
    ]);
    console.log('Все коллекции очищены.');

    // Вставка пользователей
    const users = await User.insertMany(usersData);
    console.log('Пользователи добавлены:', users.length);

    // Вставка достижений
    const achievements = await Achievement.insertMany(achievementsData);
    console.log('Достижения добавлены:', achievements.length);

    // Вставка регионов
    const regions = await Region.insertMany(regionsData);
    console.log('Регионы добавлены:', regions.length);

    // Вставка отелей
    const hotels = await Hotel.insertMany(hotelsData.map(hotel => ({
      ...hotel,
      reviews: [
        {
          userId: users[Math.floor(Math.random() * users.length)]._id,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5
          comment: 'Отличный отель!',
          createdAt: new Date('2025-04-01'),
        },
      ],
    })));
    console.log('Отели добавлены:', hotels.length);

    // Маппинг отелей по имени
    const hotelMap = hotels.reduce((map, hotel) => {
      map[hotel.name] = hotel._id;
      return map;
    }, {});

    // Вставка достопримечательностей
    const attractions = await Attraction.insertMany(attractionsData);
    console.log('Достопримечательности добавлены:', attractions.length);

    // Вставка ресторанов
    const restaurants = await Restaurant.insertMany(restaurantsData.map(restaurant => ({
      ...restaurant,
      reviews: [
        {
          userId: users[Math.floor(Math.random() * users.length)]._id,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5
          comment: 'Вкусная еда!',
          createdAt: new Date('2025-04-01'),
        },
      ],
    })));
    console.log('Рестораны добавлены:', restaurants.length);

    // Вставка категорий
    const categories = await Category.insertMany(categoriesData);
    console.log('Категории добавлены:', categories.length);

    // Вставка туров
    const tours = await Tour.insertMany(toursData.map(tour => {
      let hotelId = null;
      if (tour.accommodation.type === 'hotel' || tour.accommodation.type === 'sanatorium') {
        let hotelName;
        if (tour.title.includes('Mriya Resort')) {
          hotelName = 'Mriya Resort & Spa';
        } else if (tour.title.includes('Феодосии')) {
          hotelName = 'Feodosia Grand';
        } else {
          const regionHotels = hotels.filter(h => h.location.region === tour.location.region);
          hotelName = regionHotels[Math.floor(Math.random() * regionHotels.length)]?.name;
        }
        hotelId = hotelMap[hotelName] || null;
      }
      return {
        ...tour,
        accommodation: {
          ...tour.accommodation,
          hotel: hotelId,
        },
        reviews: [
          {
            userId: users[Math.floor(Math.random() * users.length)]._id,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5
            comment: 'Отличный тур!',
            createdAt: new Date('2025-04-01'),
          },
        ],
        hotelCapacity: hotelId ? hotels.find(h => h._id.equals(hotelId))?.capacity : tour.maxGroupSize,
      };
    }));
    console.log('Туры добавлены:', tours.length);

    // Обновление категорий с featuredTours
    await Promise.all(categories.map(async (category, index) => {
      category.featuredTours = tours.slice(index % tours.length, (index % tours.length) + 2).map(tour => tour._id);
      await category.save();
    }));
    console.log('Категории обновлены с featuredTours.');

    // Вставка бронирований
    const bookings = await Booking.insertMany(bookingsData.map((booking, index) => {
      const isHotelBooking = index % 2 === 0; // Чередуем бронирования туров и отелей
      return {
        ...booking,
        userId: users[Math.floor(Math.random() * users.length)]._id,
        tourId: isHotelBooking ? null : tours[index % tours.length]._id,
        hotelId: isHotelBooking ? hotels[index % hotels.length]._id : null,
        endDate: isHotelBooking ? new Date(booking.startDate.getTime() + 7 * 24 * 60 * 60 * 1000) : undefined,
        roomType: isHotelBooking || tours[index % tours.length].accommodation.type === 'hotel' ? booking.roomType : undefined,
      };
    }));
    console.log('Бронирования добавлены:', bookings.length);

    // Вставка постов
    const posts = await Post.insertMany(postsData.map(post => ({
      ...post,
      author: users[Math.floor(Math.random() * users.length)]._id,
      likes: [users[Math.floor(Math.random() * users.length)]._id],
      comments: [
        {
          user: users[Math.floor(Math.random() * users.length)]._id,
          content: 'Отличный пост!',
          createdAt: new Date('2025-04-01'),
        },
      ],
    })));
    console.log('Посты добавлены:', posts.length);

    // Вставка отзывов
    const reviews = await Review.insertMany(reviewsData.map(review => ({
      ...review,
      userId: users[Math.floor(Math.random() * users.length)]._id,
      tourId: tours[Math.floor(Math.random() * tours.length)]._id,
    })));
    console.log('Отзывы добавлены:', reviews.length);

    // Вставка достижений пользователей
    const userAchievements = await UserAchievement.insertMany(userAchievementsData.map(ua => ({
      ...ua,
      user: users[Math.floor(Math.random() * users.length)]._id,
      achievement: achievements[Math.floor(Math.random() * achievements.length)]._id,
    })));
    console.log('Достижения пользователей добавлены:', userAchievements.length);

    // Вставка доступности отелей
    const today = new Date('2025-05-25');
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);

    const hotelAvailabilities = [];
    for (const hotel of hotels) {
      for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
        hotelAvailabilities.push({
          hotelId: hotel._id,
          date: new Date(d),
          availableSlots: Math.floor(hotel.capacity * 0.8), // 80% доступности
        });
      }
    }
    await HotelAvailability.insertMany(hotelAvailabilities);
    console.log('Доступность отелей добавлена:', hotelAvailabilities.length);

    console.log('База данных успешно заполнена!');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error.message, error.stack);
  } finally {
    if (connectionOpened && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Подключение к MongoDB закрыто.');
    }
  }
}

seedDatabase();