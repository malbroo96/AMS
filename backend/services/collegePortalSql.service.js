const { randomUUID } = require('crypto');
const { sql, getPool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const CollegeAssetModel = require('../models/CollegeAsset.model');
const sharepointService = require('./sharepointService');

let tablesReady = false;

function jsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function jsonString(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function asId(value) {
  const id = parseInt(String(value), 10);
  if (!Number.isFinite(id)) throw new ApiError('Invalid college id', 400);
  return id;
}

async function ensureTables() {
  if (tablesReady) return;
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID('dbo.CollegeProfiles', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CollegeProfiles (
        CollegeID INT NOT NULL PRIMARY KEY,
        ShortName NVARCHAR(100) NULL,
        EstablishmentYear INT NULL,
        CollegeType NVARCHAR(50) NULL,
        UniversityAffiliation NVARCHAR(255) NULL,
        NaacGrade NVARCHAR(20) NULL,
        AicteApproval BIT NOT NULL CONSTRAINT DF_CollegeProfiles_Aicte DEFAULT 0,
        UgcRecognition BIT NOT NULL CONSTRAINT DF_CollegeProfiles_Ugc DEFAULT 0,
        ProspectusUrl NVARCHAR(1000) NULL,
        Country NVARCHAR(100) NULL,
        State NVARCHAR(100) NULL,
        District NVARCHAR(100) NULL,
        City NVARCHAR(100) NULL,
        Pincode NVARCHAR(20) NULL,
        FullAddress NVARCHAR(600) NULL,
        Latitude DECIMAL(10,8) NULL,
        Longitude DECIMAL(11,8) NULL,
        GoogleMapsUrl NVARCHAR(1000) NULL,
        ContactEmail NVARCHAR(255) NULL,
        AdmissionMobileNumber NVARCHAR(30) NULL,
        OfficeMobileNumber NVARCHAR(30) NULL,
        LandlineNumber NVARCHAR(30) NULL,
        WebsiteUrl NVARCHAR(255) NULL,
        SummaryDescription NVARCHAR(MAX) NULL,
        VisionStatement NVARCHAR(MAX) NULL,
        MissionStatement NVARCHAR(MAX) NULL,
        PrincipalMessage NVARCHAR(MAX) NULL,
        ChairmanMessage NVARCHAR(MAX) NULL,
        PlacementPercentage DECIMAL(5,2) NULL,
        HighestPackage NVARCHAR(50) NULL,
        AveragePackage NVARCHAR(50) NULL,
        TopRecruiters NVARCHAR(MAX) NULL,
        Facilities NVARCHAR(MAX) NULL,
        TotalStudentViews INT NOT NULL CONSTRAINT DF_CollegeProfiles_Views DEFAULT 0,
        TotalEnquiries INT NOT NULL CONSTRAINT DF_CollegeProfiles_Enquiries DEFAULT 0,
        ProfileCompletionPercentage DECIMAL(5,2) NOT NULL CONSTRAINT DF_CollegeProfiles_Completion DEFAULT 0,
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CollegeProfiles_Colleges FOREIGN KEY (CollegeID)
          REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
      );
    END

    IF OBJECT_ID('dbo.CollegeCourses', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CollegeCourses (
        CourseID INT IDENTITY(1,1) PRIMARY KEY,
        CollegeID INT NOT NULL,
        CourseName NVARCHAR(255) NOT NULL,
        CourseCategory NVARCHAR(100) NULL,
        DegreeType NVARCHAR(100) NULL,
        Duration DECIMAL(4,1) NULL,
        TotalSeats INT NULL,
        Eligibility NVARCHAR(MAX) NULL,
        AnnualFee DECIMAL(12,2) NULL,
        HostelFee DECIMAL(12,2) NULL,
        ExamAccepted NVARCHAR(MAX) NULL,
        Description NVARCHAR(MAX) NULL,
        CourseImageUrl NVARCHAR(1000) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_CollegeCourses_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeCourses_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeCourses_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CollegeCourses_Colleges FOREIGN KEY (CollegeID)
          REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
      );
      CREATE INDEX IX_CollegeCourses_CollegeID ON dbo.CollegeCourses(CollegeID);
    END

    IF OBJECT_ID('dbo.CollegeAchievements', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CollegeAchievements (
        AchievementID INT IDENTITY(1,1) PRIMARY KEY,
        CollegeID INT NOT NULL,
        AchievementTitle NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        AchievementYear INT NULL,
        AchievementImageUrl NVARCHAR(1000) NULL,
        DisplayOrder INT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_CollegeAchievements_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeAchievements_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeAchievements_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CollegeAchievements_Colleges FOREIGN KEY (CollegeID)
          REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
      );
      CREATE INDEX IX_CollegeAchievements_CollegeID ON dbo.CollegeAchievements(CollegeID);
    END

    IF OBJECT_ID('dbo.CollegeGallery', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CollegeGallery (
        ImageID INT IDENTITY(1,1) PRIMARY KEY,
        CollegeID INT NOT NULL,
        ImageUrl NVARCHAR(1000) NOT NULL,
        ImageTitle NVARCHAR(255) NULL,
        ImageDescription NVARCHAR(600) NULL,
        ImageCategory NVARCHAR(100) NULL,
        DisplayOrder INT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_CollegeGallery_IsActive DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeGallery_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeGallery_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CollegeGallery_Colleges FOREIGN KEY (CollegeID)
          REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
      );
      CREATE INDEX IX_CollegeGallery_CollegeID ON dbo.CollegeGallery(CollegeID);
    END

    IF OBJECT_ID('dbo.CollegeEnquiries', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CollegeEnquiries (
        EnquiryID INT IDENTITY(1,1) PRIMARY KEY,
        CollegeID INT NOT NULL,
        StudentName NVARCHAR(255) NOT NULL,
        StudentEmail NVARCHAR(255) NULL,
        StudentPhone NVARCHAR(30) NULL,
        Message NVARCHAR(MAX) NULL,
        InterestedCourse NVARCHAR(255) NULL,
        Status NVARCHAR(50) NOT NULL CONSTRAINT DF_CollegeEnquiries_Status DEFAULT 'Pending',
        IsRead BIT NOT NULL CONSTRAINT DF_CollegeEnquiries_IsRead DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeEnquiries_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeEnquiries_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CollegeEnquiries_Colleges FOREIGN KEY (CollegeID)
          REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
      );
      CREATE INDEX IX_CollegeEnquiries_CollegeID ON dbo.CollegeEnquiries(CollegeID);
    END
  `);
  tablesReady = true;
}

async function ownCollegeId(user) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, user.id)
    .query('SELECT CollegeID FROM dbo.Colleges WHERE UserID = @userId');
  const row = result.recordset[0];
  if (!row) throw new ApiError('College profile not found', 404);
  return row.CollegeID;
}

function profileCompletion(profile) {
  const fields = [
    profile.collegeName,
    profile.shortName,
    profile.collegeType,
    profile.universityAffiliation,
    profile.logoUrl,
    profile.coverBannerUrl,
    profile.location?.state,
    profile.location?.city,
    profile.location?.fullAddress,
    profile.contact?.emailAddress,
    profile.contact?.admissionMobileNumber,
    profile.about?.summaryDescription,
    profile.placements?.placementPercentage,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function mapCourse(row) {
  return {
    id: String(row.CourseID),
    courseName: row.CourseName || '',
    courseCategory: row.CourseCategory || '',
    degreeType: row.DegreeType || '',
    duration: row.Duration != null ? Number(row.Duration) : null,
    totalSeats: row.TotalSeats != null ? Number(row.TotalSeats) : null,
    eligibility: row.Eligibility || '',
    fees: {
      annualFee: row.AnnualFee != null ? Number(row.AnnualFee) : null,
      hostelFee: row.HostelFee != null ? Number(row.HostelFee) : null,
    },
    examAccepted: jsonParse(row.ExamAccepted, []),
    description: row.Description || '',
    courseImageUrl: row.CourseImageUrl || null,
  };
}

function mapAchievement(row) {
  return {
    id: String(row.AchievementID),
    achievementTitle: row.AchievementTitle || '',
    description: row.Description || '',
    achievementYear: row.AchievementYear != null ? Number(row.AchievementYear) : null,
    achievementImageUrl: row.AchievementImageUrl || null,
    displayOrder: row.DisplayOrder != null ? Number(row.DisplayOrder) : null,
  };
}

function mapGallery(row) {
  return {
    id: String(row.ImageID),
    imageUrl: row.ImageUrl,
    imageTitle: row.ImageTitle || '',
    imageDescription: row.ImageDescription || '',
    imageCategory: row.ImageCategory || '',
    displayOrder: row.DisplayOrder != null ? Number(row.DisplayOrder) : null,
  };
}

function mapEnquiry(row) {
  return {
    id: String(row.EnquiryID),
    studentName: row.StudentName,
    studentEmail: row.StudentEmail || '',
    studentPhone: row.StudentPhone || '',
    message: row.Message || '',
    interestedCourse: row.InterestedCourse || '',
    status: row.Status,
    isRead: !!row.IsRead,
    createdAt: row.CreatedAt instanceof Date ? row.CreatedAt.toISOString() : row.CreatedAt,
  };
}

function baseProfile(row, assets) {
  const profile = {
    id: String(row.CollegeID),
    collegeName: row.CollegeName || '',
    shortName: row.ShortName || '',
    establishmentYear: row.EstablishmentYear != null ? Number(row.EstablishmentYear) : null,
    collegeType: row.CollegeType || '',
    universityAffiliation: row.UniversityAffiliation || '',
    naacGrade: row.NaacGrade || '',
    aicteApproval: !!row.AicteApproval,
    ugcRecognition: !!row.UgcRecognition,
    email: row.Email || '',
    status: row.Status || '',
    logoUrl: assets?.logoUrl || null,
    coverBannerUrl: assets?.bannerUrl || null,
    prospectusUrl: row.ProspectusUrl || null,
    location: {
      country: row.Country || '',
      state: row.State || '',
      district: row.District || '',
      city: row.City || '',
      pincode: row.Pincode || '',
      fullAddress: row.FullAddress || '',
      latitude: row.Latitude != null ? Number(row.Latitude) : null,
      longitude: row.Longitude != null ? Number(row.Longitude) : null,
      googleMapsUrl: row.GoogleMapsUrl || '',
    },
    contact: {
      emailAddress: row.ContactEmail || row.Email || '',
      admissionMobileNumber: row.AdmissionMobileNumber || '',
      officeMobileNumber: row.OfficeMobileNumber || '',
      landlineNumber: row.LandlineNumber || '',
      websiteUrl: row.WebsiteUrl || '',
    },
    placements: {
      placementPercentage: row.PlacementPercentage != null ? Number(row.PlacementPercentage) : null,
      highestPackage: row.HighestPackage || '',
      averagePackage: row.AveragePackage || '',
      topRecruiters: jsonParse(row.TopRecruiters, []),
    },
    about: {
      summaryDescription: row.SummaryDescription || '',
      visionStatement: row.VisionStatement || '',
      missionStatement: row.MissionStatement || '',
      principalMessage: row.PrincipalMessage || '',
      chairmanMessage: row.ChairmanMessage || '',
    },
    facilities: jsonParse(row.Facilities, []),
  };
  return {
    ...profile,
    dashboard: {
      totalStudentViews: Number(row.TotalStudentViews || 0),
      totalEnquiries: Number(row.TotalEnquiries || 0),
      totalInterestedStudents: Number(row.TotalInterestedStudents || 0),
      profileCompletionPercentage: profileCompletion(profile),
    },
  };
}

async function getProfileRow(collegeId) {
  await ensureTables();
  const pool = await getPool();
  const result = await pool.request().input('collegeId', sql.Int, collegeId).query(`
    SELECT c.CollegeID, c.CollegeName, c.Email, c.Status,
           p.ShortName, p.EstablishmentYear, p.CollegeType, p.UniversityAffiliation, p.NaacGrade,
           p.AicteApproval, p.UgcRecognition, p.ProspectusUrl, p.Country, p.State, p.District, p.City,
           p.Pincode, p.FullAddress, p.Latitude, p.Longitude, p.GoogleMapsUrl, p.ContactEmail,
           p.AdmissionMobileNumber, p.OfficeMobileNumber, p.LandlineNumber, p.WebsiteUrl,
           p.SummaryDescription, p.VisionStatement, p.MissionStatement, p.PrincipalMessage,
           p.ChairmanMessage, p.PlacementPercentage, p.HighestPackage, p.AveragePackage,
           p.TopRecruiters, p.Facilities, COALESCE(p.TotalStudentViews, 0) AS TotalStudentViews,
           COALESCE(p.TotalEnquiries, 0) AS TotalEnquiries,
           (SELECT COUNT(*) FROM dbo.StudentApplications sa WHERE sa.CollegeID = c.CollegeID) AS TotalInterestedStudents
    FROM dbo.Colleges c
    LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
    WHERE c.CollegeID = @collegeId
  `);
  const row = result.recordset[0];
  if (!row) throw new ApiError('College profile not found', 404);
  return row;
}

async function getProfile(collegeId) {
  const row = await getProfileRow(collegeId);
  const assets = await CollegeAssetModel.getByCollegeId(collegeId);
  const pool = await getPool();
  const [courses, achievements, gallery, enquiries] = await Promise.all([
    pool.request().input('collegeId', sql.Int, collegeId).query(`
      SELECT * FROM dbo.CollegeCourses WHERE CollegeID = @collegeId AND IsActive = 1 ORDER BY CourseName
    `),
    pool.request().input('collegeId', sql.Int, collegeId).query(`
      SELECT * FROM dbo.CollegeAchievements WHERE CollegeID = @collegeId AND IsActive = 1 ORDER BY COALESCE(DisplayOrder, 9999), AchievementYear DESC
    `),
    pool.request().input('collegeId', sql.Int, collegeId).query(`
      SELECT * FROM dbo.CollegeGallery WHERE CollegeID = @collegeId AND IsActive = 1 ORDER BY COALESCE(DisplayOrder, 9999), CreatedAt DESC
    `),
    pool.request().input('collegeId', sql.Int, collegeId).query(`
      SELECT TOP 25 * FROM dbo.CollegeEnquiries WHERE CollegeID = @collegeId ORDER BY CreatedAt DESC
    `),
  ]);
  return {
    ...baseProfile(row, assets),
    courses: courses.recordset.map(mapCourse),
    achievements: achievements.recordset.map(mapAchievement),
    gallery: gallery.recordset.map(mapGallery),
    enquiries: enquiries.recordset.map(mapEnquiry),
  };
}

async function updateProfile(user, data) {
  await ensureTables();
  const collegeId = await ownCollegeId(user);
  const current = await getProfile(collegeId);
  const next = {
    ...current,
    ...data,
    location: { ...current.location, ...(data.location || {}) },
    contact: { ...current.contact, ...(data.contact || {}) },
    placements: { ...current.placements, ...(data.placements || {}) },
    about: { ...current.about, ...(data.about || {}) },
    facilities: Array.isArray(data.facilities) ? data.facilities : current.facilities,
  };
  const completion = profileCompletion(next);
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input('collegeId', sql.Int, collegeId)
      .input('collegeName', sql.NVarChar(150), next.collegeName || current.collegeName)
      .input('email', sql.NVarChar(255), next.email || next.contact.emailAddress || current.email)
      .query(`
        UPDATE dbo.Colleges
        SET CollegeName = @collegeName, Email = @email
        WHERE CollegeID = @collegeId
      `);

    await new sql.Request(transaction)
      .input('collegeId', sql.Int, collegeId)
      .input('shortName', sql.NVarChar(100), next.shortName || null)
      .input('establishmentYear', sql.Int, next.establishmentYear || null)
      .input('collegeType', sql.NVarChar(50), next.collegeType || null)
      .input('universityAffiliation', sql.NVarChar(255), next.universityAffiliation || null)
      .input('naacGrade', sql.NVarChar(20), next.naacGrade || null)
      .input('aicteApproval', sql.Bit, next.aicteApproval ? 1 : 0)
      .input('ugcRecognition', sql.Bit, next.ugcRecognition ? 1 : 0)
      .input('prospectusUrl', sql.NVarChar(1000), next.prospectusUrl || null)
      .input('country', sql.NVarChar(100), next.location.country || null)
      .input('state', sql.NVarChar(100), next.location.state || null)
      .input('district', sql.NVarChar(100), next.location.district || null)
      .input('city', sql.NVarChar(100), next.location.city || null)
      .input('pincode', sql.NVarChar(20), next.location.pincode || null)
      .input('fullAddress', sql.NVarChar(600), next.location.fullAddress || null)
      .input('latitude', sql.Decimal(10, 8), next.location.latitude || null)
      .input('longitude', sql.Decimal(11, 8), next.location.longitude || null)
      .input('googleMapsUrl', sql.NVarChar(1000), next.location.googleMapsUrl || null)
      .input('contactEmail', sql.NVarChar(255), next.contact.emailAddress || null)
      .input('admissionMobileNumber', sql.NVarChar(30), next.contact.admissionMobileNumber || null)
      .input('officeMobileNumber', sql.NVarChar(30), next.contact.officeMobileNumber || null)
      .input('landlineNumber', sql.NVarChar(30), next.contact.landlineNumber || null)
      .input('websiteUrl', sql.NVarChar(255), next.contact.websiteUrl || null)
      .input('summaryDescription', sql.NVarChar(sql.MAX), next.about.summaryDescription || null)
      .input('visionStatement', sql.NVarChar(sql.MAX), next.about.visionStatement || null)
      .input('missionStatement', sql.NVarChar(sql.MAX), next.about.missionStatement || null)
      .input('principalMessage', sql.NVarChar(sql.MAX), next.about.principalMessage || null)
      .input('chairmanMessage', sql.NVarChar(sql.MAX), next.about.chairmanMessage || null)
      .input('placementPercentage', sql.Decimal(5, 2), next.placements.placementPercentage || null)
      .input('highestPackage', sql.NVarChar(50), next.placements.highestPackage || null)
      .input('averagePackage', sql.NVarChar(50), next.placements.averagePackage || null)
      .input('topRecruiters', sql.NVarChar(sql.MAX), jsonString(next.placements.topRecruiters))
      .input('facilities', sql.NVarChar(sql.MAX), jsonString(next.facilities))
      .input('completion', sql.Decimal(5, 2), completion)
      .query(`
        MERGE dbo.CollegeProfiles AS target
        USING (SELECT @collegeId AS CollegeID) AS source
        ON target.CollegeID = source.CollegeID
        WHEN MATCHED THEN UPDATE SET
          ShortName = @shortName, EstablishmentYear = @establishmentYear, CollegeType = @collegeType,
          UniversityAffiliation = @universityAffiliation, NaacGrade = @naacGrade,
          AicteApproval = @aicteApproval, UgcRecognition = @ugcRecognition, ProspectusUrl = @prospectusUrl,
          Country = @country, State = @state, District = @district, City = @city, Pincode = @pincode,
          FullAddress = @fullAddress, Latitude = @latitude, Longitude = @longitude, GoogleMapsUrl = @googleMapsUrl,
          ContactEmail = @contactEmail, AdmissionMobileNumber = @admissionMobileNumber,
          OfficeMobileNumber = @officeMobileNumber, LandlineNumber = @landlineNumber, WebsiteUrl = @websiteUrl,
          SummaryDescription = @summaryDescription, VisionStatement = @visionStatement,
          MissionStatement = @missionStatement, PrincipalMessage = @principalMessage,
          ChairmanMessage = @chairmanMessage, PlacementPercentage = @placementPercentage,
          HighestPackage = @highestPackage, AveragePackage = @averagePackage,
          TopRecruiters = @topRecruiters, Facilities = @facilities,
          ProfileCompletionPercentage = @completion, UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (
          CollegeID, ShortName, EstablishmentYear, CollegeType, UniversityAffiliation, NaacGrade,
          AicteApproval, UgcRecognition, ProspectusUrl, Country, State, District, City, Pincode,
          FullAddress, Latitude, Longitude, GoogleMapsUrl, ContactEmail, AdmissionMobileNumber,
          OfficeMobileNumber, LandlineNumber, WebsiteUrl, SummaryDescription, VisionStatement,
          MissionStatement, PrincipalMessage, ChairmanMessage, PlacementPercentage, HighestPackage,
          AveragePackage, TopRecruiters, Facilities, ProfileCompletionPercentage
        ) VALUES (
          @collegeId, @shortName, @establishmentYear, @collegeType, @universityAffiliation, @naacGrade,
          @aicteApproval, @ugcRecognition, @prospectusUrl, @country, @state, @district, @city, @pincode,
          @fullAddress, @latitude, @longitude, @googleMapsUrl, @contactEmail, @admissionMobileNumber,
          @officeMobileNumber, @landlineNumber, @websiteUrl, @summaryDescription, @visionStatement,
          @missionStatement, @principalMessage, @chairmanMessage, @placementPercentage, @highestPackage,
          @averagePackage, @topRecruiters, @facilities, @completion
        );
      `);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  return getProfile(collegeId);
}

const collegePortalSqlService = {
  ensureTables,
  ownCollegeId,

  async getOwnProfile(user) {
    const collegeId = await ownCollegeId(user);
    return getProfile(collegeId);
  },

  updateProfile,

  async listPublic(query = {}) {
    await ensureTables();
    const pool = await getPool();
    const req = pool.request();
    const clauses = ["c.Status = 'approved'"];
    const search = String(query.search || '').trim().toLowerCase();
    if (search) {
      clauses.push('(LOWER(c.CollegeName) LIKE @search OR LOWER(p.City) LIKE @search OR LOWER(p.State) LIKE @search)');
      req.input('search', sql.NVarChar(255), `%${search}%`);
    }
    if (query.state) {
      clauses.push('p.State = @state');
      req.input('state', sql.NVarChar(100), query.state);
    }
    if (query.city) {
      clauses.push('p.City = @city');
      req.input('city', sql.NVarChar(100), query.city);
    }
    if (query.collegeType) {
      clauses.push('p.CollegeType = @collegeType');
      req.input('collegeType', sql.NVarChar(50), query.collegeType);
    }
    if (query.maxFee) {
      clauses.push('EXISTS (SELECT 1 FROM dbo.CollegeCourses cc WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1 AND cc.AnnualFee <= @maxFee)');
      req.input('maxFee', sql.Decimal(12, 2), Number(query.maxFee));
    }
    const result = await req.query(`
      SELECT c.CollegeID, c.CollegeName, c.Email, c.Status, p.*, a.LogoUrl, a.BannerUrl,
             (SELECT MIN(AnnualFee) FROM dbo.CollegeCourses cc WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1) AS FeesFrom,
             (SELECT COUNT(*) FROM dbo.CollegeCourses cc WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1) AS CourseCount,
             (SELECT COUNT(*) FROM dbo.StudentApplications sa WHERE sa.CollegeID = c.CollegeID) AS TotalInterestedStudents
      FROM dbo.Colleges c
      LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
      LEFT JOIN dbo.CollegeAssets a ON a.CollegeId = c.CollegeID
      WHERE ${clauses.join(' AND ')}
      ORDER BY c.CollegeName
    `);
    return result.recordset.map((row) => ({
      ...baseProfile(row, { logoUrl: row.LogoUrl, bannerUrl: row.BannerUrl }),
      feesFrom: row.FeesFrom != null ? Number(row.FeesFrom) : null,
      courseCount: Number(row.CourseCount || 0),
    }));
  },

  async getPublicDetails(collegeIdRaw) {
    const collegeId = asId(collegeIdRaw);
    const profile = await getProfile(collegeId);
    await (await getPool())
      .request()
      .input('collegeId', sql.Int, collegeId)
      .query(`
        MERGE dbo.CollegeProfiles AS target
        USING (SELECT @collegeId AS CollegeID) AS source
        ON target.CollegeID = source.CollegeID
        WHEN MATCHED THEN UPDATE SET TotalStudentViews = TotalStudentViews + 1
        WHEN NOT MATCHED THEN INSERT (CollegeID, TotalStudentViews) VALUES (@collegeId, 1);
      `);
    return profile;
  },

  async saveCourse(user, courseIdRaw, data) {
    await ensureTables();
    const collegeId = await ownCollegeId(user);
    const pool = await getPool();
    const courseId = courseIdRaw ? parseInt(String(courseIdRaw), 10) : null;
    const req = pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('courseName', sql.NVarChar(255), data.courseName || '')
      .input('courseCategory', sql.NVarChar(100), data.courseCategory || null)
      .input('degreeType', sql.NVarChar(100), data.degreeType || null)
      .input('duration', sql.Decimal(4, 1), data.duration || null)
      .input('totalSeats', sql.Int, data.totalSeats || null)
      .input('eligibility', sql.NVarChar(sql.MAX), data.eligibility || null)
      .input('annualFee', sql.Decimal(12, 2), data.fees?.annualFee ?? data.annualFee ?? null)
      .input('hostelFee', sql.Decimal(12, 2), data.fees?.hostelFee ?? data.hostelFee ?? null)
      .input('examAccepted', sql.NVarChar(sql.MAX), jsonString(data.examAccepted))
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('courseImageUrl', sql.NVarChar(1000), data.courseImageUrl || null);
    if (courseId) {
      req.input('courseId', sql.Int, courseId);
      const result = await req.query(`
        UPDATE dbo.CollegeCourses
        SET CourseName = @courseName, CourseCategory = @courseCategory, DegreeType = @degreeType,
            Duration = @duration, TotalSeats = @totalSeats, Eligibility = @eligibility,
            AnnualFee = @annualFee, HostelFee = @hostelFee, ExamAccepted = @examAccepted,
            Description = @description, CourseImageUrl = @courseImageUrl, UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.*
        WHERE CourseID = @courseId AND CollegeID = @collegeId
      `);
      if (!result.recordset[0]) throw new ApiError('Course not found', 404);
      return mapCourse(result.recordset[0]);
    }
    const result = await req.query(`
      INSERT INTO dbo.CollegeCourses (
        CollegeID, CourseName, CourseCategory, DegreeType, Duration, TotalSeats, Eligibility,
        AnnualFee, HostelFee, ExamAccepted, Description, CourseImageUrl
      )
      OUTPUT inserted.*
      VALUES (
        @collegeId, @courseName, @courseCategory, @degreeType, @duration, @totalSeats, @eligibility,
        @annualFee, @hostelFee, @examAccepted, @description, @courseImageUrl
      )
    `);
    return mapCourse(result.recordset[0]);
  },

  async deleteCourse(user, courseIdRaw) {
    const collegeId = await ownCollegeId(user);
    const courseId = asId(courseIdRaw);
    await ensureTables();
    const result = await (await getPool()).request()
      .input('collegeId', sql.Int, collegeId)
      .input('courseId', sql.Int, courseId)
      .query('UPDATE dbo.CollegeCourses SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE CourseID = @courseId AND CollegeID = @collegeId');
    if (!result.rowsAffected[0]) throw new ApiError('Course not found', 404);
    return { message: 'Course deleted successfully' };
  },

  async saveAchievement(user, achievementIdRaw, data) {
    await ensureTables();
    const collegeId = await ownCollegeId(user);
    const achievementId = achievementIdRaw ? parseInt(String(achievementIdRaw), 10) : null;
    const req = (await getPool()).request()
      .input('collegeId', sql.Int, collegeId)
      .input('achievementTitle', sql.NVarChar(255), data.achievementTitle || '')
      .input('description', sql.NVarChar(sql.MAX), data.description || null)
      .input('achievementYear', sql.Int, data.achievementYear || null)
      .input('achievementImageUrl', sql.NVarChar(1000), data.achievementImageUrl || null)
      .input('displayOrder', sql.Int, data.displayOrder || null);
    if (achievementId) {
      req.input('achievementId', sql.Int, achievementId);
      const result = await req.query(`
        UPDATE dbo.CollegeAchievements
        SET AchievementTitle = @achievementTitle, Description = @description, AchievementYear = @achievementYear,
            AchievementImageUrl = @achievementImageUrl, DisplayOrder = @displayOrder, UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.*
        WHERE AchievementID = @achievementId AND CollegeID = @collegeId
      `);
      if (!result.recordset[0]) throw new ApiError('Achievement not found', 404);
      return mapAchievement(result.recordset[0]);
    }
    const result = await req.query(`
      INSERT INTO dbo.CollegeAchievements (CollegeID, AchievementTitle, Description, AchievementYear, AchievementImageUrl, DisplayOrder)
      OUTPUT inserted.*
      VALUES (@collegeId, @achievementTitle, @description, @achievementYear, @achievementImageUrl, @displayOrder)
    `);
    return mapAchievement(result.recordset[0]);
  },

  async deleteAchievement(user, achievementIdRaw) {
    const collegeId = await ownCollegeId(user);
    const achievementId = asId(achievementIdRaw);
    await ensureTables();
    const result = await (await getPool()).request()
      .input('collegeId', sql.Int, collegeId)
      .input('achievementId', sql.Int, achievementId)
      .query('UPDATE dbo.CollegeAchievements SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE AchievementID = @achievementId AND CollegeID = @collegeId');
    if (!result.rowsAffected[0]) throw new ApiError('Achievement not found', 404);
    return { message: 'Achievement deleted successfully' };
  },

  async saveGalleryImage(user, imageIdRaw, data, file) {
    await ensureTables();
    const collegeId = await ownCollegeId(user);
    const upload = file
      ? await sharepointService.uploadCollegeGalleryImage({ collegeId, file, itemId: randomUUID() })
      : null;
    const imageUrl = upload?.url || data.imageUrl;
    if (!imageUrl) throw new ApiError('Gallery image URL or file is required', 400);
    const imageId = imageIdRaw ? parseInt(String(imageIdRaw), 10) : null;
    const req = (await getPool()).request()
      .input('collegeId', sql.Int, collegeId)
      .input('imageUrl', sql.NVarChar(1000), imageUrl)
      .input('imageTitle', sql.NVarChar(255), data.imageTitle || data.title || null)
      .input('imageDescription', sql.NVarChar(600), data.imageDescription || data.description || null)
      .input('imageCategory', sql.NVarChar(100), data.imageCategory || data.category || null)
      .input('displayOrder', sql.Int, data.displayOrder || null);
    if (imageId) {
      req.input('imageId', sql.Int, imageId);
      const result = await req.query(`
        UPDATE dbo.CollegeGallery
        SET ImageUrl = @imageUrl, ImageTitle = @imageTitle, ImageDescription = @imageDescription,
            ImageCategory = @imageCategory, DisplayOrder = @displayOrder, UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.*
        WHERE ImageID = @imageId AND CollegeID = @collegeId
      `);
      if (!result.recordset[0]) throw new ApiError('Gallery image not found', 404);
      return mapGallery(result.recordset[0]);
    }
    const result = await req.query(`
      INSERT INTO dbo.CollegeGallery (CollegeID, ImageUrl, ImageTitle, ImageDescription, ImageCategory, DisplayOrder)
      OUTPUT inserted.*
      VALUES (@collegeId, @imageUrl, @imageTitle, @imageDescription, @imageCategory, @displayOrder)
    `);
    return mapGallery(result.recordset[0]);
  },

  async deleteGalleryImage(user, imageIdRaw) {
    const collegeId = await ownCollegeId(user);
    const imageId = asId(imageIdRaw);
    await ensureTables();
    const result = await (await getPool()).request()
      .input('collegeId', sql.Int, collegeId)
      .input('imageId', sql.Int, imageId)
      .query('UPDATE dbo.CollegeGallery SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE ImageID = @imageId AND CollegeID = @collegeId');
    if (!result.rowsAffected[0]) throw new ApiError('Gallery image not found', 404);
    return { message: 'Gallery image deleted successfully' };
  },

  async createEnquiry(collegeIdRaw, data) {
    await ensureTables();
    const collegeId = asId(collegeIdRaw);
    const pool = await getPool();
    const result = await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('studentName', sql.NVarChar(255), data.studentName || data.name || '')
      .input('studentEmail', sql.NVarChar(255), data.studentEmail || data.email || null)
      .input('studentPhone', sql.NVarChar(30), data.studentPhone || data.phone || null)
      .input('message', sql.NVarChar(sql.MAX), data.message || null)
      .input('interestedCourse', sql.NVarChar(255), data.interestedCourse || null)
      .query(`
        INSERT INTO dbo.CollegeEnquiries (CollegeID, StudentName, StudentEmail, StudentPhone, Message, InterestedCourse)
        OUTPUT inserted.*
        VALUES (@collegeId, @studentName, @studentEmail, @studentPhone, @message, @interestedCourse);
        UPDATE dbo.CollegeProfiles SET TotalEnquiries = TotalEnquiries + 1 WHERE CollegeID = @collegeId;
      `);
    return mapEnquiry(result.recordset[0]);
  },

  async updateEnquiry(user, enquiryIdRaw, data) {
    const collegeId = await ownCollegeId(user);
    const enquiryId = asId(enquiryIdRaw);
    await ensureTables();
    const result = await (await getPool()).request()
      .input('collegeId', sql.Int, collegeId)
      .input('enquiryId', sql.Int, enquiryId)
      .input('status', sql.NVarChar(50), data.status || 'Pending')
      .input('isRead', sql.Bit, data.isRead ? 1 : 0)
      .query(`
        UPDATE dbo.CollegeEnquiries
        SET Status = @status, IsRead = @isRead, UpdatedAt = SYSUTCDATETIME()
        OUTPUT inserted.*
        WHERE EnquiryID = @enquiryId AND CollegeID = @collegeId
      `);
    if (!result.recordset[0]) throw new ApiError('Enquiry not found', 404);
    return mapEnquiry(result.recordset[0]);
  },
};

module.exports = collegePortalSqlService;
