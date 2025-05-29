const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: false },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: false },
  bookingDate: { type: Date, default: Date.now },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: function() { return !!this.hotelId; } },
  status: { 
    type: String, 
    enum: ['confirmed', 'pending', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  participants: { type: Number, required: true, min: 1 },
  roomType: {
    type: String,
    enum: ['standard', 'standardWithAC', 'luxury'],
    required: function() { 
      return (this.tourId && ['hotel', 'sanatorium'].includes(this.tourId.accommodation?.type)) || !!this.hotelId; 
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

bookingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);