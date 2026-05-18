const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { adminUserSchema } = require('../validations/schemas');

const router = express.Router();

router.get('/dashboard', authMiddleware, roleMiddleware('super_admin'), adminController.getDashboard);
router.get('/analytics', authMiddleware, roleMiddleware('super_admin'), adminController.getDashboard);

router.get('/admins', authMiddleware, roleMiddleware('super_admin'), adminController.getSchoolAdmins);
router.post('/admins', authMiddleware, roleMiddleware('super_admin'), validate(adminUserSchema), adminController.createSchoolAdmin);
router.patch('/admins/:id/approve', authMiddleware, roleMiddleware('super_admin'), adminController.approveSchoolAdmin);
router.delete('/admins/:id', authMiddleware, roleMiddleware('super_admin'), adminController.deleteSchoolAdmin);

module.exports = router;
