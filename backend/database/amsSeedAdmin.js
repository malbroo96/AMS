/**
 * One-time: create AMS admin user (dbo.Users + dbo.Roles 'admin').
 * Usage (from backend/): ADMIN_EMAIL=admin@23 ADMIN_PASSWORD=yourPass node database/amsSeedAdmin.js
 * Requires .env with USE_AMS_SQL=true and DB_* so getPool() works.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/database');

const email = (process.env.ADMIN_EMAIL || 'admin@23').trim().toLowerCase();
const plain = process.env.ADMIN_PASSWORD || 'ChangeMeAdmin123!';

async function main() {
  const pool = await getPool();
  const exists = await pool.request().input('e', sql.VarChar(255), email).query('SELECT UserID FROM Users WHERE Email=@e');
  if (exists.recordset[0]) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const role = await pool.request().query("SELECT RoleID FROM Roles WHERE RoleName='admin'");
  const roleId = role.recordset[0]?.RoleID;
  if (!roleId) {
    console.error('Run ams-schema.sql first (Roles must include admin).');
    process.exit(1);
  }
  const hash = await bcrypt.hash(plain, 12);
  await pool
    .request()
    .input('rid', sql.Int, roleId)
    .input('email', sql.VarChar(255), email)
    .input('pw', sql.NVarChar(255), hash)
    .input('name', sql.NVarChar(150), 'System Admin')
    .query(`
      INSERT INTO Users (RoleID, Email, Password, FullName, Phone, IsApproved)
      VALUES (@rid, @email, @pw, @name, NULL, 1)
    `);
  console.log('Created admin:', email, '/ password:', plain);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
