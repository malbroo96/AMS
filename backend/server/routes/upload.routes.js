const express = require('express');
const uploadController = require('../controllers/upload.controller');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware('student'),
  upload.single('file'),
  uploadController.uploadDocument
);

module.exports = router;
