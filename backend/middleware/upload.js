const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { upload } = require('../config/env');

const allowedMimes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
];

const fileFilter = (_req, file, cb) => {
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new ApiError('Invalid file type', 400));
  }
  cb(null, true);
};

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: upload.maxFileSizeMb * 1024 * 1024 },
});

const collegeAssetAllowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

const collegeAssetFileFilter = (_req, file, cb) => {
  if (!collegeAssetAllowedMimes.includes(file.mimetype)) {
    return cb(new ApiError('Only PNG, JPEG, and WebP images are allowed', 400));
  }
  cb(null, true);
};

const collegeAssetUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: collegeAssetFileFilter,
  limits: { fileSize: upload.maxFileSizeMb * 1024 * 1024 },
});

module.exports = { uploadMiddleware, collegeAssetUploadMiddleware };
