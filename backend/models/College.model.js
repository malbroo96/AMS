// College Model
const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  // Basic Information
  collegeCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  collegeName: {
    type: String,
    required: true,
    trim: true
  },
  shortName: String,
  establishmentYear: Number,
  collegeType: {
    type: String,
    enum: ['Government', 'Private', 'Autonomous'],
    required: true
  },
  universityAffiliation: String,
  naacGrade: {
    type: String,
    enum: ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', null],
    default: null
  },
  aicteApproval: {
    type: Boolean,
    default: false
  },
  ugcRecognition: {
    type: Boolean,
    default: false
  },

  // Branding
  logoUrl: String,
  coverBannerUrl: String,
  prospectusUrl: String,

  // Location Details
  location: {
    country: String,
    state: String,
    district: String,
    city: String,
    fullAddress: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    googleMapsUrl: String
  },

  // Contact Information
  contact: {
    admissionMobileNumber: String,
    officeMobileNumber: String,
    landlineNumber: String,
    emailAddress: String,
    websiteUrl: String
  },

  // About College
  about: {
    summaryDescription: String,
    visionStatement: String,
    missionStatement: String,
    principalMessage: String,
    chairmanMessage: String
  },

  // Placements
  placements: {
    placementPercentage: Number,
    highestPackage: String,
    averagePackage: String,
    topRecruiters: [
      {
        recruiterName: String,
        recruiterLogoUrl: String,
        _id: false
      }
    ]
  },

  // Facilities
  facilities: [String], // ['Hostel', 'Library', 'Sports', ...]

  // Analytics
  analytics: {
    totalStudentViews: {
      type: Number,
      default: 0
    },
    totalEnquiries: {
      type: Number,
      default: 0
    },
    totalInterestedStudents: {
      type: Number,
      default: 0
    },
    profileCompletionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes
collegeSchema.index({ state: 1, city: 1 });
collegeSchema.index({ collegeType: 1 });
collegeSchema.index({ naacGrade: 1 });
collegeSchema.index({ collegeName: 'text', shortName: 'text' });

module.exports = mongoose.model('College', collegeSchema);
