require('dotenv').config();
const { getPool, closePool, sql } = require('../config/database');
const authService = require('../services/auth.service');
const UserModel = require('../models/User.model');

async function testAuth() {
  console.log('--- STARTING AUTH FLOW INTEGRATION TESTS ---');
  await getPool();

  const testEmail = `auth_test_${Date.now()}@test.com`;
  const testPassword = 'SecurePassword123!';
  let createdUserId = null;

  try {
    // 1. Register a test student user
    console.log(`\n1. Registering test user with email: ${testEmail}`);
    const regResult = await authService.register({
      name: 'Test Student User',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      phone: '1234567890',
      role: 'student',
      dob: '2000-01-01',
      gender: 'male',
      parentName: 'Test Parent',
      address: '123 Test Street'
    });

    console.log('Registration Success!');
    console.log('User ID:', regResult.user.id);
    console.log('User Role:', regResult.user.role);
    console.log('Has Token:', !!regResult.token);
    
    createdUserId = regResult.user.id;

    // 2. Register again (duplicate check)
    console.log('\n2. Testing duplicate email registration...');
    try {
      await authService.register({
        name: 'Test Student User 2',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'student'
      });
      console.error('FAIL: Duplicate email registration should have thrown an error!');
    } catch (err) {
      console.log('Success (Expected error):', err.message);
    }

    // 3. Login with correct password
    console.log('\n3. Testing login with correct credentials...');
    const loginResult = await authService.login({
      email: testEmail,
      password: testPassword
    });
    console.log('Login Success!');
    console.log('Logged in user ID:', loginResult.user.id);
    console.log('Logged in user isActive:', loginResult.user.isActive);

    // 4. Login with incorrect password
    console.log('\n4. Testing login with incorrect password...');
    try {
      await authService.login({
        email: testEmail,
        password: 'WrongPassword'
      });
      console.error('FAIL: Incorrect password login should have thrown an error!');
    } catch (err) {
      console.log('Success (Expected error):', err.message);
    }

    // 5. Get current user profile
    console.log('\n5. Fetching current user profile...');
    const profile = await authService.getCurrentUser(createdUserId);
    console.log('Success!');
    console.log('Profile Student Name:', profile.name);
    console.log('Profile Student DOB:', profile.student?.dob);
    console.log('Profile Student Parent Name:', profile.student?.parentName);

  } catch (err) {
    console.error('Test step failed:', err);
  } finally {
    if (createdUserId) {
      console.log(`\nCleaning up user ID: ${createdUserId}`);
      try {
        const pool = await getPool();
        // Since StudentDocuments and StudentProfiles have ON DELETE CASCADE to Students, 
        // we can delete Students and then Users.
        const sRes = await pool.request()
          .input('uid', sql.Int, createdUserId)
          .query('SELECT StudentID FROM Students WHERE UserID = @uid');
        if (sRes.recordset[0]) {
          const studentId = sRes.recordset[0].StudentID;
          // Delete from Applications first to avoid foreign key errors
          await pool.request().input('sid', sql.Int, studentId).query('DELETE FROM Applications WHERE StudentID = @sid');
          await pool.request().input('sid', sql.Int, studentId).query('DELETE FROM Students WHERE StudentID = @sid');
        }
        await UserModel.delete(createdUserId);
        console.log('Cleanup completed successfully.');
      } catch (err) {
        console.error('Failed to cleanup test user:', err);
      }
    }
    await closePool();
    console.log('\n--- AUTH FLOW INTEGRATION TESTS FINISHED ---');
  }
}

testAuth().catch(async (e) => {
  console.error('Unhandled script error:', e);
  await closePool();
});
