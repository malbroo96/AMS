const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

exports.getDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboardAnalytics();
  res.json({ success: true, data });
});

exports.getSchoolAdmins = asyncHandler(async (req, res) => {
  const data = await adminService.listSchoolAdmins(req.query);
  res.json({ success: true, data });
});

exports.createSchoolAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.createSchoolAdmin(req.body);
  res.status(201).json({ success: true, data: admin });
});

exports.approveSchoolAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.approveSchoolAdmin(req.params.id);
  res.json({ success: true, data: admin });
});

exports.deleteSchoolAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.deleteSchoolAdmin(req.params.id);
  res.json({ success: true, data: result });
});
