const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');

const ApplicationModel = {
  async findById(id) {
    const pool = await getPool();
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
    const id = uuidv4();
    const pool = await getPool();
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
    const result = await pool
      .request()
      .input('status', sql.NVarChar(50), status)
      .query('SELECT COUNT(*) AS total FROM Applications WHERE status = @status');
    return result.recordset[0].total;
  },

  async count() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM Applications');
    return result.recordset[0].total;
  },

  async countByStatusGrouped() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT status, COUNT(*) AS count FROM Applications GROUP BY status
    `);
    return result.recordset;
  },

  async recent(limit = 5) {
    const pool = await getPool();
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
