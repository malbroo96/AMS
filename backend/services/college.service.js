// College Service
const College = require('../models/College.model');
const CollegeCourse = require('../models/CollegeCourse.model');
const CollegeAchievement = require('../models/CollegeAchievement.model');
const CollegeGallery = require('../models/CollegeGallery.model');
const CollegeRating = require('../models/CollegeRating.model');
const CollegeStudentInterest = require('../models/CollegeStudentInterest.model');
const CollegeEnquiry = require('../models/CollegeEnquiry.model');
const ApiError = require('../utils/ApiError');

class CollegeService {
  // Create a new college
  async createCollege(collegeData, userId) {
    try {
      const college = new College({
        ...collegeData,
        createdBy: userId,
        updatedBy: userId
      });
      return await college.save();
    } catch (error) {
      throw new ApiError(400, `Error creating college: ${error.message}`);
    }
  }

  // Get all colleges with filters
  async getAllColleges(filters = {}, skip = 0, limit = 10) {
    try {
      const query = { isActive: true };

      if (filters.state) query['location.state'] = filters.state;
      if (filters.city) query['location.city'] = filters.city;
      if (filters.collegeType) query.collegeType = filters.collegeType;
      if (filters.naacGrade) query.naacGrade = filters.naacGrade;
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const colleges = await College.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await College.countDocuments(query);

      return { colleges, total };
    } catch (error) {
      throw new ApiError(500, `Error fetching colleges: ${error.message}`);
    }
  }

  // Search colleges with advanced filters
  async searchColleges(filters = {}) {
    try {
      const query = { isActive: true, isVerified: true };

      if (filters.state) query['location.state'] = filters.state;
      if (filters.city) query['location.city'] = filters.city;
      if (filters.collegeType) query.collegeType = filters.collegeType;
      if (filters.naacGrade) query.naacGrade = filters.naacGrade;

      // Fee range filter
      if (filters.minFee || filters.maxFee) {
        // This would require aggregation pipeline
      }

      // Rating filter
      if (filters.minRating) {
        // Aggregate ratings separately
      }

      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      if (filters.facilities && filters.facilities.length > 0) {
        query.facilities = { $in: filters.facilities };
      }

      const colleges = await College.find(query)
        .limit(filters.limit || 20)
        .sort({ 'analytics.totalStudentViews': -1 });

      return colleges;
    } catch (error) {
      throw new ApiError(500, `Error searching colleges: ${error.message}`);
    }
  }

  // Get college by ID
  async getCollegeById(collegeId) {
    try {
      const college = await College.findById(collegeId);
      if (!college) {
        throw new ApiError(404, 'College not found');
      }
      return college;
    } catch (error) {
      throw new ApiError(500, `Error fetching college: ${error.message}`);
    }
  }

  // Get college with all related data
  async getCollegeDetails(collegeId) {
    try {
      const college = await College.findById(collegeId);
      if (!college) {
        throw new ApiError(404, 'College not found');
      }

      const courses = await CollegeCourse.find({ collegeId, isActive: true });
      const achievements = await CollegeAchievement.find({ collegeId, isActive: true }).sort({ displayOrder: 1 });
      const gallery = await CollegeGallery.find({ collegeId, isActive: true }).sort({ displayOrder: 1 });
      const ratings = await CollegeRating.find({ collegeId, isApproved: true });

      // Calculate average ratings
      const averageRatings = this.calculateAverageRatings(ratings);
      const totalReviews = ratings.length;

      return {
        college,
        courses,
        achievements,
        gallery,
        ratings: {
          average: averageRatings,
          total: totalReviews
        }
      };
    } catch (error) {
      throw new ApiError(500, `Error fetching college details: ${error.message}`);
    }
  }

  // Update college profile
  async updateCollegeProfile(collegeId, updateData, userId) {
    try {
      updateData.updatedBy = userId;
      updateData.updatedAt = new Date();

      // Calculate profile completion percentage
      updateData.profileCompletionPercentage = this.calculateProfileCompletion(updateData);

      const college = await College.findByIdAndUpdate(
        collegeId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!college) {
        throw new ApiError(404, 'College not found');
      }

      return college;
    } catch (error) {
      throw new ApiError(400, `Error updating college: ${error.message}`);
    }
  }

  // Calculate profile completion percentage
  calculateProfileCompletion(collegeData) {
    const requiredFields = [
      'collegeName',
      'collegeType',
      'universityAffiliation',
      'location.state',
      'location.city',
      'location.fullAddress',
      'contact.emailAddress',
      'contact.admissionMobileNumber',
      'about.summaryDescription'
    ];

    let completedFields = 0;
    requiredFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], collegeData);
      if (value) completedFields++;
    });

    return (completedFields / requiredFields.length) * 100;
  }

  // Calculate average ratings
  calculateAverageRatings(ratings) {
    if (ratings.length === 0) {
      return {
        infrastructure: 0,
        faculty: 0,
        placement: 0,
        campusLife: 0,
        overall: 0
      };
    }

    const sum = ratings.reduce(
      (acc, rating) => ({
        infrastructure: acc.infrastructure + rating.ratings.infrastructure,
        faculty: acc.faculty + rating.ratings.faculty,
        placement: acc.placement + rating.ratings.placement,
        campusLife: acc.campusLife + rating.ratings.campusLife,
        overall: acc.overall + rating.ratings.overall
      }),
      { infrastructure: 0, faculty: 0, placement: 0, campusLife: 0, overall: 0 }
    );

    return {
      infrastructure: (sum.infrastructure / ratings.length).toFixed(1),
      faculty: (sum.faculty / ratings.length).toFixed(1),
      placement: (sum.placement / ratings.length).toFixed(1),
      campusLife: (sum.campusLife / ratings.length).toFixed(1),
      overall: (sum.overall / ratings.length).toFixed(1)
    };
  }

  // Add analytics view
  async addStudentView(collegeId) {
    try {
      await College.findByIdAndUpdate(
        collegeId,
        { $inc: { 'analytics.totalStudentViews': 1 } },
        { new: true }
      );
    } catch (error) {
      console.error('Error recording student view:', error);
    }
  }

  // Get college dashboard stats
  async getCollegeDashboardStats(collegeId) {
    try {
      const college = await College.findById(collegeId);
      if (!college) {
        throw new ApiError(404, 'College not found');
      }

      const studentInterests = await CollegeStudentInterest.countDocuments({
        collegeId,
        isActive: true
      });

      const enquiries = await CollegeEnquiry.countDocuments({
        collegeId
      });

      const courses = await CollegeCourse.countDocuments({
        collegeId,
        isActive: true
      });

      return {
        totalStudentViews: college.analytics.totalStudentViews,
        totalEnquiries: enquiries,
        totalInterestedStudents: studentInterests,
        profileCompletionPercentage: college.analytics.profileCompletionPercentage,
        totalCourses: courses
      };
    } catch (error) {
      throw new ApiError(500, `Error fetching dashboard stats: ${error.message}`);
    }
  }

  // Delete college (soft delete)
  async deleteCollege(collegeId, userId) {
    try {
      const college = await College.findByIdAndUpdate(
        collegeId,
        { isActive: false, updatedBy: userId, updatedAt: new Date() },
        { new: true }
      );

      if (!college) {
        throw new ApiError(404, 'College not found');
      }

      return college;
    } catch (error) {
      throw new ApiError(500, `Error deleting college: ${error.message}`);
    }
  }
}

module.exports = new CollegeService();
