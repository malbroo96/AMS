require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'admission_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
