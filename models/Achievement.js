const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  condition: {
    type: String, // Условие, например, "create_post_1"
    required: true,
    unique: true
  },
  icon: {
    type: String, // Путь к иконке, например, "/images/achievements/newbie.png"
    default: null
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);