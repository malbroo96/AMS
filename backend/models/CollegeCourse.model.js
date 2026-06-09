// College Course Model
const mongoose = require('mongoose');

const collegeCourseSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  courseCategory: {
    type: String,
    enum: ['UG', 'PG', 'Diploma', 'Certificate'],
    required: true
  },
  degreeType: {
    type: String,
    required: true,
    // B.Tech, B.Com, MBA, MCA, BCA, etc.
  },
  duration: {
    type: Number,
    required: true,
    // in years
  },
  totalSeats: Number,
  eligibility: String,
  fees: {
    annualFee: Number,
    hostelFee: Number
  },
  examAccepted: [String], // ['JEE', 'NEET', 'GATE', ...]
  description: String,
  courseImageUrl: String,
  
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

module.exports = mongoose.model('CollegeCourse', collegeCourseSchema);
