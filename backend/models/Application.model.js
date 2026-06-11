const { sql, getPool } = require('../config/database');

function mapStatus(status) {
  if (!status) return null;
  const s = String(status).trim().toLowerCase();
  if (s === 'pending' || s === 'submitted') return 'Submitted';
  if (s === 'under_review' || s === 'under review') return 'Under Review';
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
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
        c.CourseName AS course_name,
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
      INNER JOIN dbo.Students st ON st.StudentID = a.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      WHERE a.ApplicationID = @id
    `);
    return result.recordset[0] || null;
  },

  async create({ studentId, schoolId, courseId, status = 'pending' }) {
    const pool = await getPool();
    const sId = typeof studentId === 'number' ? studentId : parseInt(String(studentId), 10);
    const colId = typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10);
    const cId = typeof courseId === 'number' ? courseId : parseInt(String(courseId), 10);

    // Find or create CollegeCourseID
    const resolved = await pool.request()
      .input('cid', sql.Int, colId)
      .input('courseId', sql.Int, cId)
      .query('SELECT CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid AND CourseID = @courseId');
    let collegeCourseId = resolved.recordset[0]?.CollegeCourseID;
    if (!collegeCourseId) {
      let defaultBranch = await pool.request().query('SELECT TOP 1 BranchID FROM dbo.Branches');
      let branchId = defaultBranch.recordset[0]?.BranchID;
      if (!branchId) {
        let insBranch = await pool.request().input('cid', sql.Int, cId).query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@cid, 'General Branch', 'GEN')");
        branchId = insBranch.recordset[0].BranchID;
      }
      let insCc = await pool.request()
        .input('cid', sql.Int, colId)
        .input('courseId', sql.Int, cId)
        .input('branchId', sql.Int, branchId)
        .query("INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee) OUTPUT inserted.CollegeCourseID VALUES (@cid, @courseId, @branchId, 4.0, 60, 50000.00)");
      collegeCourseId = insCc.recordset[0].CollegeCourseID;
    }

    const ins = await pool
      .request()
      .input('student_id', sql.Int, sId)
      .input('ccid', sql.Int, collegeCourseId)
      .input('status', sql.NVarChar(50), mapStatus(status))
      .query(`
        INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
        OUTPUT inserted.ApplicationID
        VALUES (@student_id, @ccid, @status)
      `);
    const appId = ins.recordset[0].ApplicationID;
    return this.findById(appId);
  },

  async updateStatus(id, { status, remarks }) {
    const pool = await getPool();
    const appId = typeof id === 'number' ? id : parseInt(String(id), 10);
    await pool
      .request()
      .input('id', sql.Int, appId)
      .input('status', sql.NVarChar(50), mapStatus(status))
      .input('remarks', sql.NVarChar(sql.MAX), remarks || null)
      .query('UPDATE dbo.Applications SET CurrentStatus = @status, Remarks = @remarks, UpdatedAt = SYSUTCDATETIME() WHERE ApplicationID = @id');
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
        c.CourseName AS course_name,
        (sp.FirstName + ' ' + sp.LastName) AS student_name,
        sp.Email AS student_email
      FROM dbo.Applications a
      INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID
      INNER JOIN dbo.Colleges col ON col.CollegeID = cc.CollegeID
      INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
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
      INNER JOIN dbo.Students st ON st.StudentID = a.StudentID
      LEFT JOIN dbo.StudentProfiles sp ON sp.StudentID = st.StudentID
      WHERE ${where}
    `);

    return { rows: data.recordset, total: count.recordset[0].total };
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
