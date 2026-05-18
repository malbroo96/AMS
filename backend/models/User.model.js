const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');

const UserModel = {
  async findByEmail(email) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT * FROM Users WHERE email = @email');
    return result.recordset[0] || null;
  },

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM Users WHERE id = @id');
    return result.recordset[0] || null;
  },

  async create({ name, email, password, role, phone, isApproved = true }) {
    const id = uuidv4();
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar(100), name)
      .input('email', sql.NVarChar(255), email)
      .input('password', sql.NVarChar(255), password)
      .input('role', sql.NVarChar(50), role)
      .input('phone', sql.NVarChar(20), phone || null)
      .input('is_approved', sql.Bit, isApproved ? 1 : 0)
      .query(`
        INSERT INTO Users (id, name, email, password, role, phone, is_approved)
        VALUES (@id, @name, @email, @password, @role, @phone, @is_approved)
      `);
    return this.findById(id);
  },

  async update(id, fields) {
    const pool = await getPool();
    const sets = [];
    const request = pool.request().input('id', sql.UniqueIdentifier, id);

    if (fields.name !== undefined) {
      sets.push('name = @name');
      request.input('name', sql.NVarChar(100), fields.name);
    }
    if (fields.phone !== undefined) {
      sets.push('phone = @phone');
      request.input('phone', sql.NVarChar(20), fields.phone);
    }
    if (fields.isApproved !== undefined) {
      sets.push('is_approved = @is_approved');
      request.input('is_approved', sql.Bit, fields.isApproved ? 1 : 0);
    }

    if (!sets.length) return this.findById(id);
    await request.query(`UPDATE Users SET ${sets.join(', ')} WHERE id = @id`);
    return this.findById(id);
  },

  async listSchoolAdmins({ search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;
    let where = "role = 'school_admin'";
    if (search) {
      where += ' AND (name LIKE @search OR email LIKE @search)';
    }
    const request = pool
      .request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit);
    if (search) request.input('search', sql.NVarChar(255), `%${search}%`);

    const data = await request.query(`
      SELECT u.*, s.id AS school_id, s.school_name, s.city
      FROM Users u
      LEFT JOIN Schools s ON s.admin_id = u.id
      WHERE ${where}
      ORDER BY u.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countReq = pool.request();
    if (search) countReq.input('search', sql.NVarChar(255), `%${search}%`);
    const count = await countReq.query(`
      SELECT COUNT(*) AS total FROM Users WHERE ${where}
    `);

    return { rows: data.recordset, total: count.recordset[0].total };
  },

  async delete(id) {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM Users WHERE id = @id');
  },

  async countByRole(role) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('role', sql.NVarChar(50), role)
      .query('SELECT COUNT(*) AS total FROM Users WHERE role = @role');
    return result.recordset[0].total;
  },
};

module.exports = UserModel;
