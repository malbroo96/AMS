const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { upload } = require('../config/env');

const uploadsPath = path.join(__dirname, '..', upload.dir);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsPath),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const fileFilter = (_req, file, cb) => {
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new ApiError('Invalid file type', 400));
  }
  cb(null, true);
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: upload.maxFileSizeMb * 1024 * 1024 },
});

module.exports = { uploadMiddleware, uploadsPath };
