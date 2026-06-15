const asyncHandler = require('../utils/asyncHandler');
const { uploadDir } = require('../config/env');

exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `/${uploadDir}/${req.file.filename}`;
  res.status(201).json({
    success: true,
    data: {
      fileUrl,
      originalName: req.file.originalname,
      documentType: req.body.documentType || 'general',
    },
  });
});
