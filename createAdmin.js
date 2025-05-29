// createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

async function createAdmin() {
  // Подключаемся к базе данных
  await connectDB();

  const email = 'admin@example.com';
  const username = 'admin';
  const password = 'admin123'; // Пароль, который ты потом сможешь изменить

  try {
    // Проверяем, есть ли уже пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Администратор уже существует:', existingUser);
      return;
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём нового администратора
    const admin = new User({
      username,
      email,
      passwordHash,
      role: 'admin',
    });

    await admin.save();
    console.log('Администратор успешно создан:', admin);
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
  } finally {
    mongoose.connection.close(); // Закрываем соединение
  }
}

createAdmin();