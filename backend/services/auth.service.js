const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { mapUser } = require('../utils/mappers');
const UserModel = require('../models/User.model');
const StudentModel = require('../models/Student.model');
const NotificationModel = require('../models/Notification.model');

const SALT_ROUNDS = 12;

const sanitize = (user) => {
  const { password, ...rest } = user;
  return mapUser(rest);
};

const authService = {
  async register({ name, email, phone, password, role }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // School admins require super admin approval before login
    const isApproved = role !== 'school_admin';

    const user = await UserModel.create({
      name,
      email,
      phone,
      password: hashed,
      role,
      isApproved,
    });

    if (role === 'student') {
      await StudentModel.create(user.id);
    }

    if (role === 'school_admin') {
      await NotificationModel.create({
        userId: user.id,
        title: 'Account Pending',
        message: 'Your school admin account is awaiting super admin approval.',
      });
    }

    const token = signToken({ id: user.id, role: user.role });
    return { user: sanitize(user), token };
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new ApiError('Invalid email or password', 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new ApiError('Invalid email or password', 401);

    if (user.role === 'school_admin' && !user.is_approved) {
      throw new ApiError('Account pending approval by super admin', 403);
    }

    const token = signToken({ id: user.id, role: user.role });
    return { user: sanitize(user), token };
  },

  async getCurrentUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    let profile = sanitize(user);
    if (user.role === 'student') {
      const student = await StudentModel.findByUserId(userId);
      profile = { ...profile, student: student ? {
        id: student.id,
        userId: student.user_id,
        dob: student.dob,
        gender: student.gender,
        parentName: student.parent_name,
        address: student.address,
        grade: student.grade,
        board: student.board,
        percentage: student.percentage,
        profileImage: student.profile_image,
      } : null };
    }
    if (user.role === 'school_admin') {
      const SchoolModel = require('../models/School.model');
      const school = await SchoolModel.findByAdminId(userId);
      profile = { ...profile, school: school ? require('../utils/mappers').mapSchool(school) : null };
    }
    return profile;
  },
};

module.exports = authService;
