const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');
const { useAmsSql } = require('../config/env');

const ApplicationModel = {
  async findById(id) {
    const pool = await getPool();
    if (useAmsSql) {
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
    }

    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
      SELECT a.*,
        s.school_name, s.city AS school_city,
        c.course_name, c.fees,
        st.user_id, u.name AS student_name, u.email AS student_email, u.phone AS student_phone,
        st.parent_name, st.address AS student_address, st.gender, st.dob
      FROM Applications a
      INNER JOIN Schools s ON s.id = a.school_id
      INNER JOIN Courses c ON c.id = a.course_id
      INNER JOIN Students st ON st.id = a.student_id
      INNER JOIN Users u ON u.id = st.user_id
      WHERE a.id = @id
    `);
    return result.recordset[0] || null;
  },

  async create({ studentId, schoolId, courseId, status = 'pending' }) {
    const pool = await getPool();
    if (useAmsSql) {
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
        .input('status', sql.NVarChar(50), status)
        .query(`
          INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
          OUTPUT inserted.ApplicationID
          VALUES (@student_id, @ccid, @status)
        `);
      const appId = ins.recordset[0].ApplicationID;
      return this.findById(appId);
    }

    const id = uuidv4();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('student_id', sql.UniqueIdentifier, studentId)
      .input('school_id', sql.UniqueIdentifier, schoolId)
      .input('course_id', sql.UniqueIdentifier, courseId)
      .input('status', sql.NVarChar(50), status)
      .query(`
        INSERT INTO Applications (id, student_id, school_id, course_id, status)
        VALUES (@id, @student_id, @school_id, @course_id, @status)
      `);
    return this.findById(id);
  },

  async updateStatus(id, { status, remarks }) {
    const pool = await getPool();
    if (useAmsSql) {
      const appId = typeof id === 'number' ? id : parseInt(String(id), 10);
      await pool
        .request()
        .input('id', sql.Int, appId)
        .input('status', sql.NVarChar(50), status)
        .input('remarks', sql.NVarChar(sql.MAX), remarks || null)
        .query('UPDATE dbo.Applications SET CurrentStatus = @status, Remarks = @remarks, UpdatedAt = SYSUTCDATETIME() WHERE ApplicationID = @id');
      return this.findById(appId);
    }

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('status', sql.NVarChar(50), status)
      .input('remarks', sql.NVarChar(sql.MAX), remarks || null)
      .query('UPDATE Applications SET status = @status, remarks = @remarks WHERE id = @id');
    return this.findById(id);
  },

  async list({ studentId, schoolId, status, search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    if (useAmsSql) {
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
        request.input('status', sql.NVarChar(50), status);
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
      if (status) countReq.input('status', sql.NVarChar(50), status);
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
    }

    const conditions = ['1=1'];
    const request = pool.request().input('offset', sql.Int, offset).input('limit', sql.Int, limit);

    if (studentId) {
      conditions.push('a.student_id = @student_id');
      request.input('student_id', sql.UniqueIdentifier, studentId);
    }
    if (schoolId) {
      conditions.push('a.school_id = @school_id');
      request.input('school_id', sql.UniqueIdentifier, schoolId);
    }
    if (status) {
      conditions.push('a.status = @status');
      request.input('status', sql.NVarChar(50), status);
    }
    if (search) {
      conditions.push('(s.school_name LIKE @search OR c.course_name LIKE @search OR u.name LIKE @search)');
      request.input('search', sql.NVarChar(255), `%${search}%`);
    }

    const where = conditions.join(' AND ');
    const data = await request.query(`
      SELECT a.*, s.school_name, c.course_name, u.name AS student_name, u.email AS student_email
      FROM Applications a
      INNER JOIN Schools s ON s.id = a.school_id
      INNER JOIN Courses c ON c.id = a.course_id
      INNER JOIN Students st ON st.id = a.student_id
      INNER JOIN Users u ON u.id = st.user_id
      WHERE ${where}
      ORDER BY a.applied_date DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countReq = pool.request();
    if (studentId) countReq.input('student_id', sql.UniqueIdentifier, studentId);
    if (schoolId) countReq.input('school_id', sql.UniqueIdentifier, schoolId);
    if (status) countReq.input('status', sql.NVarChar(50), status);
    if (search) countReq.input('search', sql.NVarChar(255), `%${search}%`);

    const count = await countReq.query(`
      SELECT COUNT(*) AS total FROM Applications a
      INNER JOIN Schools s ON s.id = a.school_id
      INNER JOIN Courses c ON c.id = a.course_id
      INNER JOIN Students st ON st.id = a.student_id
      INNER JOIN Users u ON u.id = st.user_id
      WHERE ${where}
    `);

    return { rows: data.recordset, total: count.recordset[0].total };
  },

  async countByStatus(status) {
    const pool = await getPool();
    if (useAmsSql) {
      const result = await pool
        .request()
        .input('status', sql.NVarChar(50), status)
        .query('SELECT COUNT(*) AS total FROM dbo.Applications WHERE CurrentStatus = @status');
      return result.recordset[0].total;
    }

    const result = await pool
      .request()
      .input('status', sql.NVarChar(50), status)
      .query('SELECT COUNT(*) AS total FROM Applications WHERE status = @status');
    return result.recordset[0].total;
  },

  async count() {
    const pool = await getPool();
    if (useAmsSql) {
      const result = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.Applications');
      return result.recordset[0].total;
    }

    const result = await pool.request().query('SELECT COUNT(*) AS total FROM Applications');
    return result.recordset[0].total;
  },

  async countByStatusGrouped() {
    const pool = await getPool();
    if (useAmsSql) {
      const result = await pool.request().query(`
        SELECT CurrentStatus AS status, COUNT(*) AS count FROM dbo.Applications GROUP BY CurrentStatus
      `);
      return result.recordset;
    }

    const result = await pool.request().query(`
      SELECT status, COUNT(*) AS count FROM Applications GROUP BY status
    `);
    return result.recordset;
  },

  async recent(limit = 5) {
    const pool = await getPool();
    if (useAmsSql) {
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
    }

    const result = await pool.request().input('limit', sql.Int, limit).query(`
      SELECT TOP (@limit) a.*, s.school_name, u.name AS student_name
      FROM Applications a
      INNER JOIN Schools s ON s.id = a.school_id
      INNER JOIN Students st ON st.id = a.student_id
      INNER JOIN Users u ON u.id = st.user_id
      ORDER BY a.applied_date DESC
    `);
    return result.recordset;
  },
};

module.exports = ApplicationModel;
