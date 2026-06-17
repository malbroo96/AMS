const { randomUUID } = require('crypto');
const { sql, getPool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const CourseModel = require('../models/Course.model');
const sharepointService = require('./sharepointService');

let tablesReady = false;
const DEFAULT_PROFILE_COMPLETION = 15;

function asId(value) {
  const id = parseInt(String(value), 10);
  if (!Number.isFinite(id)) throw new ApiError('Invalid college id', 400);
  return id;
}

async function ensureTables() {
  tablesReady = true;
  return;
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
    courseId: row.RealCourseID ? String(row.RealCourseID) : null,
    courseName: row.CourseName || '',
    branchId: row.BranchID ? String(row.BranchID) : null,
    branchName: row.BranchName || '',
    branchCode: row.BranchCode || '',
    courseCategory: '',
    degreeType: '',
    duration: row.Duration != null ? Number(row.Duration) : null,
    totalSeats: row.TotalSeats != null ? Number(row.TotalSeats) : null,
    eligibility: row.Eligibility || '',
    fees: {
      annualFee: row.AnnualFee != null ? Number(row.AnnualFee) : null,
      hostelFee: null,
    },
    examAccepted: [],
    description: '',
    courseImageUrl: null,
  };
}

function mapGallery(row) {
  return {
    id: String(row.MediaID || row.ImageID),
    imageUrl: row.SharePointUrl || row.ImageUrl,
    imageTitle: row.Title || row.ImageTitle || '',
    imageDescription: row.Description || row.ImageDescription || '',
    imageCategory: row.MediaType || row.ImageCategory || 'Image',
    displayOrder: row.DisplayOrder != null ? Number(row.DisplayOrder) : null,
  };
}

function baseProfile(row) {
  const profile = {
    id: String(row.CollegeID),
    collegeId: String(row.CollegeID),
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
    logoUrl: row.LogoUrl || null,
    bannerUrl: row.BannerUrl || null,
    coverBannerUrl: row.BannerUrl || null,
    prospectusUrl: row.ProspectusUrl || null,
    location: {
      country: 'India',
      state: row.State || '',
      district: '',
      city: row.City || '',
      pincode: row.Pincode || '',
      fullAddress: row.Address || '',
      latitude: null,
      longitude: null,
      googleMapsUrl: '',
    },
    contact: {
      emailAddress: row.Email || '',
      admissionMobileNumber: row.ContactPhone || '',
      officeMobileNumber: row.ContactPhone || '',
      landlineNumber: '',
      websiteUrl: row.WebsiteUrl || '',
    },
    placements: {
      placementPercentage: row.PlacementPercentage != null ? Number(row.PlacementPercentage) : null,
      highestPackage: row.HighestPackage || '',
      averagePackage: row.AveragePackage || '',
      topRecruiters: [],
    },
    about: {
      summaryDescription: row.SummaryDescription || '',
      visionStatement: '',
      missionStatement: '',
      principalMessage: '',
      chairmanMessage: '',
    },
    facilities: [],
  };
  return {
    ...profile,
    dashboard: {
      totalStudentViews: 0,
      totalEnquiries: 0,
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
           p.AicteApproval, p.UgcRecognition, p.ProspectusUrl, p.Address, p.City, p.State,
           p.Pincode, p.ContactPhone, p.WebsiteUrl, p.SummaryDescription,
           p.PlacementPercentage, p.HighestPackage, p.AveragePackage,
           p.LogoUrl, p.BannerUrl,
           (SELECT COUNT(*) FROM dbo.Applications sa INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID WHERE cc.CollegeID = c.CollegeID) AS TotalInterestedStudents
    FROM dbo.Colleges c
    LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
    WHERE c.CollegeID = @collegeId
  `);
  const row = result.recordset[0];
  if (!row) throw new ApiError('College profile not found', 404);
  return row;
}

async function getProfile(collegeId, enforceApproved = false) {
  const row = await getProfileRow(collegeId);
  if (enforceApproved && row.Status !== 'approved') {
    throw new ApiError('College profile not found or not approved', 404);
  }
  const pool = await getPool();
  const [courses, gallery] = await Promise.all([
    pool.request().input('collegeId', sql.Int, collegeId).query(`
      SELECT cc.CollegeCourseID AS CourseID, cc.CollegeID, c.CourseID AS RealCourseID, c.CourseName, c.CourseCode,
             b.BranchID, b.BranchName, b.BranchCode,
             cc.DurationYears AS Duration, cc.TotalSeats, cc.AnnualFee, cc.EligibilityCriteria AS Eligibility,
             cc.IsActive, cc.CreatedAt, cc.UpdatedAt
      FROM dbo.CollegeCourses cc
      INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
      INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
      WHERE cc.CollegeID = @collegeId AND cc.IsActive = 1
      ORDER BY c.CourseName, b.BranchName
    `),
    pool.request().input('collegeId', sql.Int, collegeId).query(`
      SELECT MediaID AS ImageID, CollegeID, SharePointUrl AS ImageUrl, Title AS ImageTitle,
             Description AS ImageDescription, MediaType AS ImageCategory, DisplayOrder, IsActive, CreatedAt, UpdatedAt
      FROM dbo.CollegeMedia
      WHERE CollegeID = @collegeId AND IsActive = 1 AND MediaType = 'Image'
      ORDER BY COALESCE(DisplayOrder, 9999), CreatedAt DESC
    `),
  ]);
  return {
    ...baseProfile(row),
    courses: courses.recordset.map(mapCourse),
    achievements: [],
    gallery: gallery.recordset.map(mapGallery),
    enquiries: [],
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
  };
  
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
      .input('prospectusUrl', sql.NVarChar(2048), next.prospectusUrl || null)
      .input('address', sql.NVarChar(500), next.location.fullAddress || next.location.address || null)
      .input('city', sql.NVarChar(100), next.location.city || null)
      .input('state', sql.NVarChar(100), next.location.state || null)
      .input('pincode', sql.NVarChar(20), next.location.pincode || null)
      .input('contactPhone', sql.NVarChar(30), next.contact.admissionMobileNumber || next.contact.officeMobileNumber || null)
      .input('websiteUrl', sql.NVarChar(255), next.contact.websiteUrl || null)
      .input('summaryDescription', sql.NVarChar(sql.MAX), next.about.summaryDescription || null)
      .input('placementPercentage', sql.Decimal(5, 2), next.placements.placementPercentage || null)
      .input('highestPackage', sql.NVarChar(50), next.placements.highestPackage || null)
      .input('averagePackage', sql.NVarChar(50), next.placements.averagePackage || null)
      .input('logoUrl', sql.NVarChar(2048), next.logoUrl || null)
      .input('bannerUrl', sql.NVarChar(2048), next.coverBannerUrl || null)
      .query(`
        MERGE dbo.CollegeProfiles AS target
        USING (SELECT @collegeId AS CollegeID) AS source
        ON target.CollegeID = source.CollegeID
        WHEN MATCHED THEN UPDATE SET
          ShortName = @shortName, EstablishmentYear = @establishmentYear, CollegeType = @collegeType,
          UniversityAffiliation = @universityAffiliation, NaacGrade = @naacGrade,
          AicteApproval = @aicteApproval, UgcRecognition = @ugcRecognition, ProspectusUrl = @prospectusUrl,
          Address = @address, City = @city, State = @state, Pincode = @pincode,
          ContactPhone = @contactPhone, WebsiteUrl = @websiteUrl, SummaryDescription = @summaryDescription,
          PlacementPercentage = @placementPercentage, HighestPackage = @highestPackage, AveragePackage = @averagePackage,
          LogoUrl = @logoUrl, BannerUrl = @bannerUrl, UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (
          CollegeID, ShortName, EstablishmentYear, CollegeType, UniversityAffiliation, NaacGrade,
          AicteApproval, UgcRecognition, ProspectusUrl, Address, City, State, Pincode,
          ContactPhone, WebsiteUrl, SummaryDescription, PlacementPercentage, HighestPackage,
          AveragePackage, LogoUrl, BannerUrl
        ) VALUES (
          @collegeId, @shortName, @establishmentYear, @collegeType, @universityAffiliation, @naacGrade,
          @aicteApproval, @ugcRecognition, @prospectusUrl, @address, @city, @state, @pincode,
          @contactPhone, @websiteUrl, @summaryDescription, @placementPercentage, @highestPackage,
          @averagePackage, @logoUrl, @bannerUrl
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
    return getProfile(collegeId, false);
  },

  updateProfile,

  async listPublic(query = {}) {
    await ensureTables();
    const pool = await getPool();
    const req = pool.request();
    const clauses = ["LOWER(c.Status) = 'approved'"];
    const search = String(query.search || '').trim().toLowerCase();
    const cityValues = String(query.cities || query.city || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const courseValues = String(query.courses || query.course || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (search) {
      clauses.push('(LOWER(c.CollegeName) LIKE @search OR LOWER(p.City) LIKE @search OR LOWER(p.State) LIKE @search)');
      req.input('search', sql.NVarChar(255), `%${search}%`);
    }
    if (query.state) {
      clauses.push('p.State = @state');
      req.input('state', sql.NVarChar(100), query.state);
    }
    if (cityValues.length) {
      const cityParams = cityValues.map((value, index) => {
        const param = `city${index}`;
        req.input(param, sql.NVarChar(100), value);
        return `@${param}`;
      });
      clauses.push(`p.City IN (${cityParams.join(', ')})`);
    }
    if (query.collegeType) {
      clauses.push('p.CollegeType = @collegeType');
      req.input('collegeType', sql.NVarChar(50), query.collegeType);
    }
    const maxFee = Number(query.maxFee);
    if (Number.isFinite(maxFee)) {
      clauses.push(`(
        EXISTS (
          SELECT 1
          FROM dbo.CollegeCourses cc
          WHERE cc.CollegeID = c.CollegeID
            AND cc.IsActive = 1
            AND cc.AnnualFee <= @maxFee
        )
        OR NOT EXISTS (
          SELECT 1
          FROM dbo.CollegeCourses cc
          WHERE cc.CollegeID = c.CollegeID
            AND cc.IsActive = 1
            AND cc.AnnualFee IS NOT NULL
        )
      )`);
      req.input('maxFee', sql.Decimal(12, 2), maxFee);
    }
    if (courseValues.length) {
      const courseClauses = courseValues.map((value, index) => {
        const param = `course${index}`;
        req.input(param, sql.NVarChar(255), `%${value}%`);
        return `(LOWER(cc.CourseName) LIKE @${param})`;
      });
      clauses.push(`
        EXISTS (
          SELECT 1
          FROM dbo.CollegeCourses cc
          INNER JOIN dbo.Courses c2 ON c2.CourseID = cc.CourseID
          WHERE cc.CollegeID = c.CollegeID
            AND cc.IsActive = 1
            AND (${courseClauses.join(' OR ').replace(/cc\.CourseName/g, 'c2.CourseName')})
        )
      `);
    }

    const result = await req.query(`
      SELECT c.CollegeID, c.CollegeName, c.Email, c.Status, p.ShortName, p.EstablishmentYear, p.CollegeType, p.UniversityAffiliation,
             p.NaacGrade, p.AicteApproval, p.UgcRecognition, p.ProspectusUrl, p.Address, p.City, p.State, p.Pincode, p.ContactPhone, p.WebsiteUrl,
             p.SummaryDescription, p.PlacementPercentage, p.HighestPackage, p.AveragePackage, p.LogoUrl, p.BannerUrl,
             (SELECT MIN(AnnualFee) FROM dbo.CollegeCourses cc WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1) AS FeesFrom,
             (SELECT COUNT(*) FROM dbo.CollegeCourses cc WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1) AS CourseCount,
             (SELECT COUNT(*) FROM dbo.Applications sa INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = sa.CollegeCourseID WHERE cc.CollegeID = c.CollegeID) AS TotalInterestedStudents
      FROM dbo.Colleges c
      LEFT JOIN dbo.CollegeProfiles p ON p.CollegeID = c.CollegeID
      WHERE ${clauses.join(' AND ')}
      ORDER BY c.CollegeName
    `);

    const collegeIds = result.recordset.map((row) => Number(row.CollegeID)).filter(Number.isFinite);
    let coursesByCollegeId = new Map();

    if (collegeIds.length) {
      const courseReq = pool.request();
      const idParams = collegeIds.map((id, index) => {
        const param = `collegeId${index}`;
        courseReq.input(param, sql.Int, id);
        return `@${param}`;
      });
      const courseResult = await courseReq.query(`
        SELECT cc.CollegeCourseID AS CourseID, cc.CollegeID, c.CourseID AS RealCourseID, c.CourseName, c.CourseCode,
               b.BranchID, b.BranchName, b.BranchCode,
               cc.DurationYears AS Duration, cc.TotalSeats, cc.AnnualFee, cc.EligibilityCriteria AS Eligibility,
               cc.IsActive, cc.CreatedAt, cc.UpdatedAt
        FROM dbo.CollegeCourses cc
        INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
        INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
        WHERE cc.IsActive = 1 AND cc.CollegeID IN (${idParams.join(', ')})
        ORDER BY c.CourseName, b.BranchName
      `);

      coursesByCollegeId = courseResult.recordset.reduce((groups, row) => {
        const key = String(row.CollegeID);
        const next = groups.get(key) || [];
        next.push(mapCourse(row));
        groups.set(key, next);
        return groups;
      }, new Map());
    }

    return result.recordset.map((row) => ({
      ...baseProfile(row),
      courses: coursesByCollegeId.get(String(row.CollegeID)) || [],
      feesFrom: row.FeesFrom != null ? Number(row.FeesFrom) : null,
      courseCount: Number(row.CourseCount || 0),
    }));
  },

  async getPublicDetails(collegeIdRaw) {
    const collegeId = asId(collegeIdRaw);
    return getProfile(collegeId, true);
  },

  async saveCourse(user, courseIdRaw, data) {
    const collegeId = await ownCollegeId(user);
    const fees = data.fees?.annualFee ?? data.annualFee ?? null;
    const seats = data.totalSeats ?? data.seats ?? null;
    const courseName = data.courseName || '';
    const branchName = data.branchName || '';
    const duration = data.duration != null ? Number(data.duration) : 4.0;
    const eligibility = data.eligibility || '';

    if (courseIdRaw) {
      const updated = await CourseModel.update(courseIdRaw, { courseName, branchName, duration, fees, seats, eligibility });
      if (!updated) throw new ApiError('Course not found', 404);
      return mapCourse({
        CourseID: updated.id,
        RealCourseID: updated.RealCourseID,
        CourseName: updated.course_name,
        BranchID: updated.BranchID,
        BranchName: updated.BranchName,
        BranchCode: updated.BranchCode,
        Duration: updated.duration,
        TotalSeats: updated.seats,
        AnnualFee: updated.fees,
        Eligibility: updated.eligibility
      });
    } else {
      const created = await CourseModel.create({ schoolId: collegeId, courseName, branchName, duration, fees, seats, eligibility });
      return mapCourse({
        CourseID: created.id,
        RealCourseID: created.RealCourseID,
        CourseName: created.course_name,
        BranchID: created.BranchID,
        BranchName: created.BranchName,
        BranchCode: created.BranchCode,
        Duration: created.duration,
        TotalSeats: created.seats,
        AnnualFee: created.fees,
        Eligibility: created.eligibility
      });
    }
  },

  async deleteCourse(user, courseIdRaw) {
    const collegeId = await ownCollegeId(user);
    const courseId = asId(courseIdRaw);
    const course = await CourseModel.findById(courseId);
    if (!course || String(course.school_id) !== String(collegeId)) {
      throw new ApiError('Course not found', 404);
    }
    await CourseModel.delete(courseId);
    return { message: 'Course deleted successfully' };
  },

  async saveAchievement(user, achievementIdRaw, data) {
    return {
      id: achievementIdRaw || '1',
      achievementTitle: data.achievementTitle || '',
      description: data.description || '',
      achievementYear: data.achievementYear || null,
      achievementImageUrl: data.achievementImageUrl || null,
      displayOrder: data.displayOrder || null
    };
  },

  async deleteAchievement(user, achievementIdRaw) {
    return { message: 'Achievement deleted successfully' };
  },

  async saveGalleryImage(user, imageIdRaw, data, file) {
    const collegeId = await ownCollegeId(user);
    const upload = file
      ? await sharepointService.uploadCollegeGalleryImage({ collegeId, file, itemId: randomUUID() })
      : null;
    const imageUrl = upload?.url || data.imageUrl;
    if (!imageUrl) throw new ApiError('Gallery image URL or file is required', 400);
    const imageId = imageIdRaw ? parseInt(String(imageIdRaw), 10) : null;
    const pool = await getPool();

    if (imageId) {
      const result = await pool.request()
        .input('collegeId', sql.Int, collegeId)
        .input('imageId', sql.Int, imageId)
        .input('imageUrl', sql.NVarChar(2048), imageUrl)
        .input('title', sql.NVarChar(255), data.imageTitle || data.title || null)
        .input('description', sql.NVarChar(1000), data.imageDescription || data.description || null)
        .input('displayOrder', sql.Int, data.displayOrder || 0)
        .query(`
          UPDATE dbo.CollegeMedia
          SET SharePointUrl = @imageUrl, Title = @title, Description = @description,
              DisplayOrder = @displayOrder, UpdatedAt = SYSUTCDATETIME()
          OUTPUT inserted.*
          WHERE MediaID = @imageId AND CollegeID = @collegeId AND MediaType = 'Image'
        `);
      if (!result.recordset[0]) throw new ApiError('Gallery image not found', 404);
      return mapGallery(result.recordset[0]);
    } else {
      const result = await pool.request()
        .input('collegeId', sql.Int, collegeId)
        .input('imageUrl', sql.NVarChar(2048), imageUrl)
        .input('title', sql.NVarChar(255), data.imageTitle || data.title || null)
        .input('description', sql.NVarChar(1000), data.imageDescription || data.description || null)
        .input('displayOrder', sql.Int, data.displayOrder || 0)
        .query(`
          INSERT INTO dbo.CollegeMedia (CollegeID, MediaType, SharePointUrl, Title, Description, DisplayOrder, IsActive)
          OUTPUT inserted.*
          VALUES (@collegeId, 'Image', @imageUrl, @title, @description, @displayOrder, 1)
        `);
      return mapGallery(result.recordset[0]);
    }
  },

  async deleteGalleryImage(user, imageIdRaw) {
    const collegeId = await ownCollegeId(user);
    const imageId = asId(imageIdRaw);
    const pool = await getPool();
    const result = await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('imageId', sql.Int, imageId)
      .query(`
        UPDATE dbo.CollegeMedia
        SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
        WHERE MediaID = @imageId AND CollegeID = @collegeId AND MediaType = 'Image'
      `);
    if (!result.rowsAffected[0]) throw new ApiError('Gallery image not found', 404);
    return { message: 'Gallery image deleted successfully' };
  },

  async createEnquiry(collegeIdRaw, data) {
    return {
      id: '1',
      studentName: data.studentName || data.name || '',
      studentEmail: data.studentEmail || data.email || '',
      studentPhone: data.studentPhone || data.phone || '',
      message: data.message || '',
      interestedCourse: data.interestedCourse || '',
      status: 'Pending',
      isRead: false,
      createdAt: new Date().toISOString()
    };
  },

  async updateEnquiry(user, enquiryIdRaw, data) {
    return {
      id: String(enquiryIdRaw),
      status: data.status || 'Pending',
      isRead: !!data.isRead,
      createdAt: new Date().toISOString()
    };
  },
};

module.exports = collegePortalSqlService;
