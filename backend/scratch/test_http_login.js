const fetch = require('isomorphic-fetch');

async function testHttpLogin() {
  console.log('--- TESTING HTTP LOGIN ENDPOINT ---');
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@23',
        password: 'ChangeMeAdmin123!'
      })
    });

    const data = await res.json();
    console.log('HTTP Response Status:', res.status);
    console.log('HTTP Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('HTTP Request failed:', err);
  }
}

testHttpLogin();
