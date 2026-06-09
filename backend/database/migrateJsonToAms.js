/**
 * One-time import: backend/data/ams-local-db.json -> MSSQL AMS tables.
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

function dobIsoDate(val) {
  const d = parseDob(val);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

async function upsertUser(pool, roleIds, u, userMap) {
  const rid = roleIds[u.role] || roleIds.student;
  const email = String(u.email || '').trim().toLowerCase();
  if (!email) return;

  const existing = await pool
    .request()
    .input('email', sql.VarChar(150), email)
    .query('SELECT UserID FROM Users WHERE LOWER(Email) = LOWER(@email)');

  let userId = existing.recordset[0]?.UserID;
  if (userId) {
    await pool
      .request()
      .input('id', sql.Int, userId)
      .input('rid', sql.Int, rid)
      .input('pw', sql.VarChar(255), u.password)
      .input('name', sql.VarChar(150), u.name || '')
      .input('phone', sql.VarChar(20), u.phone || null)
      .input('approved', sql.Bit, u.is_approved ? 1 : 0)
      .query(`
        UPDATE Users
        SET RoleID = @rid, Password = @pw, FullName = @name, Phone = @phone, IsApproved = @approved
        WHERE UserID = @id
      `);
  } else {
    const ins = await pool
      .request()
      .input('rid', sql.Int, rid)
      .input('email', sql.VarChar(150), email)
      .input('pw', sql.VarChar(255), u.password)
      .input('name', sql.VarChar(150), u.name || '')
      .input('phone', sql.VarChar(20), u.phone || null)
      .input('approved', sql.Bit, u.is_approved ? 1 : 0)
      .query(`
        INSERT INTO Users (RoleID, Email, Password, FullName, Phone, IsApproved)
        OUTPUT inserted.UserID
        VALUES (@rid, @email, @pw, @name, @phone, @approved)
      `);
    userId = ins.recordset[0].UserID;
  }

  userMap.set(u.id, userId);
  console.log('User:', email, '-> UserID', userId);
}

async function upsertCollege(pool, c, userMap, collegeMap) {
  const uid = userMap.get(c.userId);
  if (!uid) {
    console.warn('Skip college (no user):', c.collegeName);
    return;
  }
  const adminUid = c.createdByAdmin ? userMap.get(c.createdByAdmin) : null;
  const email = String(c.email || '').trim().toLowerCase();

  const existing = await pool
    .request()
    .input('uid', sql.Int, uid)
    .input('email', sql.VarChar(150), email)
    .query('SELECT TOP 1 CollegeID FROM Colleges WHERE UserID = @uid OR LOWER(Email) = LOWER(@email)');

  let collegeId = existing.recordset[0]?.CollegeID;
  if (collegeId) {
    await pool
      .request()
      .input('id', sql.Int, collegeId)
      .input('cn', sql.VarChar(150), c.collegeName || '')
      .input('email', sql.VarChar(150), email)
      .input('uid', sql.Int, uid)
      .input('st', sql.VarChar(50), c.status || 'approved')
      .input('by', sql.Int, adminUid)
      .query(`
        UPDATE Colleges
        SET CollegeName = @cn, Email = @email, UserID = @uid, Status = @st, CreatedByAdminUserID = @by
        WHERE CollegeID = @id
      `);
  } else {
    const ins = await pool
      .request()
      .input('cn', sql.VarChar(150), c.collegeName || '')
      .input('email', sql.VarChar(150), email)
      .input('uid', sql.Int, uid)
      .input('st', sql.VarChar(50), c.status || 'approved')
      .input('by', sql.Int, adminUid)
      .query(`
        INSERT INTO Colleges (CollegeName, Email, UserID, Status, CreatedByAdminUserID)
        OUTPUT inserted.CollegeID
        VALUES (@cn, @email, @uid, @st, @by)
      `);
    collegeId = ins.recordset[0].CollegeID;
  }

  collegeMap.set(c.id, collegeId);
  console.log('College:', c.collegeName, '-> CollegeID', collegeId);
}

async function upsertStudent(pool, s, userMap, studentMap) {
  const uid = userMap.get(s.userId);
  if (!uid) {
    console.warn('Skip student (no user):', s.email);
    return;
  }

  const existing = await pool
    .request()
    .input('uid', sql.Int, uid)
    .query('SELECT TOP 1 StudentID FROM Students WHERE UserID = @uid');

  let studentId = existing.recordset[0]?.StudentID;
  if (studentId) {
    await pool
      .request()
      .input('id', sql.Int, studentId)
      .input('name', sql.VarChar(150), s.name || '')
      .input('address', sql.VarChar(300), s.address || '')
      .input('mobile', sql.VarChar(20), s.mobile || '')
      .input('email', sql.VarChar(150), s.email || '')
      .input('gender', sql.VarChar(20), s.gender || '')
      .input('dob', sql.VarChar(10), dobIsoDate(s.dateOfBirth))
      .input('education', sql.VarChar(150), s.education || '')
      .input('pv', sql.Bit, s.profileVisible ? 1 : 0)
      .query(`
        UPDATE Students
        SET Name = @name, Address = @address, Mobile = @mobile, Email = @email,
            Gender = @gender, DateOfBirth = CASE WHEN @dob IS NULL THEN NULL ELSE CONVERT(date, @dob, 23) END,
            Education = @education, ProfileVisible = @pv
        WHERE StudentID = @id
      `);
  } else {
    const ins = await pool
      .request()
      .input('uid', sql.Int, uid)
      .input('name', sql.VarChar(150), s.name || '')
      .input('address', sql.VarChar(300), s.address || '')
      .input('mobile', sql.VarChar(20), s.mobile || '')
      .input('email', sql.VarChar(150), s.email || '')
      .input('gender', sql.VarChar(20), s.gender || '')
      .input('dob', sql.VarChar(10), dobIsoDate(s.dateOfBirth))
      .input('education', sql.VarChar(150), s.education || '')
      .input('pv', sql.Bit, s.profileVisible ? 1 : 0)
      .query(`
        INSERT INTO Students (UserID, Name, Address, Mobile, Email, Gender, DateOfBirth, Education, InterestedCollege, ProfileVisible)
        OUTPUT inserted.StudentID
        VALUES (@uid, @name, @address, @mobile, @email, @gender, CASE WHEN @dob IS NULL THEN NULL ELSE CONVERT(date, @dob, 23) END, @education, NULL, @pv)
      `);
    studentId = ins.recordset[0].StudentID;
  }

  studentMap.set(s.id, studentId);
  console.log('Student:', s.name, '-> StudentID', studentId);
}

async function updateStudentInterestedCollege(pool, students, studentMap, collegeMap) {
  for (const s of students || []) {
    const sid = studentMap.get(s.id);
    if (!sid) continue;
    const interested = s.interestedCollege;
    if (!interested) continue;

    let targetCollegeId = collegeMap.get(interested);
    if (!targetCollegeId) {
      const byName = await pool
        .request()
        .input('name', sql.VarChar(150), String(interested))
        .query('SELECT TOP 1 CollegeID FROM Colleges WHERE LOWER(CollegeName) = LOWER(@name)');
      targetCollegeId = byName.recordset[0]?.CollegeID;
    }
    if (!targetCollegeId) continue;

    await pool
      .request()
      .input('sid', sql.Int, sid)
      .input('cid', sql.Int, targetCollegeId)
      .query('UPDATE Students SET InterestedCollege = @cid WHERE StudentID = @sid');
  }
}

async function upsertInterest(pool, i, studentMap, collegeMap) {
  const sid = studentMap.get(i.studentId);
  const cid = collegeMap.get(i.collegeId);
  if (!sid || !cid) return;

  const exists = await pool
    .request()
    .input('sid', sql.Int, sid)
    .input('cid', sql.Int, cid)
    .query('SELECT ApplicationID FROM StudentApplications WHERE StudentID = @sid AND CollegeID = @cid');

  if (exists.recordset[0]) {
    await pool
      .request()
      .input('sid', sql.Int, sid)
      .input('cid', sql.Int, cid)
      .input('st', sql.NVarChar(30), i.status || 'Interested')
      .input('ap', sql.Bit, i.approvedByAdmin ? 1 : 0)
      .query(`
        UPDATE StudentApplications
        SET Status = @st, ApprovedByAdmin = @ap
        WHERE StudentID = @sid AND CollegeID = @cid
      `);
  } else {
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
}

async function main() {
  const sourcePath = resolveJsonFile();
  if (!sourcePath) {
    console.log('No ams-local-db.json or .migrated.bak to import.');
    process.exit(0);
  }

  const db = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const pool = await getPool();

  const roleIds = {
    admin: await roleId(pool, 'admin'),
    college: await roleId(pool, 'college'),
    student: await roleId(pool, 'student'),
  };

  const userMap = new Map();
  for (const u of db.users || []) {
    await upsertUser(pool, roleIds, u, userMap);
  }

  const collegeMap = new Map();
  for (const c of db.colleges || []) {
    await upsertCollege(pool, c, userMap, collegeMap);
  }

  const studentMap = new Map();
  for (const s of db.students || []) {
    try {
      await upsertStudent(pool, s, userMap, studentMap);
    } catch (err) {
      console.error('Student migration error for:', s.email, '-', err.message);
      throw err;
    }
  }

  await updateStudentInterestedCollege(pool, db.students || [], studentMap, collegeMap);

  for (const i of db.interests || []) {
    await upsertInterest(pool, i, studentMap, collegeMap);
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
