const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { profileSchema } = require('../validations/schemas');

const router = express.Router();

router.get('/profile', authMiddleware, roleMiddleware('student'), studentController.getProfile);
router.put('/profile', authMiddleware, roleMiddleware('student'), validate(profileSchema), studentController.updateProfile);

module.exports = router;
