const asyncHandler = require('../utils/asyncHandler');
const schoolService = require('../services/school.service');
const SchoolModel = require('../models/School.model');

exports.getSchools = asyncHandler(async (req, res) => {
  const data = await schoolService.list(req.query);
  res.json({ success: true, data });
});

exports.getSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.getById(req.params.id);
  res.json({ success: true, data: school });
});

exports.createSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data: school });
});

exports.updateSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.update(req.params.id, req.body);
  res.json({ success: true, data: school });
});

exports.deleteSchool = asyncHandler(async (req, res) => {
  const result = await schoolService.remove(req.params.id);
  res.json({ success: true, data: result });
});

/** School admin updates their own school */
exports.updateMySchool = asyncHandler(async (req, res) => {
  const school = await SchoolModel.findByAdminId(req.user.id);
  if (!school) return res.status(404).json({ success: false, message: 'No school assigned' });
  const updated = await schoolService.update(school.id, req.body);
  res.json({ success: true, data: updated });
});

exports.getCourses = asyncHandler(async (req, res) => {
  const courses = await schoolService.getCourses(req.params.id);
  res.json({ success: true, data: courses });
});

exports.addCourse = asyncHandler(async (req, res) => {
  const course = await schoolService.addCourse(req.params.id, req.body);
  res.status(201).json({ success: true, data: course });
});

exports.updateCourse = asyncHandler(async (req, res) => {
  let schoolId;
  if (req.user.role === 'school_admin') {
    const school = await SchoolModel.findByAdminId(req.user.id);
    schoolId = school?.id;
  }
  const course = await schoolService.updateCourse(req.params.courseId, req.body, schoolId);
  res.json({ success: true, data: course });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
  let schoolId;
  if (req.user.role === 'school_admin') {
    const school = await SchoolModel.findByAdminId(req.user.id);
    schoolId = school?.id;
  }
  const result = await schoolService.deleteCourse(req.params.courseId, schoolId);
  res.json({ success: true, data: result });
});
