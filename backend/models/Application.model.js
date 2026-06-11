const { sql, getPool } = require('../config/database');
const { ApplicationStatus } = require('../config/constants');

function mapStatus(status) {
  if (!status) return null;
  const s = String(status).trim().toLowerCase();
  if (s === 'pending' || s === 'submitted') return ApplicationStatus.SUBMITTED;
  if (s === 'under_review' || s === 'under review') return ApplicationStatus.UNDER_REVIEW;
  if (s === 'approved') return ApplicationStatus.APPROVED;
  if (s === 'rejected') return ApplicationStatus.REJECTED;
  return status;
}

const ApplicationModel = {
  async findById(id) {
    const pool = await getPool();
    const appId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (Number.isNaN(appId)) return null;

    const result = await pool.request().input('id', sql.Int, appId).query(`
      SELECT 
        a.ApplicationID AS id,
        a.StudentID AS student_id,
        cc.CollegeCourseID AS college_course_id,
        a.CurrentStatus AS status,
        a.Remarks AS remarks,
        a.CreatedAt AS applied_date,
        a.CreatedAt AS created_at,
        a.UpdatedAt AS updated_at,
        col.CollegeName AS school_name,
        col.CollegeID AS school_id,
        col.Email AS school_email,
        col.City AS school_city,
        c.CourseName AS course_name,
        b.BranchName AS branch_name,
        cc.AnnualFee AS fees,
        st.UserID AS user_id,
        (sp.FirstName + ' ' + sp.LastName) AS student_name,
        sp.Email AS student_email,
        sp.Mobile AS student_phone,
        sp.FatherName AS parent_name,
        sp.AddressLine1 AS student_address,
        sp.Gender AS gender,
        sp.DateOfBirth AS dob
      FROM dbo.Applications a
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID
      INNER JOIN dbo.Colleges col ON col.CollegeID = cc.CollegeID
      INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
      INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
      INNER JOIN dbo.Students st ON st.StudentID = a.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      WHERE a.ApplicationID = @id
    `);
    return result.recordset[0] || null;
  },

  async create({ studentId, collegeCourseId, status = 'pending', changedByUserId }) {
    const pool = await getPool();
    const sId = typeof studentId === 'number' ? studentId : parseInt(String(studentId), 10);
    const ccId = typeof collegeCourseId === 'number' ? collegeCourseId : parseInt(String(collegeCourseId), 10);

    const ins = await pool
      .request()
      .input('student_id', sql.Int, sId)
      .input('ccid', sql.Int, ccId)
      .input('status', sql.NVarChar(50), mapStatus(status))
      .query(`
        INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
        OUTPUT inserted.ApplicationID
        VALUES (@student_id, @ccid, @status)
      `);
    const appId = ins.recordset[0].ApplicationID;

    // Resolve changedByUserId if not passed
    let userId = changedByUserId;
    if (!userId) {
      const userRes = await pool.request().input('sid', sql.Int, sId).query('SELECT UserID FROM dbo.Students WHERE StudentID = @sid');
      userId = userRes.recordset[0]?.UserID;
    }

    if (userId) {
      await pool.request()
        .input('appId', sql.Int, appId)
        .input('status', sql.NVarChar(50), mapStatus(status))
        .input('remarks', sql.NVarChar(1000), 'Application submitted')
        .input('userId', sql.Int, userId)
        .query('INSERT INTO dbo.ApplicationStatusHistory (ApplicationID, Status, Remarks, ChangedByUserID) VALUES (@appId, @status, @remarks, @userId)');
    }

    return this.findById(appId);
  },

  async updateStatus(id, { status, remarks, changedByUserId }) {
    const pool = await getPool();
    const appId = typeof id === 'number' ? id : parseInt(String(id), 10);
    await pool
      .request()
      .input('id', sql.Int, appId)
      .input('status', sql.NVarChar(50), mapStatus(status))
      .input('remarks', sql.NVarChar(sql.MAX), remarks || null)
      .query('UPDATE dbo.Applications SET CurrentStatus = @status, Remarks = @remarks, UpdatedAt = SYSUTCDATETIME() WHERE ApplicationID = @id');
    
    // Resolve changedByUserId if not passed
    let userId = changedByUserId;
    if (!userId) {
      const appCheck = await pool.request().input('appId', sql.Int, appId).query('SELECT StudentID FROM dbo.Applications WHERE ApplicationID = @appId');
      const studentId = appCheck.recordset[0]?.StudentID;
      if (studentId) {
        const userRes = await pool.request().input('sid', sql.Int, studentId).query('SELECT UserID FROM dbo.Students WHERE StudentID = @sid');
        userId = userRes.recordset[0]?.UserID;
      }
    }

    if (userId) {
      await pool.request()
        .input('appId', sql.Int, appId)
        .input('status', sql.NVarChar(50), mapStatus(status))
        .input('remarks', sql.NVarChar(1000), remarks || null)
        .input('userId', sql.Int, userId)
        .query('INSERT INTO dbo.ApplicationStatusHistory (ApplicationID, Status, Remarks, ChangedByUserID) VALUES (@appId, @status, @remarks, @userId)');
    }

    return this.findById(appId);
  },

  async list({ studentId, schoolId, status, search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    const conditions = ['1=1'];
    const request = pool.request().input('offset', sql.Int, offset).input('limit', sql.Int, limit);

    if (studentId) {
      const sId = typeof studentId === 'number' ? studentId : parseInt(String(studentId), 10);
      conditions.push('a.StudentID = @student_id');
      request.input('student_id', sql.Int, sId);
    }
    if (schoolId) {
      const colId = typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10);
      conditions.push('cc.CollegeID = @school_id');
      request.input('school_id', sql.Int, colId);
    }
    if (status) {
      conditions.push('a.CurrentStatus = @status');
      request.input('status', sql.NVarChar(50), mapStatus(status));
    }
    if (search) {
      conditions.push('(col.CollegeName LIKE @search OR c.CourseName LIKE @search OR (sp.FirstName + \' \' + sp.LastName) LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${search}%`);
    }

    const where = conditions.join(' AND ');
    const data = await request.query(`
      SELECT 
        a.ApplicationID AS id,
        a.StudentID AS student_id,
        cc.CollegeCourseID AS college_course_id,
        a.CurrentStatus AS status,
        a.Remarks AS remarks,
        a.CreatedAt AS applied_date,
        a.CreatedAt AS created_at,
        a.UpdatedAt AS updated_at,
        col.CollegeName AS school_name,
        col.CollegeID AS school_id,
        col.City AS school_city,
        c.CourseName AS course_name,
        b.BranchName AS branch_name,
        (sp.FirstName + ' ' + sp.LastName) AS student_name,
        sp.Email AS student_email
      FROM dbo.Applications a
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID
      INNER JOIN dbo.Colleges col ON col.CollegeID = cc.CollegeID
      INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
      INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
      INNER JOIN dbo.Students st ON st.StudentID = a.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      WHERE ${where}
      ORDER BY a.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countReq = pool.request();
    if (studentId) countReq.input('student_id', sql.Int, typeof studentId === 'number' ? studentId : parseInt(String(studentId), 10));
    if (schoolId) countReq.input('school_id', sql.Int, typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10));
    if (status) countReq.input('status', sql.NVarChar(50), mapStatus(status));
    if (search) countReq.input('search', sql.NVarChar(255), `%${search}%`);

    const count = await countReq.query(`
      SELECT COUNT(*) AS total 
      FROM dbo.Applications a
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID
      INNER JOIN dbo.Colleges col ON col.CollegeID = cc.CollegeID
      INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
      INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
      INNER JOIN dbo.Students st ON st.StudentID = a.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      WHERE ${where}
    `);

    return { rows: data.recordset, total: count.recordset[0].total };
  },

  async getStatusHistory(applicationId) {
    const pool = await getPool();
    const appId = typeof applicationId === 'number' ? applicationId : parseInt(String(applicationId), 10);
    const result = await pool.request().input('appId', sql.Int, appId).query(`
      SELECT Status AS status, Remarks AS remarks, CreatedAt AS createdAt
      FROM dbo.ApplicationStatusHistory
      WHERE ApplicationID = @appId
      ORDER BY CreatedAt ASC
    `);
    return result.recordset;
  },

  async countByStatus(status) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('status', sql.NVarChar(50), mapStatus(status))
      .query('SELECT COUNT(*) AS total FROM dbo.Applications WHERE CurrentStatus = @status');
    return result.recordset[0].total;
  },

  async count() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.Applications');
    return result.recordset[0].total;
  },

  async countByStatusGrouped() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT CurrentStatus AS status, COUNT(*) AS count FROM dbo.Applications GROUP BY CurrentStatus
    `);
    return result.recordset;
  },

  async recent(limit = 5) {
    const pool = await getPool();
    const result = await pool.request().input('limit', sql.Int, limit).query(`
      SELECT TOP (@limit) 
        a.ApplicationID AS id,
        col.CollegeName AS school_name,
        (sp.FirstName + ' ' + sp.LastName) AS student_name,
        a.CreatedAt AS applied_date,
        a.CurrentStatus AS status
      FROM dbo.Applications a
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID
      INNER JOIN dbo.Colleges col ON col.CollegeID = cc.CollegeID
      INNER JOIN dbo.Students st ON st.StudentID = a.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      ORDER BY a.CreatedAt DESC
    `);
    return result.recordset;
  },
};

module.exports = ApplicationModel;
