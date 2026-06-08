// College Gallery Model
const mongoose = require('mongoose');

const collegeGallerySchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageTitle: String,
  imageDescription: String,
  imageCategory: {
    type: String,
    enum: ['Campus', 'Classroom', 'Lab', 'Event', 'Sports', 'Hostel', 'Library', 'Other'],
    default: 'Other'
  },
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

module.exports = mongoose.model('CollegeGallery', collegeGallerySchema);
