const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    region: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  cuisine: { type: String, required: true },
  images: [String],
  website: { type: String },
  rating: { type: Number, required: true, min: 0, max: 5, default: 0 }, // Статическое поле рейтинга (0-5)
});

module.exports = mongoose.model('Restaurant', restaurantSchema);