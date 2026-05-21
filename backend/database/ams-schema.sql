/*
  AMS database layout for Node Express (matches Object Explorer: Users, Roles, Colleges,
  Students, StudentApplications, ActivityLogs). Optional: Schools for future use.

  Run in SSMS against your AMS database, or: sqlcmd -S server\instance -d AMS -i ams-schema.sql
*/

-- Roles (admin, college, student)
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
  );
  INSERT INTO dbo.Roles (RoleName) VALUES ('admin'), ('college'), ('student');
END
GO

-- If Roles existed but was empty, seed rows
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'admin')
BEGIN
  INSERT INTO dbo.Roles (RoleName) VALUES ('admin'), ('college'), ('student');
END
GO

-- Users
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    RoleID INT NOT NULL REFERENCES dbo.Roles(RoleID),
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    Phone NVARCHAR(30) NULL,
    IsApproved BIT NOT NULL CONSTRAINT DF_Users_IsApproved DEFAULT (1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Users_Email ON dbo.Users(Email);
  CREATE INDEX IX_Users_RoleID ON dbo.Users(RoleID);
END
GO

-- Colleges (one login user per college row)
IF OBJECT_ID('dbo.Colleges', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Colleges (
    CollegeID INT IDENTITY(1,1) PRIMARY KEY,
    CollegeName VARCHAR(150) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    UserID INT NOT NULL UNIQUE REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Colleges_Status DEFAULT ('approved'),
    CreatedByAdminUserID INT NULL REFERENCES dbo.Users(UserID),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Colleges_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Colleges_Status CHECK (Status IN ('pending', 'approved', 'rejected'))
  );
  CREATE INDEX IX_Colleges_Status ON dbo.Colleges(Status);
END
GO

-- Students (AMS extended profile; one row per student user)
IF OBJECT_ID('dbo.Students', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
    Name NVARCHAR(150) NOT NULL,
    Address NVARCHAR(500) NULL,
    Mobile NVARCHAR(30) NULL,
    Email NVARCHAR(255) NOT NULL,
    Gender NVARCHAR(20) NULL,
    DateOfBirth DATE NULL,
    Education NVARCHAR(150) NULL,
    InterestedCollege NVARCHAR(200) NULL,
    ProfileVisible BIT NOT NULL CONSTRAINT DF_Students_ProfileVisible DEFAULT (0),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_CreatedAt DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_Students_UserID ON dbo.Students(UserID);
END
GO

-- Student interest / application (maps to previous JSON "interests")
IF OBJECT_ID('dbo.StudentApplications', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.StudentApplications (
    ApplicationID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL REFERENCES dbo.Students(StudentID) ON DELETE CASCADE,
    CollegeID INT NOT NULL REFERENCES dbo.Colleges(CollegeID) ON DELETE NO ACTION,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_SA_Status DEFAULT ('Interested'),
    ApprovedByAdmin BIT NOT NULL CONSTRAINT DF_SA_Approved DEFAULT (0),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_SA_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Student_College UNIQUE (StudentID, CollegeID)
  );
  CREATE INDEX IX_SA_CollegeID ON dbo.StudentApplications(CollegeID);
  CREATE INDEX IX_SA_StudentID ON dbo.StudentApplications(StudentID);
END
GO

IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ActivityLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Activity_CreatedAt DEFAULT SYSUTCDATETIME()
  );
END
GO

PRINT 'AMS tables ready (Roles, Users, Colleges, Students, StudentApplications, ActivityLogs).';
