const mongoose = require('mongoose');
const crypto = require('crypto');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    region: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  amenities: [String],
  images: [String],
  website: { type: String },
  capacity: { type: Number, min: 1 },
  roomTypes: [{
    type: String,
    enum: ['standard', 'standardWithAC', 'luxury'],
    required: true
  }],
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  apiKey: {
    type: String,
    default: () => crypto.randomBytes(32).toString('hex'),
    select: false
  },
  basePrice: { type: Number, required: true, default: 5000 }
});

hotelSchema.virtual('reviewsCount').get(function () {
  return this.reviews.length;
});

hotelSchema.set('toObject', { virtuals: true });
hotelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Hotel', hotelSchema);