const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { localAuth } = require('../config/env');
const { signToken } = require('../utils/jwt');
const { mapUser } = require('../utils/mappers');
const UserModel = require('../models/userStore');
const LocalDb = require('../models/LocalDb');
const StudentModel = require('../models/Student.model');
const NotificationModel = require('../models/Notification.model');

const SALT_ROUNDS = 12;

const sanitize = (user) => {
  const { password, ...rest } = user;
  return mapUser(rest);
};

const authService = {
  async register(payload) {
    const { name, email, password } = payload;
    const role = localAuth ? 'student' : payload.role;
    const phone = payload.phone || payload.mobile;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(normalizedEmail);
    if (existing) throw new ApiError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    // School admins require super admin approval before login
    const isApproved = role !== 'school_admin';

    const user = await UserModel.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashed,
      role,
      isApproved,
    });

    if (!localAuth && role === 'student') {
      await StudentModel.create(user.id);
    }

    if (localAuth) {
      const db = await LocalDb.read();
      const student = {
        id: user.id,
        userId: user.id,
        name,
        address: payload.address || '',
        mobile: phone || '',
        email: normalizedEmail,
        gender: payload.gender || '',
        dateOfBirth: payload.dateOfBirth || payload.dob || '',
        education: payload.education || payload.educationDetails || '',
        interestedCollege: payload.interestedCollege || '',
        profileVisible: false,
        createdAt: user.created_at,
      };
      db.students.push(student);
      LocalDb.addActivity(db, `Student registered: ${name}`);
      await LocalDb.write(db);
      user.student = student;
    }

    if (!localAuth && role === 'school_admin') {
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
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);
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
    if (localAuth) {
      const db = await LocalDb.read();
      if (user.role === 'student') {
        return { ...profile, student: db.students.find((student) => student.userId === userId) || null };
      }
      if (user.role === 'college') {
        return { ...profile, college: db.colleges.find((college) => college.userId === userId) || null };
      }
      return profile;
    }
    if (!localAuth && user.role === 'student') {
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
    if (!localAuth && user.role === 'school_admin') {
      const SchoolModel = require('../models/School.model');
      const school = await SchoolModel.findByAdminId(userId);
      profile = { ...profile, school: school ? require('../utils/mappers').mapSchool(school) : null };
    }
    return profile;
  },
};

module.exports = authService;
