-- ===========================================================================
-- AMS DATABASE SCHEMA (SQL Server DDL)
-- Designed for: 500+ colleges and 50,000+ students
-- ===========================================================================

-- Create Database (Optional)
-- CREATE DATABASE AMS_DB;
-- GO
-- USE AMS_DB;
-- GO

-------------------------------------------------------------------------------
-- 1. ROLES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
CREATE TABLE dbo.Roles (
    RoleID INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (RoleID),
    CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName)
);

-------------------------------------------------------------------------------
-- 2. USERS TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
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

-------------------------------------------------------------------------------
-- 3. COLLEGES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Colleges', 'U') IS NOT NULL DROP TABLE dbo.Colleges;
CREATE TABLE dbo.Colleges (
    CollegeID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    CollegeName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Colleges_Status DEFAULT 'pending',
    IsActive BIT NOT NULL CONSTRAINT DF_Colleges_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Colleges_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Colleges_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Colleges PRIMARY KEY CLUSTERED (CollegeID),
    CONSTRAINT FK_Colleges_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
    CONSTRAINT UQ_Colleges_Email UNIQUE (Email)
);

-------------------------------------------------------------------------------
-- 4. COLLEGE PROFILES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeProfiles', 'U') IS NOT NULL DROP TABLE dbo.CollegeProfiles;
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

-------------------------------------------------------------------------------
-- 5. COURSES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Courses', 'U') IS NOT NULL DROP TABLE dbo.Courses;
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

-------------------------------------------------------------------------------
-- 6. BRANCHES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Branches', 'U') IS NOT NULL DROP TABLE dbo.Branches;
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

-------------------------------------------------------------------------------
-- 7. COLLEGE COURSES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeCourses', 'U') IS NOT NULL DROP TABLE dbo.CollegeCourses;
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

-------------------------------------------------------------------------------
-- 8. COLLEGE MEDIA TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.CollegeMedia', 'U') IS NOT NULL DROP TABLE dbo.CollegeMedia;
CREATE TABLE dbo.CollegeMedia (
    MediaID INT IDENTITY(1,1) NOT NULL,
    CollegeID INT NOT NULL,
    MediaType NVARCHAR(50) NOT NULL,
    SharePointUrl NVARCHAR(2048) NOT NULL,
    Title NVARCHAR(255) NULL,
    Description NVARCHAR(1000) NULL,
    DisplayOrder INT NOT NULL CONSTRAINT DF_CollegeMedia_DisplayOrder DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_CollegeMedia_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeMedia_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_CollegeMedia_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CollegeMedia PRIMARY KEY CLUSTERED (MediaID),
    CONSTRAINT FK_CollegeMedia_Colleges FOREIGN KEY (CollegeID) REFERENCES dbo.Colleges(CollegeID) ON DELETE CASCADE
);

-------------------------------------------------------------------------------
-- 9. STUDENTS TABLE (Minimal)
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL DROP TABLE dbo.Students;
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

-------------------------------------------------------------------------------
-- 10. STUDENT PROFILES TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.StudentProfiles', 'U') IS NOT NULL DROP TABLE dbo.StudentProfiles;
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
    ProfileStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_StudentProfiles_Status DEFAULT 'Incomplete',
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StudentProfiles PRIMARY KEY CLUSTERED (StudentID),
    CONSTRAINT FK_StudentProfiles_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID) ON DELETE CASCADE
);

-------------------------------------------------------------------------------
-- 11. STUDENT ACADEMIC DETAILS TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.StudentAcademicDetails', 'U') IS NOT NULL DROP TABLE dbo.StudentAcademicDetails;
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

-------------------------------------------------------------------------------
-- 12. STUDENT DOCUMENTS TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.StudentDocuments', 'U') IS NOT NULL DROP TABLE dbo.StudentDocuments;
CREATE TABLE dbo.StudentDocuments (
    DocumentID INT IDENTITY(1,1) NOT NULL,
    StudentID INT NOT NULL,
    DocumentType NVARCHAR(100) NOT NULL,
    SharePointUrl NVARCHAR(2048) NOT NULL,
    IsVerified BIT NOT NULL CONSTRAINT DF_StudentDocuments_IsVerified DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_StudentDocuments_IsActive DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentDocuments_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentDocuments_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StudentDocuments PRIMARY KEY CLUSTERED (DocumentID),
    CONSTRAINT FK_StudentDocuments_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID) ON DELETE CASCADE
);

-------------------------------------------------------------------------------
-- 13. APPLICATIONS TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Applications', 'U') IS NOT NULL DROP TABLE dbo.Applications;
CREATE TABLE dbo.Applications (
    ApplicationID INT IDENTITY(1,1) NOT NULL,
    StudentID INT NOT NULL,
    CollegeCourseID INT NOT NULL,
    CurrentStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_Applications_Status DEFAULT 'Submitted',
    Remarks NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Applications_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Applications_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Applications PRIMARY KEY CLUSTERED (ApplicationID),
    CONSTRAINT FK_Applications_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
    CONSTRAINT FK_Applications_CollegeCourses FOREIGN KEY (CollegeCourseID) REFERENCES dbo.CollegeCourses(CollegeCourseID),
    CONSTRAINT UQ_Applications_Student_CollegeCourse UNIQUE (StudentID, CollegeCourseID)
);

-------------------------------------------------------------------------------
-- 14. APPLICATION STATUS HISTORY TABLE
-------------------------------------------------------------------------------
IF OBJECT_ID('dbo.ApplicationStatusHistory', 'U') IS NOT NULL DROP TABLE dbo.ApplicationStatusHistory;
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

-------------------------------------------------------------------------------
-- HIGH PERFORMANCE INDEXES
-------------------------------------------------------------------------------
CREATE NONCLUSTERED INDEX IX_Users_RoleID ON dbo.Users(RoleID) INCLUDE (Email, FullName, IsActive);
CREATE NONCLUSTERED INDEX IX_Colleges_Status_IsActive ON dbo.Colleges(Status, IsActive) INCLUDE (CollegeName, Email);
CREATE NONCLUSTERED INDEX IX_CollegeProfiles_State_City ON dbo.CollegeProfiles(State, City) INCLUDE (ShortName, WebsiteUrl);
CREATE NONCLUSTERED INDEX IX_CollegeProfiles_CollegeType ON dbo.CollegeProfiles(CollegeType);
CREATE NONCLUSTERED INDEX IX_CollegeCourses_CollegeID ON dbo.CollegeCourses(CollegeID);
CREATE NONCLUSTERED INDEX IX_CollegeCourses_CourseID_BranchID ON dbo.CollegeCourses(CourseID, BranchID);
CREATE NONCLUSTERED INDEX IX_CollegeCourses_AnnualFee ON dbo.CollegeCourses(AnnualFee) INCLUDE (CollegeCourseID, CollegeID);
CREATE UNIQUE NONCLUSTERED INDEX IX_Students_UserID ON dbo.Students(UserID);
CREATE NONCLUSTERED INDEX IX_StudentProfiles_FirstName_LastName ON dbo.StudentProfiles(FirstName, LastName);
CREATE NONCLUSTERED INDEX IX_StudentProfiles_City_State ON dbo.StudentProfiles(City, State);
CREATE NONCLUSTERED INDEX IX_Applications_StudentID ON dbo.Applications(StudentID) INCLUDE (CurrentStatus, CollegeCourseID);
CREATE NONCLUSTERED INDEX IX_Applications_CollegeCourseID ON dbo.Applications(CollegeCourseID) INCLUDE (CurrentStatus, StudentID);
CREATE NONCLUSTERED INDEX IX_Applications_CurrentStatus ON dbo.Applications(CurrentStatus);
CREATE NONCLUSTERED INDEX IX_AppStatusHistory_ApplicationID ON dbo.ApplicationStatusHistory(ApplicationID) INCLUDE (Status, CreatedAt);
GO

-------------------------------------------------------------------------------
-- TIMESTAMPS TRIGGERS
-------------------------------------------------------------------------------
CREATE TRIGGER dbo.TR_Colleges_UpdateTimestamp
ON dbo.Colleges AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Colleges SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.Colleges c INNER JOIN inserted i ON c.CollegeID = i.CollegeID;
END;
GO

CREATE TRIGGER dbo.TR_CollegeProfiles_UpdateTimestamp
ON dbo.CollegeProfiles AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.CollegeProfiles SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.CollegeProfiles cp INNER JOIN inserted i ON cp.CollegeID = i.CollegeID;
END;
GO

CREATE TRIGGER dbo.TR_Students_UpdateTimestamp
ON dbo.Students AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Students SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.Students s INNER JOIN inserted i ON s.StudentID = i.StudentID;
END;
GO

CREATE TRIGGER dbo.TR_StudentProfiles_UpdateTimestamp
ON dbo.StudentProfiles AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.StudentProfiles SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.StudentProfiles sp INNER JOIN inserted i ON sp.StudentID = i.StudentID;
END;
GO

CREATE TRIGGER dbo.TR_StudentAcademicDetails_UpdateTimestamp
ON dbo.StudentAcademicDetails AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.StudentAcademicDetails SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.StudentAcademicDetails sad INNER JOIN inserted i ON sad.StudentID = i.StudentID;
END;
GO

CREATE TRIGGER dbo.TR_Applications_UpdateTimestamp
ON dbo.Applications AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Applications SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.Applications a INNER JOIN inserted i ON a.ApplicationID = i.ApplicationID;
END;
GO
