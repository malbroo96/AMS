const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, notificationController.getNotifications);
router.patch('/:id/read', authMiddleware, notificationController.markRead);
router.patch('/read-all', authMiddleware, notificationController.markAllRead);

module.exports = router;
