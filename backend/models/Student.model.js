const { sql, getPool } = require('../config/database');

function toSqlDateString(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
  }
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function toSqlDecimal(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const StudentModel = {
  async findByUserId(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
          s.StudentID AS id,
          s.UserID AS user_id,
          sp.DateOfBirth AS dob,
          sp.Gender AS gender,
          sp.FatherName AS parent_name,
          sp.AddressLine1 AS address,
          sad.Qualification AS grade,
          sad.Board AS board,
          sad.TenthPercentage AS percentage,
          sp.ProfilePhotoUrl AS profile_image,
          u.FullName AS name,
          u.Email AS email,
          u.Phone AS phone
        FROM Students s
        INNER JOIN Users u ON u.UserID = s.UserID
        LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
        LEFT JOIN StudentAcademicDetails sad ON sad.StudentID = s.StudentID
        WHERE s.UserID = @user_id
      `);
    return result.recordset[0] || null;
  },

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          s.StudentID AS id,
          s.UserID AS user_id,
          sp.DateOfBirth AS dob,
          sp.Gender AS gender,
          sp.FatherName AS parent_name,
          sp.AddressLine1 AS address,
          sad.Qualification AS grade,
          sad.Board AS board,
          sad.TenthPercentage AS percentage,
          sp.ProfilePhotoUrl AS profile_image,
          u.FullName AS name,
          u.Email AS email,
          u.Phone AS phone
        FROM Students s
        INNER JOIN Users u ON u.UserID = s.UserID
        LEFT JOIN StudentProfiles sp ON sp.StudentID = s.StudentID
        LEFT JOIN StudentAcademicDetails sad ON sad.StudentID = s.StudentID
        WHERE s.StudentID = @id
      `);
    return result.recordset[0] || null;
  },

  async create(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .query(`
        INSERT INTO Students (UserID)
        OUTPUT inserted.StudentID
        VALUES (@user_id)
      `);
    const studentId = result.recordset[0].StudentID;

    // Get user name and details for StudentProfiles
    let firstName = 'Student';
    let lastName = '';
    const userRes = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .query('SELECT FullName, Email, Phone FROM Users WHERE UserID = @user_id');
    if (userRes.recordset[0]) {
      const fullName = userRes.recordset[0].FullName || '';
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0] || 'Student';
      lastName = parts.slice(1).join(' ') || '';
    }

    await pool
      .request()
      .input('student_id', sql.Int, studentId)
      .input('first_name', sql.NVarChar(100), firstName)
      .input('last_name', sql.NVarChar(100), lastName)
      .query(`
        INSERT INTO StudentProfiles (StudentID, FirstName, LastName, ProfileCompletionPercentage, ProfileStatus)
        VALUES (@student_id, @first_name, @last_name, 0, 'Incomplete')
      `);

    await pool
      .request()
      .input('student_id', sql.Int, studentId)
      .query(`
        INSERT INTO StudentAcademicDetails (StudentID)
        VALUES (@student_id)
      `);

    return this.findById(studentId);
  },

  async update(userId, data) {
    const pool = await getPool();
    const studentCheck = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .query('SELECT StudentID FROM Students WHERE UserID = @user_id');
    const student = studentCheck.recordset[0];
    if (!student) return null;
    const studentId = student.StudentID;
    const dob = toSqlDateString(data.dob);
    const percentage = toSqlDecimal(data.percentage);

    // Upsert StudentProfiles
    const profileCheck = await pool
      .request()
      .input('student_id', sql.Int, studentId)
      .query('SELECT StudentID FROM StudentProfiles WHERE StudentID = @student_id');
    const profileExists = !!profileCheck.recordset[0];

    let firstName = 'Student';
    let lastName = '';
    const userRes = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .query('SELECT FullName, Email, Phone FROM Users WHERE UserID = @user_id');
    if (userRes.recordset[0]) {
      const fullName = userRes.recordset[0].FullName || '';
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0] || 'Student';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (profileExists) {
      await pool
        .request()
        .input('student_id', sql.Int, studentId)
        .input('dob', sql.NVarChar(10), dob)
        .input('gender', sql.NVarChar(20), data.gender || null)
        .input('parent_name', sql.NVarChar(150), data.parentName || null)
        .input('address', sql.NVarChar(255), data.address || null)
        .input('profile_image', sql.NVarChar(2048), data.profileImage || null)
        .query(`
          UPDATE StudentProfiles
          SET DateOfBirth = CONVERT(date, @dob, 23), Gender = @gender, FatherName = @parent_name,
              AddressLine1 = @address, ProfilePhotoUrl = @profile_image,
              UpdatedAt = SYSUTCDATETIME()
          WHERE StudentID = @student_id
        `);
    } else {
      await pool
        .request()
        .input('student_id', sql.Int, studentId)
        .input('first_name', sql.NVarChar(100), firstName)
        .input('last_name', sql.NVarChar(100), lastName)
        .input('dob', sql.NVarChar(10), dob)
        .input('gender', sql.NVarChar(20), data.gender || null)
        .input('parent_name', sql.NVarChar(150), data.parentName || null)
        .input('address', sql.NVarChar(255), data.address || null)
        .input('profile_image', sql.NVarChar(2048), data.profileImage || null)
        .query(`
          INSERT INTO StudentProfiles (StudentID, FirstName, LastName, DateOfBirth, Gender, FatherName, AddressLine1, ProfilePhotoUrl, ProfileCompletionPercentage, ProfileStatus)
          VALUES (@student_id, @first_name, @last_name, CONVERT(date, @dob, 23), @gender, @parent_name, @address, @profile_image, 0, 'Incomplete')
        `);
    }

    // Upsert StudentAcademicDetails
    const acadCheck = await pool
      .request()
      .input('student_id', sql.Int, studentId)
      .query('SELECT StudentID FROM StudentAcademicDetails WHERE StudentID = @student_id');
    const acadExists = !!acadCheck.recordset[0];

    if (acadExists) {
      await pool
        .request()
        .input('student_id', sql.Int, studentId)
        .input('grade', sql.NVarChar(100), data.grade || null)
        .input('board', sql.NVarChar(100), data.board || null)
        .input('percentage', sql.Decimal(5, 2), percentage)
        .query(`
          UPDATE StudentAcademicDetails
          SET Qualification = @grade, Board = @board, TenthPercentage = @percentage,
              UpdatedAt = SYSUTCDATETIME()
          WHERE StudentID = @student_id
        `);
    } else {
      await pool
        .request()
        .input('student_id', sql.Int, studentId)
        .input('grade', sql.NVarChar(100), data.grade || null)
        .input('board', sql.NVarChar(100), data.board || null)
        .input('percentage', sql.Decimal(5, 2), percentage)
        .query(`
          INSERT INTO StudentAcademicDetails (StudentID, Qualification, Board, TenthPercentage)
          VALUES (@student_id, @grade, @board, @percentage)
        `);
    }

    return this.findByUserId(userId);
  },

  async count() {
    const pool = await getPool();
    const result = await pool.request().query('SELECT COUNT(*) AS total FROM Students');
    return result.recordset[0].total;
  },
};

module.exports = StudentModel;
