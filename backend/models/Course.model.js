const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');
const { useAmsSql } = require('../config/env');

const CourseModel = {
  async findById(id) {
    const pool = await getPool();
    if (useAmsSql) {
      const ccId = typeof id === 'number' ? id : parseInt(String(id), 10);
      if (Number.isNaN(ccId)) return null;

      const result = await pool
        .request()
        .input('id', sql.Int, ccId)
        .query(`
          SELECT 
            cc.CollegeCourseID AS id,
            cc.CollegeID AS school_id,
            c.CourseName AS course_name,
            cc.AnnualFee AS fees,
            cc.TotalSeats AS seats
          FROM dbo.CollegeCourses cc
          INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
          WHERE cc.CollegeCourseID = @id
        `);
      return result.recordset[0] || null;
    }

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM Courses WHERE id = @id');
    return result.recordset[0] || null;
  },

  async findBySchool(schoolId) {
    const pool = await getPool();
    if (useAmsSql) {
      const colId = typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10);
      if (Number.isNaN(colId)) return [];

      const result = await pool
        .request()
        .input('school_id', sql.Int, colId)
        .query(`
          SELECT 
            cc.CollegeCourseID AS id,
            cc.CollegeID AS school_id,
            c.CourseName AS course_name,
            cc.AnnualFee AS fees,
            cc.TotalSeats AS seats
          FROM dbo.CollegeCourses cc
          INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
          WHERE cc.CollegeID = @school_id
          ORDER BY c.CourseName
        `);
      return result.recordset;
    }

    const result = await pool
      .request()
      .input('school_id', sql.UniqueIdentifier, schoolId)
      .query('SELECT * FROM Courses WHERE school_id = @school_id ORDER BY course_name');
    return result.recordset;
  },

  async create({ schoolId, courseName, fees, seats }) {
    const pool = await getPool();

    if (useAmsSql) {
      const colId = typeof schoolId === 'number' ? schoolId : parseInt(String(schoolId), 10);

      // Find or create CourseID in dbo.Courses
      const cleanName = String(courseName || '').trim();
      let courseRes = await pool
        .request()
        .input('name', sql.NVarChar(255), cleanName)
        .query('SELECT CourseID FROM dbo.Courses WHERE LOWER(CourseName) = LOWER(@name)');
      let courseId = courseRes.recordset[0]?.CourseID;
      
      if (!courseId) {
        let code = cleanName.slice(0, 3).toUpperCase();
        let insCourse = await pool
          .request()
          .input('name', sql.NVarChar(255), cleanName)
          .input('code', sql.NVarChar(50), code)
          .query('INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES (@name, @code)');
        courseId = insCourse.recordset[0].CourseID;
      }

      // Find or create BranchID
      let branchRes = await pool
        .request()
        .input('courseId', sql.Int, courseId)
        .query('SELECT TOP 1 BranchID FROM dbo.Branches WHERE CourseID = @courseId');
      let branchId = branchRes.recordset[0]?.BranchID;

      if (!branchId) {
        let insBranch = await pool
          .request()
          .input('courseId', sql.Int, courseId)
          .query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@courseId, 'General Branch', 'GEN')");
        branchId = insBranch.recordset[0].BranchID;
      }

      // Insert CollegeCourse
      const insCc = await pool
        .request()
        .input('cid', sql.Int, colId)
        .input('courseId', sql.Int, courseId)
        .input('branchId', sql.Int, branchId)
        .input('fees', sql.Decimal(12, 2), fees ?? null)
        .input('seats', sql.Int, seats ?? null)
        .query(`
          INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee)
          OUTPUT inserted.CollegeCourseID
          VALUES (@cid, @courseId, @branchId, 4.0, @seats, @fees)
        `);
      const collegeCourseId = insCc.recordset[0].CollegeCourseID;
      return this.findById(collegeCourseId);
    }

    const id = uuidv4();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('school_id', sql.UniqueIdentifier, schoolId)
      .input('course_name', sql.NVarChar(200), courseName)
      .input('fees', sql.Decimal(12, 2), fees ?? null)
      .input('seats', sql.Int, seats ?? null)
      .query(`
        INSERT INTO Courses (id, school_id, course_name, fees, seats)
        VALUES (@id, @school_id, @course_name, @fees, @seats)
      `);
    return this.findById(id);
  },

  async update(id, { courseName, fees, seats }) {
    const pool = await getPool();

    if (useAmsSql) {
      const ccId = typeof id === 'number' ? id : parseInt(String(id), 10);
      const existing = await this.findById(ccId);
      if (!existing) return null;

      const cleanName = String(courseName || '').trim();
      let courseRes = await pool
        .request()
        .input('name', sql.NVarChar(255), cleanName)
        .query('SELECT CourseID FROM dbo.Courses WHERE LOWER(CourseName) = LOWER(@name)');
      let courseId = courseRes.recordset[0]?.CourseID;
      
      if (!courseId) {
        let code = cleanName.slice(0, 3).toUpperCase();
        let insCourse = await pool
          .request()
          .input('name', sql.NVarChar(255), cleanName)
          .input('code', sql.NVarChar(50), code)
          .query('INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES (@name, @code)');
        courseId = insCourse.recordset[0].CourseID;
      }

      let branchRes = await pool
        .request()
        .input('courseId', sql.Int, courseId)
        .query('SELECT TOP 1 BranchID FROM dbo.Branches WHERE CourseID = @courseId');
      let branchId = branchRes.recordset[0]?.BranchID;

      if (!branchId) {
        let insBranch = await pool
          .request()
          .input('courseId', sql.Int, courseId)
          .query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@courseId, 'General Branch', 'GEN')");
        branchId = insBranch.recordset[0].BranchID;
      }

      await pool
        .request()
        .input('id', sql.Int, ccId)
        .input('courseId', sql.Int, courseId)
        .input('branchId', sql.Int, branchId)
        .input('fees', sql.Decimal(12, 2), fees ?? null)
        .input('seats', sql.Int, seats ?? null)
        .query(`
          UPDATE dbo.CollegeCourses
          SET CourseID = @courseId, BranchID = @branchId, AnnualFee = @fees, TotalSeats = @seats, UpdatedAt = SYSUTCDATETIME()
          WHERE CollegeCourseID = @id
        `);
      return this.findById(ccId);
    }

    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('course_name', sql.NVarChar(200), courseName)
      .input('fees', sql.Decimal(12, 2), fees ?? null)
      .input('seats', sql.Int, seats ?? null)
      .query(`
        UPDATE Courses SET course_name = @course_name, fees = @fees, seats = @seats
        WHERE id = @id
      `);
    return this.findById(id);
  },

  async delete(id) {
    const pool = await getPool();
    if (useAmsSql) {
      const ccId = typeof id === 'number' ? id : parseInt(String(id), 10);
      await pool.request().input('id', sql.Int, ccId).query('DELETE FROM dbo.CollegeCourses WHERE CollegeCourseID = @id');
      return;
    }
    await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM Courses WHERE id = @id');
  },
};

module.exports = CourseModel;
