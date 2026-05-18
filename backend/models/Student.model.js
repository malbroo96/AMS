const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');

const StudentModel = {
  async findByUserId(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT st.*, u.name, u.email, u.phone
        FROM Students st
        INNER JOIN Users u ON u.id = st.user_id
        WHERE st.user_id = @user_id
      `);
    return result.recordset[0] || null;
  },

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT st.*, u.name, u.email, u.phone
        FROM Students st
        INNER JOIN Users u ON u.id = st.user_id
        WHERE st.id = @id
      `);
    return result.recordset[0] || null;
  },

  async create(userId) {
    const id = uuidv4();
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('user_id', sql.UniqueIdentifier, userId)
      .query('INSERT INTO Students (id, user_id) VALUES (@id, @user_id)');
    return this.findById(id);
  },

  async update(userId, data) {
    const pool = await getPool();
    await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('dob', sql.Date, data.dob || null)
      .input('gender', sql.NVarChar(20), data.gender || null)
      .input('parent_name', sql.NVarChar(100), data.parentName || null)
      .input('address', sql.NVarChar(500), data.address || null)
      .input('grade', sql.NVarChar(50), data.grade || null)
      .input('board', sql.NVarChar(100), data.board || null)
      .input('percentage', sql.Decimal(5, 2), data.percentage ?? null)
      .input('profile_image', sql.NVarChar(500), data.profileImage || null)
      .query(`
        UPDATE Students SET
          dob = @dob, gender = @gender, parent_name = @parent_name,
          address = @address, grade = @grade, board = @board,
          percentage = @percentage, profile_image = @profile_image
        WHERE user_id = @user_id
      `);
    return this.findByUserId(userId);
  },

  async count() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM Students');
    return result.recordset[0].total;
  },
};

module.exports = StudentModel;
