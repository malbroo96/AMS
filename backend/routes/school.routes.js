const express = require('express');
const schoolController = require('../controllers/school.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { schoolSchema, courseSchema } = require('../validations/schemas');

const router = express.Router();

router.get('/', authMiddleware, schoolController.getSchools);
router.put('/my', authMiddleware, roleMiddleware('school_admin', 'college'), validate(schoolSchema), schoolController.updateMySchool);
router.get('/:id', authMiddleware, schoolController.getSchool);
router.get('/:id/courses', authMiddleware, schoolController.getCourses);

router.post('/', authMiddleware, roleMiddleware('super_admin', 'admin'), validate(schoolSchema), schoolController.createSchool);
router.put('/:id', authMiddleware, roleMiddleware('super_admin', 'admin'), validate(schoolSchema), schoolController.updateSchool);
router.delete('/:id', authMiddleware, roleMiddleware('super_admin', 'admin'), schoolController.deleteSchool);

router.post('/:id/courses', authMiddleware, roleMiddleware('super_admin', 'admin', 'school_admin', 'college'), validate(courseSchema), schoolController.addCourse);
router.put('/courses/:courseId', authMiddleware, roleMiddleware('super_admin', 'admin', 'school_admin', 'college'), validate(courseSchema), schoolController.updateCourse);
router.delete('/courses/:courseId', authMiddleware, roleMiddleware('super_admin', 'admin', 'school_admin', 'college'), schoolController.deleteCourse);

module.exports = router;


