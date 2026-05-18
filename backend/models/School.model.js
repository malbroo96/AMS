const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');

const SchoolModel = {
  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT s.*, u.name AS admin_name, u.email AS admin_email
        FROM Schools s
        LEFT JOIN Users u ON u.id = s.admin_id
        WHERE s.id = @id
      `);
    return result.recordset[0] || null;
  },

  async findByAdminId(adminId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('admin_id', sql.UniqueIdentifier, adminId)
      .query('SELECT * FROM Schools WHERE admin_id = @admin_id');
    return result.recordset[0] || null;
  },

  async list({ search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;
    const request = pool.request().input('offset', sql.Int, offset).input('limit', sql.Int, limit);
    let where = '1=1';
    if (search) {
      where += ' AND (school_name LIKE @search OR city LIKE @search OR board LIKE @search)';
      request.input('search', sql.NVarChar(255), `%${search}%`);
    }
    const data = await request.query(`
      SELECT * FROM Schools WHERE ${where}
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    const countReq = pool.request();
    if (search) countReq.input('search', sql.NVarChar(255), `%${search}%`);
    const count = await countReq.query(`SELECT COUNT(*) AS total FROM Schools WHERE ${where}`);
    return { rows: data.recordset, total: count.recordset[0].total };
  },

  async create(data) {
    const id = uuidv4();
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('school_name', sql.NVarChar(200), data.schoolName)
      .input('address', sql.NVarChar(500), data.address || null)
      .input('city', sql.NVarChar(100), data.city || null)
      .input('phone', sql.NVarChar(20), data.phone || null)
      .input('email', sql.NVarChar(255), data.email || null)
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('logo_url', sql.NVarChar(500), data.logoUrl || null)
      .input('board', sql.NVarChar(100), data.board || null)
      .input('created_by', sql.UniqueIdentifier, data.createdBy || null)
      .input('admin_id', sql.UniqueIdentifier, data.adminId || null)
      .query(`
        INSERT INTO Schools (id, school_name, address, city, phone, email, description, logo_url, board, created_by, admin_id)
        VALUES (@id, @school_name, @address, @city, @phone, @email, @description, @logo_url, @board, @created_by, @admin_id)
      `);
    return this.findById(id);
  },

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('school_name', sql.NVarChar(200), data.schoolName ?? existing.school_name)
      .input('address', sql.NVarChar(500), data.address !== undefined ? data.address : existing.address)
      .input('city', sql.NVarChar(100), data.city ?? existing.city)
      .input('phone', sql.NVarChar(20), data.phone !== undefined ? data.phone : existing.phone)
      .input('email', sql.NVarChar(255), data.email !== undefined ? data.email : existing.email)
      .input('description', sql.NVarChar(sql.MAX), data.description !== undefined ? data.description : existing.description)
      .input('logo_url', sql.NVarChar(500), data.logoUrl !== undefined ? data.logoUrl : existing.logo_url)
      .input('board', sql.NVarChar(100), data.board !== undefined ? data.board : existing.board)
      .input('admin_id', sql.UniqueIdentifier, data.adminId !== undefined ? data.adminId : existing.admin_id)
      .query(`
        UPDATE Schools SET
          school_name = @school_name, address = @address, city = @city,
          phone = @phone, email = @email, description = @description,
          logo_url = @logo_url, board = @board, admin_id = @admin_id
        WHERE id = @id
      `);
    return this.findById(id);
  },

  async setAdmin(schoolId, adminId) {
    const school = await this.findById(schoolId);
    if (!school) return null;
    return this.update(schoolId, { adminId });
  },

  async delete(id) {
    const pool = await getPool();
    await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM Schools WHERE id = @id');
  },

  async count() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM Schools');
    return result.recordset[0].total;
  },
};

module.exports = SchoolModel;
