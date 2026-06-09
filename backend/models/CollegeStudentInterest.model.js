// College Student Interest Model
const mongoose = require('mongoose');

const collegeStudentInterestSchema = new mongoose.Schema({
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
  interestedCourseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeCourse'
  },
  status: {
    type: String,
    enum: ['Interested', 'Enquired', 'Applied', 'Admitted', 'Rejected'],
    default: 'Interested'
  },
  appliedDate: Date,
  notes: String,
  
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

// Index for faster queries
collegeStudentInterestSchema.index({ collegeId: 1, studentId: 1 });

module.exports = mongoose.model('CollegeStudentInterest', collegeStudentInterestSchema);
