const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['active', 'passive', 'camping', 'excursion', 'health'],
    required: true,
  },
  durationDays: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  location: {
    region: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  route: {
    type: [{
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }],
    required: false,
    default: undefined,
    validate: {
      validator: function(v) {
        return this.type !== 'excursion' || (Array.isArray(v) && v.length > 0);
      },
      message: 'Маршрут обязателен для экскурсионных туров и должен содержать хотя бы одну точку.'
    }
  },
  accommodation: {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: false },
    type: {
      type: String,
      enum: ['hotel', 'sanatorium', 'camping', 'retreat', 'none'],
      required: true,
    },
    amenities: [{ type: String }],
  },
  activities: [
    {
      name: { type: String, required: true },
      description: { type: String },
      durationHours: { type: Number, required: true, min: 1 },
      equipmentRequired: { type: Boolean, default: false },
    },
  ],
  excursions: [
    {
      name: { type: String, required: true },
      description: { type: String },
      durationHours: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    },
  ],
  includedServices: [String],
  season: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  minGroupSize: { type: Number, required: true, min: 1 },
  maxGroupSize: { type: Number, required: true, min: 1 },
  hotelCapacity: { type: Number, min: 1 },
  images: [String],
  isFeatured: { type: Boolean, default: false },
  isHotDeal: { type: Boolean, default: false }, // Пометка горящего тура
  discounts: {
    groupDiscount: { // Скидка за группу больше 5 человек
      enabled: { type: Boolean, default: false },
      minParticipants: { type: Number, default: 5 },
      percentage: { type: Number, default: 0, min: 0, max: 100 },
    },
    seasonalDiscount: { // Сезонная скидка
      enabled: { type: Boolean, default: false },
      startDate: { type: Date },
      endDate: { type: Date },
      percentage: { type: Number, default: 0, min: 0, max: 100 },
    },
    hotDealDiscount: { // Скидка для горящих туров
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, default: 0, min: 0, max: 100 },
    },
  },
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

tourSchema.virtual('rating').get(function () {
  if (!this.reviews.length) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});

tourSchema.virtual('reviewsCount').get(function () {
  return this.reviews.length;
});

tourSchema.set('toObject', { virtuals: true });
tourSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tour', tourSchema);