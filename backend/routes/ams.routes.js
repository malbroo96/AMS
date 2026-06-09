const express = require('express');
const amsController = require('../controllers/ams.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { collegeAssetUploadMiddleware } = require('../middleware/upload');

const router = express.Router();

router.get('/colleges', authMiddleware, amsController.listColleges);
router.get('/college-search', amsController.searchCollegeProfiles);
router.get('/college-search/:collegeId', amsController.publicCollegeProfile);
router.post('/college-search/:collegeId/enquiries', amsController.createCollegeEnquiry);

router.get('/student/dashboard', authMiddleware, roleMiddleware('student'), amsController.studentDashboard);
router.post('/student/interests', authMiddleware, roleMiddleware('student'), amsController.markInterest);

router.get('/college/dashboard', authMiddleware, roleMiddleware('college'), amsController.collegeDashboard);
router.get('/college/profile', authMiddleware, roleMiddleware('college'), amsController.collegeProfile);
router.put('/college/profile', authMiddleware, roleMiddleware('college'), amsController.updateCollegeProfile);
router.post('/college/profile/courses', authMiddleware, roleMiddleware('college'), amsController.createCollegeCourse);
router.put('/college/profile/courses/:courseId', authMiddleware, roleMiddleware('college'), amsController.updateCollegeCourse);
router.delete('/college/profile/courses/:courseId', authMiddleware, roleMiddleware('college'), amsController.deleteCollegeCourse);
router.post('/college/profile/achievements', authMiddleware, roleMiddleware('college'), amsController.createCollegeAchievement);
router.put('/college/profile/achievements/:achievementId', authMiddleware, roleMiddleware('college'), amsController.updateCollegeAchievement);
router.delete('/college/profile/achievements/:achievementId', authMiddleware, roleMiddleware('college'), amsController.deleteCollegeAchievement);
router.post(
  '/college/profile/gallery',
  authMiddleware,
  roleMiddleware('college'),
  collegeAssetUploadMiddleware.single('file'),
  amsController.createCollegeGalleryImage
);
router.put(
  '/college/profile/gallery/:imageId',
  authMiddleware,
  roleMiddleware('college'),
  collegeAssetUploadMiddleware.single('file'),
  amsController.updateCollegeGalleryImage
);
router.delete('/college/profile/gallery/:imageId', authMiddleware, roleMiddleware('college'), amsController.deleteCollegeGalleryImage);
router.put('/college/profile/enquiries/:enquiryId', authMiddleware, roleMiddleware('college'), amsController.updateCollegeEnquiry);

router.get('/admin/dashboard', authMiddleware, roleMiddleware('admin'), amsController.adminDashboard);
router.get('/admin/students', authMiddleware, roleMiddleware('admin'), amsController.adminStudents);
router.post('/admin/students', authMiddleware, roleMiddleware('admin'), amsController.createStudent);
router.put('/admin/students/:id', authMiddleware, roleMiddleware('admin'), amsController.updateStudent);
router.delete('/admin/students/:id', authMiddleware, roleMiddleware('admin'), amsController.deleteStudent);
router.get('/admin/interests', authMiddleware, roleMiddleware('admin'), amsController.adminInterests);
router.post('/admin/colleges', authMiddleware, roleMiddleware('admin'), amsController.createCollege);
router.put('/admin/colleges/:id', authMiddleware, roleMiddleware('admin'), amsController.updateCollege);
router.delete('/admin/colleges/:id', authMiddleware, roleMiddleware('admin'), amsController.deleteCollege);
router.patch('/admin/interests/:id/permission', authMiddleware, roleMiddleware('admin'), amsController.setInterestPermission);

module.exports = router;
