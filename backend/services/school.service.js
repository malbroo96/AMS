const ApiError = require('../utils/ApiError');
const { mapSchool, mapCourse } = require('../utils/mappers');
const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');

const schoolService = {
  async list(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
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

  async create(data, createdBy) {
    const school = await SchoolModel.create({ ...data, createdBy });
    return mapSchool(school);
  },

  async update(id, data) {
    await schoolService.getById(id);
    const school = await SchoolModel.update(id, data);
    return mapSchool(school);
  },

  async remove(id) {
    await schoolService.getById(id);
    await SchoolModel.delete(id);
    return { message: 'School deleted successfully' };
  },

  async getCourses(schoolId) {
    await schoolService.getById(schoolId);
    const courses = await CourseModel.findBySchool(schoolId);
    return courses.map(mapCourse);
  },

  async addCourse(schoolId, data) {
    await schoolService.getById(schoolId);
    const course = await CourseModel.create({ schoolId, ...data });
    return mapCourse(course);
  },

  async updateCourse(courseId, data, schoolId) {
    const course = await CourseModel.findById(courseId);
    if (!course) throw new ApiError('Course not found', 404);
    if (schoolId && course.school_id !== schoolId) {
      throw new ApiError('Course does not belong to your school', 403);
    }
    const updated = await CourseModel.update(courseId, data);
    return mapCourse(updated);
  },

  async deleteCourse(courseId, schoolId) {
    const course = await CourseModel.findById(courseId);
    if (!course) throw new ApiError('Course not found', 404);
    if (schoolId && course.school_id !== schoolId) {
      throw new ApiError('Course does not belong to your school', 403);
    }
    await CourseModel.delete(courseId);
    return { message: 'Course deleted successfully' };
  },
};

module.exports = schoolService;
