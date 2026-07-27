const { sql, getPool } = require('../config/database');
const sharepointService = require('./sharepointService');
const ApiError = require('../utils/ApiError');
const notificationServices = require('./notification.services');

function versionedAssetUrl(url, updatedAt) {
  if (!url || !updatedAt || !url.startsWith('/api/files/')) return url || null;
  const version = updatedAt instanceof Date ? updatedAt.getTime() : String(updatedAt);
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

async function resolveCollegeId(user, explicitId) {
  if (user.role === 'admin' && explicitId) {
    return parseInt(String(explicitId), 10);
  }
  const pool = await getPool();
  const res = await pool
    .request()
    .input('uid', sql.Int, user.id)
    .query('SELECT CollegeID FROM dbo.Colleges WHERE UserID = @uid');
  const row = res.recordset[0];
  if (!row) throw new ApiError('College not found for this user', 404);
  return row.CollegeID;
}

const collegeAssetService = {
  async uploadAsset({ user, collegeId: rawCollegeId, file, assetType }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    if (!file) throw new ApiError('No file uploaded', 400);

    const folderPath = `${sharepointService.getConfiguredRootFolder()}/${collegeId}`;
    
    // Keep the current asset until the replacement is safely uploaded and saved.
    const column = assetType === 'logo' ? 'LogoUrl' : 'BannerUrl';
    const pool = await getPool();
    const existingRes = await pool.request()
      .input('cid', sql.Int, collegeId)
      .query(`SELECT ${column} FROM dbo.CollegeProfiles WHERE CollegeID = @cid`);
    
    const existingUrl = existingRes.recordset[0]?.[column];
    const uploaded = await sharepointService.uploadFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folderPath,
        entityType: 'College',
        entityId: collegeId,
        uploadedBy: user.id
    });

    const proxyUrl = `/api/files/${uploaded.fileId}`;

    try {
      // Ensure CollegeProfile row exists, then persist the backend proxy URL.
      const exists = await pool.request().input('cid', sql.Int, collegeId).query('SELECT 1 FROM dbo.CollegeProfiles WHERE CollegeID = @cid');
      if (!exists.recordset[0]) {
        await pool.request().input('cid', sql.Int, collegeId).query('INSERT INTO dbo.CollegeProfiles (CollegeID) VALUES (@cid)');
      }

      await pool
        .request()
        .input('cid', sql.Int, collegeId)
        .input('url', sql.NVarChar(2048), proxyUrl)
        .query(`UPDATE dbo.CollegeProfiles SET ${column} = @url, UpdatedAt = SYSUTCDATETIME() WHERE CollegeID = @cid`);
    } catch (error) {
      // Compensate for a SQL failure so SharePoint and FileMetadata do not retain an orphan.
      try {
        await sharepointService.deleteFile(uploaded.fileId);
      } catch (cleanupError) {
        console.error('Failed to clean up new SharePoint upload:', cleanupError.message);
      }
      throw error;
    }

    if (existingUrl && existingUrl.includes('/api/files/')) {
      const oldFileId = existingUrl.split('/api/files/')[1];
      try {
        await sharepointService.deleteFile(oldFileId);
      } catch (error) {
        console.error('Failed to delete old file from SharePoint:', error.message);
      }
    }

    const label = assetType === 'logo' ? 'Logo' : 'Banner';
    await notificationServices.notifyCollege({
      collegeId,
      type: 'Profile',
      title: `${label} updated`,
      description: `Your college ${assetType} asset is now updated on the portal.`,
      priority: 'success',
      referenceId: collegeId,
      referenceType: 'college',
    });

    return { collegeId, url: proxyUrl, assetType };
  },

  async deleteAsset({ user, collegeId: rawCollegeId, assetType }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    const pool = await getPool();

    const column = assetType === 'logo' ? 'LogoUrl' : 'BannerUrl';
    const profileRes = await pool
      .request()
      .input('cid', sql.Int, collegeId)
      .query(`SELECT ${column} FROM dbo.CollegeProfiles WHERE CollegeID = @cid`);
    const currentUrl = profileRes.recordset[0]?.[column];

    if (currentUrl && currentUrl.includes('/api/files/')) {
      const oldFileId = currentUrl.split('/api/files/')[1];
      try {
        await sharepointService.deleteFile(oldFileId);
      } catch (err) {
        console.error('SharePoint file deletion failed:', err.message);
      }
    }

    await pool
      .request()
      .input('cid', sql.Int, collegeId)
      .query(`UPDATE dbo.CollegeProfiles SET ${column} = NULL, UpdatedAt = SYSUTCDATETIME() WHERE CollegeID = @cid`);

    if (assetType === 'logo') {
      await notificationServices.notifyCollege({
        collegeId,
        type: 'Profile',
        title: 'Logo removed',
        description: 'Your college profile is missing a logo asset.',
        priority: 'reminder',
        referenceId: collegeId,
        referenceType: 'college',
      });
    }

    return { success: true };
  },

  async getAssets({ user, collegeId: rawCollegeId }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    const pool = await getPool();
    const res = await pool
      .request()
      .input('cid', sql.Int, collegeId)
      .query('SELECT LogoUrl, BannerUrl, UpdatedAt FROM dbo.CollegeProfiles WHERE CollegeID = @cid');
    const row = res.recordset[0] || {};
    const logoUrl = versionedAssetUrl(row.LogoUrl, row.UpdatedAt);
    const bannerUrl = versionedAssetUrl(row.BannerUrl, row.UpdatedAt);
    return {
      logoUrl,
      bannerUrl,
      coverBannerUrl: bannerUrl,
    };
  },
};

module.exports = collegeAssetService;
