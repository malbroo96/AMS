// College Enquiry Model
const mongoose = require('mongoose');

const collegeEnquirySchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: String,
  studentPhone: String,
  message: String,
  interestedCourse: String,
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  isRead: {
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

// Index for faster queries
collegeEnquirySchema.index({ collegeId: 1, createdAt: -1 });
collegeEnquirySchema.index({ status: 1 });

module.exports = mongoose.model('CollegeEnquiry', collegeEnquirySchema);
