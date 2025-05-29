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
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

restaurantSchema.virtual('rating').get(function () {
  if (!this.reviews.length) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});

restaurantSchema.virtual('reviewsCount').get(function () {
  return this.reviews.length;
});

restaurantSchema.set('toObject', { virtuals: true });
restaurantSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);