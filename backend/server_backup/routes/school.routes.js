const express = require('express');
const schoolController = require('../controllers/school.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { schoolSchema, courseSchema } = require('../validations/school.validation');

const router = express.Router();

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    error.isJoi = true;
    return next(error);
  }
  next();
};

router.get('/', authMiddleware, schoolController.getSchools);
router.get('/:id', authMiddleware, schoolController.getSchool);
router.get('/:id/courses', authMiddleware, schoolController.getCourses);

router.post(
  '/',
  authMiddleware,
  roleMiddleware('super_admin'),
  validateBody(schoolSchema),
  schoolController.createSchool
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('super_admin'),
  validateBody(schoolSchema),
  schoolController.updateSchool
);
router.delete('/:id', authMiddleware, roleMiddleware('super_admin'), schoolController.deleteSchool);

router.post(
  '/:id/courses',
  authMiddleware,
  roleMiddleware('super_admin', 'school_admin'),
  validateBody(courseSchema),
  schoolController.addCourse
);

module.exports = router;
