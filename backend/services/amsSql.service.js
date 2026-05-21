const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/userStore');
const { mapAmsStudentRow, mapAmsCollegeRow } = require('../utils/mappers');
const AmsActivity = require('../models/AmsActivity.model');

async function getRoleId(pool, roleName) {
  const r = await pool
    .request()
    .input('roleName', sql.VarChar(50), roleName)
    .query('SELECT RoleID FROM Roles WHERE RoleName = @roleName');
  if (!r.recordset[0]) throw new ApiError(`Missing role in AMS.Roles: ${roleName}`, 500);
  return r.recordset[0].RoleID;
}

async function addActivity(message) {
  await AmsActivity.add(message);
}

function visibleCollege(row) {
  if (!row) return { id: '', collegeName: '', email: '', status: '', createdByAdmin: null };
  return {
    id: String(row.CollegeID),
    collegeName: row.CollegeName,
    email: row.Email,
    status: row.Status,
    createdByAdmin: row.CreatedByAdminUserID != null ? String(row.CreatedByAdminUserID) : null,
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
      SELECT c.CollegeID, c.CollegeName, c.Email, c.Status, c.CreatedByAdminUserID, c.UserID, c.CreatedAt
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
      .query('SELECT * FROM Students WHERE UserID = @userId');
    const studentRow = stud.recordset[0];
    if (!studentRow) throw new ApiError('Student profile not found', 404);

    const col = await pool
      .request()
      .input('collegeId', sql.Int, collegeId)
      .query("SELECT * FROM Colleges WHERE CollegeID = @collegeId AND Status = 'approved'");
    const collegeRow = col.recordset[0];
    if (!collegeRow) throw new ApiError('College not found or not approved', 404);

    const exists = await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .input('cid', sql.Int, collegeId)
      .query('SELECT ApplicationID FROM StudentApplications WHERE StudentID = @sid AND CollegeID = @cid');
    if (exists.recordset[0]) return this.getStudentDashboard(user);

    await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .input('cid', sql.Int, collegeId)
      .query(`
        INSERT INTO StudentApplications (StudentID, CollegeID, Status, ApprovedByAdmin)
        VALUES (@sid, @cid, 'Interested', 0)
      `);

    await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .input('ic', sql.NVarChar(200), collegeRow.CollegeName)
      .query('UPDATE Students SET InterestedCollege = @ic WHERE StudentID = @sid');

    await addActivity(`${studentRow.Name} marked interest in ${collegeRow.CollegeName}`);
    return this.getStudentDashboard(user);
  },

  async getStudentDashboard(user) {
    const pool = await getPool();
    const stud = await pool
      .request()
      .input('userId', sql.Int, user.id)
      .query('SELECT * FROM Students WHERE UserID = @userId');
    const studentRow = stud.recordset[0];
    if (!studentRow) throw new ApiError('Student profile not found', 404);
    const student = mapAmsStudentRow(studentRow);

    const apps = await pool
      .request()
      .input('sid', sql.Int, studentRow.StudentID)
      .query(`
        SELECT sa.ApplicationID, sa.StudentID, sa.CollegeID, sa.Status, sa.ApprovedByAdmin, sa.CreatedAt,
               c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus, c.CreatedByAdminUserID
        FROM StudentApplications sa
        INNER JOIN Colleges c ON c.CollegeID = sa.CollegeID
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
        },
        {
          CollegeID: row.CollegeID,
          CollegeName: row.CollegeName,
          Email: row.CollegeEmail,
          Status: row.CollegeStatus,
          CreatedByAdminUserID: row.CreatedByAdminUserID,
        }
      )
    );

    const approvedColleges = await pool.request().query("SELECT COUNT(*) AS n FROM Colleges WHERE Status = 'approved'");
    const granted = interests.filter((i) => i.approvedByAdmin).length;

    return {
      student,
      stats: {
        registeredColleges: approvedColleges.recordset[0].n,
        appliedColleges: interests.length,
        approvedAccess: granted,
      },
      interests,
    };
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
        SELECT sa.ApplicationID, sa.StudentID, sa.CollegeID, sa.Status, sa.ApprovedByAdmin, sa.CreatedAt,
               st.Name, st.Address, st.Mobile, st.Email, st.Gender, st.DateOfBirth, st.Education,
               st.StudentID AS StuId, st.UserID AS StuUserID
        FROM StudentApplications sa
        INNER JOIN Students st ON st.StudentID = sa.StudentID
        WHERE sa.CollegeID = @cid
        ORDER BY sa.CreatedAt DESC
      `);

    const interests = apps.recordset;
    return {
      college: visibleCollege(collegeRow),
      stats: {
        interestedStudents: interests.length,
        grantedProfiles: interests.filter((r) => r.ApprovedByAdmin).length,
        hiddenProfiles: interests.filter((r) => !r.ApprovedByAdmin).length,
      },
      students: interests.map((row) => {
        const student = mapAmsStudentRow({
          StudentID: row.StuId,
          UserID: row.StuUserID,
          Name: row.Name,
          Address: row.Address,
          Mobile: row.Mobile,
          Email: row.Email,
          Gender: row.Gender,
          DateOfBirth: row.DateOfBirth,
          Education: row.Education,
        });
        const interestLike = {
          approvedByAdmin: !!row.ApprovedByAdmin,
          createdAt: row.CreatedAt instanceof Date ? row.CreatedAt.toISOString() : row.CreatedAt,
        };
        return row.ApprovedByAdmin ? fullStudent(student, interestLike) : publicStudent(student, interestLike);
      }),
    };
  },

  async adminDashboard() {
    const pool = await getPool();
    const [students, colleges, apps, pending, logs] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS n FROM Students'),
      pool.request().query('SELECT COUNT(*) AS n FROM Colleges'),
      pool.request().query('SELECT COUNT(*) AS n FROM StudentApplications'),
      pool.request().query('SELECT COUNT(*) AS n FROM StudentApplications WHERE ApprovedByAdmin = 0'),
      pool.request().query(`
        SELECT TOP 20 LogID AS id, Message AS message, CreatedAt AS createdAt
        FROM ActivityLogs ORDER BY CreatedAt DESC
      `),
    ]);
    return {
      totalStudents: students.recordset[0].n,
      totalColleges: colleges.recordset[0].n,
      interestedStudentsCount: apps.recordset[0].n,
      permissionRequests: pending.recordset[0].n,
      recentActivities: logs.recordset.map((r) => ({
        id: String(r.id),
        message: r.message,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      })),
    };
  },

  async adminStudents() {
    const pool = await getPool();
    const studs = await pool.request().query('SELECT * FROM Students ORDER BY Name');
    const apps = await pool.request().query(`
      SELECT sa.ApplicationID, sa.StudentID, sa.CollegeID, sa.Status, sa.ApprovedByAdmin, sa.CreatedAt,
             c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus, c.CreatedByAdminUserID
      FROM StudentApplications sa
      INNER JOIN Colleges c ON c.CollegeID = sa.CollegeID
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
            CreatedByAdminUserID: row.CreatedByAdminUserID,
          }
        )
      );
      return { ...student, interests };
    });
  },

  async adminInterests() {
    const pool = await getPool();
    const rows = await pool.request().query(`
      SELECT sa.ApplicationID, sa.StudentID, sa.CollegeID, sa.Status, sa.ApprovedByAdmin, sa.CreatedAt AS AppCreatedAt,
             st.UserID AS StudentUserID, st.Name AS StudentName, st.Address AS StudentAddress, st.Mobile AS StudentMobile,
             st.Email AS StudentEmail, st.Gender AS StudentGender, st.DateOfBirth AS StudentDOB, st.Education AS StudentEducation,
             st.InterestedCollege, st.ProfileVisible,
             c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus, c.CreatedByAdminUserID, c.UserID AS CollegeUserId, c.CreatedAt AS CollegeCreatedAt
      FROM StudentApplications sa
      INNER JOIN Students st ON st.StudentID = sa.StudentID
      INNER JOIN Colleges c ON c.CollegeID = sa.CollegeID
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
        CreatedByAdminUserID: row.CreatedByAdminUserID,
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
    const adminUserId = parseInt(String(admin.id), 10);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const insUser = new sql.Request(transaction)
        .input('roleId', sql.Int, collegeRoleId)
        .input('email', sql.VarChar(255), email)
        .input('password', sql.NVarChar(255), await bcrypt.hash(password, 12))
        .input('fullName', sql.NVarChar(150), data.collegeName)
        .input('phone', sql.NVarChar(30), data.mobile || null)
        .input('isApproved', sql.Bit, 1);
      const userOut = await insUser.query(`
        INSERT INTO Users (RoleID, Email, Password, FullName, Phone, IsApproved)
        OUTPUT inserted.UserID
        VALUES (@roleId, @email, @password, @fullName, @phone, @isApproved)
      `);
      const userId = userOut.recordset[0].UserID;

      const status = data.status || 'approved';
      const insCol = new sql.Request(transaction)
        .input('collegeName', sql.VarChar(150), data.collegeName)
        .input('email', sql.VarChar(255), email)
        .input('userId', sql.Int, userId)
        .input('status', sql.VarChar(20), status)
        .input('createdBy', sql.Int, adminUserId);
      const colOut = await insCol.query(`
        INSERT INTO Colleges (CollegeName, Email, UserID, Status, CreatedByAdminUserID)
        OUTPUT inserted.CollegeID, inserted.CollegeName, inserted.Email, inserted.UserID, inserted.Status, inserted.CreatedByAdminUserID, inserted.CreatedAt
        VALUES (@collegeName, @email, @userId, @status, @createdBy)
      `);
      await transaction.commit();

      const crow = colOut.recordset[0];
      await addActivity(`Admin created college account: ${crow.CollegeName}`);
      const college = mapAmsCollegeRow({
        CollegeID: crow.CollegeID,
        CollegeName: crow.CollegeName,
        Email: crow.Email,
        UserID: crow.UserID,
        Status: crow.Status,
        CreatedByAdminUserID: crow.CreatedByAdminUserID,
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

    if (data.collegeName !== undefined) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('cn', sql.VarChar(150), data.collegeName)
        .query('UPDATE Colleges SET CollegeName = @cn WHERE CollegeID = @id');
      await pool
        .request()
        .input('uid', sql.Int, row.UserID)
        .input('fn', sql.NVarChar(150), data.collegeName)
        .query('UPDATE Users SET FullName = @fn WHERE UserID = @uid');
    }
    if (data.status !== undefined) {
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('st', sql.VarChar(20), data.status)
        .query('UPDATE Colleges SET Status = @st WHERE CollegeID = @id');
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

    await pool.request().input('cid', sql.Int, id).query('DELETE FROM StudentApplications WHERE CollegeID = @cid');
    await pool.request().input('cid', sql.Int, id).query('DELETE FROM Colleges WHERE CollegeID = @cid');
    await pool.request().input('uid', sql.Int, uid).query('DELETE FROM Users WHERE UserID = @uid');

    await addActivity(`College deleted: ${name}`);
    return { message: 'College deleted successfully' };
  },

  async setInterestPermission(idRaw, approvedByAdmin) {
    const pool = await getPool();
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id)) throw new ApiError('Interest request not found', 404);

    const cur = await pool.request().input('id', sql.Int, id).query(`
      SELECT sa.*, c.CollegeName
      FROM StudentApplications sa
      INNER JOIN Colleges c ON c.CollegeID = sa.CollegeID
      WHERE sa.ApplicationID = @id
    `);
    const row = cur.recordset[0];
    if (!row) throw new ApiError('Interest request not found', 404);

    const appr = !!approvedByAdmin;
    const status = appr ? 'Approved' : 'Interested';
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('ap', sql.Bit, appr ? 1 : 0)
      .input('st', sql.VarChar(30), status)
      .query('UPDATE StudentApplications SET ApprovedByAdmin = @ap, Status = @st WHERE ApplicationID = @id');

    await addActivity(
      `${appr ? 'Granted' : 'Revoked'} student profile access for ${row.CollegeName}`
    );

    const after = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT sa.ApplicationID, sa.StudentID, sa.CollegeID, sa.Status, sa.ApprovedByAdmin, sa.CreatedAt,
               c.CollegeName, c.Email AS CollegeEmail, c.Status AS CollegeStatus, c.CreatedByAdminUserID
        FROM StudentApplications sa
        INNER JOIN Colleges c ON c.CollegeID = sa.CollegeID
        WHERE sa.ApplicationID = @id
      `);
    const r = after.recordset[0];
    return interestDto(r, {
      CollegeID: r.CollegeID,
      CollegeName: r.CollegeName,
      Email: r.CollegeEmail,
      Status: r.CollegeStatus,
      CreatedByAdminUserID: r.CreatedByAdminUserID,
    });
  },
};

module.exports = amsSqlService;
