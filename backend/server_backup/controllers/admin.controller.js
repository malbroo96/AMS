const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getSchoolAdmins = asyncHandler(async (req, res) => {
  const result = await adminService.listSchoolAdmins(req.query);
  res.json({ success: true, data: result });
});

exports.createSchoolAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.createSchoolAdmin(req.body);
  res.status(201).json({ success: true, data: admin });
});

exports.deleteSchoolAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.deleteSchoolAdmin(req.params.id);
  res.json({ success: true, data: result });
});
