const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');
const ApiError = require('../utils/ApiError');

module.exports = {
  async list(query) {
    return SchoolModel.list({
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 10
    });
  },

  async getById(id) {
    const school = await SchoolModel.findById(id);
    if (!school) throw new ApiError('School not found', 404);
    return school;
  },

  async create(body, adminId) {
    return SchoolModel.create({ ...body, adminId });
  },

  async update(id, body) {
    const updated = await SchoolModel.update(id, body);
    if (!updated) throw new ApiError('School not found', 404);
    return updated;
  },

  async remove(id) {
    const school = await SchoolModel.findById(id);
    if (!school) throw new ApiError('School not found', 404);
    await SchoolModel.delete(id);
    return { message: 'School deleted successfully' };
  },

  async getCourses(schoolId) {
    return CourseModel.findBySchool(schoolId);
  },

  async addCourse(schoolId, body) {
    return CourseModel.create({ ...body, schoolId });
  },

  async updateCourse(courseId, body, schoolId) {
    if (schoolId) {
      const course = await CourseModel.findById(courseId);
      if (!course || String(course.school_id) !== String(schoolId)) {
        throw new ApiError('Unauthorized or course not found', 403);
      }
    }
    const updated = await CourseModel.update(courseId, body);
    if (!updated) throw new ApiError('Course not found', 404);
    return updated;
  },

  async deleteCourse(courseId, schoolId) {
    if (schoolId) {
      const course = await CourseModel.findById(courseId);
      if (!course || String(course.school_id) !== String(schoolId)) {
        throw new ApiError('Unauthorized or course not found', 403);
      }
    }
    await CourseModel.delete(courseId);
    return { message: 'Course deleted successfully' };
  }
};
