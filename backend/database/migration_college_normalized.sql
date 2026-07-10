-- ===========================================================================
-- Normalized college registration / portal schema (additive, idempotent)
-- Extends CollegeProfiles + CollegeCourses and adds child tables.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Extend CollegeProfiles with fields needed for full registration
-- ---------------------------------------------------------------------------
IF COL_LENGTH('dbo.CollegeProfiles', 'Vision') IS NULL
  ALTER TABLE dbo.CollegeProfiles ADD Vision NVARCHAR(MAX) NULL;
GO
IF COL_LENGTH('dbo.CollegeProfiles', 'Mission') IS NULL
  ALTER TABLE dbo.CollegeProfiles ADD Mission NVARCHAR(MAX) NULL;
GO
IF COL_LENGTH('dbo.CollegeProfiles', 'District') IS NULL
  ALTER TABLE dbo.CollegeProfiles ADD District NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.CollegeProfiles', 'Country') IS NULL
  ALTER TABLE dbo.CollegeProfiles ADD Country NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.CollegeProfiles', 'GoogleMapUrl') IS NULL
  ALTER TABLE dbo.CollegeProfiles ADD GoogleMapUrl NVARCHAR(2048) NULL;
GO
IF COL_LENGTH('dbo.CollegeProfiles', 'CalculatedRating') IS NULL
  ALTER TABLE dbo.CollegeProfiles ADD CalculatedRating DECIMAL(3,2) NULL;
GO

-- ---------------------------------------------------------------------------
-- Extend CollegeCourses
-- ---------------------------------------------------------------------------
IF COL_LENGTH('dbo.CollegeCourses', 'Degree') IS NULL
  ALTER TABLE dbo.CollegeCourses ADD Degree NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.CollegeCourses', 'Intake') IS NULL
  ALTER TABLE dbo.CollegeCourses ADD Intake INT NULL;
GO
IF COL_LENGTH('dbo.CollegeCourses', 'AvailableSeats') IS NULL
  ALTER TABLE dbo.CollegeCourses ADD AvailableSeats INT NULL;
GO
IF COL_LENGTH('dbo.CollegeCourses', 'Description') IS NULL
  ALTER TABLE dbo.CollegeCourses ADD Description NVARCHAR(MAX) NULL;
GO

-- ---------------------------------------------------------------------------
-- CollegeContacts
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeContacts', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeContacts (
    ContactID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    PrincipalName NVARCHAR(150) NULL,
    AdmissionOfficer NVARCHAR(150) NULL,
    AdmissionEmail NVARCHAR(255) NULL,
    AdmissionPhone NVARCHAR(30) NULL,
    WhatsAppNumber NVARCHAR(30) NULL,
    OfficePhone NVARCHAR(30) NULL,
    LandlineNumber NVARCHAR(30) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeContacts_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeContacts_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeContacts PRIMARY KEY CLUSTERED (ContactID),
    CONSTRAINT FK_CollegeContacts_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE,
    CONSTRAINT UQ_CollegeContacts_College UNIQUE (CollegeID)
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeFees (one row per college course)
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeFees', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeFees (
    FeeID INT IDENTITY(1,1) NOT NULL,
    CollegeCourseID INT NOT NULL,
    TuitionFee DECIMAL(12,2) NULL,
    HostelFee DECIMAL(12,2) NULL,
    TransportFee DECIMAL(12,2) NULL,
    ExamFee DECIMAL(12,2) NULL,
    MiscellaneousFee DECIMAL(12,2) NULL,
    ScholarshipInfo NVARCHAR(MAX) NULL,
    TotalFee DECIMAL(12,2) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeFees_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeFees_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeFees PRIMARY KEY CLUSTERED (FeeID),
    CONSTRAINT FK_CollegeFees_CollegeCourses FOREIGN KEY (CollegeCourseID) REFERENCES dbo.CollegeCourses(CollegeCourseID) ON DELETE CASCADE,
    CONSTRAINT UQ_CollegeFees_CollegeCourse UNIQUE (CollegeCourseID)
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeFacilities
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeFacilities', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeFacilities (
    FacilityID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    FacilityName NVARCHAR(100) NOT NULL,
    IsAvailable BIT NOT NULL CONSTRAINT DF_CollegeFacilities_IsAvailable DEFAULT 1,
    OtherDescription NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeFacilities_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeFacilities_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeFacilities PRIMARY KEY CLUSTERED (FacilityID),
    CONSTRAINT FK_CollegeFacilities_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE,
    CONSTRAINT UQ_CollegeFacilities_College_Name UNIQUE (CollegeID, FacilityName)
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegePlacements
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegePlacements', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegePlacements (
    PlacementID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    HighestPackage NVARCHAR(50) NULL,
    AveragePackage NVARCHAR(50) NULL,
    PlacementPercentage DECIMAL(5,2) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegePlacements_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegePlacements_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegePlacements PRIMARY KEY CLUSTERED (PlacementID),
    CONSTRAINT FK_CollegePlacements_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE,
    CONSTRAINT UQ_CollegePlacements_College UNIQUE (CollegeID)
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeRecruiters (top recruiters under placements)
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeRecruiters', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeRecruiters (
    RecruiterID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    RecruiterName NVARCHAR(255) NOT NULL,
    RecruiterLogoUrl NVARCHAR(2048) NULL,
    DisplayOrder INT NOT NULL CONSTRAINT DF_CollegeRecruiters_DisplayOrder DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_CollegeRecruiters_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeRecruiters_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeRecruiters_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeRecruiters PRIMARY KEY CLUSTERED (RecruiterID),
    CONSTRAINT FK_CollegeRecruiters_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeAccreditations
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeAccreditations', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeAccreditations (
    AccreditationID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    AccreditationName NVARCHAR(100) NOT NULL,
    GradeOrScore NVARCHAR(50) NULL,
    CertificateNumber NVARCHAR(100) NULL,
    ValidTill DATE NULL,
    CertificateUrl NVARCHAR(2048) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_CollegeAccreditations_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeAccreditations_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeAccreditations_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeAccreditations PRIMARY KEY CLUSTERED (AccreditationID),
    CONSTRAINT FK_CollegeAccreditations_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeDocuments
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeDocuments', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeDocuments (
    DocumentID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    DocumentType NVARCHAR(100) NOT NULL,
    DocumentName NVARCHAR(255) NULL,
    FileUrl NVARCHAR(2048) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_CollegeDocuments_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeDocuments_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeDocuments_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeDocuments PRIMARY KEY CLUSTERED (DocumentID),
    CONSTRAINT FK_CollegeDocuments_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeSocialLinks
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeSocialLinks', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeSocialLinks (
    SocialLinkID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    Platform NVARCHAR(50) NOT NULL,
    Url NVARCHAR(2048) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeSocialLinks_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeSocialLinks_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeSocialLinks PRIMARY KEY CLUSTERED (SocialLinkID),
    CONSTRAINT FK_CollegeSocialLinks_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE,
    CONSTRAINT UQ_CollegeSocialLinks_College_Platform UNIQUE (CollegeID, Platform)
  );
END
GO

-- ---------------------------------------------------------------------------
-- CollegeNotices
-- ---------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeNotices', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CollegeNotices (
    NoticeID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Body NVARCHAR(MAX) NULL,
    Category NVARCHAR(100) NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_CollegeNotices_Status DEFAULT 'draft',
    AttachmentUrl NVARCHAR(2048) NULL,
    PublishedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeNotices_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeNotices_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeNotices PRIMARY KEY CLUSTERED (NoticeID),
    CONSTRAINT FK_CollegeNotices_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
  );
END
GO

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CollegeFacilities_CollegeID' AND object_id = OBJECT_ID('dbo.CollegeFacilities'))
  CREATE INDEX IX_CollegeFacilities_CollegeID ON dbo.CollegeFacilities(CollegeID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CollegeAccreditations_CollegeID' AND object_id = OBJECT_ID('dbo.CollegeAccreditations'))
  CREATE INDEX IX_CollegeAccreditations_CollegeID ON dbo.CollegeAccreditations(CollegeID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CollegeDocuments_CollegeID' AND object_id = OBJECT_ID('dbo.CollegeDocuments'))
  CREATE INDEX IX_CollegeDocuments_CollegeID ON dbo.CollegeDocuments(CollegeID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CollegeNotices_CollegeID' AND object_id = OBJECT_ID('dbo.CollegeNotices'))
  CREATE INDEX IX_CollegeNotices_CollegeID ON dbo.CollegeNotices(CollegeID);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CollegeFees_CollegeCourseID' AND object_id = OBJECT_ID('dbo.CollegeFees'))
  CREATE INDEX IX_CollegeFees_CollegeCourseID ON dbo.CollegeFees(CollegeCourseID);
GO
