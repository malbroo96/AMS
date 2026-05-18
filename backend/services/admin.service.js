const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/User.model');
const SchoolModel = require('../models/School.model');
const StudentModel = require('../models/Student.model');
const ApplicationModel = require('../models/Application.model');
const NotificationModel = require('../models/Notification.model');
const { mapUser } = require('../utils/mappers');

const adminService = {
  async getDashboardAnalytics() {
    const [
      totalSchools,
      totalStudents,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      schoolAdmins,
      applicationsByStatus,
      recentApplications,
    ] = await Promise.all([
      SchoolModel.count(),
      StudentModel.count(),
      ApplicationModel.count(),
      ApplicationModel.countByStatus('pending'),
      ApplicationModel.countByStatus('approved'),
      ApplicationModel.countByStatus('rejected'),
      UserModel.countByRole('school_admin'),
      ApplicationModel.countByStatusGrouped(),
      ApplicationModel.recent(5),
    ]);

    return {
      totalSchools,
      totalStudents,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      schoolAdmins,
      applicationsByStatus: applicationsByStatus.map((r) => ({
        status: r.status,
        _count: { status: r.count },
      })),
      recentApplications: recentApplications.map((r) => ({
        id: r.id,
        submittedAt: r.applied_date,
        school: { schoolName: r.school_name },
        student: { user: { name: r.student_name } },
      })),
    };
  },

  async listSchoolAdmins(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const { rows, total } = await UserModel.listSchoolAdmins({ search: query.search, page, limit });
    return {
      admins: rows.map((r) => ({
        ...mapUser(r),
        school: r.school_id ? { id: r.school_id, schoolName: r.school_name, city: r.city } : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async createSchoolAdmin({ name, email, phone, password, schoolId }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name,
      email,
      phone,
      password: hashed,
      role: 'school_admin',
      isApproved: false,
    });

    if (schoolId) {
      const school = await SchoolModel.findById(schoolId);
      if (!school) throw new ApiError('School not found', 404);
      await SchoolModel.setAdmin(schoolId, user.id);
    }

    return UserModel.findById(user.id);
  },

  async approveSchoolAdmin(adminId) {
    const user = await UserModel.findById(adminId);
    if (!user || user.role !== 'school_admin') {
      throw new ApiError('School admin not found', 404);
    }
    await UserModel.update(adminId, { isApproved: true });
    await NotificationModel.create({
      userId: adminId,
      title: 'Account Approved',
      message: 'Your school admin account has been approved. You can now log in.',
    });
    const updated = await UserModel.findById(adminId);
    return mapUser(updated);
  },

  async deleteSchoolAdmin(id) {
    const user = await UserModel.findById(id);
    if (!user || user.role !== 'school_admin') {
      throw new ApiError('School admin not found', 404);
    }
    const school = await SchoolModel.findByAdminId(id);
    if (school) {
      await SchoolModel.setAdmin(school.id, null);
    }
    await UserModel.delete(id);
    return { message: 'School admin deleted successfully' };
  },
};

module.exports = adminService;
