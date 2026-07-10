const { sql, getPool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { calculateCollegeRating } = require('../utils/collegeRating');
const notificationServices = require('./notification.services');

const FACILITY_OPTIONS = [
  'Hostel',
  'Library',
  'WiFi',
  'Smart Classroom',
  'Computer Lab',
  'Sports',
  'Gym',
  'Cafeteria',
  'Transport',
  'Auditorium',
  'Medical Facility',
  'Placement Cell',
  'Research Center',
  'Parking',
  'ATM',
  'Bank',
  'Others',
];

function asInt(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function asDecimal(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value, max) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return max ? s.slice(0, max) : s;
}

async function ensureCourseAndBranch(requestFactory, courseName, branchName) {
  const cleanCourseName = String(courseName || '').trim() || 'General Course';
  const cleanBranchName = String(branchName || '').trim() || 'General';

  let courseRes = await requestFactory()
    .input('name', sql.NVarChar(255), cleanCourseName)
    .query('SELECT CourseID FROM dbo.Courses WHERE LOWER(CourseName) = LOWER(@name)');
  let courseId = courseRes.recordset[0]?.CourseID;

  if (!courseId) {
    let code = cleanCourseName.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'CRS';
    let uniqueCode = code;
    let suffix = 1;
    while (true) {
      const codeCheck = await requestFactory()
        .input('code', sql.NVarChar(50), uniqueCode)
        .query('SELECT CourseID FROM dbo.Courses WHERE CourseCode = @code');
      if (!codeCheck.recordset.length) break;
      uniqueCode = `${code}${suffix++}`;
    }
    const ins = await requestFactory()
      .input('name', sql.NVarChar(255), cleanCourseName)
      .input('code', sql.NVarChar(50), uniqueCode)
      .query('INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES (@name, @code)');
    courseId = ins.recordset[0].CourseID;
  }

  let branchRes = await requestFactory()
    .input('courseId', sql.Int, courseId)
    .input('name', sql.NVarChar(255), cleanBranchName)
    .query('SELECT BranchID FROM dbo.Branches WHERE CourseID = @courseId AND LOWER(BranchName) = LOWER(@name)');
  let branchId = branchRes.recordset[0]?.BranchID;

  if (!branchId) {
    let code = cleanBranchName.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'BRN';
    let uniqueCode = code;
    let suffix = 1;
    while (true) {
      const codeCheck = await requestFactory()
        .input('code', sql.NVarChar(50), uniqueCode)
        .query('SELECT BranchID FROM dbo.Branches WHERE BranchCode = @code');
      if (!codeCheck.recordset.length) break;
      uniqueCode = `${code}${suffix++}`;
    }
    const ins = await requestFactory()
      .input('courseId', sql.Int, courseId)
      .input('name', sql.NVarChar(255), cleanBranchName)
      .input('code', sql.NVarChar(50), uniqueCode)
      .query(
        'INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@courseId, @name, @code)'
      );
    branchId = ins.recordset[0].BranchID;
  }

  return { courseId, branchId };
}

async function upsertProfileBasics(requestFactory, collegeId, basic, branding, address) {
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .input('collegeName', sql.NVarChar(150), str(basic.collegeName, 150) || 'College')
    .input('email', sql.NVarChar(255), str(basic.email, 255))
    .input('address', sql.NVarChar(255), str(address?.address || address?.fullAddress, 255))
    .query(`
      UPDATE dbo.Colleges
      SET CollegeName = COALESCE(@collegeName, CollegeName),
          Email = COALESCE(@email, Email),
          CollegeAddress = COALESCE(@address, CollegeAddress),
          UpdatedAt = SYSUTCDATETIME()
      WHERE CollegeID = @collegeId
    `);

  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .input('establishmentYear', sql.Int, asInt(basic.establishmentYear))
    .input('collegeType', sql.NVarChar(50), str(basic.collegeType, 50))
    .input('universityAffiliation', sql.NVarChar(255), str(basic.universityAffiliation || basic.university, 255))
    .input('summaryDescription', sql.NVarChar(sql.MAX), str(basic.description || basic.summaryDescription))
    .input('vision', sql.NVarChar(sql.MAX), str(basic.vision))
    .input('mission', sql.NVarChar(sql.MAX), str(basic.mission))
    .input('websiteUrl', sql.NVarChar(255), str(basic.website || basic.websiteUrl, 255))
    .input('contactPhone', sql.NVarChar(30), str(basic.phone, 30))
    .input('logoUrl', sql.NVarChar(2048), str(branding?.logoUrl, 2048))
    .input('bannerUrl', sql.NVarChar(2048), str(branding?.bannerUrl || branding?.coverBannerUrl, 2048))
    .input('address', sql.NVarChar(500), str(address?.address || address?.fullAddress, 500))
    .input('city', sql.NVarChar(100), str(address?.city, 100))
    .input('district', sql.NVarChar(100), str(address?.district, 100))
    .input('state', sql.NVarChar(100), str(address?.state, 100))
    .input('country', sql.NVarChar(100), str(address?.country, 100) || 'India')
    .input('pincode', sql.NVarChar(20), str(address?.pincode, 20))
    .input('googleMapUrl', sql.NVarChar(2048), str(address?.googleMapUrl || address?.googleMapsUrl, 2048))
    .query(`
      MERGE dbo.CollegeProfiles AS target
      USING (SELECT @collegeId AS CollegeID) AS source
      ON target.CollegeID = source.CollegeID
      WHEN MATCHED THEN UPDATE SET
        EstablishmentYear = COALESCE(@establishmentYear, EstablishmentYear),
        CollegeType = COALESCE(@collegeType, CollegeType),
        UniversityAffiliation = COALESCE(@universityAffiliation, UniversityAffiliation),
        SummaryDescription = COALESCE(@summaryDescription, SummaryDescription),
        Vision = COALESCE(@vision, Vision),
        Mission = COALESCE(@mission, Mission),
        WebsiteUrl = COALESCE(@websiteUrl, WebsiteUrl),
        ContactPhone = COALESCE(@contactPhone, ContactPhone),
        LogoUrl = COALESCE(@logoUrl, LogoUrl),
        BannerUrl = COALESCE(@bannerUrl, BannerUrl),
        Address = COALESCE(@address, Address),
        City = COALESCE(@city, City),
        District = COALESCE(@district, District),
        State = COALESCE(@state, State),
        Country = COALESCE(@country, Country),
        Pincode = COALESCE(@pincode, Pincode),
        GoogleMapUrl = COALESCE(@googleMapUrl, GoogleMapUrl),
        UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (
        CollegeID, EstablishmentYear, CollegeType, UniversityAffiliation, SummaryDescription,
        Vision, Mission, WebsiteUrl, ContactPhone, LogoUrl, BannerUrl,
        Address, City, District, State, Country, Pincode, GoogleMapUrl
      ) VALUES (
        @collegeId, @establishmentYear, @collegeType, @universityAffiliation, @summaryDescription,
        @vision, @mission, @websiteUrl, @contactPhone, @logoUrl, @bannerUrl,
        @address, @city, @district, @state, @country, @pincode, @googleMapUrl
      );
    `);
}

async function upsertContacts(requestFactory, collegeId, contacts) {
  if (!contacts) return;
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .input('principalName', sql.NVarChar(150), str(contacts.principalName, 150))
    .input('admissionOfficer', sql.NVarChar(150), str(contacts.admissionOfficer, 150))
    .input('admissionEmail', sql.NVarChar(255), str(contacts.admissionEmail, 255))
    .input('admissionPhone', sql.NVarChar(30), str(contacts.admissionPhone, 30))
    .input('whatsAppNumber', sql.NVarChar(30), str(contacts.whatsAppNumber || contacts.whatsappNumber, 30))
    .input('officePhone', sql.NVarChar(30), str(contacts.officePhone, 30))
    .input('landlineNumber', sql.NVarChar(30), str(contacts.landlineNumber, 30))
    .query(`
      MERGE dbo.CollegeContacts AS target
      USING (SELECT @collegeId AS CollegeID) AS source
      ON target.CollegeID = source.CollegeID
      WHEN MATCHED THEN UPDATE SET
        PrincipalName = @principalName,
        AdmissionOfficer = @admissionOfficer,
        AdmissionEmail = @admissionEmail,
        AdmissionPhone = @admissionPhone,
        WhatsAppNumber = @whatsAppNumber,
        OfficePhone = @officePhone,
        LandlineNumber = @landlineNumber,
        UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (
        CollegeID, PrincipalName, AdmissionOfficer, AdmissionEmail, AdmissionPhone,
        WhatsAppNumber, OfficePhone, LandlineNumber
      ) VALUES (
        @collegeId, @principalName, @admissionOfficer, @admissionEmail, @admissionPhone,
        @whatsAppNumber, @officePhone, @landlineNumber
      );
    `);
}

async function replaceFacilities(requestFactory, collegeId, facilities) {
  if (!Array.isArray(facilities)) return;
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .query('DELETE FROM dbo.CollegeFacilities WHERE CollegeID = @collegeId');

  for (const item of facilities) {
    const name = typeof item === 'string' ? item : item?.facilityName || item?.name;
    const facilityName = str(name, 100);
    if (!facilityName) continue;
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('facilityName', sql.NVarChar(100), facilityName)
      .input('otherDescription', sql.NVarChar(255), str(typeof item === 'object' ? item.otherDescription : null, 255))
      .query(`
        INSERT INTO dbo.CollegeFacilities (CollegeID, FacilityName, IsAvailable, OtherDescription)
        VALUES (@collegeId, @facilityName, 1, @otherDescription)
      `);
  }
}

async function upsertPlacements(requestFactory, collegeId, placements) {
  if (!placements) return;
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .input('highestPackage', sql.NVarChar(50), str(placements.highestPackage, 50))
    .input('averagePackage', sql.NVarChar(50), str(placements.averagePackage, 50))
    .input('placementPercentage', sql.Decimal(5, 2), asDecimal(placements.placementPercentage))
    .query(`
      MERGE dbo.CollegePlacements AS target
      USING (SELECT @collegeId AS CollegeID) AS source
      ON target.CollegeID = source.CollegeID
      WHEN MATCHED THEN UPDATE SET
        HighestPackage = @highestPackage,
        AveragePackage = @averagePackage,
        PlacementPercentage = @placementPercentage,
        UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (CollegeID, HighestPackage, AveragePackage, PlacementPercentage)
      VALUES (@collegeId, @highestPackage, @averagePackage, @placementPercentage);
    `);

  // Keep legacy columns in sync for older queries
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .input('highestPackage', sql.NVarChar(50), str(placements.highestPackage, 50))
    .input('averagePackage', sql.NVarChar(50), str(placements.averagePackage, 50))
    .input('placementPercentage', sql.Decimal(5, 2), asDecimal(placements.placementPercentage))
    .query(`
      UPDATE dbo.CollegeProfiles
      SET HighestPackage = COALESCE(@highestPackage, HighestPackage),
          AveragePackage = COALESCE(@averagePackage, AveragePackage),
          PlacementPercentage = COALESCE(@placementPercentage, PlacementPercentage),
          UpdatedAt = SYSUTCDATETIME()
      WHERE CollegeID = @collegeId
    `);

  if (Array.isArray(placements.topRecruiters)) {
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .query('DELETE FROM dbo.CollegeRecruiters WHERE CollegeID = @collegeId');
    let order = 0;
    for (const recruiter of placements.topRecruiters) {
      const name = typeof recruiter === 'string' ? recruiter : recruiter?.recruiterName || recruiter?.name;
      const recruiterName = str(name, 255);
      if (!recruiterName) continue;
      await requestFactory()
        .input('collegeId', sql.Int, collegeId)
        .input('recruiterName', sql.NVarChar(255), recruiterName)
        .input('logoUrl', sql.NVarChar(2048), str(typeof recruiter === 'object' ? recruiter.recruiterLogoUrl : null, 2048))
        .input('displayOrder', sql.Int, order++)
        .query(`
          INSERT INTO dbo.CollegeRecruiters (CollegeID, RecruiterName, RecruiterLogoUrl, DisplayOrder, IsActive)
          VALUES (@collegeId, @recruiterName, @logoUrl, @displayOrder, 1)
        `);
    }
  }
}

async function replaceAccreditations(requestFactory, collegeId, accreditations) {
  if (!Array.isArray(accreditations)) return;
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .query('DELETE FROM dbo.CollegeAccreditations WHERE CollegeID = @collegeId');

  for (const item of accreditations) {
    const name = str(item.accreditationName || item.name, 100);
    if (!name) continue;
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('name', sql.NVarChar(100), name)
      .input('grade', sql.NVarChar(50), str(item.gradeOrScore || item.grade, 50))
      .input('certNumber', sql.NVarChar(100), str(item.certificateNumber, 100))
      .input('validTill', sql.Date, item.validTill || null)
      .input('certificateUrl', sql.NVarChar(2048), str(item.certificateUrl, 2048))
      .query(`
        INSERT INTO dbo.CollegeAccreditations
          (CollegeID, AccreditationName, GradeOrScore, CertificateNumber, ValidTill, CertificateUrl, IsActive)
        VALUES (@collegeId, @name, @grade, @certNumber, @validTill, @certificateUrl, 1)
      `);
  }

  await refreshCalculatedRating(requestFactory, collegeId);
}

async function refreshCalculatedRating(requestFactory, collegeId) {
  const result = await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .query(`
      SELECT AccreditationName, GradeOrScore
      FROM dbo.CollegeAccreditations
      WHERE CollegeID = @collegeId AND IsActive = 1
    `);
  const rating = calculateCollegeRating(result.recordset);
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .input('rating', sql.Decimal(3, 2), rating)
    .query(`
      UPDATE dbo.CollegeProfiles
      SET CalculatedRating = @rating, UpdatedAt = SYSUTCDATETIME()
      WHERE CollegeID = @collegeId
    `);
  return rating;
}

async function replaceSocialLinks(requestFactory, collegeId, social) {
  if (!social || typeof social !== 'object') return;
  await requestFactory()
    .input('collegeId', sql.Int, collegeId)
    .query('DELETE FROM dbo.CollegeSocialLinks WHERE CollegeID = @collegeId');

  const platforms = [
    ['facebook', social.facebook],
    ['instagram', social.instagram],
    ['linkedin', social.linkedin],
    ['twitter', social.twitter || social.x],
    ['youtube', social.youtube],
  ];

  for (const [platform, url] of platforms) {
    const link = str(url, 2048);
    if (!link) continue;
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('platform', sql.NVarChar(50), platform)
      .input('url', sql.NVarChar(2048), link)
      .query(`
        INSERT INTO dbo.CollegeSocialLinks (CollegeID, Platform, Url)
        VALUES (@collegeId, @platform, @url)
      `);
  }
}

async function insertDocuments(requestFactory, collegeId, documents) {
  if (!Array.isArray(documents)) return;
  for (const doc of documents) {
    const fileUrl = str(doc.fileUrl || doc.url, 2048);
    const documentType = str(doc.documentType || doc.type, 100);
    if (!fileUrl || !documentType) continue;
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('documentType', sql.NVarChar(100), documentType)
      .input('documentName', sql.NVarChar(255), str(doc.documentName || doc.name, 255))
      .input('fileUrl', sql.NVarChar(2048), fileUrl)
      .query(`
        INSERT INTO dbo.CollegeDocuments (CollegeID, DocumentType, DocumentName, FileUrl, IsActive)
        VALUES (@collegeId, @documentType, @documentName, @fileUrl, 1)
      `);
  }
}

async function insertGallery(requestFactory, collegeId, images) {
  if (!Array.isArray(images)) return;
  let order = 0;
  for (const image of images) {
    const url = str(image.imageUrl || image.url || image, 2048);
    if (!url) continue;
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('url', sql.NVarChar(2048), url)
      .input('title', sql.NVarChar(255), str(typeof image === 'object' ? image.imageTitle || image.title : null, 255))
      .input('description', sql.NVarChar(1000), str(typeof image === 'object' ? image.imageDescription || image.description : null, 1000))
      .input('displayOrder', sql.Int, order++)
      .query(`
        INSERT INTO dbo.CollegeMedia (CollegeID, MediaType, SharePointUrl, Title, Description, DisplayOrder, IsActive)
        VALUES (@collegeId, 'Image', @url, @title, @description, @displayOrder, 1)
      `);
  }
}

async function insertCoursesWithFees(requestFactory, collegeId, courses) {
  if (!Array.isArray(courses)) return [];
  const created = [];

  for (const course of courses) {
    const courseName = str(course.courseName || course.name, 255);
    if (!courseName) continue;
    const { courseId, branchId } = await ensureCourseAndBranch(
      requestFactory,
      courseName,
      course.branch || course.branchName
    );

    const duration = asDecimal(course.duration, 4);
    const intake = asInt(course.intake);
    const availableSeats = asInt(course.availableSeats ?? course.totalSeats);
    const totalSeats = asInt(course.totalSeats ?? course.intake ?? course.availableSeats, 0) || 0;
    const fees = course.fees || {};
    const tuition = asDecimal(fees.tuitionFee ?? course.tuitionFee ?? course.annualFee);
    const totalFee = asDecimal(
      fees.totalFee ??
        course.totalFee ??
        [
          fees.tuitionFee ?? course.tuitionFee,
          fees.hostelFee ?? course.hostelFee,
          fees.transportFee ?? course.transportFee,
          fees.examFee ?? course.examFee,
          fees.miscellaneousFee ?? course.miscellaneousFee,
        ].reduce((sum, v) => sum + (asDecimal(v, 0) || 0), 0)
    );

    const annualFee = tuition ?? totalFee ?? 0;

    const ins = await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('courseId', sql.Int, courseId)
      .input('branchId', sql.Int, branchId)
      .input('duration', sql.Decimal(3, 1), duration)
      .input('totalSeats', sql.Int, totalSeats)
      .input('annualFee', sql.Decimal(12, 2), annualFee)
      .input('eligibility', sql.NVarChar(sql.MAX), str(course.eligibility))
      .input('degree', sql.NVarChar(100), str(course.degree, 100))
      .input('intake', sql.Int, intake)
      .input('availableSeats', sql.Int, availableSeats)
      .input('description', sql.NVarChar(sql.MAX), str(course.description))
      .query(`
        INSERT INTO dbo.CollegeCourses (
          CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee,
          EligibilityCriteria, Degree, Intake, AvailableSeats, Description, IsActive
        )
        OUTPUT inserted.CollegeCourseID
        VALUES (
          @collegeId, @courseId, @branchId, @duration, @totalSeats, @annualFee,
          @eligibility, @degree, @intake, @availableSeats, @description, 1
        )
      `);

    const collegeCourseId = ins.recordset[0].CollegeCourseID;

    await requestFactory()
      .input('collegeCourseId', sql.Int, collegeCourseId)
      .input('tuitionFee', sql.Decimal(12, 2), tuition)
      .input('hostelFee', sql.Decimal(12, 2), asDecimal(fees.hostelFee ?? course.hostelFee))
      .input('transportFee', sql.Decimal(12, 2), asDecimal(fees.transportFee ?? course.transportFee))
      .input('examFee', sql.Decimal(12, 2), asDecimal(fees.examFee ?? course.examFee))
      .input('miscFee', sql.Decimal(12, 2), asDecimal(fees.miscellaneousFee ?? course.miscellaneousFee))
      .input('scholarship', sql.NVarChar(sql.MAX), str(fees.scholarshipInfo ?? course.scholarshipInfo))
      .input('totalFee', sql.Decimal(12, 2), totalFee)
      .query(`
        INSERT INTO dbo.CollegeFees (
          CollegeCourseID, TuitionFee, HostelFee, TransportFee, ExamFee,
          MiscellaneousFee, ScholarshipInfo, TotalFee
        ) VALUES (
          @collegeCourseId, @tuitionFee, @hostelFee, @transportFee, @examFee,
          @miscFee, @scholarship, @totalFee
        )
      `);

    created.push(collegeCourseId);
  }

  return created;
}

/**
 * Persist full registration payload for an existing college (user already created).
 * Runs in a single transaction — partial saves are rolled back.
 */
async function saveFullRegistration(collegeId, payload) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  const requestFactory = () => new sql.Request(transaction);

  try {
    await upsertProfileBasics(
      requestFactory,
      collegeId,
      payload.basic || payload,
      payload.branding || {},
      payload.address || payload.location || {}
    );
    await upsertContacts(requestFactory, collegeId, payload.contacts || payload.contact);
    await replaceFacilities(requestFactory, collegeId, payload.facilities);
    await upsertPlacements(requestFactory, collegeId, payload.placements);
    await replaceAccreditations(requestFactory, collegeId, payload.accreditations);
    await replaceSocialLinks(requestFactory, collegeId, payload.social || payload.socialLinks);
    await insertDocuments(requestFactory, collegeId, payload.documents);
    await insertGallery(requestFactory, collegeId, payload.gallery || payload.campusImages || payload.branding?.campusImages);
    await insertCoursesWithFees(requestFactory, collegeId, payload.courses);

    // Profile completion
    const completion = computeCompletion(payload);
    await requestFactory()
      .input('collegeId', sql.Int, collegeId)
      .input('completion', sql.Decimal(5, 2), completion)
      .query(`
        UPDATE dbo.CollegeProfiles
        SET ProfileCompletionPercentage = @completion, UpdatedAt = SYSUTCDATETIME()
        WHERE CollegeID = @collegeId
      `);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await notificationServices.notifyCollege({
    collegeId,
    type: 'System',
    title: 'College registration completed',
    description: 'Your college profile was saved successfully and is pending approval.',
    priority: 'success',
    referenceId: collegeId,
    referenceType: 'college',
  });

  return { collegeId, message: 'Registration saved' };
}

function computeCompletion(payload) {
  const checks = [
    payload.basic?.collegeName || payload.collegeName,
    payload.basic?.collegeType || payload.collegeType,
    payload.basic?.description || payload.description,
    payload.branding?.logoUrl || payload.logoUrl,
    payload.address?.city || payload.location?.city,
    payload.contacts?.admissionEmail || payload.contact?.admissionEmail,
    Array.isArray(payload.courses) && payload.courses.length > 0,
    Array.isArray(payload.facilities) && payload.facilities.length > 0,
    Array.isArray(payload.accreditations) && payload.accreditations.length > 0,
    payload.placements?.placementPercentage != null,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

module.exports = {
  FACILITY_OPTIONS,
  saveFullRegistration,
  upsertProfileBasics,
  upsertContacts,
  replaceFacilities,
  upsertPlacements,
  replaceAccreditations,
  replaceSocialLinks,
  insertDocuments,
  insertGallery,
  insertCoursesWithFees,
  refreshCalculatedRating,
  ensureCourseAndBranch,
  asInt,
  asDecimal,
  str,
};
