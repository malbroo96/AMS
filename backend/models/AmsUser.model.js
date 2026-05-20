const { sql, getPool } = require('../config/database');

const toIntId = (raw) => {
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
};

async function roleIdFor(pool, roleName) {
  const r = await pool
    .request()
    .input('roleName', sql.VarChar(50), roleName)
    .query('SELECT RoleID FROM Roles WHERE RoleName = @roleName');
  const row = r.recordset[0];
  if (!row) throw new Error(`Role not found in AMS.Roles: ${roleName}`);
  return row.RoleID;
}

/** Row shape expected by auth middleware / bcrypt (snake-ish aliases from SQL) */
function shapeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role,
    is_approved: row.is_approved,
    created_at: row.created_at,
  };
}

const AmsUserModel = {
  async findByEmail(email) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.VarChar(255), email.trim().toLowerCase())
      .query(`
        SELECT u.UserID AS id, u.FullName AS [name], u.Email AS email, u.Phone AS phone,
               u.Password AS [password], LOWER(r.RoleName) AS role,
               u.IsApproved AS is_approved, u.CreatedAt AS created_at
        FROM Users u
        INNER JOIN Roles r ON r.RoleID = u.RoleID
        WHERE LOWER(u.Email) = LOWER(@email)
      `);
  return shapeUser(result.recordset[0]);
  },

  async findById(rawId) {
    const id = toIntId(rawId);
    if (id == null) return null;
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT u.UserID AS id, u.FullName AS [name], u.Email AS email, u.Phone AS phone,
               u.Password AS [password], LOWER(r.RoleName) AS role,
               u.IsApproved AS is_approved, u.CreatedAt AS created_at
        FROM Users u
        INNER JOIN Roles r ON r.RoleID = u.RoleID
        WHERE u.UserID = @id
      `);
    return shapeUser(result.recordset[0]);
  },

  async create({ name, email, password, role, phone, isApproved = true }) {
    const pool = await getPool();
    const rid = await roleIdFor(pool, role);
    const result = await pool
      .request()
      .input('roleId', sql.Int, rid)
      .input('email', sql.VarChar(255), email.trim().toLowerCase())
      .input('password', sql.NVarChar(255), password)
      .input('fullName', sql.NVarChar(150), name)
      .input('phone', sql.NVarChar(30), phone || null)
      .input('isApproved', sql.Bit, isApproved ? 1 : 0)
      .query(`
        INSERT INTO Users (RoleID, Email, Password, FullName, Phone, IsApproved)
        OUTPUT inserted.UserID
        VALUES (@roleId, @email, @password, @fullName, @phone, @isApproved)
      `);
    const newId = result.recordset[0].UserID;
    return this.findById(newId);
  },

  async update(rawId, fields) {
    const id = toIntId(rawId);
    if (id == null) return null;
    const pool = await getPool();
    const req = pool.request().input('id', sql.Int, id);
    const sets = [];
    if (fields.name !== undefined) {
      sets.push('FullName = @fullName');
      req.input('fullName', sql.NVarChar(150), fields.name);
    }
    if (fields.phone !== undefined) {
      sets.push('Phone = @phone');
      req.input('phone', sql.NVarChar(30), fields.phone);
    }
    if (fields.isApproved !== undefined) {
      sets.push('IsApproved = @isApproved');
      req.input('isApproved', sql.Bit, fields.isApproved ? 1 : 0);
    }
    if (!sets.length) return this.findById(id);
    await req.query(`UPDATE Users SET ${sets.join(', ')} WHERE UserID = @id`);
    return this.findById(id);
  },

  async delete(rawId) {
    const id = toIntId(rawId);
    if (id == null) return;
    const pool = await getPool();
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Users WHERE UserID = @id');
  },

  async countByRole(role) {
    const pool = await getPool();
    const mapped = role === 'school_admin' ? 'college' : role;
    const result = await pool
      .request()
      .input('roleName', sql.VarChar(50), mapped)
      .query(`
        SELECT COUNT(*) AS total
        FROM Users u
        INNER JOIN Roles r ON r.RoleID = u.RoleID
        WHERE LOWER(r.RoleName) = LOWER(@roleName)
      `);
    return result.recordset[0].total;
  },

  /** Legacy admin.service: treat college accounts as \"school admins\" listing. */
  async listSchoolAdmins({ search, page = 1, limit = 10 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;
    const collegeRoleId = await roleIdFor(pool, 'college');
    const req = pool
      .request()
      .input('collegeRoleId', sql.Int, collegeRoleId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit);
    let where = 'u.RoleID = @collegeRoleId';
    if (search) {
      where += ' AND (u.FullName LIKE @search OR u.Email LIKE @search)';
      req.input('search', sql.NVarChar(255), `%${search}%`);
    }
    const data = await req.query(`
      SELECT
        u.UserID AS id,
        u.FullName AS [name],
        u.Email AS email,
        u.Phone AS phone,
        'school_admin' AS role,
        u.IsApproved AS is_approved,
        u.CreatedAt AS created_at,
        CAST(NULL AS UNIQUEIDENTIFIER) AS school_id,
        CAST(NULL AS NVARCHAR(200)) AS school_name,
        CAST(NULL AS NVARCHAR(100)) AS city
      FROM Users u
      WHERE ${where}
      ORDER BY u.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    const countReq = pool.request().input('collegeRoleId', sql.Int, collegeRoleId);
    if (search) countReq.input('search', sql.NVarChar(255), `%${search}%`);
    const count = await countReq.query(`
      SELECT COUNT(*) AS total FROM Users u WHERE ${where}
    `);
    return { rows: data.recordset, total: count.recordset[0].total };
  },
};

module.exports = AmsUserModel;
