const { sql, getPool } = require('../config/database');

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID('dbo.CollegeAssets', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CollegeAssets (
        CollegeId INT NOT NULL PRIMARY KEY,
        LogoUrl NVARCHAR(1000) NULL,
        BannerUrl NVARCHAR(1000) NULL,
        UpdatedOn DATETIME2 NOT NULL CONSTRAINT DF_CollegeAssets_UpdatedOn DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CollegeAssets_Colleges FOREIGN KEY (CollegeId)
          REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
      );
    END
  `);
  tableReady = true;
}

function mapAsset(row) {
  if (!row) return null;
  return {
    collegeId: String(row.CollegeId),
    logoUrl: row.LogoUrl,
    bannerUrl: row.BannerUrl,
    updatedOn: row.UpdatedOn instanceof Date ? row.UpdatedOn.toISOString() : row.UpdatedOn,
  };
}

const CollegeAssetModel = {
  async ensureTable() {
    await ensureTable();
  },

  async findCollegeById(collegeId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('collegeId', sql.Int, collegeId)
      .query('SELECT CollegeID, CollegeName, UserID, Status FROM dbo.Colleges WHERE CollegeID = @collegeId');
    return result.recordset[0] || null;
  },

  async findCollegeByUserId(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT CollegeID, CollegeName, UserID, Status FROM dbo.Colleges WHERE UserID = @userId');
    return result.recordset[0] || null;
  },

  async getByCollegeId(collegeId) {
    await ensureTable();
    const pool = await getPool();
    const result = await pool
      .request()
      .input('collegeId', sql.Int, collegeId)
      .query('SELECT CollegeId, LogoUrl, BannerUrl, UpdatedOn FROM dbo.CollegeAssets WHERE CollegeId = @collegeId');
    return mapAsset(result.recordset[0]);
  },

  async upsertAssetUrl(collegeId, assetType, url) {
    await ensureTable();
    const column = assetType === 'banner' ? 'BannerUrl' : 'LogoUrl';
    const pool = await getPool();
    const result = await pool
      .request()
      .input('collegeId', sql.Int, collegeId)
      .input('url', sql.NVarChar(1000), url)
      .query(`
        MERGE dbo.CollegeAssets AS target
        USING (SELECT @collegeId AS CollegeId) AS source
        ON target.CollegeId = source.CollegeId
        WHEN MATCHED THEN
          UPDATE SET ${column} = @url, UpdatedOn = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (CollegeId, ${column}, UpdatedOn)
          VALUES (@collegeId, @url, SYSUTCDATETIME())
        OUTPUT inserted.CollegeId, inserted.LogoUrl, inserted.BannerUrl, inserted.UpdatedOn;
      `);
    return mapAsset(result.recordset[0]);
  },

  async clearAssetUrl(collegeId, assetType) {
    await ensureTable();
    const column = assetType === 'banner' ? 'BannerUrl' : 'LogoUrl';
    const pool = await getPool();
    const result = await pool
      .request()
      .input('collegeId', sql.Int, collegeId)
      .query(`
        UPDATE dbo.CollegeAssets
        SET ${column} = NULL, UpdatedOn = SYSUTCDATETIME()
        OUTPUT inserted.CollegeId, inserted.LogoUrl, inserted.BannerUrl, inserted.UpdatedOn
        WHERE CollegeId = @collegeId
      `);
    return mapAsset(result.recordset[0]);
  },
};

module.exports = CollegeAssetModel;
