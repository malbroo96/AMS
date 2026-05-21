const express = require('express');
const amsController = require('../controllers/ams.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/colleges', authMiddleware, amsController.listColleges);

router.get('/student/dashboard', authMiddleware, roleMiddleware('student'), amsController.studentDashboard);
router.post('/student/interests', authMiddleware, roleMiddleware('student'), amsController.markInterest);

router.get('/college/dashboard', authMiddleware, roleMiddleware('college'), amsController.collegeDashboard);

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
