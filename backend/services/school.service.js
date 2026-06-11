const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');
const ApiError = require('../utils/ApiError');
const { mapSchool, mapCourse } = require('../utils/mappers');

module.exports = {
  async list(query) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const { rows, total } = await SchoolModel.list({ search: query.search, page, limit });
    return {
      schools: rows.map(mapSchool),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id) {
    const school = await SchoolModel.findById(id);
    if (!school) throw new ApiError('School not found', 404);
    const courses = await CourseModel.findBySchool(id);
    return {
      ...mapSchool(school),
      admin: school.admin_name ? { id: school.admin_id, name: school.admin_name, email: school.admin_email } : null,
      courses: courses.map(mapCourse),
    };
  },

  async create(body, adminId) {
    const school = await SchoolModel.create({ ...body, adminId });
    return mapSchool(school);
  },

  async update(id, body) {
    const updated = await SchoolModel.update(id, body);
    if (!updated) throw new ApiError('School not found', 404);
    return mapSchool(updated);
  },

  async remove(id) {
    const school = await SchoolModel.findById(id);
    if (!school) throw new ApiError('School not found', 404);
    await SchoolModel.delete(id);
    return { message: 'School deleted successfully' };
  },

  async getCourses(schoolId) {
    const courses = await CourseModel.findBySchool(schoolId);
    return courses.map(mapCourse);
  },

  async addCourse(schoolId, body) {
    const course = await CourseModel.create({ ...body, schoolId });
    return mapCourse(course);
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
    return mapCourse(updated);
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
