/**
 * One-time import: backend/data/ams-local-db.json → MSSQL AMS tables.
 * Usage: npm run db:migrate-json
 * Requires .env with DB_* and schema from ams-schema.sql already applied.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sql, getPool } = require('../config/database');

const dataDir = path.join(__dirname, '..', 'data');
const jsonPath = path.join(dataDir, 'ams-local-db.json');
const backupPath = path.join(dataDir, 'ams-local-db.json.migrated.bak');

function resolveJsonFile() {
  if (fs.existsSync(jsonPath)) return jsonPath;
  if (fs.existsSync(backupPath)) return backupPath;
  return null;
}

async function roleId(pool, name) {
  const r = await pool.request().input('n', sql.VarChar(50), name).query('SELECT RoleID FROM Roles WHERE RoleName=@n');
  if (!r.recordset[0]) throw new Error(`Missing role: ${name}. Run ams-schema.sql first.`);
  return r.recordset[0].RoleID;
}

function parseDob(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const sourcePath = resolveJsonFile();
  if (!sourcePath) {
    console.log('No ams-local-db.json or .migrated.bak to import.');
    process.exit(0);
  }

  const db = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const pool = await getPool();

  const existing = await pool.request().query('SELECT COUNT(*) AS n FROM Users');
  if (existing.recordset[0].n > 0) {
    console.log('Users table already has data. Skipping migration (delete rows first if you want to re-import).');
    process.exit(0);
  }

  const roleIds = {
    admin: await roleId(pool, 'admin'),
    college: await roleId(pool, 'college'),
    student: await roleId(pool, 'student'),
  };

  const userMap = new Map();

  for (const u of db.users || []) {
    const rid = roleIds[u.role] || roleIds.student;
    const ins = await pool
      .request()
      .input('rid', sql.Int, rid)
      .input('email', sql.VarChar(255), u.email.trim().toLowerCase())
      .input('pw', sql.NVarChar(255), u.password)
      .input('name', sql.NVarChar(150), u.name)
      .input('phone', sql.NVarChar(30), u.phone || null)
      .input('approved', sql.Bit, u.is_approved ? 1 : 0)
      .query(`
        INSERT INTO Users (RoleID, Email, Password, FullName, Phone, IsApproved)
        OUTPUT inserted.UserID
        VALUES (@rid, @email, @pw, @name, @phone, @approved)
      `);
    userMap.set(u.id, ins.recordset[0].UserID);
    console.log('User:', u.email, '→ UserID', ins.recordset[0].UserID);
  }

  const studentMap = new Map();

  for (const s of db.students || []) {
    const uid = userMap.get(s.userId);
    if (!uid) {
      console.warn('Skip student (no user):', s.email);
      continue;
    }
    const ins = await pool
      .request()
      .input('uid', sql.Int, uid)
      .input('name', sql.NVarChar(150), s.name)
      .input('address', sql.NVarChar(500), s.address || '')
      .input('mobile', sql.NVarChar(30), s.mobile || '')
      .input('email', sql.NVarChar(255), s.email)
      .input('gender', sql.NVarChar(20), s.gender || '')
      .input('dob', sql.Date, parseDob(s.dateOfBirth))
      .input('education', sql.NVarChar(150), s.education || '')
      .input('ic', sql.NVarChar(200), s.interestedCollege || '')
      .input('pv', sql.Bit, s.profileVisible ? 1 : 0)
      .query(`
        INSERT INTO Students (UserID, Name, Address, Mobile, Email, Gender, DateOfBirth, Education, InterestedCollege, ProfileVisible)
        OUTPUT inserted.StudentID
        VALUES (@uid, @name, @address, @mobile, @email, @gender, @dob, @education, @ic, @pv)
      `);
    studentMap.set(s.id, ins.recordset[0].StudentID);
    console.log('Student:', s.name, '→ StudentID', ins.recordset[0].StudentID);
  }

  const collegeMap = new Map();

  for (const c of db.colleges || []) {
    const uid = userMap.get(c.userId);
    if (!uid) {
      console.warn('Skip college (no user):', c.collegeName);
      continue;
    }
    const adminUid = c.createdByAdmin ? userMap.get(c.createdByAdmin) : null;
    const ins = await pool
      .request()
      .input('cn', sql.VarChar(150), c.collegeName)
      .input('email', sql.VarChar(255), c.email.trim().toLowerCase())
      .input('uid', sql.Int, uid)
      .input('st', sql.VarChar(20), c.status || 'approved')
      .input('by', sql.Int, adminUid)
      .query(`
        INSERT INTO Colleges (CollegeName, Email, UserID, Status, CreatedByAdminUserID)
        OUTPUT inserted.CollegeID
        VALUES (@cn, @email, @uid, @st, @by)
      `);
    collegeMap.set(c.id, ins.recordset[0].CollegeID);
    console.log('College:', c.collegeName, '→ CollegeID', ins.recordset[0].CollegeID);
  }

  for (const i of db.interests || []) {
    const sid = studentMap.get(i.studentId);
    const cid = collegeMap.get(i.collegeId);
    if (!sid || !cid) continue;
    await pool
      .request()
      .input('sid', sql.Int, sid)
      .input('cid', sql.Int, cid)
      .input('st', sql.NVarChar(30), i.status || 'Interested')
      .input('ap', sql.Bit, i.approvedByAdmin ? 1 : 0)
      .query(`
        INSERT INTO StudentApplications (StudentID, CollegeID, Status, ApprovedByAdmin)
        VALUES (@sid, @cid, @st, @ap)
      `);
  }

  const activities = [...(db.activities || [])].reverse();
  for (const a of activities) {
    const msg = String(a.message || '').slice(0, 500);
    if (!msg) continue;
    await pool.request().input('m', sql.NVarChar(500), msg).query('INSERT INTO ActivityLogs (Message) VALUES (@m)');
  }

  if (sourcePath === jsonPath && !fs.existsSync(backupPath)) {
    fs.renameSync(jsonPath, backupPath);
  }
  console.log('\nMigration complete. Source:', sourcePath);
  console.log('Set USE_LOCAL_AUTH=false and restart the API. Users must log in again (new numeric UserIDs in JWT).');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
