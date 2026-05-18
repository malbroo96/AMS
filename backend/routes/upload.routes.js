const express = require('express');
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

router.post('/', authMiddleware, uploadMiddleware.single('file'), uploadController.uploadFile);
router.post('/profile', authMiddleware, roleMiddleware('student'), uploadMiddleware.single('file'), uploadController.uploadProfileImage);
router.post('/school', authMiddleware, roleMiddleware('school_admin'), uploadMiddleware.single('file'), uploadController.uploadSchoolMedia);

module.exports = router;
