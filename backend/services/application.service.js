const ApiError = require('../utils/ApiError');
const { mapApplication } = require('../utils/mappers');
const ApplicationModel = require('../models/Application.model');
const StudentModel = require('../models/Student.model');
const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');
const NotificationModel = require('../models/Notification.model');

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
    if (!course || course.school_id !== schoolId) {
      throw new ApiError('Invalid school or course selection', 400);
    }

    const app = await ApplicationModel.create({
      studentId: student.id,
      schoolId,
      courseId,
    });

    const school = await SchoolModel.findById(schoolId);
    if (school?.admin_id) {
      await NotificationModel.create({
        userId: school.admin_id,
        title: 'New Application',
        message: `A new admission application has been submitted for ${school.school_name}.`,
      });
    }

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
    } else if (user.role === 'school_admin') {
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
      if (app.student_id !== student?.id) throw new ApiError('Access denied', 403);
    }
    if (user.role === 'school_admin') {
      const school = await SchoolModel.findByAdminId(user.id);
      if (app.school_id !== school?.id) throw new ApiError('Access denied', 403);
    }

    return enrichApplication(app);
  },

  async updateStatus(id, user, { status, remarks }) {
    const app = await applicationService.getById(id, user);
    const updated = await ApplicationModel.updateStatus(id, { status, remarks });

    const student = await StudentModel.findById(app.studentId || app.student_id);
    if (student) {
      await NotificationModel.create({
        userId: student.user_id,
        title: 'Application Update',
        message: `Your application status is now: ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      });
    }

    return enrichApplication(updated);
  },
};

module.exports = applicationService;
