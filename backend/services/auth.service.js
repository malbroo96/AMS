const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/User.model');
const SchoolModel = require('../models/School.model');
const StudentModel = require('../models/Student.model');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

async function removePartialRegistration(userId) {
  const { sql, getPool } = require('../config/database');
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const studentResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .query('SELECT StudentID FROM dbo.Students WHERE UserID = @userId');
    const studentId = studentResult.recordset[0]?.StudentID;
    if (studentId) {
      await new sql.Request(transaction).input('studentId', sql.Int, studentId)
        .query('DELETE FROM dbo.StudentAcademicDetails WHERE StudentID = @studentId; DELETE FROM dbo.StudentProfiles WHERE StudentID = @studentId; DELETE FROM dbo.Students WHERE StudentID = @studentId;');
    }

    const collegeResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .query('SELECT CollegeID FROM dbo.Colleges WHERE UserID = @userId');
    const collegeId = collegeResult.recordset[0]?.CollegeID;
    if (collegeId) {
      await new sql.Request(transaction).input('collegeId', sql.Int, collegeId).query(`
        DELETE FROM dbo.CollegeFees WHERE CollegeCourseID IN (SELECT CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @collegeId);
        DELETE FROM dbo.CollegeCourses WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeContacts WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeFacilities WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegePlacements WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeRecruiters WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeAccreditations WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeDocuments WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeSocialLinks WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeNotices WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeMedia WHERE CollegeID = @collegeId;
        DELETE FROM dbo.CollegeProfiles WHERE CollegeID = @collegeId;
        DELETE FROM dbo.Colleges WHERE CollegeID = @collegeId;
      `);
    }

    await new sql.Request(transaction).input('userId', sql.Int, userId)
      .query('DELETE FROM dbo.Users WHERE UserID = @userId');
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

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

    let user;
    try {
      user = await UserModel.create({
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
        const collegeName = payload.collegeName || payload.basic?.collegeName || name;
        user.college = await SchoolModel.create({
          schoolName: collegeName,
          email: normalizedEmail,
          adminId: user.id,
          status: 'pending'
        });

        const hasFullPayload =
          payload.basic ||
          payload.courses ||
          payload.facilities ||
          payload.accreditations ||
          payload.placements ||
          payload.contacts ||
          payload.address ||
          payload.location;

        if (hasFullPayload || payload.collegeAddress) {
          const collegeRegistration = require('./collegeRegistration.service');
          await collegeRegistration.saveFullRegistration(user.college.id, {
            basic: {
              collegeName,
              collegeType: payload.basic?.collegeType || payload.collegeType,
              universityAffiliation: payload.basic?.universityAffiliation || payload.universityAffiliation,
              establishmentYear: payload.basic?.establishmentYear || payload.establishmentYear,
              description: payload.basic?.description || payload.description,
              vision: payload.basic?.vision || payload.vision,
              mission: payload.basic?.mission || payload.mission,
              website: payload.basic?.website || payload.website,
              email: normalizedEmail,
              phone: phone || payload.basic?.phone,
              ...(payload.basic || {}),
            },
            branding: payload.branding || {},
            address: payload.address || payload.location || {
              address: payload.collegeAddress || payload.address,
              city: payload.city,
              state: payload.state,
              district: payload.district,
              country: payload.country,
              pincode: payload.pincode,
              googleMapUrl: payload.googleMapUrl,
            },
            contacts: payload.contacts || payload.contact || {},
            courses: payload.courses || [],
            facilities: payload.facilities || [],
            placements: payload.placements || {},
            accreditations: payload.accreditations || [],
            documents: payload.documents || [],
            social: payload.social || payload.socialLinks || {},
            gallery: payload.gallery || payload.campusImages || payload.branding?.campusImages || [],
          });
        }
      }
    } catch (error) {
      if (user?.id) {
        try {
          await removePartialRegistration(user.id);
        } catch (cleanupError) {
          console.error('Failed to clean up partial registration:', cleanupError);
        }
      }
      throw error;
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
