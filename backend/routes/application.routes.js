const express = require('express');
const applicationController = require('../controllers/application.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { applicationSchema, statusSchema } = require('../validations/schemas');

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware('student'), validate(applicationSchema), applicationController.apply);
router.get('/', authMiddleware, applicationController.getApplications);
router.get('/:id', authMiddleware, applicationController.getApplication);
router.put('/:id/status', authMiddleware, roleMiddleware('school_admin', 'super_admin'), validate(statusSchema), applicationController.updateStatus);

module.exports = router;
