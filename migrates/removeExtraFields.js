const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const Hotel = require('../models/Hotel');

// Функция для получения разрешенных полей из схемы
const getAllowedFields = (schema) => {
  const paths = Object.keys(schema.paths);
  const allowedFields = new Set(['_id', '__v']);
  paths.forEach((path) => {
    allowedFields.add(path);
  });
  return allowedFields;
};

// Функция для очистки документа от лишних полей
const cleanDocument = (doc, allowedFields) => {
  const cleaned = {};
  Object.keys(doc).forEach((key) => {
    if (allowedFields.has(key)) {
      cleaned[key] = doc[key];
    }
  });
  return cleaned;
};

// Функция миграции для одной коллекции
const migrateCollection = async (Model, collectionName) => {
  console.log(`Starting migration for ${collectionName}...`);

  const allowedFields = getAllowedFields(Model.schema);
  const documents = await Model.find({}).lean();
  let updatedCount = 0;

  for (const doc of documents) {
    const cleanedDoc = cleanDocument(doc, allowedFields);
    const extraFields = Object.keys(doc).filter((key) => !allowedFields.has(key));

    if (extraFields.length > 0) {
      console.log(`Document ${doc._id} in ${collectionName} has extra fields: ${extraFields.join(', ')}`);
      await Model.updateOne({ _id: doc._id }, { $set: cleanedDoc });
      updatedCount++;
    }
  }

  console.log(`Migration for ${collectionName} completed. Updated ${updatedCount} documents.`);
};

// Основная функция миграции
const migrate = async () => {
  try {
    // Подключение к MongoDB (замените URL на ваш)
    await mongoose.connect('mongodb://localhost:27017/tourism-krasnodar', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Миграция для каждой коллекции
    await migrateCollection(Booking, 'bookings');
    await migrateCollection(Tour, 'tours');
    await migrateCollection(Hotel, 'hotels');

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

migrate();