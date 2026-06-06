const ApiError = require('../utils/ApiError');
const CollegeAssetModel = require('../models/CollegeAsset.model');
const sharepointService = require('./sharepointService');

function parseCollegeId(raw) {
  const collegeId = parseInt(String(raw), 10);
  if (!Number.isFinite(collegeId)) {
    throw new ApiError('Invalid college id', 400);
  }
  return collegeId;
}

async function resolveCollegeId(user, rawCollegeId) {
  if (rawCollegeId !== undefined && rawCollegeId !== null && rawCollegeId !== '') {
    const collegeId = parseCollegeId(rawCollegeId);
    const college = await CollegeAssetModel.findCollegeById(collegeId);
    if (!college) throw new ApiError('College not found', 404);
    if (user.role === 'college' && Number(college.UserID) !== Number(user.id)) {
      throw new ApiError('You can only manage your own college assets', 403);
    }
    return collegeId;
  }

  if (user.role !== 'college') {
    throw new ApiError('collegeId is required', 400);
  }

  const college = await CollegeAssetModel.findCollegeByUserId(parseCollegeId(user.id));
  if (!college) throw new ApiError('College profile not found', 404);
  return college.CollegeID;
}

const collegeAssetService = {
  async uploadAsset({ user, collegeId: rawCollegeId, file, assetType }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    const upload = await sharepointService.uploadCollegeAsset({ collegeId, file, assetType });
    const asset = await CollegeAssetModel.upsertAssetUrl(collegeId, assetType, upload.url);
    return { asset, upload };
  },

  async deleteAsset({ user, collegeId: rawCollegeId, assetType }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    const existing = await CollegeAssetModel.getByCollegeId(collegeId);
    const currentUrl = assetType === 'banner' ? existing?.bannerUrl : existing?.logoUrl;
    const deletion = await sharepointService.deleteCollegeAsset({ collegeId, assetType, currentUrl });
    const asset = await CollegeAssetModel.clearAssetUrl(collegeId, assetType);
    return { asset, deletion };
  },

  async getLogo({ collegeId: rawCollegeId }) {
    const collegeId = parseCollegeId(rawCollegeId);
    const college = await CollegeAssetModel.findCollegeById(collegeId);
    if (!college) throw new ApiError('College not found', 404);
    const asset = await CollegeAssetModel.getByCollegeId(collegeId);
    return {
      collegeId: String(collegeId),
      collegeName: college.CollegeName,
      logoUrl: asset?.logoUrl || null,
      updatedOn: asset?.updatedOn || null,
    };
  },

  async getAssets({ user, collegeId: rawCollegeId }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    const college = await CollegeAssetModel.findCollegeById(collegeId);
    if (!college) throw new ApiError('College not found', 404);
    const asset = await CollegeAssetModel.getByCollegeId(collegeId);
    return {
      collegeId: String(collegeId),
      collegeName: college.CollegeName,
      logoUrl: asset?.logoUrl || null,
      bannerUrl: asset?.bannerUrl || null,
      updatedOn: asset?.updatedOn || null,
    };
  },
};

module.exports = collegeAssetService;
