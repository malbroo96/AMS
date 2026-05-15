const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware('super_admin'),
  analyticsController.getAnalytics
);

module.exports = router;
