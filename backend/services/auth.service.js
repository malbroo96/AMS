const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { localAuth, useAmsSql } = require('../config/env');
const { sql, getPool } = require('../config/database');
const { signToken } = require('../utils/jwt');
const { mapUser, mapAmsStudentRow, mapAmsCollegeRow } = require('../utils/mappers');
const UserModel = require('../models/userStore');
const LocalDb = require('../models/LocalDb');
const StudentModel = require('../models/Student.model');
const NotificationModel = require('../models/Notification.model');
const AmsActivity = require('../models/AmsActivity.model');

const SALT_ROUNDS = 12;

const sanitize = (user) => {
  const { password, ...rest } = user;
  const mapped = mapUser(rest);
  if (rest.student) return { ...mapped, student: rest.student };
  if (rest.college) return { ...mapped, college: rest.college };
  return mapped;
};

const authService = {
  async register(payload) {
    const { name, email, password } = payload;
    const role = useAmsSql || localAuth ? 'student' : payload.role;
    const phone = payload.phone || payload.mobile;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(normalizedEmail);
    if (existing) throw new ApiError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const isApproved = role !== 'school_admin';

    const user = await UserModel.create({
      name,
      email: normalizedEmail,
      phone,
      password: hashed,
      role,
      isApproved,
    });

    if (useAmsSql && role === 'student') {
      const pool = await getPool();
      let dobVal = null;
      if (payload.dateOfBirth || payload.dob) {
        const d = new Date(payload.dateOfBirth || payload.dob);
        if (!Number.isNaN(d.getTime())) dobVal = d;
      }
      const interestedCollegeId = parseInt(String(payload.interestedCollege || ''), 10);
      await pool
        .request()
        .input('userId', sql.Int, user.id)
        .input('name', sql.NVarChar(150), name)
        .input('address', sql.NVarChar(500), payload.address || '')
        .input('mobile', sql.NVarChar(30), phone || '')
        .input('email', sql.NVarChar(255), normalizedEmail)
        .input('gender', sql.NVarChar(20), payload.gender || '')
        .input('dob', sql.Date, dobVal)
        .input('education', sql.NVarChar(150), payload.education || payload.educationDetails || '')
        .input('ic', sql.Int, Number.isFinite(interestedCollegeId) ? interestedCollegeId : null)
        .query(`
          INSERT INTO Students (UserID, Name, Address, Mobile, Email, Gender, DateOfBirth, Education, InterestedCollege, ProfileVisible)
          VALUES (@userId, @name, @address, @mobile, @email, @gender, @dob, @education, @ic, 0)
        `);
      const stud = await pool.request().input('uid', sql.Int, user.id).query('SELECT * FROM Students WHERE UserID = @uid');
      user.student = mapAmsStudentRow(stud.recordset[0]);
      await AmsActivity.add(`Student registered: ${name}`);
    }

    if (localAuth) {
      const ldb = await LocalDb.read();
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
      ldb.students.push(student);
      LocalDb.addActivity(ldb, `Student registered: ${name}`);
      await LocalDb.write(ldb);
      user.student = student;
    }

    if (!useAmsSql && !localAuth && role === 'student') {
      await StudentModel.create(user.id);
    }

    if (!useAmsSql && !localAuth && role === 'school_admin') {
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

    const profile = sanitize(user);
    if (localAuth) {
      const ldb = await LocalDb.read();
      if (user.role === 'student') {
        return { ...profile, student: ldb.students.find((s) => String(s.userId) === String(userId)) || null };
      }
      if (user.role === 'college') {
        return { ...profile, college: ldb.colleges.find((c) => String(c.userId) === String(userId)) || null };
      }
      return profile;
    }
    if (useAmsSql) {
      if (user.role === 'student') {
        const pool = await getPool();
        const r = await pool.request().input('uid', sql.Int, user.id).query('SELECT * FROM Students WHERE UserID = @uid');
        return { ...profile, student: mapAmsStudentRow(r.recordset[0]) || null };
      }
      if (user.role === 'college') {
        const pool = await getPool();
        const r = await pool.request().input('uid', sql.Int, user.id).query('SELECT * FROM Colleges WHERE UserID = @uid');
        return { ...profile, college: mapAmsCollegeRow(r.recordset[0]) || null };
      }
      return profile;
    }
    if (!localAuth && user.role === 'student') {
      const student = await StudentModel.findByUserId(userId);
      return {
        ...profile,
        student: student
          ? {
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
            }
          : null,
      };
    }
    if (!localAuth && user.role === 'school_admin') {
      const SchoolModel = require('../models/School.model');
      const school = await SchoolModel.findByAdminId(userId);
      return {
        ...profile,
        school: school ? require('../utils/mappers').mapSchool(school) : null,
      };
    }
    return profile;
  },
};

module.exports = authService;
