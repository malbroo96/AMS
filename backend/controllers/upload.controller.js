const asyncHandler = require('../utils/asyncHandler');
const { processUpload } = require('../services/upload.service');
const studentService = require('../services/student.service');
const schoolService = require('../services/school.service');
const SchoolModel = require('../models/School.model');

exports.uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const subfolder = req.body.folder || req.body.documentType || 'general';
  const result = await processUpload(req.file, subfolder);
  res.status(201).json({
    success: true,
    data: {
      fileUrl: result.url,
      publicId: result.publicId,
      storage: result.storage,
      documentType: req.body.documentType || 'general',
    },
  });
});

/** Student profile image upload */
exports.uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const result = await processUpload(req.file, 'profiles');
  await studentService.updateProfile(req.user.id, { profileImage: result.url });
  res.json({ success: true, data: { fileUrl: result.url } });
});

/** School admin school logo / media */
exports.uploadSchoolMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const school = await SchoolModel.findByAdminId(req.user.id);
  if (!school) {
    return res.status(404).json({ success: false, message: 'No school assigned' });
  }
  const result = await processUpload(req.file, 'schools');
  const field = req.body.type === 'logo' ? { logoUrl: result.url } : { description: school.description };
  if (req.body.type === 'logo') {
    await schoolService.update(school.id, { logoUrl: result.url, schoolName: school.school_name, city: school.city });
  }
  res.json({ success: true, data: { fileUrl: result.url } });
});
