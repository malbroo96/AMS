const asyncHandler = require('../utils/asyncHandler');
const collegeAssetService = require('../services/collegeAsset.service');

function uploadedFile(req) {
  return req.file;
}

exports.uploadLogo = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.uploadAsset({
    user: req.user,
    collegeId: req.body.collegeId,
    file: uploadedFile(req),
    assetType: 'logo',
  });

  res.status(201).json({ success: true, data: result });
});

exports.uploadBanner = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.uploadAsset({
    user: req.user,
    collegeId: req.body.collegeId,
    file: uploadedFile(req),
    assetType: 'banner',
  });

  res.status(201).json({ success: true, data: result });
});

exports.updateLogo = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.uploadAsset({
    user: req.user,
    collegeId: req.body.collegeId,
    file: uploadedFile(req),
    assetType: 'logo',
  });

  res.json({ success: true, data: result });
});

exports.deleteLogo = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.deleteAsset({
    user: req.user,
    collegeId: req.params.collegeId,
    assetType: 'logo',
  });

  res.json({ success: true, data: result });
});

exports.getLogo = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.getLogo({ collegeId: req.params.collegeId });
  res.json({ success: true, data: result });
});

exports.getAssets = asyncHandler(async (req, res) => {
  const result = await collegeAssetService.getAssets({ user: req.user, collegeId: req.params.collegeId });
  res.json({ success: true, data: result });
});
