const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  date: { type: Date, required: true }, // Дата доступности
  availableSlots: { type: Number, required: true, min: 0 }, // Количество доступных мест
});

availabilitySchema.index({ tourId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);