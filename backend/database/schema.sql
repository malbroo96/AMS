-- E-Admin Admission Portal — MSSQL Schema
-- Run: npm run db:init  (or execute in SSMS)

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'admission_portal')
BEGIN
  CREATE DATABASE admission_portal;
END
GO

USE admission_portal;
GO

-- Drop in dependency order (for re-runs in dev)
IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL DROP TABLE dbo.Notifications;
IF OBJECT_ID('dbo.Applications', 'U') IS NOT NULL DROP TABLE dbo.Applications;
IF OBJECT_ID('dbo.Courses', 'U') IS NOT NULL DROP TABLE dbo.Courses;
IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL DROP TABLE dbo.Students;
IF OBJECT_ID('dbo.Schools', 'U') IS NOT NULL DROP TABLE dbo.Schools;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  password NVARCHAR(255) NOT NULL,
  role NVARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'student')),
  phone NVARCHAR(20) NULL,
  is_approved BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE TABLE dbo.Schools (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  school_name NVARCHAR(200) NOT NULL,
  address NVARCHAR(500) NULL,
  city NVARCHAR(100) NULL,
  phone NVARCHAR(20) NULL,
  email NVARCHAR(255) NULL,
  description NVARCHAR(MAX) NULL,
  logo_url NVARCHAR(500) NULL,
  board NVARCHAR(100) NULL,
  created_by UNIQUEIDENTIFIER NULL REFERENCES dbo.Users(id) ON DELETE SET NULL,
  admin_id UNIQUEIDENTIFIER NULL UNIQUE REFERENCES dbo.Users(id) ON DELETE SET NULL,
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE TABLE dbo.Students (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES dbo.Users(id) ON DELETE CASCADE,
  dob DATE NULL,
  gender NVARCHAR(20) NULL,
  parent_name NVARCHAR(100) NULL,
  address NVARCHAR(500) NULL,
  grade NVARCHAR(50) NULL,
  board NVARCHAR(100) NULL,
  percentage DECIMAL(5,2) NULL,
  profile_image NVARCHAR(500) NULL
);
GO

CREATE TABLE dbo.Courses (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  school_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Schools(id) ON DELETE CASCADE,
  course_name NVARCHAR(200) NOT NULL,
  fees DECIMAL(12,2) NULL,
  seats INT NULL,
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE TABLE dbo.Applications (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  student_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Students(id) ON DELETE CASCADE,
  school_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Schools(id) ON DELETE NO ACTION,
  course_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Courses(id) ON DELETE NO ACTION,
  status NVARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  remarks NVARCHAR(MAX) NULL,
  applied_date DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE TABLE dbo.Notifications (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.Users(id) ON DELETE CASCADE,
  title NVARCHAR(200) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  is_read BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_Users_Email ON dbo.Users(email);
CREATE INDEX IX_Users_Role ON dbo.Users(role);
CREATE INDEX IX_Schools_Admin ON dbo.Schools(admin_id);
CREATE INDEX IX_Applications_Student ON dbo.Applications(student_id);
CREATE INDEX IX_Applications_School ON dbo.Applications(school_id);
CREATE INDEX IX_Applications_Status ON dbo.Applications(status);
CREATE INDEX IX_Notifications_User ON dbo.Notifications(user_id);
GO

PRINT 'Schema created successfully.';
