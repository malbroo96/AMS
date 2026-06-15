const studentService = require('../services/student.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.getStudentProfile(req.user.id);
  res.json({ success: true, data: profile });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.updateStudentProfile(req.user.id, req.body);
  res.json({ success: true, data: profile });
});
