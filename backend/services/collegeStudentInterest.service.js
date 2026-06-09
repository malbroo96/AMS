// College Student Interest Service
const CollegeStudentInterest = require('../models/CollegeStudentInterest.model');
const ApiError = require('../utils/ApiError');

class CollegeStudentInterestService {
  async markInterest(collegeId, studentId, courseId = null) {
    try {
      // Check if already interested
      const existing = await CollegeStudentInterest.findOne({
        collegeId,
        studentId,
        isActive: true
      });

      if (existing) {
        // Update existing interest
        return await CollegeStudentInterest.findByIdAndUpdate(
          existing._id,
          { interestedCourseId: courseId, updatedAt: new Date() },
          { new: true }
        );
      }

      // Create new interest
      const interest = new CollegeStudentInterest({
        collegeId,
        studentId,
        interestedCourseId: courseId,
        status: 'Interested'
      });

      const savedInterest = await interest.save();

      // Increment interested students count
      const College = require('../models/College.model');
      await College.findByIdAndUpdate(
        collegeId,
        { $inc: { 'analytics.totalInterestedStudents': 1 } }
      );

      return savedInterest;
    } catch (error) {
      throw new ApiError(400, `Error marking interest: ${error.message}`);
    }
  }

  async removeInterest(collegeId, studentId) {
    try {
      const interest = await CollegeStudentInterest.findOneAndUpdate(
        { collegeId, studentId },
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      if (interest) {
        // Decrement interested students count
        const College = require('../models/College.model');
        await College.findByIdAndUpdate(
          collegeId,
          { $inc: { 'analytics.totalInterestedStudents': -1 } }
        );
      }

      return interest;
    } catch (error) {
      throw new ApiError(500, `Error removing interest: ${error.message}`);
    }
  }

  async getStudentInterests(studentId) {
    try {
      const interests = await CollegeStudentInterest.find({
        studentId,
        isActive: true
      })
        .populate('collegeId', 'collegeName logoUrl location')
        .populate('interestedCourseId', 'courseName degreeType');

      return interests;
    } catch (error) {
      throw new ApiError(500, `Error fetching interests: ${error.message}`);
    }
  }

  async getCollegeInterestedStudents(collegeId) {
    try {
      const interests = await CollegeStudentInterest.find({
        collegeId,
        isActive: true
      })
        .populate('studentId', 'firstName lastName email phone')
        .populate('interestedCourseId', 'courseName');

      return interests;
    } catch (error) {
      throw new ApiError(500, `Error fetching interested students: ${error.message}`);
    }
  }

  async updateInterestStatus(collegeId, studentId, status) {
    try {
      const interest = await CollegeStudentInterest.findOneAndUpdate(
        { collegeId, studentId },
        { status, appliedDate: status === 'Applied' ? new Date() : null, updatedAt: new Date() },
        { new: true }
      );

      if (!interest) {
        throw new ApiError(404, 'Interest record not found');
      }

      return interest;
    } catch (error) {
      throw new ApiError(500, `Error updating interest status: ${error.message}`);
    }
  }

  async checkInterest(collegeId, studentId) {
    try {
      const interest = await CollegeStudentInterest.findOne({
        collegeId,
        studentId,
        isActive: true
      });

      return interest || null;
    } catch (error) {
      throw new ApiError(500, `Error checking interest: ${error.message}`);
    }
  }
}

module.exports = new CollegeStudentInterestService();
