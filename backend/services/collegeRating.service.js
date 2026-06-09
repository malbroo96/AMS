// College Rating Service
const CollegeRating = require('../models/CollegeRating.model');
const ApiError = require('../utils/ApiError');

class CollegeRatingService {
  async submitRating(collegeId, studentId, ratingData) {
    try {
      // Check if student already reviewed this college
      const existingRating = await CollegeRating.findOne({ collegeId, studentId });

      if (existingRating) {
        // Update existing rating
        return await CollegeRating.findByIdAndUpdate(
          existingRating._id,
          { ...ratingData, updatedAt: new Date() },
          { new: true }
        );
      }

      // Create new rating
      const rating = new CollegeRating({
        collegeId,
        studentId,
        ...ratingData
      });

      return await rating.save();
    } catch (error) {
      throw new ApiError(400, `Error submitting rating: ${error.message}`);
    }
  }

  async getCollegeRatings(collegeId, approved = true) {
    try {
      const query = { collegeId };
      if (approved) query.isApproved = true;

      const ratings = await CollegeRating.find(query)
        .populate('studentId', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 });

      return ratings;
    } catch (error) {
      throw new ApiError(500, `Error fetching ratings: ${error.message}`);
    }
  }

  async getStudentRating(collegeId, studentId) {
    try {
      const rating = await CollegeRating.findOne({ collegeId, studentId });
      return rating;
    } catch (error) {
      throw new ApiError(500, `Error fetching rating: ${error.message}`);
    }
  }

  async approveRating(ratingId) {
    try {
      const rating = await CollegeRating.findByIdAndUpdate(
        ratingId,
        { isApproved: true, updatedAt: new Date() },
        { new: true }
      );

      if (!rating) {
        throw new ApiError(404, 'Rating not found');
      }

      return rating;
    } catch (error) {
      throw new ApiError(500, `Error approving rating: ${error.message}`);
    }
  }

  async rejectRating(ratingId) {
    try {
      await CollegeRating.findByIdAndRemove(ratingId);
      return true;
    } catch (error) {
      throw new ApiError(500, `Error rejecting rating: ${error.message}`);
    }
  }

  async getAverageRatings(collegeId) {
    try {
      const ratings = await CollegeRating.find({ collegeId, isApproved: true });

      if (ratings.length === 0) {
        return {
          infrastructure: 0,
          faculty: 0,
          placement: 0,
          campusLife: 0,
          overall: 0,
          totalReviews: 0
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
        overall: (sum.overall / ratings.length).toFixed(1),
        totalReviews: ratings.length
      };
    } catch (error) {
      throw new ApiError(500, `Error calculating average ratings: ${error.message}`);
    }
  }
}

module.exports = new CollegeRatingService();
