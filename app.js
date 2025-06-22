const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const csrf = require('csurf');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const Achievement = require('./models/Achievement');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

// Загрузка переменных окружения
dotenv.config();

// Инициализация приложения
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Настройка multer для обработки FormData (без загрузки файлов)
const upload = multer();

// Подключение к MongoDB
const connectDB = require('./config/db');
connectDB();

// Настройка Handlebars
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs',
  partialsDir: [
    path.join(__dirname, 'views/partials'),
    path.join(__dirname, 'views/booking'),
  ],
});

// Регистрация помощников для Handlebars
hbs.handlebars.registerHelper('if', function (conditional, options) {
  console.log('Handlebars if called with:', {
    conditional,
    args: arguments.length,
    arguments: Array.from(arguments).slice(0, -1)
  });
  if (arguments.length !== 2) {
    throw new Error(`#if requires exactly one argument, but ${arguments.length - 1} were provided: ${JSON.stringify(Array.from(arguments).slice(0, -1))}`);
  }
  if (conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});
hbs.handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});
hbs.handlebars.registerHelper('gt', function (a, b) {
  return a > b;
});
hbs.handlebars.registerHelper('lt', function (a, b) {
  return a < b;
});
hbs.handlebars.registerHelper('add', function (a, b) {
  return a + b;
});
hbs.handlebars.registerHelper('subtract', function (a, b) {
  return a - b;
});
hbs.handlebars.registerHelper('range', function (start, end) {
  const range = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
});
hbs.handlebars.registerHelper('formatDate', function (date) {
  return new Date(date).toLocaleDateString('ru-RU');
});
hbs.handlebars.registerHelper('formatPrice', function (price) {
  return Number(price).toLocaleString('ru-RU'); // Форматирует цену как 123 456
});
hbs.handlebars.registerHelper('join', function (array, separator) {
  console.log('Join helper called with:', array, separator);
  return array ? array.join(separator) : '';
});
hbs.handlebars.registerHelper('includes', function (array, value, options) {
  let values = [];
  if (typeof array === 'string') {
    values = array.split(',');
  } else if (Array.isArray(array)) {
    values = array;
  }
  return values.includes(value) ? options.fn(this) : '';
});
hbs.handlebars.registerHelper('contains', function (array, value) {
  if (typeof array === 'string') {
    return array.split(',').includes(value);
  }
  return Array.isArray(array) && array.includes(value);
});
hbs.handlebars.registerHelper('truncate', function(str, len) {
  if (str.length > len) return str.substring(0, len) + '...';
  return str;
});
hbs.handlebars.registerHelper('and', function (a, b) {
  return a && b;
});
hbs.handlebars.registerHelper('or', function (...args) {
  return args.slice(0, -1).some(arg => !!arg);
});
hbs.handlebars.registerHelper('not', function(value) {
  return !value;
});
hbs.handlebars.registerHelper('isObject', function (value) {
  return value && typeof value === 'object' && (value.name || value.rating || value.roomTypes);
});
hbs.handlebars.registerHelper('json', function (value) {
  return JSON.stringify(value);
});
hbs.handlebars.registerHelper('get', function (array, index) {
  return array && array.length > index ? array[index] : null;
});
hbs.handlebars.registerHelper('toJson', function (obj) {
  return JSON.stringify(obj);
});
hbs.handlebars.registerHelper('default', function (value, defaultValue) {
  return value !== undefined && value !== null && !isNaN(value) ? value : defaultValue;
});


console.log('Handlebars helpers registered: eq, gt, lt, add, subtract, range, formatDate, join, includes, contains, truncate, and, or, not');

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Создание папок для загрузок и иконок достижений
fs.mkdirSync(path.join(__dirname, 'public/uploads'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'public/images/achievements'), { recursive: true });

app.use(cookieParser());
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24*60*60*1000,
  },
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Инициализация CSRF-защиты
const csrfProtection = csrf({
  cookie: true,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});
app.use((req, res, next) => {
  // Список маршрутов для исключения CSRF
  const csrfExemptPaths = [
    '/auth/login',
    '/auth/register',
    '/bookings/clean-expired',
    '/community/posts',
    '/community/posts/:id/like',
    '/community/posts/:id/comment',
    '/bookings',
    '/tours/:id/availability',
  ];
  // Проверка статических путей
  if (csrfExemptPaths.includes(req.path) && req.method === 'POST') {
    console.log(`Bypassing CSRF protection for static path ${req.path}`);
    return next();
  }
  // Проверка динамического маршрута /bookings/:id/pay
  if (req.path.match(/^\/bookings\/[a-f0-9]{24}\/pay$/) && req.method === 'POST') {
    console.log(`Bypassing CSRF protection for dynamic path ${req.path}`);
    return next();
  }
  csrfProtection(req, res, next);
});

// Передача flash-сообщений и CSRF-токена в шаблоны
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.user = req.user || null;
  console.log(`User for ${req.path}:`, req.user ? { id: req.user._id, username: req.user.username, role: req.user.role } : 'No user');
  try {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
    console.log(`CSRF token generated for ${req.path}: ${res.locals.csrfToken}`);
  } catch (err) {
    console.error(`Failed to generate CSRF token for ${req.path}:`, err);
    res.locals.csrfToken = null;
  }
  next();
});

// Подключение Passport
require('./config/passport');

// Инициализация достижений
const initializeAchievements = async () => {
  const achievements = [
    {
      name: 'Новичок',
      description: 'Создайте свой первый пост в сообществе',
      condition: 'create_post_1',
      icon: '/images/achievements/newbie.png'
    },
    {
      name: 'Активный путешественник',
      description: 'Создайте 5 постов в сообществе',
      condition: 'create_posts_5',
      icon: '/images/achievements/active_traveler.png'
    },
    {
      name: 'Популярный автор',
      description: 'Получите 10 лайков на одном посте',
      condition: 'likes_on_post_10',
      icon: '/images/achievements/popular_author.png'
    },
    {
      name: 'Комментатор',
      description: 'Оставьте 10 комментариев',
      condition: 'comments_10',
      icon: '/images/achievements/commentator.png'
    },
    {
      name: 'Турист',
      description: 'Забронируйте свой первый тур',
      condition: 'book_tour_1',
      icon: '/images/achievements/tourist.png'
    },
    {
      name: 'Критик',
      description: 'Оставьте 3 отзыва о турах или отелях',
      condition: 'reviews_3',
      icon: '/images/achievements/critic.png'
    }
  ];

  try {
    for (const ach of achievements) {
      await Achievement.findOneAndUpdate(
        { condition: ach.condition },
        ach,
        { upsert: true, new: true }
      );
    }
    console.log('Achievements initialized');
  } catch (error) {
    console.error('Error initializing achievements:', error.message);
  }
};

// Вызываем инициализацию после подключения к БД
mongoose.connection.once('open', async () => {
  await initializeAchievements();
});

// Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});
const chatHandler = require('./services/chatHandler');
io.on('connection', (socket) => {
  chatHandler(socket, io);
});

// Маршруты
app.use('/', require('./routes/mainRoutes'));
app.use('/tours', require('./routes/tourRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/regions', require('./routes/regionRoutes'));
app.use('/bookings', upload.none(), require('./routes/bookingRoutes')); // Добавляем upload.none() для парсинга FormData
app.use('/profile', require('./routes/profileRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/news', require('./routes/newsRoutes'));
app.use('/travel', require('./routes/travelRoutes'));
app.use('/hotels', require('./routes/hotelRoutes'));
app.use('/attractions', require('./routes/attractionRoutes'));
app.use('/community', require('./routes/community'));
app.use('/api/hotel', require('./routes/hotelApiRoutes'));

// Обработка ошибок
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF token validation failed:', { path: req.path, method: req.method });
    req.flash('error', 'Недействительный CSRF-токен');
    return res.redirect(req.path); // Редирект на ту же страницу с сообщением
  }
  console.error(err.stack);
  req.flash('error', 'Что-то пошло не так!');
  res.redirect('/admin');
});


// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});