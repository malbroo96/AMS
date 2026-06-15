const ApiError = require('../utils/ApiError');
const { mapApplication } = require('../utils/mappers');
const ApplicationModel = require('../models/Application.model');
const StudentModel = require('../models/Student.model');
const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');
const { ApplicationStatus, hasProfileAccess } = require('../config/constants');
const { getPool, sql } = require('../config/database');

const enrichApplication = (row, user, academics = null, documents = []) => {
  const mapped = {
    ...mapApplication(row),
    school: row.school_name ? { schoolName: row.school_name, city: row.school_city } : undefined,
    course: row.course_name ? { courseName: row.course_name, branchName: row.branch_name, fees: row.fees } : undefined,
  };

  if (row.student_name) {
    const isApproved = hasProfileAccess(row.status);
    const isCollegeUser = user && (user.role === 'college' || user.role === 'school_admin');

    if (isCollegeUser && !isApproved) {
      mapped.student = {
        user: { name: row.student_name },
      };
    } else {
      mapped.student = {
        user: { name: row.student_name, email: row.student_email, phone: row.student_phone },
        parentName: row.parent_name,
        address: row.student_address,
        gender: row.gender,
        dob: row.dob,
        academics: academics || undefined,
        documents: documents || [],
      };
    }
  }

  return mapped;
};

const applicationService = {
  async apply(userId, { schoolId, courseId, studentDetails, documents }) {
    const student = await StudentModel.findByUserId(userId);
    if (!student) throw new ApiError('Student profile not found', 404);

    const pool = await getPool();

    // 1. Verify CollegeCourseID exists, course is active, and college is active
    const courseCheck = await pool.request()
      .input('ccid', sql.Int, courseId)
      .query(`
        SELECT cc.CollegeCourseID, cc.IsActive AS CourseActive, c.IsActive AS CollegeActive
        FROM dbo.CollegeCourses cc
        INNER JOIN dbo.Colleges c ON c.CollegeID = cc.CollegeID
        WHERE cc.CollegeCourseID = @ccid
      `);
    const courseRow = courseCheck.recordset[0];
    if (!courseRow || !courseRow.CourseActive || !courseRow.CollegeActive) {
      throw new ApiError('This course is no longer available for applications.', 400);
    }

    // 2. Check if the student has already applied to this course-college combination
    const existingCheck = await pool.request()
      .input('sid', sql.Int, student.id)
      .input('ccid', sql.Int, courseId)
      .query('SELECT ApplicationID FROM dbo.Applications WHERE StudentID = @sid AND CollegeCourseID = @ccid');
    if (existingCheck.recordset[0]) {
      throw new ApiError('You have already applied to this course.', 400);
    }

    // Update student details if provided
    if (studentDetails) {
      await StudentModel.update(userId, studentDetails);
    }

    // Save student documents if provided
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        const docExist = await pool.request()
          .input('sid', sql.Int, student.id)
          .input('type', sql.NVarChar(100), doc.documentType)
          .query('SELECT DocumentID FROM dbo.StudentDocuments WHERE StudentID = @sid AND DocumentType = @type AND IsActive = 1');
        
        if (docExist.recordset[0]) {
          await pool.request()
            .input('docId', sql.Int, docExist.recordset[0].DocumentID)
            .input('url', sql.NVarChar(2048), doc.fileUrl)
            .query('UPDATE dbo.StudentDocuments SET SharePointUrl = @url, UpdatedAt = SYSUTCDATETIME() WHERE DocumentID = @docId');
        } else {
          await pool.request()
            .input('sid', sql.Int, student.id)
            .input('type', sql.NVarChar(100), doc.documentType)
            .input('url', sql.NVarChar(2048), doc.fileUrl)
            .query('INSERT INTO dbo.StudentDocuments (StudentID, DocumentType, SharePointUrl, IsVerified, IsActive) VALUES (@sid, @type, @url, 0, 1)');
        }
      }
    }

    const app = await ApplicationModel.create({
      studentId: student.id,
      collegeCourseId: courseId,
      status: ApplicationStatus.SUBMITTED,
      changedByUserId: userId,
    });

    const full = await ApplicationModel.findById(app.id);
    return enrichApplication(full, { id: userId, role: 'student' });
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
      applications: rows.map(r => enrichApplication(r, user)),
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

    let academics = null;
    let documents = [];

    const isApproved = hasProfileAccess(app.status);
    const isCollegeUser = user.role === 'college' || user.role === 'school_admin';
    const canAccessDetails = !isCollegeUser || isApproved;

    if (canAccessDetails) {
      const pool = await getPool();
      const [acadRes, docsRes] = await Promise.all([
        pool.request().input('sid', sql.Int, app.student_id).query('SELECT Qualification AS grade, Board AS board, TenthPercentage AS percentage FROM dbo.StudentAcademicDetails WHERE StudentID = @sid'),
        pool.request().input('sid', sql.Int, app.student_id).query('SELECT DocumentType AS documentType, SharePointUrl AS fileUrl, IsVerified AS isVerified FROM dbo.StudentDocuments WHERE StudentID = @sid AND IsActive = 1')
      ]);
      academics = acadRes.recordset[0] || null;
      documents = docsRes.recordset || [];
    }

    return enrichApplication(app, user, academics, documents);
  },

  async updateStatus(id, user, { status, remarks }) {
    await applicationService.getById(id, user);

    if (user.role === 'college' && status !== 'under_review') {
      throw new ApiError('Colleges can only request access (Under Review)', 403);
    }

    const updated = await ApplicationModel.updateStatus(id, { status, remarks, changedByUserId: user.id });
    return enrichApplication(updated, user);
  },

  async getStatusHistory(id, user) {
    const app = await ApplicationModel.findById(id);
    if (!app) throw new ApiError('Application not found', 404);

    if (user.role === 'student') {
      const student = await StudentModel.findByUserId(user.id);
      if (Number(app.student_id) !== Number(student?.id)) {
        throw new ApiError('Access denied', 403);
      }
    } else if (user.role === 'college' || user.role === 'school_admin') {
      const school = await SchoolModel.findByAdminId(user.id);
      if (Number(app.school_id) !== Number(school?.id)) {
        throw new ApiError('Access denied', 403);
      }
    }

    return ApplicationModel.getStatusHistory(id);
  }
};

module.exports = applicationService;
