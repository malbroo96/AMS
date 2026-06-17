-- ===========================================================================
-- DATABASE MIGRATION SCRIPT
-- Objective: Separate college login from student visibility.
-- Ensure all existing colleges can log in and approved colleges have Status.
-- ===========================================================================

-- 1. Ensure all existing college users can log in
UPDATE u
SET u.IsActive = 1
FROM dbo.Users u
INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
WHERE r.RoleName = 'college' AND u.IsActive = 0;
GO

-- 2. Ensure existing colleges that were previously approved have status set
IF COL_LENGTH('dbo.Colleges', 'Status') IS NOT NULL
BEGIN
    UPDATE dbo.Colleges
    SET Status = 'approved'
    WHERE Status IS NULL;
END
GO
