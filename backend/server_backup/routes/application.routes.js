const express = require('express');
const applicationController = require('../controllers/application.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createApplicationSchema, statusSchema } = require('../validations/application.validation');

const router = express.Router();

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    error.isJoi = true;
    return next(error);
  }
  next();
};

router.post(
  '/',
  authMiddleware,
  roleMiddleware('student'),
  validateBody(createApplicationSchema),
  applicationController.createApplication
);
router.get('/', authMiddleware, applicationController.getApplications);
router.get('/:id', authMiddleware, applicationController.getApplication);
router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware('school_admin', 'super_admin'),
  validateBody(statusSchema),
  applicationController.updateStatus
);

module.exports = router;
