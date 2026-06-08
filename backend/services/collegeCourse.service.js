// College Course Service
const CollegeCourse = require('../models/CollegeCourse.model');
const ApiError = require('../utils/ApiError');

class CollegeCourseService {
  async createCourse(courseData) {
    try {
      const course = new CollegeCourse(courseData);
      return await course.save();
    } catch (error) {
      throw new ApiError(400, `Error creating course: ${error.message}`);
    }
  }

  async getCoursesByCollege(collegeId) {
    try {
      const courses = await CollegeCourse.find({ collegeId, isActive: true });
      return courses;
    } catch (error) {
      throw new ApiError(500, `Error fetching courses: ${error.message}`);
    }
  }

  async getCourseById(courseId) {
    try {
      const course = await CollegeCourse.findById(courseId);
      if (!course) {
        throw new ApiError(404, 'Course not found');
      }
      return course;
    } catch (error) {
      throw new ApiError(500, `Error fetching course: ${error.message}`);
    }
  }

  async updateCourse(courseId, updateData) {
    try {
      const course = await CollegeCourse.findByIdAndUpdate(
        courseId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!course) {
        throw new ApiError(404, 'Course not found');
      }

      return course;
    } catch (error) {
      throw new ApiError(400, `Error updating course: ${error.message}`);
    }
  }

  async deleteCourse(courseId) {
    try {
      await CollegeCourse.findByIdAndUpdate(
        courseId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new ApiError(500, `Error deleting course: ${error.message}`);
    }
  }

  async searchCourses(filters = {}) {
    try {
      const query = { isActive: true };

      if (filters.collegeId) query.collegeId = filters.collegeId;
      if (filters.degreeType) query.degreeType = filters.degreeType;
      if (filters.courseCategory) query.courseCategory = filters.courseCategory;

      const courses = await CollegeCourse.find(query);
      return courses;
    } catch (error) {
      throw new ApiError(500, `Error searching courses: ${error.message}`);
    }
  }
}

module.exports = new CollegeCourseService();
