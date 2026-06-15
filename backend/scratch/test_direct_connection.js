const { Connection } = require('tedious');
const { db } = require('../config/env');

const config = {
  server: db.server,
  authentication: {
    type: 'default',
    options: {
      userName: db.user,
      password: db.password
    }
  },
  options: {
    database: db.database,
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1',
      ciphers: 'DEFAULT@SECLEVEL=0'
    }
  }
};

console.log('Connecting with config:', {
  server: config.server,
  user: config.authentication.options.userName,
  database: config.options.database
});

const connection = new Connection(config);

connection.on('connect', (err) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connection successful!');
  }
  process.exit(0);
});

connection.connect();
