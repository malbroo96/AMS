const { sql, getPool } = require('../config/database');

const SchoolModel = {
  async findById(id) {
    const pool = await getPool();
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
          c.CreatedAt AS created_at,
          u.FullName AS admin_name,
          u.Email AS admin_email
        FROM dbo.Colleges c
        LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
        LEFT JOIN dbo.Users u ON u.UserID = c.UserID
        WHERE c.CollegeID = @id
      `);
    return result.recordset[0] || null;
  },

  async findByAdminId(adminId) {
    const pool = await getPool();
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
          c.CreatedAt AS created_at
        FROM dbo.Colleges c
        LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
        WHERE c.UserID = @admin_id
      `);
    return result.recordset[0] || null;
  },

  async list({ search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    const request = pool.request().input('offset', sql.Int, offset).input('limit', sql.Int, limit);
    let where = '1=1';
    if (search) {
      where += ' AND (c.CollegeName LIKE @search OR p.City LIKE @search OR p.NaacGrade LIKE @search)';
      request.input('search', sql.NVarChar(255), `%${search}%`);
    }
    const data = await request.query(`
      WITH PagedSchools AS (
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
          c.CreatedAt AS created_at,
          ROW_NUMBER() OVER (ORDER BY c.CreatedAt DESC) AS RowNum
        FROM dbo.Colleges c
        LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
        WHERE ${where}
      )
      SELECT * FROM PagedSchools
      WHERE RowNum > @offset AND RowNum <= (@offset + @limit)
      ORDER BY RowNum
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
  },

  async create(data) {
    const pool = await getPool();
    const uId = typeof data.adminId === 'number' ? data.adminId : parseInt(String(data.adminId || ''), 10);

    const ins = await pool
      .request()
      .input('school_name', sql.NVarChar(200), data.schoolName)
      .input('email', sql.NVarChar(255), data.email || null)
      .input('admin_id', sql.Int, Number.isFinite(uId) ? uId : null)
      .query(`
        INSERT INTO dbo.Colleges (CollegeName, Email, UserID, Status)
        OUTPUT inserted.CollegeID
        VALUES (@school_name, @email, @admin_id, 'approved')
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
  },

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const pool = await getPool();

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
  },

  async setAdmin(schoolId, adminId) {
    const school = await this.findById(schoolId);
    if (!school) return null;
    return this.update(schoolId, { adminId });
  },

  async delete(id) {
    const pool = await getPool();
    const colId = typeof id === 'number' ? id : parseInt(String(id), 10);
    await pool.request().input('id', sql.Int, colId).query('DELETE FROM dbo.Colleges WHERE CollegeID = @id');
  },

  async count() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM dbo.Colleges');
    return result.recordset[0].total;
  },
};

module.exports = SchoolModel;
