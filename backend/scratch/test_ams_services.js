require('dotenv').config();
const amsSqlService = require('../services/amsSql.service');
const { getPool, closePool } = require('../config/database');

async function runTests() {
  console.log('--- STARTING AMS SQL SERVICE INTEGRATION TESTS ---');
  
  // 1. Get an active student UserID and StudentID
  const pool = await getPool();
  const studentUserRes = await pool.request().query(`
    SELECT TOP 1 s.UserID, s.StudentID 
    FROM dbo.Students s 
    INNER JOIN dbo.StudentProfiles sp ON sp.StudentID = s.StudentID
  `);
  
  if (studentUserRes.recordset.length === 0) {
    console.error('No students found in DB. Run migrateJsonToAms first.');
    await closePool();
    process.exit(1);
  }
  
  const student = studentUserRes.recordset[0];
  console.log(`Testing with Student: UserID=${student.UserID}, StudentID=${student.StudentID}`);
  
  // 2. Get an active CollegeID
  const collegeRes = await pool.request().query(`
    SELECT TOP 1 CollegeID FROM dbo.Colleges WHERE Status = 'approved'
  `);
  if (collegeRes.recordset.length === 0) {
    console.error('No active colleges found in DB.');
    await closePool();
    process.exit(1);
  }
  const collegeId = collegeRes.recordset[0].CollegeID;
  console.log(`Testing with College: CollegeID=${collegeId}`);

  // Test adminDashboard
  try {
    console.log('\nTesting: adminDashboard()');
    const adminDash = await amsSqlService.adminDashboard();
    console.log('Success! Keys in dashboard:', Object.keys(adminDash));
    console.log('Summary stats:', adminDash.stats);
  } catch (err) {
    console.error('FAILED adminDashboard():', err);
  }

  // Test getStudentDashboard
  let userObj = { id: student.UserID };
  try {
    console.log('\nTesting: getStudentDashboard()');
    const studentDash = await amsSqlService.getStudentDashboard(userObj);
    console.log('Success! Student Dashboard keys:', Object.keys(studentDash));
    console.log('Interests count:', studentDash.interests?.length);
  } catch (err) {
    console.error('FAILED getStudentDashboard():', err);
  }

  // Test adminStudents
  try {
    console.log('\nTesting: adminStudents()');
    const adminStuds = await amsSqlService.adminStudents();
    console.log('Success! Students count:', adminStuds.length);
    if (adminStuds.length > 0) {
      console.log('First student sample:', {
        id: adminStuds[0].id,
        name: adminStuds[0].name,
        email: adminStuds[0].email
      });
    }
  } catch (err) {
    console.error('FAILED adminStudents():', err);
  }

  // Test adminInterests
  try {
    console.log('\nTesting: adminInterests()');
    const adminInts = await amsSqlService.adminInterests();
    console.log('Success! Interests count:', adminInts.length);
    if (adminInts.length > 0) {
      console.log('First interest sample:', {
        id: adminInts[0].id,
        studentId: adminInts[0].studentId,
        collegeId: adminInts[0].collegeId,
        status: adminInts[0].status,
        approvedByAdmin: adminInts[0].approvedByAdmin
      });
    }
  } catch (err) {
    console.error('FAILED adminInterests():', err);
  }

  // Test markInterest
  try {
    console.log('\nTesting: markInterest()');
    const resMark = await amsSqlService.markInterest(userObj, collegeId);
    console.log('Success! markInterest response interests count:', resMark.interests?.length);
  } catch (err) {
    console.error('FAILED markInterest():', err);
  }

  await closePool();
  console.log('\n--- AMS SQL SERVICE INTEGRATION TESTS FINISHED ---');
}

runTests().catch(async (e) => {
  console.error('Unhandled test failure:', e);
  await closePool();
});
