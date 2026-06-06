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

router.put(
  '/update-logo',
  authMiddleware,
  roleMiddleware('admin', 'college'),
  collegeAssetUploadMiddleware.single('file'),
  collegeController.updateLogo
);

router.delete('/delete-logo/:collegeId', authMiddleware, roleMiddleware('admin', 'college'), collegeController.deleteLogo);
router.get('/assets/:collegeId', authMiddleware, roleMiddleware('admin', 'college'), collegeController.getAssets);
router.get('/my-assets', authMiddleware, roleMiddleware('college'), collegeController.getAssets);
router.get('/logo/:collegeId', collegeController.getLogo);

module.exports = router;
