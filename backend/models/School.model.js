const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');
const { useAmsSql } = require('../config/env');

const SchoolModel = {
  async findById(id) {
    const pool = await getPool();
    if (useAmsSql) {
      const colId = typeof id === 'number' ? id : parseInt(String(id), 10);
      if (Number.isNaN(colId)) return null;

      const result = await pool
        .request()
        .input('id', sql.Int, colId)
        .query(`
          SELECT 
            c.CollegeID AS id,
            c.CollegeName AS school_name,
            p.Address AS address,
            p.City AS city,
            p.ContactPhone AS phone,
            c.Email AS email,
            p.SummaryDescription AS description,
            p.LogoUrl AS logo_url,
            p.NaacGrade AS board,
            c.UserID AS admin_id,
            c.CreatedByAdminUserID AS created_by,
            c.CreatedAt AS created_at,
            u.FullName AS admin_name,
            u.Email AS admin_email
          FROM dbo.Colleges c
          LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
          LEFT JOIN dbo.Users u ON u.UserID = c.UserID
          WHERE c.CollegeID = @id
        `);
      return result.recordset[0] || null;
    }

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
    if (useAmsSql) {
      const uId = typeof adminId === 'number' ? adminId : parseInt(String(adminId), 10);
      if (Number.isNaN(uId)) return null;

      const result = await pool
        .request()
        .input('admin_id', sql.Int, uId)
        .query(`
          SELECT 
            c.CollegeID AS id,
            c.CollegeName AS school_name,
            p.Address AS address,
            p.City AS city,
            p.ContactPhone AS phone,
            c.Email AS email,
            p.SummaryDescription AS description,
            p.LogoUrl AS logo_url,
            p.NaacGrade AS board,
            c.UserID AS admin_id,
            c.CreatedByAdminUserID AS created_by,
            c.CreatedAt AS created_at
          FROM dbo.Colleges c
          LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
          WHERE c.UserID = @admin_id
        `);
      return result.recordset[0] || null;
    }

    const result = await pool
      .request()
      .input('admin_id', sql.UniqueIdentifier, adminId)
      .query('SELECT * FROM Schools WHERE admin_id = @admin_id');
    return result.recordset[0] || null;
  },

  async list({ search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    if (useAmsSql) {
      const request = pool.request().input('offset', sql.Int, offset).input('limit', sql.Int, limit);
      let where = '1=1';
      if (search) {
        where += ' AND (c.CollegeName LIKE @search OR p.City LIKE @search OR p.NaacGrade LIKE @search)';
        request.input('search', sql.NVarChar(255), `%${search}%`);
      }
      const data = await request.query(`
        SELECT 
          c.CollegeID AS id,
          c.CollegeName AS school_name,
          p.Address AS address,
          p.City AS city,
          p.ContactPhone AS phone,
          c.Email AS email,
          p.SummaryDescription AS description,
          p.LogoUrl AS logo_url,
          p.NaacGrade AS board,
          c.UserID AS admin_id,
          c.CreatedByAdminUserID AS created_by,
          c.CreatedAt AS created_at
        FROM dbo.Colleges c
        LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
        WHERE ${where}
        ORDER BY c.CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
      const countReq = pool.request();
      if (search) countReq.input('search', sql.NVarChar(255), `%${search}%`);
      const count = await countReq.query(`
        SELECT COUNT(*) AS total 
        FROM dbo.Colleges c
        LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
        WHERE ${where}
      `);
      return { rows: data.recordset, total: count.recordset[0].total };
    }

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
    const pool = await getPool();

    if (useAmsSql) {
      const uId = typeof data.adminId === 'number' ? data.adminId : parseInt(String(data.adminId || ''), 10);
      const createdBy = typeof data.createdBy === 'number' ? data.createdBy : parseInt(String(data.createdBy || ''), 10);

      const ins = await pool
        .request()
        .input('school_name', sql.NVarChar(200), data.schoolName)
        .input('email', sql.NVarChar(255), data.email || null)
        .input('admin_id', sql.Int, Number.isFinite(uId) ? uId : null)
        .input('created_by', sql.Int, Number.isFinite(createdBy) ? createdBy : null)
        .query(`
          INSERT INTO dbo.Colleges (CollegeName, Email, UserID, Status, CreatedByAdminUserID)
          OUTPUT inserted.CollegeID
          VALUES (@school_name, @email, @admin_id, 'approved', @created_by)
        `);
      const colId = ins.recordset[0].CollegeID;

      await pool
        .request()
        .input('collegeId', sql.Int, colId)
        .input('address', sql.NVarChar(500), data.address || null)
        .input('city', sql.NVarChar(100), data.city || null)
        .input('phone', sql.NVarChar(30), data.phone || null)
        .input('description', sql.NVarChar(sql.MAX), data.description || null)
        .input('logo_url', sql.NVarChar(2048), data.logoUrl || null)
        .input('board', sql.NVarChar(100), data.board || null)
        .query(`
          INSERT INTO dbo.CollegeProfiles (CollegeID, Address, City, ContactPhone, SummaryDescription, LogoUrl, NaacGrade, ProfileCompletionPercentage)
          VALUES (@collegeId, @address, @city, @phone, @description, @logo_url, @board, 100)
        `);

      return this.findById(colId);
    }

    const id = uuidv4();
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

    if (useAmsSql) {
      const colId = typeof id === 'number' ? id : parseInt(String(id), 10);
      const uId = data.adminId !== undefined 
        ? (typeof data.adminId === 'number' ? data.adminId : parseInt(String(data.adminId || ''), 10))
        : existing.admin_id;

      await pool
        .request()
        .input('id', sql.Int, colId)
        .input('school_name', sql.NVarChar(200), data.schoolName ?? existing.school_name)
        .input('email', sql.NVarChar(255), data.email ?? existing.email)
        .input('admin_id', sql.Int, Number.isFinite(uId) ? uId : null)
        .query(`
          UPDATE dbo.Colleges 
          SET CollegeName = @school_name, Email = @email, UserID = @admin_id, UpdatedAt = SYSUTCDATETIME()
          WHERE CollegeID = @id
        `);

      await pool
        .request()
        .input('id', sql.Int, colId)
        .input('address', sql.NVarChar(500), data.address !== undefined ? data.address : existing.address)
        .input('city', sql.NVarChar(100), data.city ?? existing.city)
        .input('phone', sql.NVarChar(30), data.phone !== undefined ? data.phone : existing.phone)
        .input('description', sql.NVarChar(sql.MAX), data.description !== undefined ? data.description : existing.description)
        .input('logo_url', sql.NVarChar(2048), data.logoUrl !== undefined ? data.logoUrl : existing.logo_url)
        .input('board', sql.NVarChar(100), data.board !== undefined ? data.board : existing.board)
        .query(`
          UPDATE dbo.CollegeProfiles
          SET Address = @address, City = @city, ContactPhone = @phone, SummaryDescription = @description,
              LogoUrl = @logo_url, NaacGrade = @board, UpdatedAt = SYSUTCDATETIME()
          WHERE CollegeID = @id
        `);

      return this.findById(colId);
    }

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
    if (useAmsSql) {
      const colId = typeof id === 'number' ? id : parseInt(String(id), 10);
      await pool.request().input('id', sql.Int, colId).query('DELETE FROM dbo.Colleges WHERE CollegeID = @id');
      return;
    }
    await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM Schools WHERE id = @id');
  },

  async count() {
    const pool = await getPool();
    if (useAmsSql) {
      const result = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.Colleges');
      return result.recordset[0].total;
    }
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM Schools');
    return result.recordset[0].total;
  },
};

module.exports = SchoolModel;
