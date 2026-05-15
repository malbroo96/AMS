const express = require('express');
const authRoutes = require('./auth.routes');
const schoolRoutes = require('./school.routes');
const applicationRoutes = require('./application.routes');
const studentRoutes = require('./student.routes');
const adminRoutes = require('./admin.routes');
const analyticsRoutes = require('./analytics.routes');
const uploadRoutes = require('./upload.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/applications', applicationRoutes);
router.use('/students', studentRoutes);
router.use('/users', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Admission Portal API is running' });
});

module.exports = router;
