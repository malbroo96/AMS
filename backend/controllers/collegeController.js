const asyncHandler = require('../utils/asyncHandler');
const collegeAssetService = require('../services/collegeAsset.service');

exports.uploadLogo = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.uploadAsset({
    user: req.user,
    collegeId: req.body.collegeId,
    file: req.file,
    assetType: 'logo',
  });

  res.status(201).json({ success: true, data: result });
});

exports.uploadBanner = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.uploadAsset({
    user: req.user,
    collegeId: req.body.collegeId,
    file: req.file,
    assetType: 'banner',
  });

  res.status(201).json({ success: true, data: result });
});

exports.deleteLogo = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.deleteAsset({
    user: req.user,
    collegeId: req.params.collegeId,
    assetType: 'logo',
  });

  res.json({ success: true, data: result });
});

exports.getAssets = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.getAssets({ user: req.user, collegeId: req.params.collegeId });
  res.json({ success: true, data: result });
});
