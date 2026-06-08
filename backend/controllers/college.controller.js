// College Controller
const CollegeService = require('../services/college.service');
const CollegeCourseService = require('../services/collegeCourse.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Create a new college
exports.createCollege = asyncHandler(async (req, res) => {
  const college = await CollegeService.createCollege(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'College created successfully',
    data: college
  });
});

// Get all colleges with filters
exports.getAllColleges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, state, city, collegeType, naacGrade, search } = req.query;
  const skip = (page - 1) * limit;

  const filters = { state, city, collegeType, naacGrade, search };
  Object.keys(filters).forEach(key => !filters[key] && delete filters[key]);

  const { colleges, total } = await CollegeService.getAllColleges(filters, skip, parseInt(limit));

  res.status(200).json({
    success: true,
    data: colleges,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    }
  });
});

// Search colleges with advanced filters
exports.searchColleges = asyncHandler(async (req, res) => {
  const filters = req.query;
  const colleges = await CollegeService.searchColleges(filters);

  res.status(200).json({
    success: true,
    count: colleges.length,
    data: colleges
  });
});

// Get college by ID
exports.getCollegeById = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;
  const college = await CollegeService.getCollegeById(collegeId);

  // Record student view if requested by student
  if (req.user.role === 'student') {
    await CollegeService.addStudentView(collegeId);
  }

  res.status(200).json({
    success: true,
    data: college
  });
});

// Get college with all details
exports.getCollegeDetails = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;
  const details = await CollegeService.getCollegeDetails(collegeId);

  if (req.user.role === 'student') {
    await CollegeService.addStudentView(collegeId);
  }

  res.status(200).json({
    success: true,
    data: details
  });
});

// Update college profile
exports.updateCollegeProfile = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  // Verify college ownership
  const college = await CollegeService.getCollegeById(collegeId);
  if (college.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to update this college');
  }

  const updated = await CollegeService.updateCollegeProfile(collegeId, req.body, req.user.id);

  res.status(200).json({
    success: true,
    message: 'College updated successfully',
    data: updated
  });
});

// Get college dashboard stats
exports.getCollegeDashboardStats = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  const stats = await CollegeService.getCollegeDashboardStats(collegeId);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Delete college
exports.deleteCollege = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  const college = await CollegeService.getCollegeById(collegeId);
  if (college.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this college');
  }

  await CollegeService.deleteCollege(collegeId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'College deleted successfully'
  });
});

// Update college logo
exports.updateCollegeLogo = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  // Upload file to SharePoint and get URL
  const logoUrl = req.file.path; // This would be SharePoint URL

  const college = await CollegeService.updateCollegeProfile(
    collegeId,
    { logoUrl },
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Logo updated successfully',
    data: college
  });
});

// Update college banner
exports.updateCollegeBanner = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const bannerUrl = req.file.path;

  const college = await CollegeService.updateCollegeProfile(
    collegeId,
    { coverBannerUrl: bannerUrl },
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Banner updated successfully',
    data: college
  });
});

// Get all courses for a college
exports.getCollegeCourses = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  const courses = await CollegeCourseService.getCoursesByCollege(collegeId);

  res.status(200).json({
    success: true,
    data: courses
  });
});

// Add a new course
exports.addCourse = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;
  const courseData = { ...req.body, collegeId };

  const course = await CollegeCourseService.createCourse(courseData);

  res.status(201).json({
    success: true,
    message: 'Course added successfully',
    data: course
  });
});

// Update a course
exports.updateCourse = asyncHandler(async (req, res) => {
  const { collegeId, courseId } = req.params;

  const course = await CollegeCourseService.updateCourse(courseId, req.body);

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: course
  });
});

// Delete a course
exports.deleteCourse = asyncHandler(async (req, res) => {
  const { collegeId, courseId } = req.params;

  await CollegeCourseService.deleteCourse(courseId);

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
});
