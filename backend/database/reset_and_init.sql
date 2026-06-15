-- ===========================================================================
-- AMS DATABASE RESET AND SCHEMAINITIALIZATION
-- Drops all foreign key constraints and tables, then applies the authoritative DDL
-- ===========================================================================

-- 1. DROP ALL FOREIGN KEY CONSTRAINTS DYNAMICALLY
DECLARE @drop_fks NVARCHAR(MAX) = N'';
SELECT @drop_fks += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys;
IF @drop_fks <> '' EXEC sp_executesql @drop_fks;
GO

-- 2. DROP ALL TABLES DYNAMICALLY
DECLARE @drop_tables NVARCHAR(MAX) = N'';
SELECT @drop_tables += 'DROP TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ';' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
IF @drop_tables <> '' EXEC sp_executesql @drop_tables;
GO

-- 3. CREATE FINALIZED TABLES

-------------------------------------------------------------------------------
-- 1. ROLES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Roles (
    RoleID INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (RoleID),
    CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName)
);
GO

-------------------------------------------------------------------------------
-- 2. USERS TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Users (
    UserID INT IDENTITY(1,1) NOT NULL,
    RoleID INT NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Phone NVARCHAR(30) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserID),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES dbo.Roles(RoleID),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO

-------------------------------------------------------------------------------
-- 3. COLLEGES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Colleges (
    CollegeID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    CollegeName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Colleges_Status DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    IsActive BIT NOT NULL CONSTRAINT DF_Colleges_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Colleges_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Colleges_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Colleges PRIMARY KEY CLUSTERED (CollegeID),
    CONSTRAINT FK_Colleges_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
    CONSTRAINT UQ_Colleges_Email UNIQUE (Email)
);
GO

-------------------------------------------------------------------------------
-- 4. COLLEGE PROFILES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.CollegeProfiles (
    CollegeID INT NOT NULL,
    ShortName NVARCHAR(100) NULL,
    EstablishmentYear INT NULL,
    CollegeType NVARCHAR(50) NULL, -- 'Government', 'Private', 'Autonomous', etc.
    UniversityAffiliation NVARCHAR(255) NULL,
    NaacGrade NVARCHAR(20) NULL,
    AicteApproval BIT NOT NULL CONSTRAINT DF_CollegeProfiles_Aicte DEFAULT 0,
    UgcRecognition BIT NOT NULL CONSTRAINT DF_CollegeProfiles_Ugc DEFAULT 0,
    LogoUrl NVARCHAR(2048) NULL,      -- SharePoint URL
    BannerUrl NVARCHAR(2048) NULL,    -- SharePoint URL
    ProspectusUrl NVARCHAR(2048) NULL,-- SharePoint URL
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    State NVARCHAR(100) NULL,
    Pincode NVARCHAR(20) NULL,
    ContactPhone NVARCHAR(30) NULL,
    WebsiteUrl NVARCHAR(255) NULL,
    SummaryDescription NVARCHAR(MAX) NULL,
    PlacementPercentage DECIMAL(5,2) NULL,
    HighestPackage NVARCHAR(50) NULL,
    AveragePackage NVARCHAR(50) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeProfiles PRIMARY KEY CLUSTERED (CollegeID),
    CONSTRAINT FK_CollegeProfiles_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
);
GO

-------------------------------------------------------------------------------
-- 5. COURSES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Courses (
    CourseID INT IDENTITY(1,1) NOT NULL,
    CourseName NVARCHAR(255) NOT NULL,
    CourseCode NVARCHAR(50) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Courses_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Courses_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Courses_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Courses PRIMARY KEY CLUSTERED (CourseID),
    CONSTRAINT UQ_Courses_CourseName UNIQUE (CourseName),
    CONSTRAINT UQ_Courses_CourseCode UNIQUE (CourseCode)
);
GO

-------------------------------------------------------------------------------
-- 6. BRANCHES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Branches (
    BranchID INT IDENTITY(1,1) NOT NULL,
    CourseID INT NOT NULL,
    BranchName NVARCHAR(255) NOT NULL,
    BranchCode NVARCHAR(50) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Branches_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Branches_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Branches_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Branches PRIMARY KEY CLUSTERED (BranchID),
    CONSTRAINT FK_Branches_Courses FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID),
    CONSTRAINT UQ_Branches_Course_BranchName UNIQUE (CourseID, BranchName),
    CONSTRAINT UQ_Branches_BranchCode UNIQUE (BranchCode)
);
GO

-------------------------------------------------------------------------------
-- 7. COLLEGE COURSES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.CollegeCourses (
    CollegeCourseID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    CourseID INT NOT NULL,
    BranchID INT NOT NULL,
    DurationYears DECIMAL(3,1) NOT NULL,
    TotalSeats INT NOT NULL,
    AnnualFee DECIMAL(12,2) NOT NULL,
    EligibilityCriteria NVARCHAR(MAX) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_CollegeCourses_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeCourses_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeCourses_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeCourses PRIMARY KEY CLUSTERED (CollegeCourseID),
    CONSTRAINT FK_CollegeCourses_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE,
    CONSTRAINT FK_CollegeCourses_Courses FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID),
    CONSTRAINT FK_CollegeCourses_Branches FOREIGN KEY (BranchID) REFERENCES dbo.Branches(BranchID),
    CONSTRAINT UQ_CollegeCourses_College_Course_Branch UNIQUE (CollegeID, CourseID, BranchID)
);
GO

-------------------------------------------------------------------------------
-- 8. COLLEGE MEDIA TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.CollegeMedia (
    MediaID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    MediaType NVARCHAR(50) NOT NULL,     -- 'Image', 'Video', 'VirtualTour', etc.
    SharePointUrl NVARCHAR(2048) NOT NULL, -- Only storing SharePoint URL
    Title NVARCHAR(255) NULL,
    Description NVARCHAR(1000) NULL,
    DisplayOrder INT NOT NULL CONSTRAINT DF_CollegeMedia_DisplayOrder DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_CollegeMedia_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeMedia_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeMedia_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeMedia PRIMARY KEY CLUSTERED (MediaID),
    CONSTRAINT FK_CollegeMedia_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
);
GO

-------------------------------------------------------------------------------
-- 9. STUDENTS TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Students (
    StudentID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    ApplicationNumber NVARCHAR(50) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Students_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Students PRIMARY KEY CLUSTERED (StudentID),
    CONSTRAINT FK_Students_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
);
GO

-------------------------------------------------------------------------------
-- 10. STUDENT PROFILES TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.StudentProfiles (
    StudentID INT NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NULL,
    FatherName NVARCHAR(150) NULL,
    MotherName NVARCHAR(150) NULL,
    GuardianName NVARCHAR(150) NULL,
    Mobile NVARCHAR(30) NULL,
    Gender NVARCHAR(20) NULL,
    DateOfBirth DATE NULL,
    BloodGroup NVARCHAR(10) NULL,
    AddressLine1 NVARCHAR(255) NULL,
    AddressLine2 NVARCHAR(255) NULL,
    City NVARCHAR(100) NULL,
    State NVARCHAR(100) NULL,
    Pincode NVARCHAR(20) NULL,
    EmergencyContactName NVARCHAR(150) NULL,
    EmergencyContactPhone NVARCHAR(30) NULL,
    EmergencyContactRelation NVARCHAR(100) NULL,
    ProfilePhotoUrl NVARCHAR(2048) NULL,
    ProfileCompletionPercentage DECIMAL(5,2) NOT NULL CONSTRAINT DF_StudentProfiles_Completion DEFAULT 0,
    ProfileStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_StudentProfiles_Status DEFAULT 'Incomplete', -- 'Incomplete', 'Complete', 'Verified'
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StudentProfiles PRIMARY KEY CLUSTERED (StudentID),
    CONSTRAINT FK_StudentProfiles_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID) ON DELETE CASCADE
);
GO

-------------------------------------------------------------------------------
-- 11. STUDENT ACADEMIC DETAILS TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.StudentAcademicDetails (
    StudentID INT NOT NULL,
    TenthPercentage DECIMAL(5,2) NULL,
    TwelfthPercentage DECIMAL(5,2) NULL,
    Qualification NVARCHAR(100) NULL,
    Board NVARCHAR(100) NULL,
    PassingYear INT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentAcademicDetails_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentAcademicDetails_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StudentAcademicDetails PRIMARY KEY CLUSTERED (StudentID),
    CONSTRAINT FK_StudentAcademicDetails_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID) ON DELETE CASCADE
);
GO

-------------------------------------------------------------------------------
-- 12. STUDENT DOCUMENTS TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.StudentDocuments (
    DocumentID INT IDENTITY(1,1) NOT NULL,
    StudentID INT NOT NULL,
    DocumentType NVARCHAR(100) NOT NULL,    -- '10th Marksheet', '12th Marksheet', 'Aadhar', etc.
    SharePointUrl NVARCHAR(2048) NOT NULL,  -- Only storing SharePoint URL
    IsVerified BIT NOT NULL CONSTRAINT DF_StudentDocuments_IsVerified DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_StudentDocuments_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentDocuments_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentDocuments_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StudentDocuments PRIMARY KEY CLUSTERED (DocumentID),
    CONSTRAINT FK_StudentDocuments_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID) ON DELETE CASCADE
);
GO

-------------------------------------------------------------------------------
-- 13. APPLICATIONS TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.Applications (
    ApplicationID INT IDENTITY(1,1) NOT NULL,
    StudentID INT NOT NULL,
    CollegeCourseID INT NOT NULL,
    CurrentStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_Applications_Status DEFAULT 'Submitted', -- 'Submitted', 'Under Review', 'Approved', 'Rejected'
    Remarks NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Applications_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Applications_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Applications PRIMARY KEY CLUSTERED (ApplicationID),
    CONSTRAINT FK_Applications_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
    CONSTRAINT FK_Applications_CollegeCourses FOREIGN KEY (CollegeCourseID) REFERENCES dbo.CollegeCourses(CollegeCourseID),
    CONSTRAINT UQ_Applications_Student_CollegeCourse UNIQUE (StudentID, CollegeCourseID)
);
GO

-------------------------------------------------------------------------------
-- 14. APPLICATION STATUS HISTORY TABLE
-------------------------------------------------------------------------------
CREATE TABLE dbo.ApplicationStatusHistory (
    HistoryID INT IDENTITY(1,1) NOT NULL,
    ApplicationID INT NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    Remarks NVARCHAR(1000) NULL,
    ChangedByUserID INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ApplicationStatusHistory_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ApplicationStatusHistory PRIMARY KEY CLUSTERED (HistoryID),
    CONSTRAINT FK_ApplicationStatusHistory_Applications FOREIGN KEY (ApplicationID) REFERENCES dbo.Applications(ApplicationID) ON DELETE CASCADE,
    CONSTRAINT FK_ApplicationStatusHistory_Users FOREIGN KEY (ChangedByUserID) REFERENCES dbo.Users(UserID)
);
GO

-- 4. SEED ROLES
INSERT INTO dbo.Roles (RoleName) VALUES ('admin'), ('college'), ('student');
GO
