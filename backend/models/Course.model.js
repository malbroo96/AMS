const { sql, getPool } = require('../config/database');

const CourseModel = {
  async findById(id) {
    const pool = await getPool();
    const ccId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (Number.isNaN(ccId)) return null;

    const result = await pool
      .request()
      .input('id', sql.Int, ccId)
      .query(`
        SELECT 
          cc.CollegeCourseID AS id,
          cc.CollegeID AS school_id,
          c.CourseID AS RealCourseID,
          c.CourseName AS course_name,
          b.BranchID,
          b.BranchName,
          cc.DurationYears AS duration,
          cc.AnnualFee AS fees,
          cc.TotalSeats AS seats,
          cc.EligibilityCriteria AS eligibility
        FROM dbo.CollegeCourses cc
        INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
        INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
        WHERE cc.CollegeCourseID = @id
      `);
    return result.recordset[0] || null;
  },

  async findBySchool(schoolId) {
    const pool = await getPool();
    const colId = typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10);
    if (Number.isNaN(colId)) return [];

    const result = await pool
      .request()
      .input('school_id', sql.Int, colId)
      .query(`
        SELECT 
          cc.CollegeCourseID AS id,
          cc.CollegeID AS school_id,
          c.CourseID AS RealCourseID,
          c.CourseName AS course_name,
          b.BranchID,
          b.BranchName,
          cc.DurationYears AS duration,
          cc.AnnualFee AS fees,
          cc.TotalSeats AS seats,
          cc.EligibilityCriteria AS eligibility
        FROM dbo.CollegeCourses cc
        INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
        INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
        WHERE cc.CollegeID = @school_id AND cc.IsActive = 1
        ORDER BY c.CourseName, b.BranchName
      `);
    return result.recordset;
  },

  async create({ schoolId, courseName, branchName, duration, fees, seats, eligibility }) {
    const pool = await getPool();
    const colId = typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10);

    // Find or create CourseID in dbo.Courses
    const cleanCourseName = String(courseName || '').trim();
    let courseRes = await pool
      .request()
      .input('name', sql.NVarChar(255), cleanCourseName)
      .query('SELECT CourseID FROM dbo.Courses WHERE LOWER(CourseName) = LOWER(@name)');
    let courseId = courseRes.recordset[0]?.CourseID;
    
    if (!courseId) {
      let code = cleanCourseName.slice(0, 3).toUpperCase();
      let uniqueCode = code;
      let suffix = 1;
      while (true) {
        let codeCheck = await pool.request().input('code', sql.NVarChar(50), uniqueCode).query('SELECT CourseID FROM dbo.Courses WHERE CourseCode = @code');
        if (codeCheck.recordset.length === 0) break;
        uniqueCode = code + suffix++;
      }
      let insCourse = await pool
        .request()
        .input('name', sql.NVarChar(255), cleanCourseName)
        .input('code', sql.NVarChar(50), uniqueCode)
        .query('INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES (@name, @code)');
      courseId = insCourse.recordset[0].CourseID;
    }

    // Find or create BranchID in dbo.Branches
    const cleanBranchName = String(branchName || 'General Branch').trim();
    let branchRes = await pool
      .request()
      .input('courseId', sql.Int, courseId)
      .input('name', sql.NVarChar(255), cleanBranchName)
      .query('SELECT BranchID FROM dbo.Branches WHERE CourseID = @courseId AND LOWER(BranchName) = LOWER(@name)');
    let branchId = branchRes.recordset[0]?.BranchID;

    if (!branchId) {
      let code = cleanBranchName.slice(0, 3).toUpperCase();
      let uniqueCode = code;
      let suffix = 1;
      while (true) {
        let codeCheck = await pool.request().input('code', sql.NVarChar(50), uniqueCode).query('SELECT BranchID FROM dbo.Branches WHERE BranchCode = @code');
        if (codeCheck.recordset.length === 0) break;
        uniqueCode = code + suffix++;
      }
      let insBranch = await pool
        .request()
        .input('courseId', sql.Int, courseId)
        .input('name', sql.NVarChar(255), cleanBranchName)
        .input('code', sql.NVarChar(50), uniqueCode)
        .query('INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@courseId, @name, @code)');
      branchId = insBranch.recordset[0].BranchID;
    }

    // Check if duplicate combination already exists
    let existRes = await pool
      .request()
      .input('cid', sql.Int, colId)
      .input('courseId', sql.Int, courseId)
      .input('branchId', sql.Int, branchId)
      .query('SELECT CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid AND CourseID = @courseId AND BranchID = @branchId');
    let existingCollegeCourseId = existRes.recordset[0]?.CollegeCourseID;

    if (existingCollegeCourseId) {
      // Update existing record and make sure it is active
      await pool
        .request()
        .input('id', sql.Int, existingCollegeCourseId)
        .input('duration', sql.Decimal(3, 1), duration != null ? Number(duration) : 4.0)
        .input('fees', sql.Decimal(12, 2), fees ?? null)
        .input('seats', sql.Int, seats ?? null)
        .input('eligibility', sql.NVarChar(sql.MAX), eligibility ?? null)
        .query(`
          UPDATE dbo.CollegeCourses
          SET DurationYears = @duration, AnnualFee = @fees, TotalSeats = @seats, EligibilityCriteria = @eligibility, IsActive = 1, UpdatedAt = SYSUTCDATETIME()
          WHERE CollegeCourseID = @id
        `);
      return this.findById(existingCollegeCourseId);
    } else {
      // Insert new CollegeCourse relationship
      const insCc = await pool
        .request()
        .input('cid', sql.Int, colId)
        .input('courseId', sql.Int, courseId)
        .input('branchId', sql.Int, branchId)
        .input('duration', sql.Decimal(3, 1), duration != null ? Number(duration) : 4.0)
        .input('fees', sql.Decimal(12, 2), fees ?? null)
        .input('seats', sql.Int, seats ?? null)
        .input('eligibility', sql.NVarChar(sql.MAX), eligibility ?? null)
        .query(`
          INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee, EligibilityCriteria, IsActive)
          OUTPUT inserted.CollegeCourseID
          VALUES (@cid, @courseId, @branchId, @duration, @seats, @fees, @eligibility, 1)
        `);
      const collegeCourseId = insCc.recordset[0].CollegeCourseID;
      return this.findById(collegeCourseId);
    }
  },

  async update(id, { courseName, branchName, duration, fees, seats, eligibility }) {
    const pool = await getPool();
    const ccId = typeof id === 'number' ? id : parseInt(String(id), 10);
    const existing = await this.findById(ccId);
    if (!existing) return null;

    // Find or create CourseID in dbo.Courses
    const cleanCourseName = String(courseName || '').trim();
    let courseRes = await pool
      .request()
      .input('name', sql.NVarChar(255), cleanCourseName)
      .query('SELECT CourseID FROM dbo.Courses WHERE LOWER(CourseName) = LOWER(@name)');
    let courseId = courseRes.recordset[0]?.CourseID;
    
    if (!courseId) {
      let code = cleanCourseName.slice(0, 3).toUpperCase();
      let uniqueCode = code;
      let suffix = 1;
      while (true) {
        let codeCheck = await pool.request().input('code', sql.NVarChar(50), uniqueCode).query('SELECT CourseID FROM dbo.Courses WHERE CourseCode = @code');
        if (codeCheck.recordset.length === 0) break;
        uniqueCode = code + suffix++;
      }
      let insCourse = await pool
        .request()
        .input('name', sql.NVarChar(255), cleanCourseName)
        .input('code', sql.NVarChar(50), uniqueCode)
        .query('INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES (@name, @code)');
      courseId = insCourse.recordset[0].CourseID;
    }

    // Find or create BranchID in dbo.Branches under CourseID
    const cleanBranchName = String(branchName || 'General Branch').trim();
    let branchRes = await pool
      .request()
      .input('courseId', sql.Int, courseId)
      .input('name', sql.NVarChar(255), cleanBranchName)
      .query('SELECT BranchID FROM dbo.Branches WHERE CourseID = @courseId AND LOWER(BranchName) = LOWER(@name)');
    let branchId = branchRes.recordset[0]?.BranchID;

    if (!branchId) {
      let code = cleanBranchName.slice(0, 3).toUpperCase();
      let uniqueCode = code;
      let suffix = 1;
      while (true) {
        let codeCheck = await pool.request().input('code', sql.NVarChar(50), uniqueCode).query('SELECT BranchID FROM dbo.Branches WHERE BranchCode = @code');
        if (codeCheck.recordset.length === 0) break;
        uniqueCode = code + suffix++;
      }
      let insBranch = await pool
        .request()
        .input('courseId', sql.Int, courseId)
        .input('name', sql.NVarChar(255), cleanBranchName)
        .input('code', sql.NVarChar(50), uniqueCode)
        .query('INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@courseId, @name, @code)');
      branchId = insBranch.recordset[0].BranchID;
    }

    await pool
      .request()
      .input('id', sql.Int, ccId)
      .input('courseId', sql.Int, courseId)
      .input('branchId', sql.Int, branchId)
      .input('duration', sql.Decimal(3, 1), duration != null ? Number(duration) : 4.0)
      .input('fees', sql.Decimal(12, 2), fees ?? null)
      .input('seats', sql.Int, seats ?? null)
      .input('eligibility', sql.NVarChar(sql.MAX), eligibility ?? null)
      .query(`
        UPDATE dbo.CollegeCourses
        SET CourseID = @courseId, BranchID = @branchId, DurationYears = @duration, AnnualFee = @fees, TotalSeats = @seats, EligibilityCriteria = @eligibility, UpdatedAt = SYSUTCDATETIME()
        WHERE CollegeCourseID = @id
      `);
    return this.findById(ccId);
  },

  async delete(id) {
    const pool = await getPool();
    const ccId = typeof id === 'number' ? id : parseInt(String(id), 10);
    await pool.request().input('id', sql.Int, ccId).query('DELETE FROM dbo.CollegeCourses WHERE CollegeCourseID = @id');
  },
};

module.exports = CourseModel;
