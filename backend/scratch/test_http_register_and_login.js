const fetch = require('isomorphic-fetch');

async function testRegisterAndLogin() {
  console.log('--- TESTING HTTP REGISTER & LOGIN ENDPOINTS ---');
  
  const testEmail = `http_test_${Date.now()}@test.com`;
  const testPassword = 'Password123!';
  
  try {
    // 1. Register
    console.log(`\n1. Registering new student with email: ${testEmail}`);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'HTTP Tester Student',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        phone: '9999999999',
        role: 'student',
        dob: '2000-01-01',
        gender: 'male',
        parentName: 'HTTP Tester Parent',
        address: 'HTTP Tester Street'
      })
    });
    
    const regData = await regRes.json();
    console.log('Register Response Status:', regRes.status);
    console.log('Register Response Data:', JSON.stringify(regData, null, 2));

    if (regRes.status !== 201) {
      console.error('Registration failed, aborting login test.');
      return;
    }

    // 2. Login
    console.log(`\n2. Logging in with email: ${testEmail}`);
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response Data:', JSON.stringify(loginData, null, 2));

  } catch (err) {
    console.error('Request failed:', err);
  }
}

testRegisterAndLogin();
