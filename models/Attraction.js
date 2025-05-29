const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    region: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
  },
  category: { type: String, enum: ['historical', 'natural', 'cultural', 'other'], required: true },
  images: [String],
  website: { type: String },
});

// Создание 2dsphere индекса для геопространственных запросов
attractionSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Attraction', attractionSchema);