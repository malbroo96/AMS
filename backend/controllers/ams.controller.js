const asyncHandler = require('../utils/asyncHandler');
const amsService = require('../services/ams.service');

exports.listColleges = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.listColleges(req.query) });
});

exports.markInterest = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await amsService.markInterest(req.user, req.body.collegeId) });
});

exports.studentDashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.getStudentDashboard(req.user) });
});

exports.collegeDashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.getCollegeDashboard(req.user) });
});

exports.adminDashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await amsService.adminDashboard() });
});

exports.adminStudents = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await amsService.adminStudents() });
});

exports.createStudent = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await amsService.createStudent(req.body) });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.updateStudent(req.params.id, req.body) });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.deleteStudent(req.params.id) });
});

exports.adminInterests = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await amsService.adminInterests() });
});

exports.createCollege = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await amsService.createCollege(req.user, req.body) });
});

exports.updateCollege = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.updateCollege(req.params.id, req.body) });
});

exports.deleteCollege = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.deleteCollege(req.params.id) });
});

exports.setInterestPermission = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.setInterestPermission(req.params.id, req.body.approvedByAdmin) });
});
