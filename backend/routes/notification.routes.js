const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('college'));

router.get('/', notificationController.list);
router.post('/', notificationController.create);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
