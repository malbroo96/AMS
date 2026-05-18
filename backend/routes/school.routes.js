const express = require('express');
const schoolController = require('../controllers/school.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { schoolSchema, courseSchema } = require('../validations/schemas');

const router = express.Router();

router.get('/', authMiddleware, schoolController.getSchools);
router.put('/my', authMiddleware, roleMiddleware('school_admin'), validate(schoolSchema), schoolController.updateMySchool);
router.get('/:id', authMiddleware, schoolController.getSchool);
router.get('/:id/courses', authMiddleware, schoolController.getCourses);

router.post('/', authMiddleware, roleMiddleware('super_admin'), validate(schoolSchema), schoolController.createSchool);
router.put('/:id', authMiddleware, roleMiddleware('super_admin'), validate(schoolSchema), schoolController.updateSchool);
router.delete('/:id', authMiddleware, roleMiddleware('super_admin'), schoolController.deleteSchool);

router.post('/:id/courses', authMiddleware, roleMiddleware('super_admin', 'school_admin'), validate(courseSchema), schoolController.addCourse);
router.put('/courses/:courseId', authMiddleware, roleMiddleware('super_admin', 'school_admin'), validate(courseSchema), schoolController.updateCourse);
router.delete('/courses/:courseId', authMiddleware, roleMiddleware('super_admin', 'school_admin'), schoolController.deleteCourse);

module.exports = router;
