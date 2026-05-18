const express = require('express');
const authRoutes = require('./auth.routes');
const schoolRoutes = require('./school.routes');
const applicationRoutes = require('./application.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');
const uploadRoutes = require('./upload.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/applications', applicationRoutes);
router.use('/students', studentRoutes);
router.use('/users', adminRoutes);
router.use('/analytics', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'E-Admin Admission Portal API is running',
    version: '2.0.0',
  });
});

module.exports = router;
