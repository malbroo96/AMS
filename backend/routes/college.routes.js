// College Routes
const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/college.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/search', collegeController.searchColleges);
router.get('/all', collegeController.getAllColleges);
router.get('/:collegeId', collegeController.getCollegeById);
router.get('/:collegeId/details', collegeController.getCollegeDetails);
router.get('/:collegeId/courses', collegeController.getCollegeCourses);

// Protected routes - College Admin/Super Admin only
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.createCollege
);

router.put(
  '/:collegeId',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.updateCollegeProfile
);

router.delete(
  '/:collegeId',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.deleteCollege
);

// College logo and banner upload routes
router.post(
  '/:collegeId/logo',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  upload.single('logo'),
  collegeController.updateCollegeLogo
);

router.post(
  '/:collegeId/banner',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  upload.single('banner'),
  collegeController.updateCollegeBanner
);

// Dashboard stats
router.get(
  '/:collegeId/dashboard',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.getCollegeDashboardStats
);

// Course management routes
router.post(
  '/:collegeId/courses',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.addCourse
);

router.put(
  '/:collegeId/courses/:courseId',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.updateCourse
);

router.delete(
  '/:collegeId/courses/:courseId',
  authMiddleware,
  roleMiddleware(['admin', 'college']),
  collegeController.deleteCourse
);

module.exports = router;
