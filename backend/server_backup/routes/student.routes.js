const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { profileSchema } = require('../validations/student.validation');

const router = express.Router();

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    error.isJoi = true;
    return next(error);
  }
  next();
};

router.get('/profile', authMiddleware, roleMiddleware('student'), studentController.getProfile);
router.put(
  '/profile',
  authMiddleware,
  roleMiddleware('student'),
  validateBody(profileSchema),
  studentController.updateProfile
);

module.exports = router;
