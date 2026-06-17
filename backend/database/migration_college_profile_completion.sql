-- ===========================================================================
-- DATABASE MIGRATION SCRIPT
-- Objective: Add ProfileCompletionPercentage to dbo.CollegeProfiles & Activate colleges
-- Target DB: SQL Server (AMS)
-- ===========================================================================

-- 1. Add ProfileCompletionPercentage column to CollegeProfiles if it does not exist
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CollegeProfiles') 
      AND name = 'ProfileCompletionPercentage'
)
BEGIN
    ALTER TABLE dbo.CollegeProfiles
    ADD ProfileCompletionPercentage DECIMAL(5,2) NOT NULL
        CONSTRAINT DF_CollegeProfiles_Completion DEFAULT 0;
    PRINT 'Added ProfileCompletionPercentage column to dbo.CollegeProfiles';
END
ELSE
BEGIN
    PRINT 'ProfileCompletionPercentage column already exists in dbo.CollegeProfiles';
END
GO

-- 2. Activate all existing pending college user accounts in the Users table
UPDATE u
SET u.IsActive = 1
FROM dbo.Users u
INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
WHERE r.RoleName = 'college'
  AND u.IsActive = 0;
PRINT 'Activated all pending college user accounts in Users table';
GO

-- 3. Update status and IsActive in Colleges table for consistency
UPDATE c
SET c.Status = 'approved', c.IsActive = 1
FROM dbo.Colleges c
INNER JOIN dbo.Users u ON c.UserID = u.UserID
INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
WHERE r.RoleName = 'college'
  AND (c.Status = 'pending' OR c.IsActive = 0);
PRINT 'Set college status to approved and active for all colleges in Colleges table';
GO
