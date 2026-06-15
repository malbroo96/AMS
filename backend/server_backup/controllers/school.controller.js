const schoolService = require('../services/school.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getSchools = asyncHandler(async (req, res) => {
  const result = await schoolService.listSchools(req.query);
  res.json({ success: true, data: result });
});

exports.getSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.getSchoolById(req.params.id);
  res.json({ success: true, data: school });
});

exports.createSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.createSchool(req.body);
  res.status(201).json({ success: true, data: school });
});

exports.updateSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.updateSchool(req.params.id, req.body);
  res.json({ success: true, data: school });
});

exports.deleteSchool = asyncHandler(async (req, res) => {
  const result = await schoolService.deleteSchool(req.params.id);
  res.json({ success: true, data: result });
});

exports.getCourses = asyncHandler(async (req, res) => {
  const courses = await schoolService.getCoursesBySchool(req.params.id);
  res.json({ success: true, data: courses });
});

exports.addCourse = asyncHandler(async (req, res) => {
  const course = await schoolService.addCourse(req.params.id, req.body);
  res.status(201).json({ success: true, data: course });
});
