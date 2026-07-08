const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/User.model');
const { mapAmsStudentRow, mapAmsCollegeRow } = require('../utils/mappers');
const collegePortal = require('./collegePortalSql.service');
const { ApplicationStatus, hasProfileAccess } = require('../config/constants');

function buildCollegeProfilePayload(college, stats = {}) {
  const logoUrl = college.logoUrl || null;
  const coverBannerUrl = college.coverBannerUrl || null;
  const profile = {
    id: college.id,
    collegeName: college.collegeName || '',
    shortName: college.shortName || '',
    establishmentYear: college.establishmentYear || null,
    collegeType: college.collegeType || '',
    universityAffiliation: college.universityAffiliation || '',
    naacGrade: college.naacGrade || '',
    aicteApproval: college.aicteApproval || false,
    ugcRecognition: college.ugcRecognition || false,
    email: college.email || '',
    status: college.status || '',
    logoUrl,
    coverBannerUrl,
    prospectusUrl: college.prospectusUrl || null,
    location: {
      country: 'India',
      state: college.location?.state || '',
      city: college.location?.city || '',
      pincode: college.location?.pincode || '',
      fullAddress: college.location?.fullAddress || '',
    },
    contact: {
      emailAddress: college.email || '',
      admissionMobileNumber: college.contact?.admissionMobileNumber || '',
      officeMobileNumber: college.contact?.officeMobileNumber || '',
      websiteUrl: college.contact?.websiteUrl || '',
    },
    placements: {
      placementPercentage: college.placements?.placementPercentage || null,
      highestPackage: college.placements?.highestPackage || '',
      averagePackage: college.placements?.averagePackage || '',
      topRecruiters: [],
    },
    about: {
      summaryDescription: college.about?.summaryDescription || '',
      visionStatement: '',
      missionStatement: '',
      principalMessage: '',
    },
    facilities: [],
    courses: [],
    achievements: [],
  };

  const completionFields = [
    profile.collegeName,
    profile.contact.emailAddress,
    logoUrl,
    coverBannerUrl,
    profile.about.summaryDescription,
  ];
  const filled = completionFields.filter(Boolean).length;

  return {
    ...profile,
    dashboard: {
      totalStudentViews: 0,
      totalEnquiries: 0,
      totalInterestedStudents: stats.interestedStudents ?? 0,
      profileCompletionPercentage: Math.round((filled / completionFields.length) * 100),
    },
  };
}

function toSqlDateString(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
  }
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

async function getRoleId(pool, roleName) {
  const r = await pool
    .request()
    .input('roleName', sql.NVarChar(50), roleName.trim().toLowerCase())
    .query('SELECT RoleID FROM Roles WHERE LOWER(RoleName) = @roleName');
  if (!r.recordset[0]) throw new ApiError(`Role not found in Roles: ${roleName}`, 500);
  return r.recordset[0].RoleID;
}

async function addActivity(message) {
  console.log('AMS Activity:', message);
}

function visibleCollege(row) {
  if (!row) return { id: '', collegeName: '', email: '', status: '', createdByAdmin: null };
  return {
    id: String(row.CollegeID),
    collegeName: row.CollegeName,
    email: row.Email,
    status: row.Status,
    createdByAdmin: null,
  };
}

function interestDto(appRow, collegeRow) {
  const created = appRow.CreatedAt instanceof Date ? appRow.CreatedAt.toISOString() : appRow.CreatedAt;
  return {
    id: String(appRow.ApplicationID),
    studentId: String(appRow.StudentID),
    collegeId: String(appRow.CollegeID),
    status: appRow.Status,
    approvedByAdmin: !!appRow.ApprovedByAdmin,
    createdAt: created,
    college: visibleCollege(collegeRow),
    courseName: appRow.CourseName || '',
    branchName: appRow.BranchName || '',
  };
}

const publicStudent = (student, interestLike) => ({
  studentId: student.id,
  status: interestLike.approvedByAdmin ? 'Approved' : 'Interested',
  interestedAt: interestLike.createdAt,
});

const fullStudent = (student, interestLike) => ({
  ...publicStudent(student, interestLike),
  name: student.name,
  address: student.address,
  mobile: student.mobile,
  email: student.email,
  gender: student.gender,
  dateOfBirth: student.dateOfBirth,
  education: student.education,
  fullProfile: student,
});

const amsSqlService = {
  async listColleges(query = {}) {
    const pool = await getPool();
    const search = (query.search || '').trim().toLowerCase();
    const status = query.status || 'approved';
    const req = pool.request();
    let where = '1=1';
    if (status !== 'all') {
      where += ' AND c.Status = @status';
      req.input('status', sql.VarChar(20), status);
    }
    if (search) {
      where += ' AND (LOWER(c.CollegeName) LIKE @search OR LOWER(c.Email) LIKE @search)';
      req.input('search', sql.VarChar(255), `%${search}%`);
    }
    const result = await req.query(`
      SELECT c.CollegeID, c.CollegeName, c.Email, c.Status, c.UserID, c.CreatedAt
      FROM Colleges c
      WHERE ${where}
      ORDER BY c.CollegeName
    `);
    return result.recordset.map(visibleCollege);
  },

  async markInterest(user, collegeIdRaw) {
    const pool = await getPool();
    const collegeId = parseInt(String(collegeIdRaw), 10);
    if (!Number.isFinite(collegeId)) throw new ApiError('Invalid college', 400);

    const stud = await pool
      .request()
      .input('userId', sql.Int, user.id)
      .query(`
        SELECT s.StudentID, (sp.FirstName + ' ' + sp.LastName) AS Name
        FROM Students s
        LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
        WHERE s.UserID = @userId
      `);
    const studentRow = stud.recordset[0];
    if (!studentRow) throw new ApiError('Student profile not found', 404);

    const col = await pool
      .request()
      .input('collegeId', sql.Int, collegeId)
      .query("SELECT * FROM Colleges WHERE CollegeID = @collegeId AND Status = 'approved'");
    const collegeRow = col.recordset[0];
    if (!collegeRow) throw new ApiError('College not found or not approved', 404);

    let courseRes = await pool
      .request()
      .input('cid', sql.Int, collegeId)
      .query('SELECT TOP 1 CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid');
    let collegeCourseId = courseRes.recordset[0]?.CollegeCourseID;
    if (!collegeCourseId) {
      let defaultCourse = await pool.request().query('SELECT TOP 1 CourseID FROM dbo.Courses');
      let courseId = defaultCourse.recordset[0]?.CourseID;
      if (!courseId) {
        let insCourse = await pool.request().query("INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES ('General Course', 'GEN')");
        courseId = insCourse.recordset[0].CourseID;
      }
      let defaultBranch = await pool.request().query('SELECT TOP 1 BranchID FROM dbo.Branches');
      let branchId = defaultBranch.recordset[0]?.BranchID;
      if (!branchId) {
        let insBranch = await pool.request().input('cid', sql.Int, courseId).query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@cid, 'General Branch', 'GEN')");
        branchId = insBranch.recordset[0].BranchID;
      }
      let insCc = await pool.request()
        .input('cid', sql.Int, collegeId)
        .input('courseId', sql.Int, courseId)
        .input('branchId', sql.Int, branchId)
        .query("INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee) OUTPUT inserted.CollegeCourseID VALUES (@cid, @courseId, @branchId, 4.0, 60, 50000.00)");
      collegeCourseId = insCc.recordset[0].CollegeCourseID;
    }

    const exists = await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .input('ccid', sql.Int, collegeCourseId)
      .query('SELECT ApplicationID FROM dbo.Applications WHERE StudentID = @sid AND CollegeCourseID = @ccid');
    if (exists.recordset[0]) return this.getStudentDashboard(user);

    await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .input('ccid', sql.Int, collegeCourseId)
      .query(`
        INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
        VALUES (@sid, @ccid, 'Interested')
      `);

    await addActivity(`${studentRow.Name || 'Student'} marked interest in ${collegeRow.CollegeName}`);
    return this.getStudentDashboard(user);
  },

  async getStudentDashboard(user) {
    const pool = await getPool();
    const stud = await pool
      .request()
      .input('userId', sql.Int, user.id)
      .query(`
        SELECT 
          s.StudentID,
          s.UserID,
          (sp.FirstName + ' ' + sp.LastName) AS Name,
          sp.AddressLine1 AS Address,
          sp.Mobile,
          sp.Email,
          sp.Gender,
          sp.DateOfBirth,
          sad.Qualification AS Education,
          (SELECT TOP 1 cc.CollegeID FROM dbo.Applications a INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID WHERE a.StudentID = s.StudentID ORDER BY a.CreatedAt DESC) AS InterestedCollege,
          (CASE WHEN EXISTS (SELECT 1 FROM dbo.Applications a WHERE a.StudentID = s.StudentID AND a.CurrentStatus = 'Approved') THEN 1 ELSE 0 END) AS ProfileVisible
        FROM Students s
        LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
        LEFT JOIN StudentAcademicDetails sad ON sad.StudentID = s.StudentID
        WHERE s.UserID = @userId
      `);
    const studentRow = stud.recordset[0];
    if (!studentRow) throw new ApiError('Student profile not found', 404);
    const student = mapAmsStudentRow(studentRow);

    const apps = await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .query(`
        SELECT sa.ApplicationID, sa.StudentID, cc.CollegeID, sa.CurrentStatus AS Status, 
               (CASE WHEN sa.CurrentStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedByAdmin, sa.CreatedAt,
               col.CollegeName, col.Email AS CollegeEmail, col.Status AS CollegeStatus,
               crs.CourseName, br.BranchName
        FROM dbo.Applications sa
        INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID
        INNER JOIN dbo.Colleges col ON col.CollegeID = cc.CollegeID
        INNER JOIN dbo.Courses crs ON crs.CourseID = cc.CourseID
        INNER JOIN dbo.Branches br ON br.BranchID = cc.BranchID
        WHERE sa.StudentID = @sid
        ORDER BY sa.CreatedAt DESC
      `);

    const interests = apps.recordset.map((row) =>
      interestDto(
        {
          ApplicationID: row.ApplicationID,
          StudentID: row.StudentID,
          CollegeID: row.CollegeID,
          Status: row.Status,
          ApprovedByAdmin: row.ApprovedByAdmin,
          CreatedAt: row.CreatedAt,
          CourseName: row.CourseName,
          BranchName: row.BranchName,
        },
        {
          CollegeID: row.CollegeID,
          CollegeName: row.CollegeName,
          Email: row.CollegeEmail,
          Status: row.CollegeStatus,
          CreatedByAdminUserID: null,
        }
      )
    );

    const approvedCollegeCount = await pool.request().query("SELECT COUNT(*) AS n FROM Colleges WHERE Status = 'approved'");
    const granted = interests.filter((i) => i.approvedByAdmin).length;

    return {
      student,
      stats: {
        registeredColleges: approvedCollegeCount.recordset[0].n,
        appliedColleges: interests.length,
        approvedAccess: granted,
      },
      interests,
    };
  },

  async getCollegeProfile(user) {
    return collegePortal.getOwnProfile(user);
  },

  async updateCollegeProfile(user, data = {}) {
    return collegePortal.updateProfile(user, data);
  },

  async searchCollegeProfiles(query) {
    return collegePortal.listPublic(query);
  },

  async getPublicCollegeProfile(collegeId) {
    return collegePortal.getPublicDetails(collegeId);
  },

  async saveCollegeCourse(user, courseId, data) {
    return collegePortal.saveCourse(user, courseId, data);
  },

  async deleteCollegeCourse(user, courseId) {
    return collegePortal.deleteCourse(user, courseId);
  },

  async saveCollegeAchievement(user, achievementId, data) {
    return collegePortal.saveAchievement(user, achievementId, data);
  },

  async deleteCollegeAchievement(user, achievementId) {
    return collegePortal.deleteAchievement(user, achievementId);
  },

  async saveCollegeGalleryImage(user, imageId, data, file) {
    return collegePortal.saveGalleryImage(user, imageId, data, file);
  },

  async deleteCollegeGalleryImage(user, imageId) {
    return collegePortal.deleteGalleryImage(user, imageId);
  },

  async createCollegeEnquiry(collegeId, data) {
    return collegePortal.createEnquiry(collegeId, data);
  },

  async updateCollegeEnquiry(user, enquiryId, data) {
    return collegePortal.updateEnquiry(user, enquiryId, data);
  },

  async getCollegeDashboard(user) {
    const pool = await getPool();
    const col = await pool
      .request()
      .input('userId', sql.Int, user.id)
      .query('SELECT * FROM Colleges WHERE UserID = @userId');
    const collegeRow = col.recordset[0];
    if (!collegeRow) throw new ApiError('College profile not found', 404);

    const apps = await pool
      .request()
      .input('cid', sql.Int, collegeRow.CollegeID)
      .query(`
        SELECT sa.ApplicationID, sa.StudentID, cc.CollegeID, sa.CurrentStatus AS Status, 
               (CASE WHEN sa.CurrentStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedByAdmin, sa.CreatedAt,
               (sp.FirstName + ' ' + sp.LastName) AS Name, sp.AddressLine1 AS Address, sp.Mobile, sp.Email, sp.Gender, sp.DateOfBirth,
               sad.Qualification AS Education, sad.Board, sad.TenthPercentage AS Percentage,
               st.StudentID AS StuId, st.UserID AS StuUserID,
               c.CourseName, b.BranchName
        FROM dbo.Applications sa
        INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID
        INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
        INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
        INNER JOIN dbo.Students st ON st.StudentID = sa.StudentID
        LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
        LEFT JOIN dbo.StudentAcademicDetails sad ON sad.StudentID = st.StudentID
        WHERE cc.CollegeID = @cid
        ORDER BY sa.CreatedAt DESC
      `);

    const interests = apps.recordset;

    // Batch query student documents
    const studentIds = interests.map((row) => Number(row.StuId)).filter(Number.isFinite);
    let studentDocsMap = new Map();
    if (studentIds.length) {
      const docReq = pool.request();
      const idParams = studentIds.map((id, index) => {
        const param = `stuId${index}`;
        docReq.input(param, sql.Int, id);
        return `@${param}`;
      });
      const docsResult = await docReq.query(`
        SELECT StudentID, DocumentType, SharePointUrl, IsVerified
        FROM dbo.StudentDocuments
        WHERE IsActive = 1 AND StudentID IN (${idParams.join(', ')})
      `);
      studentDocsMap = docsResult.recordset.reduce((groups, row) => {
        const key = String(row.StudentID);
        const next = groups.get(key) || [];
        next.push({
          documentType: row.DocumentType,
          fileUrl: row.SharePointUrl,
          isVerified: !!row.IsVerified,
        });
        groups.set(key, next);
        return groups;
      }, new Map());
    }

    return {
      college: visibleCollege(collegeRow),
      stats: {
        interestedStudents: interests.length,
        grantedProfiles: interests.filter((r) => hasProfileAccess(r.Status)).length,
        hiddenProfiles: interests.filter((r) => !hasProfileAccess(r.Status)).length,
      },
      students: interests.map((row) => {
        const student = {
          ...mapAmsStudentRow({
            StudentID: row.StuId,
            UserID: row.StuUserID,
            Name: row.Name,
            Address: row.Address,
            Mobile: row.Mobile,
            Email: row.Email,
            Gender: row.Gender,
            DateOfBirth: row.DateOfBirth,
            Education: row.Education,
          }),
          board: row.Board || '',
          percentage: row.Percentage != null ? Number(row.Percentage) : null,
          courseName: row.CourseName || '',
          branchName: row.BranchName || '',
          applicationId: String(row.ApplicationID),
          appliedDate: row.CreatedAt,
        };

        const interestLike = {
          approvedByAdmin: hasProfileAccess(row.Status),
          createdAt: row.CreatedAt instanceof Date ? row.CreatedAt.toISOString() : row.CreatedAt,
        };

        const isApproved = hasProfileAccess(row.Status);
        if (!isApproved) {
          return {
            studentId: student.id,
            applicationId: student.applicationId,
            status: row.Status,
            name: student.name,
            courseName: student.courseName,
            branchName: student.branchName,
            appliedDate: student.appliedDate,
            fullProfile: false,
          };
        } else {
          return {
            ...fullStudent(student, interestLike),
            studentId: student.id,
            applicationId: student.applicationId,
            status: row.Status,
            courseName: student.courseName,
            branchName: student.branchName,
            appliedDate: student.appliedDate,
            documents: studentDocsMap.get(student.id) || [],
          };
        }
      }),
    };
  },

  async adminDashboard() {
    const pool = await getPool();
    const [students, colleges, apps, pending] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS n FROM Students'),
      pool.request().query('SELECT COUNT(*) AS n FROM Colleges'),
      pool.request().query('SELECT COUNT(*) AS n FROM dbo.Applications'),
      pool.request().query("SELECT COUNT(*) AS n FROM dbo.Applications WHERE CurrentStatus <> 'Approved'"),
    ]);
    return {
      totalStudents: students.recordset[0].n,
      totalColleges: colleges.recordset[0].n,
      interestedStudentsCount: apps.recordset[0].n,
      permissionRequests: pending.recordset[0].n,
      recentActivities: [],
    };
  },

  async adminStudents() {
    const pool = await getPool();
    const studs = await pool.request().query(`
      SELECT 
        s.StudentID,
        s.UserID,
        (sp.FirstName + ' ' + sp.LastName) AS Name,
        sp.AddressLine1 AS Address,
        sp.Mobile,
        sp.Email,
        sp.Gender,
        sp.DateOfBirth,
        sad.Qualification AS Education,
        (SELECT TOP 1 cc.CollegeID FROM dbo.Applications a INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID WHERE a.StudentID = s.StudentID ORDER BY a.CreatedAt DESC) AS InterestedCollege,
        (CASE WHEN EXISTS (SELECT 1 FROM dbo.Applications a WHERE a.StudentID = s.StudentID AND a.CurrentStatus = 'Approved') THEN 1 ELSE 0 END) AS ProfileVisible
      FROM Students s
      LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
      LEFT JOIN StudentAcademicDetails sad ON sad.StudentID = s.StudentID
      ORDER BY Name
    `);
    const apps = await pool.request().query(`
      SELECT sa.ApplicationID, sa.StudentID, cc.CollegeID, sa.CurrentStatus AS Status, 
             (CASE WHEN sa.CurrentStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedByAdmin, sa.CreatedAt,
             c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus
      FROM dbo.Applications sa
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID
      INNER JOIN dbo.Colleges c ON c.CollegeID = cc.CollegeID
    `);

    return studs.recordset.map((sr) => {
      const student = mapAmsStudentRow(sr);
      const mine = apps.recordset.filter((a) => a.StudentID === sr.StudentID);
      const interests = mine.map((row) =>
        interestDto(
          {
            ApplicationID: row.ApplicationID,
            StudentID: row.StudentID,
            CollegeID: row.CollegeID,
            Status: row.Status,
            ApprovedByAdmin: row.ApprovedByAdmin,
            CreatedAt: row.CreatedAt,
          },
          {
            CollegeID: row.CollegeID,
            CollegeName: row.CollegeName,
            Email: row.CollegeEmail,
            Status: row.CollegeStatus,
            CreatedByAdminUserID: null,
          }
        )
      );
      return { ...student, interests };
    });
  },

  async createStudent(data) {
    const pool = await getPool();
    const email = data.email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError('Email already registered', 409);

    const password = data.password || 'Student@123';
    const studentRoleId = await getRoleId(pool, 'student');
    const dobVal = toSqlDateString(data.dateOfBirth);
    const interestedCollegeId = parseInt(String(data.interestedCollege || ''), 10);

    const name = String(data.name || '').trim();
    const firstSpace = name.indexOf(' ');
    const firstName = firstSpace > 0 ? name.slice(0, firstSpace) : name || 'Student';
    const lastName = firstSpace > 0 ? name.slice(firstSpace + 1) : '';

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const userOut = await new sql.Request(transaction)
        .input('roleId', sql.Int, studentRoleId)
        .input('email', sql.VarChar(255), email)
        .input('password', sql.NVarChar(255), await bcrypt.hash(password, 12))
        .input('fullName', sql.NVarChar(150), data.name)
        .input('phone', sql.NVarChar(30), data.mobile || data.phone || null)
        .input('isActive', sql.Bit, 1)
        .query(`
          INSERT INTO Users (RoleID, Email, PasswordHash, FullName, Phone, IsActive)
          OUTPUT inserted.UserID
          VALUES (@roleId, @email, @password, @fullName, @phone, @isActive)
        `);

      const userId = userOut.recordset[0].UserID;
      const studentOut = await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .query(`
          INSERT INTO Students (UserID, IsActive)
          OUTPUT inserted.StudentID, inserted.UserID
          VALUES (@userId, 1)
        `);
      const studentId = studentOut.recordset[0].StudentID;

      await new sql.Request(transaction)
        .input('studentId', sql.Int, studentId)
        .input('firstName', sql.NVarChar(100), firstName)
        .input('lastName', sql.NVarChar(100), lastName)
        .input('email', sql.NVarChar(255), email)
        .input('mobile', sql.NVarChar(30), data.mobile || data.phone || null)
        .input('gender', sql.NVarChar(20), data.gender || null)
        .input('dob', sql.NVarChar(10), dobVal)
        .input('address', sql.NVarChar(255), data.address || null)
        .query(`
          INSERT INTO StudentProfiles (StudentID, FirstName, LastName, Email, Mobile, Gender, DateOfBirth, AddressLine1, ProfileStatus, ProfileCompletionPercentage)
          VALUES (@studentId, @firstName, @lastName, @email, @mobile, @gender, CONVERT(date, @dob, 23), @address, 'Complete', 100)
        `);

      await new sql.Request(transaction)
        .input('studentId', sql.Int, studentId)
        .input('qualification', sql.NVarChar(100), data.education || null)
        .query(`
          INSERT INTO StudentAcademicDetails (StudentID, Qualification)
          VALUES (@studentId, @qualification)
        `);

      if (Number.isFinite(interestedCollegeId)) {
        let courseRes = await new sql.Request(transaction)
          .input('cid', sql.Int, interestedCollegeId)
          .query('SELECT TOP 1 CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid');
        let collegeCourseId = courseRes.recordset[0]?.CollegeCourseID;
        if (!collegeCourseId) {
          let defaultCourse = await new sql.Request(transaction).query('SELECT TOP 1 CourseID FROM dbo.Courses');
          let courseId = defaultCourse.recordset[0]?.CourseID;
          if (!courseId) {
            let insCourse = await new sql.Request(transaction).query("INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES ('General Course', 'GEN')");
            courseId = insCourse.recordset[0].CourseID;
          }
          let defaultBranch = await new sql.Request(transaction).query('SELECT TOP 1 BranchID FROM dbo.Branches');
          let branchId = defaultBranch.recordset[0]?.BranchID;
          if (!branchId) {
            let insBranch = await new sql.Request(transaction).input('cid', sql.Int, courseId).query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@cid, 'General Branch', 'GEN')");
            branchId = insBranch.recordset[0].BranchID;
          }
          let insCc = await new sql.Request(transaction)
            .input('cid', sql.Int, interestedCollegeId)
            .input('courseId', sql.Int, courseId)
            .input('branchId', sql.Int, branchId)
            .query("INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee) OUTPUT inserted.CollegeCourseID VALUES (@cid, @courseId, @branchId, 4.0, 60, 50000.00)");
          collegeCourseId = insCc.recordset[0].CollegeCourseID;
        }

        await new sql.Request(transaction)
          .input('sid', sql.Int, studentId)
          .input('ccid', sql.Int, collegeCourseId)
          .query(`
            INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
            VALUES (@sid, @ccid, 'Interested')
          `);
      }

      await transaction.commit();
      await addActivity(`Admin created student: ${name}`);

      return {
        student: {
          StudentID: studentId,
          UserID: userId,
          Name: name,
          Address: data.address || '',
          Mobile: data.mobile || data.phone || '',
          Email: email,
          Gender: data.gender || '',
          DateOfBirth: dobVal,
          Education: data.education || '',
          InterestedCollege: Number.isFinite(interestedCollegeId) ? String(interestedCollegeId) : '',
          ProfileVisible: false
        },
        temporaryPassword: password
      };
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async updateStudent(idRaw, data) {
    const pool = await getPool();
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id)) throw new ApiError('Student not found', 404);

    const cur = await pool.request().input('id', sql.Int, id).query(`
      SELECT s.StudentID, s.UserID, sp.FirstName, sp.LastName, sp.Email, sp.Mobile, sp.Gender, sp.DateOfBirth, sp.AddressLine1 AS Address, sad.Qualification AS Education
      FROM Students s
      LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
      LEFT JOIN StudentAcademicDetails sad ON sad.StudentID = s.StudentID
      WHERE s.StudentID = @id
    `);
    const row = cur.recordset[0];
    if (!row) throw new ApiError('Student not found', 404);

    const currentEmail = row.Email || '';
    const nextEmail = data.email !== undefined ? data.email.trim().toLowerCase() : currentEmail;
    if (nextEmail !== currentEmail.toLowerCase() && nextEmail) {
      const duplicate = await pool
        .request()
        .input('email', sql.VarChar(255), nextEmail)
        .input('userId', sql.Int, row.UserID)
        .query('SELECT UserID FROM Users WHERE LOWER(Email) = LOWER(@email) AND UserID <> @userId');
      if (duplicate.recordset[0]) throw new ApiError('Email already registered', 409);
    }

    let dobVal = row.DateOfBirth;
    if (data.dateOfBirth !== undefined) {
      dobVal = toSqlDateString(data.dateOfBirth);
    }

    const name = String(data.name || row.FirstName + ' ' + (row.LastName || '')).trim();
    const firstSpace = name.indexOf(' ');
    const firstName = firstSpace > 0 ? name.slice(0, firstSpace) : name || 'Student';
    const lastName = firstSpace > 0 ? name.slice(firstSpace + 1) : '';

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const userReq = new sql.Request(transaction)
        .input('userId', sql.Int, row.UserID)
        .input('email', sql.VarChar(255), nextEmail)
        .input('name', sql.NVarChar(150), name)
        .input('phone', sql.NVarChar(30), data.mobile ?? row.Mobile ?? null);

      let userSql = 'UPDATE Users SET Email = @email, FullName = @name, Phone = @phone';
      if (data.password) {
        userReq.input('password', sql.NVarChar(255), await bcrypt.hash(data.password, 12));
        userSql += ', PasswordHash = @password';
      }
      userSql += ' WHERE UserID = @userId';
      await userReq.query(userSql);

      await new sql.Request(transaction)
        .input('id', sql.Int, id)
        .input('firstName', sql.NVarChar(100), firstName)
        .input('lastName', sql.NVarChar(100), lastName)
        .input('email', sql.NVarChar(255), nextEmail)
        .input('mobile', sql.NVarChar(30), data.mobile ?? row.Mobile ?? null)
        .input('gender', sql.NVarChar(20), data.gender ?? row.Gender ?? null)
        .input('dob', sql.NVarChar(10), dobVal instanceof Date ? dobVal.toISOString().slice(0, 10) : dobVal)
        .input('address', sql.NVarChar(255), data.address ?? row.Address ?? null)
        .query(`
          UPDATE StudentProfiles
          SET FirstName = @firstName, LastName = @lastName, Email = @email, Mobile = @mobile,
              Gender = @gender, DateOfBirth = CONVERT(date, @dob, 23), AddressLine1 = @address
          WHERE StudentID = @id
        `);

      await new sql.Request(transaction)
        .input('id', sql.Int, id)
        .input('qualification', sql.NVarChar(100), data.education ?? row.Education ?? null)
        .query(`
          UPDATE StudentAcademicDetails
          SET Qualification = @qualification
          WHERE StudentID = @id
        `);

      if (data.interestedCollege !== undefined) {
        const interestedCollegeId = parseInt(String(data.interestedCollege || ''), 10);
        if (Number.isFinite(interestedCollegeId)) {
          await new sql.Request(transaction)
            .input('sid', sql.Int, id)
            .query('DELETE FROM dbo.Applications WHERE StudentID = @sid');

          let courseRes = await new sql.Request(transaction)
            .input('cid', sql.Int, interestedCollegeId)
            .query('SELECT TOP 1 CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid');
          let collegeCourseId = courseRes.recordset[0]?.CollegeCourseID;
          if (!collegeCourseId) {
            let defaultCourse = await new sql.Request(transaction).query('SELECT TOP 1 CourseID FROM dbo.Courses');
            let courseId = defaultCourse.recordset[0]?.CourseID;
            if (!courseId) {
              let insCourse = await new sql.Request(transaction).query("INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES ('General Course', 'GEN')");
              courseId = insCourse.recordset[0].CourseID;
            }
            let defaultBranch = await new sql.Request(transaction).query('SELECT TOP 1 BranchID FROM dbo.Branches');
            let branchId = defaultBranch.recordset[0]?.BranchID;
            if (!branchId) {
              let insBranch = await new sql.Request(transaction).input('cid', sql.Int, courseId).query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@cid, 'General Branch', 'GEN')");
              branchId = insBranch.recordset[0].BranchID;
            }
            let insCc = await new sql.Request(transaction)
              .input('cid', sql.Int, interestedCollegeId)
              .input('courseId', sql.Int, courseId)
              .input('branchId', sql.Int, branchId)
              .query("INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee) OUTPUT inserted.CollegeCourseID VALUES (@cid, @courseId, @branchId, 4.0, 60, 50000.00)");
            collegeCourseId = insCc.recordset[0].CollegeCourseID;
          }

          await new sql.Request(transaction)
            .input('sid', sql.Int, id)
            .input('ccid', sql.Int, collegeCourseId)
            .query(`
              INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
              VALUES (@sid, @ccid, 'Interested')
            `);
        }
      }

      await transaction.commit();
      await addActivity(`Admin updated student: ${name}`);
      return {
        StudentID: id,
        UserID: row.UserID,
        Name: name,
        Address: data.address ?? row.Address ?? '',
        Mobile: data.mobile ?? row.Mobile ?? '',
        Email: nextEmail,
        Gender: data.gender ?? row.Gender ?? '',
        DateOfBirth: dobVal,
        Education: data.education ?? row.Education ?? '',
        InterestedCollege: data.interestedCollege !== undefined ? String(data.interestedCollege) : '',
        ProfileVisible: false
      };
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async deleteStudent(idRaw) {
    const pool = await getPool();
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id)) throw new ApiError('Student not found', 404);

    const cur = await pool.request().input('id', sql.Int, id).query(`
      SELECT s.UserID, (sp.FirstName + ' ' + sp.LastName) AS Name
      FROM Students s
      LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
      WHERE s.StudentID = @id
    `);
    const row = cur.recordset[0];
    if (!row) throw new ApiError('Student not found', 404);

    await pool.request().input('sid', sql.Int, id).query('DELETE FROM dbo.Applications WHERE StudentID = @sid');
    await pool.request().input('sid', sql.Int, id).query('DELETE FROM Students WHERE StudentID = @sid');
    await pool.request().input('uid', sql.Int, row.UserID).query('DELETE FROM Users WHERE UserID = @uid');

    await addActivity(`Admin deleted student: ${row.Name || 'Student'}`);
    return { message: 'Student deleted successfully' };
  },

  async adminInterests() {
    const pool = await getPool();
    const rows = await pool.request().query(`
      SELECT sa.ApplicationID, sa.StudentID, cc.CollegeID, sa.CurrentStatus AS Status, 
             (CASE WHEN sa.CurrentStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedByAdmin, sa.CreatedAt AS AppCreatedAt,
             st.UserID AS StudentUserID, (sp.FirstName + ' ' + sp.LastName) AS StudentName, sp.AddressLine1 AS StudentAddress, sp.Mobile AS StudentMobile,
             sp.Email AS StudentEmail, sp.Gender AS StudentGender, sp.DateOfBirth AS StudentDOB, sad.Qualification AS StudentEducation,
             (SELECT TOP 1 cc2.CollegeID FROM dbo.Applications a2 INNER JOIN dbo.CollegeCourses cc2 ON cc2.CollegeCourseID = a2.CollegeCourseID WHERE a2.StudentID = st.StudentID ORDER BY a2.CreatedAt DESC) AS InterestedCollege,
             (CASE WHEN EXISTS (SELECT 1 FROM dbo.Applications a3 WHERE a3.StudentID = st.StudentID AND a3.CurrentStatus = 'Approved') THEN 1 ELSE 0 END) AS ProfileVisible,
             c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus, c.UserID AS CollegeUserId, c.CreatedAt AS CollegeCreatedAt
      FROM dbo.Applications sa
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID
      INNER JOIN dbo.Students st ON st.StudentID = sa.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      LEFT JOIN dbo.StudentAcademicDetails sad ON sad.StudentID = st.StudentID
      INNER JOIN dbo.Colleges c ON c.CollegeID = cc.CollegeID
      ORDER BY sa.CreatedAt DESC
    `);
    return rows.recordset.map((row) => {
      const student = mapAmsStudentRow({
        StudentID: row.StudentID,
        UserID: row.StudentUserID,
        Name: row.StudentName,
        Address: row.StudentAddress,
        Mobile: row.StudentMobile,
        Email: row.StudentEmail,
        Gender: row.StudentGender,
        DateOfBirth: row.StudentDOB,
        Education: row.StudentEducation,
        InterestedCollege: row.InterestedCollege,
        ProfileVisible: row.ProfileVisible,
      });
      const college = mapAmsCollegeRow({
        CollegeID: row.CollegeID,
        CollegeName: row.CollegeName,
        Email: row.CollegeEmail,
        UserID: row.CollegeUserId,
        Status: row.CollegeStatus,
        CreatedByAdminUserID: null,
        CreatedAt: row.CollegeCreatedAt,
      });
      const created = row.AppCreatedAt instanceof Date ? row.AppCreatedAt.toISOString() : row.AppCreatedAt;
      return {
        id: String(row.ApplicationID),
        studentId: String(row.StudentID),
        collegeId: String(row.CollegeID),
        status: row.Status,
        approvedByAdmin: !!row.ApprovedByAdmin,
        createdAt: created,
        student,
        college,
      };
    });
  },

  async createCollege(admin, data) {
    const pool = await getPool();
    const email = data.email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError('Email already registered', 409);

    const password = data.password || 'College@123';
    const collegeRoleId = await getRoleId(pool, 'college');

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const insUser = new sql.Request(transaction)
        .input('roleId', sql.Int, collegeRoleId)
        .input('email', sql.VarChar(255), email)
        .input('password', sql.NVarChar(255), await bcrypt.hash(password, 12))
        .input('fullName', sql.NVarChar(150), data.collegeName)
        .input('phone', sql.NVarChar(30), data.mobile || null)
        .input('isActive', sql.Bit, 1);
      const userOut = await insUser.query(`
        INSERT INTO Users (RoleID, Email, PasswordHash, FullName, Phone, IsActive)
        OUTPUT inserted.UserID
        VALUES (@roleId, @email, @password, @fullName, @phone, @isActive)
      `);
      const userId = userOut.recordset[0].UserID;

      const status = data.status || 'approved';
      const insCol = new sql.Request(transaction)
        .input('collegeName', sql.VarChar(150), data.collegeName)
        .input('email', sql.VarChar(255), email)
        .input('userId', sql.Int, userId)
        .input('status', sql.VarChar(20), status)
        .input('collegeAddress', sql.NVarChar(255), data.collegeAddress );
      const colOut = await insCol.query(`
        INSERT INTO Colleges (CollegeName, Email, UserID, Status, CollegeAddress)
        OUTPUT inserted.CollegeID, inserted.CollegeName, inserted.Email, inserted.UserID, inserted.Status, inserted.CreatedAt, inserted.CollegeAddress
        VALUES (@collegeName, @email, @userId, @status, @collegeAddress)
      `);
      const crow = colOut.recordset[0];
      await transaction.commit();

      await addActivity(`Admin created college account: ${crow.CollegeName}`);
      const college = mapAmsCollegeRow({
        CollegeID: crow.CollegeID,
        CollegeName: crow.CollegeName,
        Email: crow.Email,
        UserID: crow.UserID,
        Status: crow.Status,
        CreatedByAdminUserID: null,
        CreatedAt: crow.CreatedAt,
      });
      return { college, temporaryPassword: password };
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async updateCollege(idRaw, data) {
    const pool = await getPool();
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id)) throw new ApiError('College not found', 404);

    const cur = await pool.request().input('id', sql.Int, id).query('SELECT * FROM Colleges WHERE CollegeID = @id');
    const row = cur.recordset[0];
    if (!row) throw new ApiError('College not found', 404);

    const nextEmail = data.email !== undefined ? data.email.trim().toLowerCase() : row.Email;
    if (nextEmail.toLowerCase() !== String(row.Email).toLowerCase()) {
      const duplicate = await pool
        .request()
        .input('email', sql.VarChar(255), nextEmail)
        .input('userId', sql.Int, row.UserID)
        .query('SELECT UserID FROM Users WHERE LOWER(Email) = LOWER(@email) AND UserID <> @userId');
      if (duplicate.recordset[0]) throw new ApiError('Email already registered', 409);
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const collegeReq = new sql.Request(transaction)
        .input('id', sql.Int, id)
        .input('collegeName', sql.VarChar(150), data.collegeName ?? row.CollegeName)
        .input('email', sql.VarChar(255), nextEmail)
        .input('status', sql.VarChar(20), data.status ?? row.Status);
      await collegeReq.query(`
        UPDATE Colleges
        SET CollegeName = @collegeName, Email = @email, Status = @status
        WHERE CollegeID = @id
      `);

      const userReq = new sql.Request(transaction)
        .input('uid', sql.Int, row.UserID)
        .input('fullName', sql.NVarChar(150), data.collegeName ?? row.CollegeName)
        .input('email', sql.VarChar(255), nextEmail);
      let userSql = 'UPDATE Users SET FullName = @fullName, Email = @email';
      if (data.password) {
        userReq.input('password', sql.NVarChar(255), await bcrypt.hash(data.password, 12));
        userSql += ', PasswordHash = @password';
      }
      userSql += ' WHERE UserID = @uid';
      await userReq.query(userSql);

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    await addActivity(`College updated: ${data.collegeName ?? row.CollegeName}`);
    const after = await pool.request().input('id', sql.Int, id).query('SELECT * FROM Colleges WHERE CollegeID = @id');
    return mapAmsCollegeRow(after.recordset[0]);
  },

  async deleteCollege(idRaw) {
    const pool = await getPool();
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id)) throw new ApiError('College not found', 404);

    const cur = await pool.request().input('id', sql.Int, id).query('SELECT * FROM Colleges WHERE CollegeID = @id');
    const row = cur.recordset[0];
    if (!row) throw new ApiError('College not found', 404);

    const uid = row.UserID;
    const name = row.CollegeName;

    await pool.request().input('cid', sql.Int, id).query('DELETE FROM dbo.Applications WHERE CollegeCourseID IN (SELECT CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid)');
    await pool.request().input('cid', sql.Int, id).query('DELETE FROM Colleges WHERE CollegeID = @cid');
    await pool.request().input('uid', sql.Int, uid).query('DELETE FROM Users WHERE UserID = @uid');

    await addActivity(`College deleted: ${name}`);
    return { message: 'College deleted successfully' };
  },

  async setInterestPermission(idRaw, approvedByAdmin, changedByUserId) {
    const pool = await getPool();
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id)) throw new ApiError('Interest request not found', 404);

    const cur = await pool.request().input('id', sql.Int, id).query(`
      SELECT sa.ApplicationID, sa.StudentID, cc.CollegeID, sa.CurrentStatus AS Status,
             (CASE WHEN sa.CurrentStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedByAdmin, sa.CreatedAt,
             c.CollegeName, crs.CourseName, br.BranchName
      FROM dbo.Applications sa
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID
      INNER JOIN dbo.Colleges c ON c.CollegeID = cc.CollegeID
      INNER JOIN dbo.Courses crs ON crs.CourseID = cc.CourseID
      INNER JOIN dbo.Branches br ON br.BranchID = cc.BranchID
      WHERE sa.ApplicationID = @id
    `);
    const row = cur.recordset[0];
    if (!row) throw new ApiError('Interest request not found', 404);

    const appr = !!approvedByAdmin;
    const status = appr ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('st', sql.VarChar(50), status)
      .query('UPDATE dbo.Applications SET CurrentStatus = @st, UpdatedAt = SYSUTCDATETIME() WHERE ApplicationID = @id');

    if (changedByUserId) {
      await pool.request()
        .input('appId', sql.Int, id)
        .input('status', sql.NVarChar(50), status)
        .input('remarks', sql.NVarChar(1000), appr ? 'Approved by admin' : 'Rejected by admin')
        .input('userId', sql.Int, changedByUserId)
        .query('INSERT INTO dbo.ApplicationStatusHistory (ApplicationID, Status, Remarks, ChangedByUserID) VALUES (@appId, @status, @remarks, @userId)');
    }

    await addActivity(
      `${appr ? 'Granted' : 'Revoked'} student profile access for ${row.CollegeName}`
    );

    const after = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT sa.ApplicationID, sa.StudentID, cc.CollegeID, sa.CurrentStatus AS Status,
               (CASE WHEN sa.CurrentStatus = 'Approved' THEN 1 ELSE 0 END) AS ApprovedByAdmin, sa.CreatedAt,
               c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus, c.UserID AS CollegeUserId, c.CreatedAt AS CollegeCreatedAt,
               crs.CourseName, br.BranchName
        FROM dbo.Applications sa
        INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID
        INNER JOIN dbo.Colleges c ON c.CollegeID = cc.CollegeID
        INNER JOIN dbo.Courses crs ON crs.CourseID = cc.CourseID
        INNER JOIN dbo.Branches br ON br.BranchID = cc.BranchID
        WHERE sa.ApplicationID = @id
      `);
    const r = after.recordset[0];
    return interestDto(r, {
      CollegeID: r.CollegeID,
      CollegeName: r.CollegeName,
      Email: r.CollegeEmail,
      Status: r.CollegeStatus,
      CreatedByAdminUserID: null,
      CreatedAt: r.CollegeCreatedAt
    });
  },

  async listAllCourses() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT CourseID, CourseName, CourseCode FROM dbo.Courses WHERE IsActive = 1 ORDER BY CourseName');
    return result.recordset;
  },

  async listAllBranches() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT BranchID, CourseID, BranchName, BranchCode FROM dbo.Branches WHERE IsActive = 1 ORDER BY BranchName');
    return result.recordset;
  },
};

module.exports = amsSqlService;
