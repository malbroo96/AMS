const { randomUUID } = require('crypto');
const { sql, getPool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const CourseModel = require('../models/Course.model');
const sharepointService = require('./sharepointService');
const notificationServices = require('./notification.services');

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
  const tuition = row.TuitionFee != null ? Number(row.TuitionFee) : null;
  const hostelFee = row.HostelFee != null ? Number(row.HostelFee) : null;
  const transportFee = row.TransportFee != null ? Number(row.TransportFee) : null;
  const examFee = row.ExamFee != null ? Number(row.ExamFee) : null;
  const miscellaneousFee = row.MiscellaneousFee != null ? Number(row.MiscellaneousFee) : null;
  const totalFee = row.TotalFee != null ? Number(row.TotalFee) : null;
  const annualFee = tuition != null ? tuition : row.AnnualFee != null ? Number(row.AnnualFee) : null;
  return {
    id: String(row.CourseID),
    courseId: row.RealCourseID ? String(row.RealCourseID) : null,
    courseName: row.CourseName || '',
    branchId: row.BranchID ? String(row.BranchID) : null,
    branchName: row.BranchName || '',
    branchCode: row.BranchCode || '',
    courseCategory: '',
    degreeType: row.Degree || '',
    degree: row.Degree || '',
    duration: row.Duration != null ? Number(row.Duration) : null,
    intake: row.Intake != null ? Number(row.Intake) : null,
    totalSeats: row.TotalSeats != null ? Number(row.TotalSeats) : null,
    availableSeats: row.AvailableSeats != null ? Number(row.AvailableSeats) : null,
    eligibility: row.Eligibility || '',
    fees: {
      annualFee,
      tuitionFee: tuition,
      hostelFee,
      transportFee,
      examFee,
      miscellaneousFee,
      scholarshipInfo: row.ScholarshipInfo || '',
      totalFee,
    },
    examAccepted: [],
    description: row.CourseDescription || '',
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

function baseProfile(row, extras = {}) {
  const rating =
    row.CalculatedRating != null
      ? Number(row.CalculatedRating)
      : extras.rating != null
        ? Number(extras.rating)
        : null;
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
    rating,
    reviewCount: extras.accreditationCount != null ? Number(extras.accreditationCount) : 0,
    location: {
      country: row.Country || '',
      state: row.State || '',
      district: row.District || '',
      city: row.City || '',
      pincode: row.Pincode || '',
      fullAddress: row.Address || '',
      address: row.Address || '',
      latitude: null,
      longitude: null,
      googleMapsUrl: row.GoogleMapUrl || '',
      googleMapUrl: row.GoogleMapUrl || '',
    },
    contact: {
      emailAddress: extras.contacts?.AdmissionEmail || row.Email || '',
      admissionMobileNumber: extras.contacts?.AdmissionPhone || row.ContactPhone || '',
      officeMobileNumber: extras.contacts?.OfficePhone || row.ContactPhone || '',
      landlineNumber: extras.contacts?.LandlineNumber || '',
      websiteUrl: row.WebsiteUrl || '',
      principalName: extras.contacts?.PrincipalName || '',
      admissionOfficer: extras.contacts?.AdmissionOfficer || '',
      admissionEmail: extras.contacts?.AdmissionEmail || '',
      admissionPhone: extras.contacts?.AdmissionPhone || '',
      whatsAppNumber: extras.contacts?.WhatsAppNumber || '',
      phone: row.ContactPhone || '',
    },
    contacts: {
      principalName: extras.contacts?.PrincipalName || '',
      admissionOfficer: extras.contacts?.AdmissionOfficer || '',
      admissionEmail: extras.contacts?.AdmissionEmail || '',
      admissionPhone: extras.contacts?.AdmissionPhone || '',
      whatsAppNumber: extras.contacts?.WhatsAppNumber || '',
      officePhone: extras.contacts?.OfficePhone || '',
      landlineNumber: extras.contacts?.LandlineNumber || '',
    },
    placements: {
      placementPercentage:
        extras.placements?.PlacementPercentage != null
          ? Number(extras.placements.PlacementPercentage)
          : row.PlacementPercentage != null
            ? Number(row.PlacementPercentage)
            : null,
      highestPackage: extras.placements?.HighestPackage || row.HighestPackage || '',
      averagePackage: extras.placements?.AveragePackage || row.AveragePackage || '',
      topRecruiters: extras.recruiters || [],
    },
    about: {
      summaryDescription: row.SummaryDescription || '',
      visionStatement: row.Vision || '',
      missionStatement: row.Mission || '',
      vision: row.Vision || '',
      mission: row.Mission || '',
      principalMessage: '',
      chairmanMessage: '',
    },
    facilities: extras.facilities || [],
    accreditations: extras.accreditations || [],
    documents: extras.documents || [],
    socialLinks: extras.socialLinks || {},
    notices: extras.notices || [],
  };
  return {
    ...profile,
    dashboard: {
      totalStudentViews: 0,
      totalEnquiries: 0,
      totalInterestedStudents: Number(row.TotalInterestedStudents || 0),
      profileCompletionPercentage:
        row.ProfileCompletionPercentage != null
          ? Number(row.ProfileCompletionPercentage)
          : profileCompletion(profile),
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
           p.District, p.Country, p.GoogleMapUrl, p.CalculatedRating, p.ProfileCompletionPercentage,
           p.Pincode, p.ContactPhone, p.WebsiteUrl, p.SummaryDescription, p.Vision, p.Mission,
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

async function loadRelated(collegeId) {
  const pool = await getPool();
  const req = () => pool.request().input('collegeId', sql.Int, collegeId);

  const [contacts, facilities, placements, recruiters, accreditations, documents, social, notices, courses, gallery] =
    await Promise.all([
      req().query('SELECT TOP 1 * FROM dbo.CollegeContacts WHERE CollegeID = @collegeId'),
      req().query(`
        SELECT FacilityName, OtherDescription
        FROM dbo.CollegeFacilities
        WHERE CollegeID = @collegeId AND IsAvailable = 1
        ORDER BY FacilityName
      `),
      req().query('SELECT TOP 1 * FROM dbo.CollegePlacements WHERE CollegeID = @collegeId'),
      req().query(`
        SELECT RecruiterName, RecruiterLogoUrl, DisplayOrder
        FROM dbo.CollegeRecruiters
        WHERE CollegeID = @collegeId AND IsActive = 1
        ORDER BY DisplayOrder, RecruiterName
      `),
      req().query(`
        SELECT AccreditationID, AccreditationName, GradeOrScore, CertificateNumber, ValidTill, CertificateUrl
        FROM dbo.CollegeAccreditations
        WHERE CollegeID = @collegeId AND IsActive = 1
        ORDER BY AccreditationName
      `),
      req().query(`
        SELECT DocumentID, DocumentType, DocumentName, FileUrl
        FROM dbo.CollegeDocuments
        WHERE CollegeID = @collegeId AND IsActive = 1
        ORDER BY DocumentType, CreatedAt DESC
      `),
      req().query(`
        SELECT Platform, Url FROM dbo.CollegeSocialLinks WHERE CollegeID = @collegeId
      `),
      req().query(`
        SELECT NoticeID, Title, Body, Category, Status, AttachmentUrl, PublishedAt, CreatedAt
        FROM dbo.CollegeNotices
        WHERE CollegeID = @collegeId
        ORDER BY COALESCE(PublishedAt, CreatedAt) DESC
      `),
      req().query(`
        SELECT cc.CollegeCourseID AS CourseID, cc.CollegeID, c.CourseID AS RealCourseID, c.CourseName, c.CourseCode,
               b.BranchID, b.BranchName, b.BranchCode,
               cc.DurationYears AS Duration, cc.TotalSeats, cc.AnnualFee, cc.EligibilityCriteria AS Eligibility,
               cc.Degree, cc.Intake, cc.AvailableSeats, cc.Description AS CourseDescription,
               f.TuitionFee, f.HostelFee, f.TransportFee, f.ExamFee, f.MiscellaneousFee, f.ScholarshipInfo, f.TotalFee,
               cc.IsActive, cc.CreatedAt, cc.UpdatedAt
        FROM dbo.CollegeCourses cc
        INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
        INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
        LEFT JOIN dbo.CollegeFees f ON f.CollegeCourseID = cc.CollegeCourseID
        WHERE cc.CollegeID = @collegeId AND cc.IsActive = 1
        ORDER BY c.CourseName, b.BranchName
      `),
      req().query(`
        SELECT MediaID AS ImageID, CollegeID, SharePointUrl AS ImageUrl, Title AS ImageTitle,
               Description AS ImageDescription, MediaType AS ImageCategory, DisplayOrder, IsActive, CreatedAt, UpdatedAt
        FROM dbo.CollegeMedia
        WHERE CollegeID = @collegeId AND IsActive = 1 AND MediaType = 'Image'
        ORDER BY COALESCE(DisplayOrder, 9999), CreatedAt DESC
      `),
    ]);

  const socialLinks = {};
  for (const row of social.recordset) {
    socialLinks[String(row.Platform).toLowerCase()] = row.Url;
  }

  return {
    contacts: contacts.recordset[0] || null,
    facilities: facilities.recordset.map((r) => r.FacilityName),
    placements: placements.recordset[0] || null,
    recruiters: recruiters.recordset.map((r) => ({
      recruiterName: r.RecruiterName,
      recruiterLogoUrl: r.RecruiterLogoUrl || null,
    })),
    accreditations: accreditations.recordset.map((r) => ({
      id: String(r.AccreditationID),
      accreditationName: r.AccreditationName,
      gradeOrScore: r.GradeOrScore || '',
      certificateNumber: r.CertificateNumber || '',
      validTill: r.ValidTill || null,
      certificateUrl: r.CertificateUrl || null,
    })),
    documents: documents.recordset.map((r) => ({
      id: String(r.DocumentID),
      documentType: r.DocumentType,
      documentName: r.DocumentName || '',
      fileUrl: r.FileUrl,
    })),
    socialLinks,
    notices: notices.recordset.map((r) => ({
      id: String(r.NoticeID),
      title: r.Title,
      body: r.Body || '',
      category: r.Category || '',
      status: r.Status,
      attachmentUrl: r.AttachmentUrl || null,
      publishedAt: r.PublishedAt,
      createdAt: r.CreatedAt,
    })),
    courses: courses.recordset.map(mapCourse),
    gallery: gallery.recordset.map(mapGallery),
    accreditationCount: accreditations.recordset.length,
  };
}

async function getProfile(collegeId, enforceApproved = false) {
  const row = await getProfileRow(collegeId);
  if (enforceApproved && row.Status !== 'approved') {
    throw new ApiError('College profile not found or not approved', 404);
  }
  const related = await loadRelated(collegeId);
  return {
    ...baseProfile(row, related),
    courses: related.courses,
    achievements: [],
    gallery: related.gallery,
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
    location: { ...current.location, ...(data.location || data.address || {}) },
    contact: { ...current.contact, ...(data.contact || data.contacts || {}) },
    contacts: { ...current.contacts, ...(data.contacts || data.contact || {}) },
    placements: { ...current.placements, ...(data.placements || {}) },
    about: { ...current.about, ...(data.about || {}) },
    socialLinks: { ...current.socialLinks, ...(data.socialLinks || data.social || {}) },
  };

  const registrationService = require('./collegeRegistration.service');
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  const requestFactory = () => new sql.Request(transaction);

  try {
    await registrationService.upsertProfileBasics(
      requestFactory,
      collegeId,
      {
        collegeName: next.collegeName,
        collegeType: next.collegeType,
        universityAffiliation: next.universityAffiliation,
        establishmentYear: next.establishmentYear,
        description: next.about?.summaryDescription,
        vision: next.about?.vision || next.about?.visionStatement,
        mission: next.about?.mission || next.about?.missionStatement,
        website: next.contact?.websiteUrl,
        email: next.email || next.contact?.emailAddress,
        phone: next.contact?.admissionMobileNumber || next.contact?.phone,
      },
      {
        logoUrl: next.logoUrl,
        bannerUrl: next.coverBannerUrl || next.bannerUrl,
      },
      next.location
    );

    if (data.contacts || data.contact) {
      await registrationService.upsertContacts(requestFactory, collegeId, next.contacts || next.contact);
    }
    if (Array.isArray(data.facilities)) {
      await registrationService.replaceFacilities(requestFactory, collegeId, data.facilities);
    }
    if (data.placements) {
      await registrationService.upsertPlacements(requestFactory, collegeId, next.placements);
    }
    if (Array.isArray(data.accreditations)) {
      await registrationService.replaceAccreditations(requestFactory, collegeId, data.accreditations);
    }
    if (data.socialLinks || data.social) {
      await registrationService.replaceSocialLinks(requestFactory, collegeId, next.socialLinks);
    }
    if (Array.isArray(data.documents)) {
      await requestFactory()
        .input('collegeId', sql.Int, collegeId)
        .query('UPDATE dbo.CollegeDocuments SET IsActive = 0 WHERE CollegeID = @collegeId');
      await registrationService.insertDocuments(requestFactory, collegeId, data.documents);
    }

    // Short name / NAAC legacy fields
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('shortName', sql.NVarChar(100), next.shortName || null)
      .input('naacGrade', sql.NVarChar(20), next.naacGrade || null)
      .input('aicteApproval', sql.Bit, next.aicteApproval ? 1 : 0)
      .input('ugcRecognition', sql.Bit, next.ugcRecognition ? 1 : 0)
      .input('prospectusUrl', sql.NVarChar(2048), next.prospectusUrl || null)
      .query(`
        UPDATE dbo.CollegeProfiles
        SET ShortName = COALESCE(@shortName, ShortName),
            NaacGrade = COALESCE(@naacGrade, NaacGrade),
            AicteApproval = @aicteApproval,
            UgcRecognition = @ugcRecognition,
            ProspectusUrl = COALESCE(@prospectusUrl, ProspectusUrl),
            UpdatedAt = SYSUTCDATETIME()
        WHERE CollegeID = @collegeId
      `);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await notificationServices.notifyCollege({
    collegeId,
    type: 'Profile',
    title: 'Profile updated',
    description: 'Your college profile changes were saved successfully.',
    priority: 'success',
    referenceId: collegeId,
    referenceType: 'college',
  });

  return getProfile(collegeId);
}

async function upsertCourseFees(pool, collegeCourseId, fees, annualFee) {
  const tuition = fees.tuitionFee ?? fees.annualFee ?? annualFee ?? null;
  const hostelFee = fees.hostelFee ?? null;
  const transportFee = fees.transportFee ?? null;
  const examFee = fees.examFee ?? null;
  const miscellaneousFee = fees.miscellaneousFee ?? null;
  const scholarshipInfo = fees.scholarshipInfo || null;
  const totalFee =
    fees.totalFee ??
    [tuition, hostelFee, transportFee, examFee, miscellaneousFee]
      .map((v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : 0))
      .reduce((a, b) => a + b, 0);

  await pool
    .request()
    .input('collegeCourseId', sql.Int, collegeCourseId)
    .input('tuitionFee', sql.Decimal(12, 2), tuition)
    .input('hostelFee', sql.Decimal(12, 2), hostelFee)
    .input('transportFee', sql.Decimal(12, 2), transportFee)
    .input('examFee', sql.Decimal(12, 2), examFee)
    .input('miscFee', sql.Decimal(12, 2), miscellaneousFee)
    .input('scholarship', sql.NVarChar(sql.MAX), scholarshipInfo)
    .input('totalFee', sql.Decimal(12, 2), totalFee)
    .query(`
      MERGE dbo.CollegeFees AS target
      USING (SELECT @collegeCourseId AS CollegeCourseID) AS source
      ON target.CollegeCourseID = source.CollegeCourseID
      WHEN MATCHED THEN UPDATE SET
        TuitionFee = @tuitionFee, HostelFee = @hostelFee, TransportFee = @transportFee,
        ExamFee = @examFee, MiscellaneousFee = @miscFee, ScholarshipInfo = @scholarship,
        TotalFee = @totalFee, UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (
        CollegeCourseID, TuitionFee, HostelFee, TransportFee, ExamFee, MiscellaneousFee, ScholarshipInfo, TotalFee
      ) VALUES (
        @collegeCourseId, @tuitionFee, @hostelFee, @transportFee, @examFee, @miscFee, @scholarship, @totalFee
      );
    `);
}

async function getMappedCourse(collegeCourseId) {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, collegeCourseId).query(`
    SELECT cc.CollegeCourseID AS CourseID, cc.CollegeID, c.CourseID AS RealCourseID, c.CourseName, c.CourseCode,
           b.BranchID, b.BranchName, b.BranchCode,
           cc.DurationYears AS Duration, cc.TotalSeats, cc.AnnualFee, cc.EligibilityCriteria AS Eligibility,
           cc.Degree, cc.Intake, cc.AvailableSeats, cc.Description AS CourseDescription,
           f.TuitionFee, f.HostelFee, f.TransportFee, f.ExamFee, f.MiscellaneousFee, f.ScholarshipInfo, f.TotalFee
    FROM dbo.CollegeCourses cc
    INNER JOIN dbo.Courses c ON c.CourseID = cc.CourseID
    INNER JOIN dbo.Branches b ON b.BranchID = cc.BranchID
    LEFT JOIN dbo.CollegeFees f ON f.CollegeCourseID = cc.CollegeCourseID
    WHERE cc.CollegeCourseID = @id
  `);
  if (!result.recordset[0]) throw new ApiError('Course not found', 404);
  return mapCourse(result.recordset[0]);
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
             p.NaacGrade, p.AicteApproval, p.UgcRecognition, p.ProspectusUrl, p.Address, p.City, p.State, p.District, p.Country,
             p.Pincode, p.ContactPhone, p.WebsiteUrl, p.SummaryDescription, p.Vision, p.Mission, p.GoogleMapUrl, p.CalculatedRating,
             p.PlacementPercentage, p.HighestPackage, p.AveragePackage, p.LogoUrl, p.BannerUrl, p.ProfileCompletionPercentage,
             (SELECT MIN(COALESCE(f.TotalFee, f.TuitionFee, cc.AnnualFee)) FROM dbo.CollegeCourses cc LEFT JOIN dbo.CollegeFees f ON f.CollegeCourseID = cc.CollegeCourseID WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1) AS FeesFrom,
             (SELECT COUNT(*) FROM dbo.CollegeCourses cc WHERE cc.CollegeID = c.CollegeID AND cc.IsActive = 1) AS CourseCount,
             (SELECT COUNT(*) FROM dbo.CollegeAccreditations ca WHERE ca.CollegeID = c.CollegeID AND ca.IsActive = 1) AS AccreditationCount,
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
      ...baseProfile(row, { accreditationCount: row.AccreditationCount }),
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
    const fees = data.fees || {};
    const annualFee = fees.tuitionFee ?? fees.annualFee ?? data.annualFee ?? data.tuitionFee ?? null;
    const seats = data.totalSeats ?? data.seats ?? data.availableSeats ?? null;
    const courseName = data.courseName || '';
    const branchName = data.branchName || data.branch || '';
    const duration = data.duration != null ? Number(data.duration) : 4.0;
    const eligibility = data.eligibility || '';
    const degree = data.degree || data.degreeType || null;
    const intake = data.intake != null ? Number(data.intake) : null;
    const availableSeats = data.availableSeats != null ? Number(data.availableSeats) : seats;
    const description = data.description || '';

    let mapped;
    if (courseIdRaw) {
      const updated = await CourseModel.update(courseIdRaw, { courseName, branchName, duration, fees: annualFee, seats, eligibility });
      if (!updated) throw new ApiError('Course not found', 404);
      const pool = await getPool();
      await pool.request()
        .input('id', sql.Int, updated.id)
        .input('degree', sql.NVarChar(100), degree)
        .input('intake', sql.Int, intake)
        .input('availableSeats', sql.Int, availableSeats)
        .input('description', sql.NVarChar(sql.MAX), description)
        .query(`
          UPDATE dbo.CollegeCourses
          SET Degree = @degree, Intake = @intake, AvailableSeats = @availableSeats, Description = @description, UpdatedAt = SYSUTCDATETIME()
          WHERE CollegeCourseID = @id
        `);
      await upsertCourseFees(pool, updated.id, fees, annualFee);
      await notificationServices.notifyCollege({
        collegeId,
        type: 'Course',
        title: 'Course updated',
        description: `${courseName || updated.course_name || 'Course'} catalog details were saved successfully.`,
        priority: 'success',
        referenceId: updated.id,
        referenceType: 'course',
      });
      mapped = await getMappedCourse(updated.id);
    } else {
      const created = await CourseModel.create({ schoolId: collegeId, courseName, branchName, duration, fees: annualFee, seats, eligibility });
      const pool = await getPool();
      await pool.request()
        .input('id', sql.Int, created.id)
        .input('degree', sql.NVarChar(100), degree)
        .input('intake', sql.Int, intake)
        .input('availableSeats', sql.Int, availableSeats)
        .input('description', sql.NVarChar(sql.MAX), description)
        .query(`
          UPDATE dbo.CollegeCourses
          SET Degree = @degree, Intake = @intake, AvailableSeats = @availableSeats, Description = @description, UpdatedAt = SYSUTCDATETIME()
          WHERE CollegeCourseID = @id
        `);
      await upsertCourseFees(pool, created.id, fees, annualFee);
      await notificationServices.notifyCollege({
        collegeId,
        type: 'Course',
        title: 'Course added',
        description: `${courseName || 'Course'} catalog details were saved successfully.`,
        priority: 'success',
        referenceId: created.id,
        referenceType: 'course',
      });
      mapped = await getMappedCourse(created.id);
    }
    return mapped;
  },

  async deleteCourse(user, courseIdRaw) {
    const collegeId = await ownCollegeId(user);
    const courseId = asId(courseIdRaw);
    const course = await CourseModel.findById(courseId);
    if (!course || String(course.school_id) !== String(collegeId)) {
      throw new ApiError('Course not found', 404);
    }
    await CourseModel.delete(courseId);
    await notificationServices.notifyCollege({
      collegeId,
      type: 'Course',
      title: 'Course deleted',
      description: `${course.course_name || 'A course'} was removed from your catalog.`,
      priority: 'reminder',
      referenceId: courseId,
      referenceType: 'course',
    });
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

  async listNotices(user, query = {}) {
    const collegeId = await ownCollegeId(user);
    const pool = await getPool();
    const req = pool.request().input('collegeId', sql.Int, collegeId);
    let sqlFilter = 'WHERE CollegeID = @collegeId';
    if (query.status) {
      req.input('status', sql.NVarChar(20), query.status);
      sqlFilter += ' AND Status = @status';
    }
    const result = await req.query(`
      SELECT NoticeID, Title, Body, Category, Status, AttachmentUrl, PublishedAt, CreatedAt, UpdatedAt
      FROM dbo.CollegeNotices
      ${sqlFilter}
      ORDER BY COALESCE(PublishedAt, CreatedAt) DESC
    `);
    return result.recordset.map((r) => ({
      id: String(r.NoticeID),
      title: r.Title,
      body: r.Body || '',
      category: r.Category || '',
      status: r.Status,
      attachmentUrl: r.AttachmentUrl || null,
      publishedAt: r.PublishedAt,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt,
    }));
  },

  async saveNotice(user, noticeIdRaw, data) {
    const collegeId = await ownCollegeId(user);
    const pool = await getPool();
    const title = String(data.title || '').trim();
    if (!title) throw new ApiError('Notice title is required', 400);
    const body = data.body || data.content || '';
    const category = data.category || null;
    const status = (data.status || 'draft').toLowerCase() === 'published' ? 'published' : 'draft';
    const attachmentUrl = data.attachmentUrl || null;
    const publishedAt = status === 'published' ? new Date() : null;

    if (noticeIdRaw) {
      const noticeId = asId(noticeIdRaw);
      const result = await pool.request()
        .input('collegeId', sql.Int, collegeId)
        .input('noticeId', sql.Int, noticeId)
        .input('title', sql.NVarChar(255), title)
        .input('body', sql.NVarChar(sql.MAX), body)
        .input('category', sql.NVarChar(100), category)
        .input('status', sql.NVarChar(20), status)
        .input('attachmentUrl', sql.NVarChar(2048), attachmentUrl)
        .input('publishedAt', sql.DateTime2, publishedAt)
        .query(`
          UPDATE dbo.CollegeNotices
          SET Title = @title, Body = @body, Category = @category, Status = @status,
              AttachmentUrl = COALESCE(@attachmentUrl, AttachmentUrl),
              PublishedAt = CASE WHEN @status = 'published' THEN COALESCE(PublishedAt, @publishedAt) ELSE PublishedAt END,
              UpdatedAt = SYSUTCDATETIME()
          OUTPUT inserted.*
          WHERE NoticeID = @noticeId AND CollegeID = @collegeId
        `);
      if (!result.recordset[0]) throw new ApiError('Notice not found', 404);
      const row = result.recordset[0];
      if (status === 'published') {
        await notificationServices.notifyCollege({
          collegeId,
          type: 'Notice',
          title: 'Notice published',
          description: `"${title}" was published.`,
          priority: 'info',
          referenceId: noticeId,
          referenceType: 'notice',
        });
      }
      return {
        id: String(row.NoticeID),
        title: row.Title,
        body: row.Body || '',
        category: row.Category || '',
        status: row.Status,
        attachmentUrl: row.AttachmentUrl || null,
        publishedAt: row.PublishedAt,
        createdAt: row.CreatedAt,
      };
    }

    const result = await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('title', sql.NVarChar(255), title)
      .input('body', sql.NVarChar(sql.MAX), body)
      .input('category', sql.NVarChar(100), category)
      .input('status', sql.NVarChar(20), status)
      .input('attachmentUrl', sql.NVarChar(2048), attachmentUrl)
      .input('publishedAt', sql.DateTime2, publishedAt)
      .query(`
        INSERT INTO dbo.CollegeNotices (CollegeID, Title, Body, Category, Status, AttachmentUrl, PublishedAt)
        OUTPUT inserted.*
        VALUES (@collegeId, @title, @body, @category, @status, @attachmentUrl, @publishedAt)
      `);
    const row = result.recordset[0];
    if (status === 'published') {
      await notificationServices.notifyCollege({
        collegeId,
        type: 'Notice',
        title: 'Notice published',
        description: `"${title}" was published.`,
        priority: 'info',
        referenceId: row.NoticeID,
        referenceType: 'notice',
      });
    }
    return {
      id: String(row.NoticeID),
      title: row.Title,
      body: row.Body || '',
      category: row.Category || '',
      status: row.Status,
      attachmentUrl: row.AttachmentUrl || null,
      publishedAt: row.PublishedAt,
      createdAt: row.CreatedAt,
    };
  },

  async deleteNotice(user, noticeIdRaw) {
    const collegeId = await ownCollegeId(user);
    const noticeId = asId(noticeIdRaw);
    const pool = await getPool();
    const result = await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('noticeId', sql.Int, noticeId)
      .query('DELETE FROM dbo.CollegeNotices WHERE NoticeID = @noticeId AND CollegeID = @collegeId');
    if (!result.rowsAffected[0]) throw new ApiError('Notice not found', 404);
    return { message: 'Notice deleted successfully' };
  },
};

module.exports = collegePortalSqlService;
