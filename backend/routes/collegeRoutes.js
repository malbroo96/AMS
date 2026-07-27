const express = require('express');
const collegeController = require('../controllers/collegeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { collegeAssetUploadMiddleware } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/upload-logo',
  authMiddleware,
  roleMiddleware('admin', 'college'),
  collegeAssetUploadMiddleware.single('file'),
  collegeController.uploadLogo
);

router.post(
  '/upload-banner',
  authMiddleware,
  roleMiddleware('admin', 'college'),
  collegeAssetUploadMiddleware.single('file'),
  collegeController.uploadBanner
);

router.delete('/delete-logo/:collegeId', authMiddleware, roleMiddleware('admin', 'college'), collegeController.deleteLogo);
router.get('/assets/:collegeId', authMiddleware, roleMiddleware('admin', 'college'), collegeController.getAssets);

module.exports = router;
