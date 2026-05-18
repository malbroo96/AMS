const asyncHandler = require('../utils/asyncHandler');
const studentService = require('../services/student.service');

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.getProfile(req.user.id);
  res.json({ success: true, data: profile });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: profile });
});
