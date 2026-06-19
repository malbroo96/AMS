const { sql, getPool } = require('../config/database');
const sharepointService = require('./sharepointService');
const ApiError = require('../utils/ApiError');

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

    const folderPath = `EADMIT PORTAL/COLLEGES/${collegeId}`;
    
    // Check if we already have an asset to delete
    const column = assetType === 'logo' ? 'LogoUrl' : 'BannerUrl';
    const pool = await getPool();
    const existingRes = await pool.request()
      .input('cid', sql.Int, collegeId)
      .query(`SELECT ${column} FROM dbo.CollegeProfiles WHERE CollegeID = @cid`);
    
    const existingUrl = existingRes.recordset[0]?.[column];
    if (existingUrl && existingUrl.includes('/api/files/')) {
        const oldFileId = existingUrl.split('/api/files/')[1];
        try {
            await sharepointService.deleteFile(oldFileId);
        } catch(e) {
            console.error('Failed to delete old file from SharePoint:', e.message);
        }
    }

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

    // Ensure CollegeProfile row exists
    const exists = await pool.request().input('cid', sql.Int, collegeId).query('SELECT 1 FROM dbo.CollegeProfiles WHERE CollegeID = @cid');
    if (!exists.recordset[0]) {
      await pool.request().input('cid', sql.Int, collegeId).query('INSERT INTO dbo.CollegeProfiles (CollegeID) VALUES (@cid)');
    }

    await pool
      .request()
      .input('cid', sql.Int, collegeId)
      .input('url', sql.NVarChar(2048), proxyUrl)
      .query(`UPDATE dbo.CollegeProfiles SET ${column} = @url, UpdatedAt = SYSUTCDATETIME() WHERE CollegeID = @cid`);

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

    return { success: true };
  },

  async getLogo({ collegeId: rawCollegeId }) {
    const collegeId = parseInt(String(rawCollegeId), 10);
    if (!Number.isFinite(collegeId)) throw new ApiError('Invalid college ID', 400);
    const pool = await getPool();
    const res = await pool.request().input('cid', sql.Int, collegeId).query('SELECT LogoUrl FROM dbo.CollegeProfiles WHERE CollegeID = @cid');
    return { logoUrl: res.recordset[0]?.LogoUrl || null };
  },

  async getAssets({ user, collegeId: rawCollegeId }) {
    const collegeId = await resolveCollegeId(user, rawCollegeId);
    const pool = await getPool();
    const res = await pool
      .request()
      .input('cid', sql.Int, collegeId)
      .query('SELECT LogoUrl, BannerUrl FROM dbo.CollegeProfiles WHERE CollegeID = @cid');
    const row = res.recordset[0] || {};
    return {
      logoUrl: row.LogoUrl || null,
      coverBannerUrl: row.BannerUrl || null,
    };
  },
};

module.exports = collegeAssetService;
