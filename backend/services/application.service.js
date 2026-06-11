const ApiError = require('../utils/ApiError');
const { mapApplication } = require('../utils/mappers');
const ApplicationModel = require('../models/Application.model');
const StudentModel = require('../models/Student.model');
const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');

const enrichApplication = (row) => ({
  ...mapApplication(row),
  school: row.school_name ? { schoolName: row.school_name, city: row.school_city } : undefined,
  course: row.course_name ? { courseName: row.course_name, fees: row.fees } : undefined,
  student: row.student_name ? {
    user: { name: row.student_name, email: row.student_email, phone: row.student_phone },
    parentName: row.parent_name,
    address: row.student_address,
    gender: row.gender,
    dob: row.dob,
  } : undefined,
});

const applicationService = {
  async apply(userId, { schoolId, courseId, studentDetails }) {
    const student = await StudentModel.findByUserId(userId);
    if (!student) throw new ApiError('Student profile not found', 404);

    if (studentDetails) {
      await StudentModel.update(userId, studentDetails);
    }

    const course = await CourseModel.findById(courseId);
    if (!course || Number(course.school_id) !== Number(schoolId)) {
      throw new ApiError('Invalid school or course selection', 400);
    }

    const app = await ApplicationModel.create({
      studentId: student.id,
      schoolId,
      courseId,
    });

    const full = await ApplicationModel.findById(app.id);
    return enrichApplication(full);
  },

  async list(user, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const filters = { status: query.status, search: query.search, page, limit };

    if (user.role === 'student') {
      const student = await StudentModel.findByUserId(user.id);
      if (!student) throw new ApiError('Student profile not found', 404);
      filters.studentId = student.id;
    } else if (user.role === 'school_admin' || user.role === 'college') {
      const school = await SchoolModel.findByAdminId(user.id);
      if (!school) throw new ApiError('No school assigned', 403);
      filters.schoolId = school.id;
    }

    const { rows, total } = await ApplicationModel.list(filters);
    return {
      applications: rows.map(enrichApplication),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id, user) {
    const app = await ApplicationModel.findById(id);
    if (!app) throw new ApiError('Application not found', 404);

    if (user.role === 'student') {
      const student = await StudentModel.findByUserId(user.id);
      if (Number(app.student_id) !== Number(student?.id)) throw new ApiError('Access denied', 403);
    }
    if (user.role === 'school_admin' || user.role === 'college') {
      const school = await SchoolModel.findByAdminId(user.id);
      if (Number(app.school_id) !== Number(school?.id)) throw new ApiError('Access denied', 403);
    }

    return enrichApplication(app);
  },

  async updateStatus(id, user, { status, remarks }) {
    await applicationService.getById(id, user);
    const updated = await ApplicationModel.updateStatus(id, { status, remarks });
    return enrichApplication(updated);
  },
};

module.exports = applicationService;
