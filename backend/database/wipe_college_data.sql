/*
  Wipe all college-related data from AMS database.
  Keeps: admin users, student users, Roles, and (by default) Courses/Branches catalog.
  Run: sqlcmd -S localhost\SQLEXPRESS -E -d AMS_DB -i wipe_college_data.sql
*/

SET NOCOUNT ON;
BEGIN TRANSACTION;

-- 1) Application history for college applications
IF OBJECT_ID('dbo.ApplicationStatusHistory', 'U') IS NOT NULL
BEGIN
  DELETE h
  FROM dbo.ApplicationStatusHistory h
  INNER JOIN dbo.Applications a ON a.ApplicationID = h.ApplicationID
  INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID;
  PRINT 'ApplicationStatusHistory (college-related): ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

-- 2) Applications linked to colleges
IF OBJECT_ID('dbo.Applications', 'U') IS NOT NULL AND OBJECT_ID('dbo.CollegeCourses', 'U') IS NOT NULL
BEGIN
  DELETE a
  FROM dbo.Applications a
  INNER JOIN dbo.CollegeCourses cc ON cc.CollegeCourseID = a.CollegeCourseID;
  PRINT 'Applications (college-related): ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

-- 3) Legacy interests table (old schema)
IF OBJECT_ID('dbo.StudentApplications', 'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.StudentApplications;
  PRINT 'StudentApplications: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

-- 4) Legacy assets table (old schema)
IF OBJECT_ID('dbo.CollegeAssets', 'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.CollegeAssets;
  PRINT 'CollegeAssets: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

-- 5–7) College child tables
IF OBJECT_ID('dbo.CollegeProfiles', 'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.CollegeProfiles;
  PRINT 'CollegeProfiles: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

IF OBJECT_ID('dbo.CollegeMedia', 'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.CollegeMedia;
  PRINT 'CollegeMedia: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

IF OBJECT_ID('dbo.CollegeCourses', 'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.CollegeCourses;
  PRINT 'CollegeCourses: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

-- 8) Colleges
IF OBJECT_ID('dbo.Colleges', 'U') IS NOT NULL
BEGIN
  DELETE FROM dbo.Colleges;
  PRINT 'Colleges: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';
END

-- 9) College login accounts only
DELETE u
FROM dbo.Users u
INNER JOIN dbo.Roles r ON r.RoleID = u.RoleID
WHERE r.RoleName = 'college';
PRINT 'College Users: ' + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' rows deleted';

COMMIT TRANSACTION;

PRINT 'College data wipe complete.';
GO
