const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');

const CourseModel = {
  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM Courses WHERE id = @id');
    return result.recordset[0] || null;
  },

  async findBySchool(schoolId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('school_id', sql.UniqueIdentifier, schoolId)
      .query('SELECT * FROM Courses WHERE school_id = @school_id ORDER BY course_name');
    return result.recordset;
  },

  async create({ schoolId, courseName, fees, seats }) {
    const id = uuidv4();
    const pool = await getPool();
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
    await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM Courses WHERE id = @id');
  },
};

module.exports = CourseModel;
