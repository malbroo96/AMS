// College Rating Model
const mongoose = require('mongoose');

const collegeRatingSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: {
    infrastructure: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    faculty: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    placement: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    campusLife: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    overall: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  reviewText: String,
  isApproved: {
    type: Boolean,
    default: false
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

// Ensure one review per student per college
collegeRatingSchema.index({ collegeId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('CollegeRating', collegeRatingSchema);
