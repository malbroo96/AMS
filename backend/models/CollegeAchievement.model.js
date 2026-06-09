// College Achievement Model
const mongoose = require('mongoose');

const collegeAchievementSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  achievementTitle: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  achievementYear: Number,
  achievementImageUrl: String,
  displayOrder: Number,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CollegeAchievement', collegeAchievementSchema);
