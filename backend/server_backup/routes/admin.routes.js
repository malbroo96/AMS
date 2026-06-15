const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { adminUserSchema } = require('../validations/school.validation');

const router = express.Router();

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    error.isJoi = true;
    return next(error);
  }
  next();
};

router.get('/admins', authMiddleware, roleMiddleware('super_admin'), adminController.getSchoolAdmins);
router.post(
  '/admins',
  authMiddleware,
  roleMiddleware('super_admin'),
  validateBody(adminUserSchema),
  adminController.createSchoolAdmin
);
router.delete(
  '/admins/:id',
  authMiddleware,
  roleMiddleware('super_admin'),
  adminController.deleteSchoolAdmin
);

module.exports = router;
