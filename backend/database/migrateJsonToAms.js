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
        SET RoleID = @rid, PasswordHash = @pw, FullName = @name, Phone = @phone, IsActive = @approved
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
        INSERT INTO Users (RoleID, Email, PasswordHash, FullName, Phone, IsActive)
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
      .query(`
        UPDATE Colleges
        SET CollegeName = @cn, Email = @email, UserID = @uid, Status = @st
        WHERE CollegeID = @id
      `);
  } else {
    const ins = await pool
      .request()
      .input('cn', sql.VarChar(150), c.collegeName || '')
      .input('email', sql.VarChar(150), email)
      .input('uid', sql.Int, uid)
      .input('st', sql.VarChar(50), c.status || 'approved')
      .query(`
        INSERT INTO Colleges (CollegeName, Email, UserID, Status)
        OUTPUT inserted.CollegeID
        VALUES (@cn, @email, @uid, @st)
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
  if (!studentId) {
    const ins = await pool
      .request()
      .input('uid', sql.Int, uid)
      .query(`
        INSERT INTO Students (UserID)
        OUTPUT inserted.StudentID
        VALUES (@uid)
      `);
    studentId = ins.recordset[0].StudentID;
  }

  // Parse name into FirstName and LastName
  const fullName = s.name || '';
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || 'Student';
  const lastName = parts.slice(1).join(' ') || '';

  const dobVal = dobIsoDate(s.dateOfBirth);
  
  // Upsert StudentProfiles
  const profExists = await pool.request().input('sid', sql.Int, studentId).query('SELECT 1 FROM StudentProfiles WHERE StudentID = @sid');
  if (profExists.recordset[0]) {
    await pool.request()
      .input('sid', sql.Int, studentId)
      .input('fn', sql.NVarChar(100), firstName)
      .input('ln', sql.NVarChar(100), lastName)
      .input('email', sql.NVarChar(255), s.email || null)
      .input('mobile', sql.NVarChar(30), s.mobile || null)
      .input('gender', sql.NVarChar(20), s.gender || null)
      .input('dob', sql.Date, dobVal)
      .input('address', sql.NVarChar(255), s.address || null)
      .query(`
        UPDATE StudentProfiles
        SET FirstName = @fn, LastName = @ln, Email = @email, Mobile = @mobile,
            Gender = @gender, DateOfBirth = @dob, AddressLine1 = @address,
            UpdatedAt = SYSUTCDATETIME()
        WHERE StudentID = @sid
      `);
  } else {
    await pool.request()
      .input('sid', sql.Int, studentId)
      .input('fn', sql.NVarChar(100), firstName)
      .input('ln', sql.NVarChar(100), lastName)
      .input('email', sql.NVarChar(255), s.email || null)
      .input('mobile', sql.NVarChar(30), s.mobile || null)
      .input('gender', sql.NVarChar(20), s.gender || null)
      .input('dob', sql.Date, dobVal)
      .input('address', sql.NVarChar(255), s.address || null)
      .query(`
        INSERT INTO StudentProfiles (StudentID, FirstName, LastName, Email, Mobile, Gender, DateOfBirth, AddressLine1, ProfileCompletionPercentage, ProfileStatus)
        VALUES (@sid, @fn, @ln, @email, @mobile, @gender, @dob, @address, 100, 'Complete')
      `);
  }

  // Upsert StudentAcademicDetails
  const acadExists = await pool.request().input('sid', sql.Int, studentId).query('SELECT 1 FROM StudentAcademicDetails WHERE StudentID = @sid');
  if (acadExists.recordset[0]) {
    await pool.request()
      .input('sid', sql.Int, studentId)
      .input('qual', sql.NVarChar(100), s.education || null)
      .query(`
        UPDATE StudentAcademicDetails
        SET Qualification = @qual, UpdatedAt = SYSUTCDATETIME()
        WHERE StudentID = @sid
      `);
  } else {
    await pool.request()
      .input('sid', sql.Int, studentId)
      .input('qual', sql.NVarChar(100), s.education || null)
      .query(`
        INSERT INTO StudentAcademicDetails (StudentID, Qualification)
        VALUES (@sid, @qual)
      `);
  }

  studentMap.set(s.id, studentId);
  console.log('Student:', s.name, '-> StudentID', studentId);
}

async function updateStudentInterestedCollege(pool, students, studentMap, collegeMap) {
  // Bypassed: InterestedCollege column is deprecated in the new schema. 
  // Student interests are now handled through dbo.Applications in upsertInterest.
}

async function upsertInterest(pool, i, studentMap, collegeMap) {
  const sid = studentMap.get(i.studentId);
  const cid = collegeMap.get(i.collegeId);
  if (!sid || !cid) return;

  // Resolve CollegeCourseID
  let courseRes = await pool
    .request()
    .input('cid', sql.Int, cid)
    .query('SELECT TOP 1 CollegeCourseID FROM dbo.CollegeCourses WHERE CollegeID = @cid');
  let collegeCourseId = courseRes.recordset[0]?.CollegeCourseID;
  if (!collegeCourseId) {
    let defaultCourse = await pool.request().query('SELECT TOP 1 CourseID FROM dbo.Courses');
    let courseId = defaultCourse.recordset[0]?.CourseID;
    if (!courseId) {
      let insCourse = await pool.request().query("INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES ('General Course', 'GEN')");
      courseId = insCourse.recordset[0].CourseID;
    }
    let defaultBranch = await pool.request().query('SELECT TOP 1 BranchID FROM dbo.Branches');
    let branchId = defaultBranch.recordset[0]?.BranchID;
    if (!branchId) {
      let insBranch = await pool.request().input('cid', sql.Int, courseId).query("INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@cid, 'General Branch', 'GEN')");
      branchId = insBranch.recordset[0].BranchID;
    }
    let insCc = await pool.request()
      .input('cid', sql.Int, cid)
      .input('courseId', sql.Int, courseId)
      .input('branchId', sql.Int, branchId)
      .query("INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee) OUTPUT inserted.CollegeCourseID VALUES (@cid, @courseId, @branchId, 4.0, 60, 50000.00)");
    collegeCourseId = insCc.recordset[0].CollegeCourseID;
  }

  const status = i.approvedByAdmin || i.status === 'Approved' ? 'Approved' : i.status || 'Interested';

  const exists = await pool
    .request()
    .input('sid', sql.Int, sid)
    .input('ccid', sql.Int, collegeCourseId)
    .query('SELECT ApplicationID FROM dbo.Applications WHERE StudentID = @sid AND CollegeCourseID = @ccid');

  if (exists.recordset[0]) {
    await pool
      .request()
      .input('sid', sql.Int, sid)
      .input('ccid', sql.Int, collegeCourseId)
      .input('st', sql.NVarChar(50), status)
      .query(`
        UPDATE dbo.Applications
        SET CurrentStatus = @st, UpdatedAt = SYSUTCDATETIME()
        WHERE StudentID = @sid AND CollegeCourseID = @ccid
      `);
  } else {
    await pool
      .request()
      .input('sid', sql.Int, sid)
      .input('ccid', sql.Int, collegeCourseId)
      .input('st', sql.NVarChar(50), status)
      .query(`
        INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus)
        VALUES (@sid, @ccid, @st)
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

  // ActivityLogs table is deprecated in the authoritative schema.

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
