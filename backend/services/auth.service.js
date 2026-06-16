const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/User.model');
const SchoolModel = require('../models/School.model');
const StudentModel = require('../models/Student.model');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

const sanitize = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

const authService = {
  async register(payload) {
    const { name, email, password } = payload;
    let requestedRole = (payload.role || 'student').trim().toLowerCase();
    
    // Normalize role names to seed Role names: admin, college, student
    if (requestedRole === 'school_admin') requestedRole = 'college';
    if (requestedRole === 'super_admin') requestedRole = 'admin';

    const phone = payload.phone || payload.mobile;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(normalizedEmail);
    if (existing) throw new ApiError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const isActive = true;

    const user = await UserModel.create({
      name,
      email: normalizedEmail,
      phone,
      passwordHash: hashed,
      role: requestedRole,
      isActive,
    });

    if (requestedRole === 'student') {
      await StudentModel.create(user.id);
      await StudentModel.update(user.id, {
        dob: payload.dateOfBirth || payload.dob || null,
        gender: payload.gender || null,
        parentName: payload.parentName || payload.parent_name || null,
        address: payload.address || null,
        grade: payload.education || payload.educationDetails || null,
      });
      user.student = await StudentModel.findByUserId(user.id);
    }

    if (requestedRole === 'college') {
      const collegeName = payload.collegeName || name;
      user.college = await SchoolModel.create({
        schoolName: collegeName,
        email: normalizedEmail,
        adminId: user.id,
        status: 'pending'
      });
    }

    const token = signToken({ id: user.id, role: user.role });
    return { user: sanitize(user), token };
  },

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) throw new ApiError('Invalid email or password', 401);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new ApiError('Invalid email or password', 401);

    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated', 403);
    }

    const token = signToken({ id: user.id, role: user.role });
    return { user: sanitize(user), token };
  },

  async getCurrentUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    const profile = sanitize(user);
    if (user.role === 'student') {
      const student = await StudentModel.findByUserId(userId);
      return { ...profile, student };
    }
    if (user.role === 'college') {
      const school = await SchoolModel.findByAdminId(userId);
      return { ...profile, school };
    }
    return profile;
  },
};

module.exports = authService;
