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

exports.collegeProfile = asyncHandler(async (req, res) => {
  const profile = await amsService.getCollegeProfile(req.user);
  console.log('[DEBUG] [College Profile API Payload]:', JSON.stringify(profile, null, 2));
  res.json({ success: true, data: profile });
});

exports.updateCollegeProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.updateCollegeProfile(req.user, req.body) });
});

exports.searchCollegeProfiles = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.searchCollegeProfiles(req.query) });
});

exports.publicCollegeProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.getPublicCollegeProfile(req.params.collegeId) });
});

exports.createCollegeCourse = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await amsService.saveCollegeCourse(req.user, null, req.body) });
});

exports.updateCollegeCourse = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.saveCollegeCourse(req.user, req.params.courseId, req.body) });
});

exports.deleteCollegeCourse = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.deleteCollegeCourse(req.user, req.params.courseId) });
});

exports.createCollegeAchievement = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await amsService.saveCollegeAchievement(req.user, null, req.body) });
});

exports.updateCollegeAchievement = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.saveCollegeAchievement(req.user, req.params.achievementId, req.body) });
});

exports.deleteCollegeAchievement = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.deleteCollegeAchievement(req.user, req.params.achievementId) });
});

exports.createCollegeGalleryImage = asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    data: await amsService.saveCollegeGalleryImage(req.user, null, req.body, req.file),
  });
});

exports.updateCollegeGalleryImage = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await amsService.saveCollegeGalleryImage(req.user, req.params.imageId, req.body, req.file),
  });
});

exports.deleteCollegeGalleryImage = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.deleteCollegeGalleryImage(req.user, req.params.imageId) });
});

exports.createCollegeEnquiry = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await amsService.createCollegeEnquiry(req.params.collegeId, req.body) });
});

exports.updateCollegeEnquiry = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.updateCollegeEnquiry(req.user, req.params.enquiryId, req.body) });
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
  res.json({ success: true, data: await amsService.setInterestPermission(req.params.id, req.body.approvedByAdmin, req.user.id) });
});

exports.listAllCourses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.listAllCourses() });
});

exports.listAllBranches = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await amsService.listAllBranches() });
});
