const mongoose = require('mongoose');

const hotelAvailabilitySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  date: { type: Date, required: true },
  availableSlots: { type: Number, required: true, min: 0 },
});

hotelAvailabilitySchema.index({ hotelId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HotelAvailability', hotelAvailabilitySchema);