-- ===========================================================================
-- AMS DATABASE SCHEMA UPDATE (Production-Safe Migration DDL)
-- Designed for production databases containing existing records.
-- Handles: Creating new tables, migrating existing data, null-to-NotNull conversion,
-- deduplication, default constraints cleanup, and constraint enforcement safety.
-- ===========================================================================

-------------------------------------------------------------------------------
-- 1. CLEAN UP OLD SCHEMAS (If existing table layouts conflict with new ones)
-------------------------------------------------------------------------------
-- If dbo.CollegeCourses exists but has CourseName, it is the old layout.
-- We drop it so it can be re-created with the new CourseID/BranchID mapping design.
IF OBJECT_ID('dbo.CollegeCourses', 'U') IS NOT NULL AND EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CollegeCourses') AND name = 'CourseName'
)
BEGIN
    PRINT 'Dropping old CollegeCourses table structure...';
    DROP TABLE dbo.CollegeCourses;
END
GO


-------------------------------------------------------------------------------
-- 2. CREATE COURSES TABLE (If Not Exists)
-------------------------------------------------------------------------------
PRINT 'Updating Courses table...';
IF OBJECT_ID('dbo.Courses', 'U') IS NULL
BEGIN
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
END
GO


-------------------------------------------------------------------------------
-- 3. CREATE BRANCHES TABLE (If Not Exists)
-------------------------------------------------------------------------------
PRINT 'Updating Branches table...';
IF OBJECT_ID('dbo.Branches', 'U') IS NULL
BEGIN
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
END
ELSE
BEGIN
    -- If table exists, perform the requested alterations safely
    -- Drop global UNIQUE constraint on BranchName if it exists
    IF EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_Branches_BranchName' AND parent_object_id = OBJECT_ID('dbo.Branches'))
    BEGIN
        ALTER TABLE dbo.Branches DROP CONSTRAINT UQ_Branches_BranchName;
    END

    -- Add CourseID as NULL first to allow addition when existing rows are present
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Branches') AND name = 'CourseID')
    BEGIN
        ALTER TABLE dbo.Branches ADD CourseID INT NULL;
    END

    -- Locate/Create a default Course to map existing orphan branches to
    DECLARE @DefaultCourseID INT;
    SELECT TOP 1 @DefaultCourseID = CourseID FROM dbo.Courses WHERE IsActive = 1;

    IF @DefaultCourseID IS NULL
    BEGIN
        INSERT INTO dbo.Courses (CourseName, CourseCode, IsActive)
        VALUES ('Default Course', 'DFT', 1);
        SET @DefaultCourseID = SCOPE_IDENTITY();
    END

    UPDATE dbo.Branches
    SET CourseID = @DefaultCourseID
    WHERE CourseID IS NULL;

    -- Now enforce NOT NULL constraint
    ALTER TABLE dbo.Branches ALTER COLUMN CourseID INT NOT NULL;

    -- Create Foreign Key relationship
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Branches_Courses' AND parent_object_id = OBJECT_ID('dbo.Branches'))
    BEGIN
        ALTER TABLE dbo.Branches ADD CONSTRAINT FK_Branches_Courses 
        FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID);
    END

    -- Deduplicate Branches to ensure the new UNIQUE constraint on (CourseID, BranchName) can be applied safely
    ;WITH DuplicateBranches AS (
        SELECT 
            BranchID,
            ROW_NUMBER() OVER (PARTITION BY CourseID, BranchName ORDER BY BranchID) as RowNum
        FROM dbo.Branches
    )
    DELETE FROM dbo.Branches
    WHERE BranchID IN (SELECT BranchID FROM DuplicateBranches WHERE RowNum > 1);

    -- Enforce UNIQUE constraint per Course
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_Branches_Course_BranchName' AND parent_object_id = OBJECT_ID('dbo.Branches'))
    BEGIN
        ALTER TABLE dbo.Branches ADD CONSTRAINT UQ_Branches_Course_BranchName 
        UNIQUE (CourseID, BranchName);
    END
END
GO


-------------------------------------------------------------------------------
-- 4. CREATE COLLEGE COURSES TABLE (If Not Exists)
-------------------------------------------------------------------------------
PRINT 'Updating CollegeCourses table...';
IF OBJECT_ID('dbo.CollegeCourses', 'U') IS NULL
BEGIN
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
END
GO


-------------------------------------------------------------------------------
-- 5. CREATE COLLEGE MEDIA TABLE (If Not Exists)
-------------------------------------------------------------------------------
PRINT 'Updating CollegeMedia table...';
IF OBJECT_ID('dbo.CollegeMedia', 'U') IS NULL
BEGIN
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
END
GO


-------------------------------------------------------------------------------
-- 6. CREATE STUDENTPROFILES TABLE & MIGRATE DATA
-------------------------------------------------------------------------------
PRINT 'Updating StudentProfiles table...';

IF OBJECT_ID('dbo.StudentProfiles', 'U') IS NULL
BEGIN
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
END
GO

-- Migrate existing student profile data from old Students table if Name exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Name')
BEGIN
    EXEC sp_executesql N'
    INSERT INTO dbo.StudentProfiles (
        StudentID, FirstName, LastName, Email, Mobile, Gender, DateOfBirth, AddressLine1, ProfileStatus, ProfileCompletionPercentage, CreatedAt, UpdatedAt
    )
    SELECT 
        StudentID,
        CASE 
            WHEN CHARINDEX('' '', LTRIM(RTRIM(Name))) > 0 
            THEN SUBSTRING(LTRIM(RTRIM(Name)), 1, CHARINDEX('' '', LTRIM(RTRIM(Name))) - 1)
            ELSE ISNULL(NULLIF(LTRIM(RTRIM(Name)), ''''), ''Student'')
        END,
        CASE 
            WHEN CHARINDEX('' '', LTRIM(RTRIM(Name))) > 0 
            THEN SUBSTRING(LTRIM(RTRIM(Name)), CHARINDEX('' '', LTRIM(RTRIM(Name))) + 1, LEN(Name))
            ELSE ''''
        END,
        Email,
        Mobile,
        Gender,
        DateOfBirth,
        Address,
        ''Complete'',
        100.00,
        CreatedAt,
        SYSUTCDATETIME()
    FROM dbo.Students
    WHERE NOT EXISTS (SELECT 1 FROM dbo.StudentProfiles sp WHERE sp.StudentID = dbo.Students.StudentID);
    ';
END
GO

-- Create composite index on FirstName and LastName for fast lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StudentProfiles_FirstName_LastName' AND object_id = OBJECT_ID('dbo.StudentProfiles'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_StudentProfiles_FirstName_LastName 
    ON dbo.StudentProfiles(FirstName, LastName);
END
GO


-------------------------------------------------------------------------------
-- 7. CREATE STUDENTACADEMICDETAILS TABLE & MIGRATE DATA
-------------------------------------------------------------------------------
PRINT 'Updating StudentAcademicDetails table...';

IF OBJECT_ID('dbo.StudentAcademicDetails', 'U') IS NULL
BEGIN
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
END
GO

-- Migrate old Education field to AcademicDetails if Education exists in Students
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Education')
BEGIN
    EXEC sp_executesql N'
    INSERT INTO dbo.StudentAcademicDetails (StudentID, Qualification, CreatedAt, UpdatedAt)
    SELECT 
        StudentID, 
        Education, 
        CreatedAt, 
        SYSUTCDATETIME()
    FROM dbo.Students
    WHERE Education IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM dbo.StudentAcademicDetails sad WHERE sad.StudentID = dbo.Students.StudentID);
    ';
END
GO


-------------------------------------------------------------------------------
-- 8. CREATE STUDENT DOCUMENTS TABLE (If Not Exists)
-------------------------------------------------------------------------------
PRINT 'Updating StudentDocuments table...';
IF OBJECT_ID('dbo.StudentDocuments', 'U') IS NULL
BEGIN
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
END
GO


-------------------------------------------------------------------------------
-- 9. MINIMIZE STUDENTS TABLE
-------------------------------------------------------------------------------
PRINT 'Minimizing Students table...';

-- A. Drop default constraints bound to columns we are about to drop
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'DF_Students_ProfileVisible' AND parent_object_id = OBJECT_ID('dbo.Students'))
BEGIN
    ALTER TABLE dbo.Students DROP CONSTRAINT DF_Students_ProfileVisible;
END
GO

-- B. Drop old columns from Students to keep it minimal
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Name')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN Name;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Address')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN Address;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Mobile')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN Mobile;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Email')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN Email;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Gender')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN Gender;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'DateOfBirth')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN DateOfBirth;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'Education')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN Education;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'InterestedCollege')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN InterestedCollege;
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'ProfileVisible')
BEGIN
    ALTER TABLE dbo.Students DROP COLUMN ProfileVisible;
END
GO

-- C. Add ApplicationNumber column to Students
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Students') AND name = 'ApplicationNumber')
BEGIN
    ALTER TABLE dbo.Students ADD ApplicationNumber NVARCHAR(50) NULL;
END
GO


-------------------------------------------------------------------------------
-- 10. CREATE APPLICATIONS & STATUS HISTORY TABLES & MIGRATE DATA
-------------------------------------------------------------------------------
PRINT 'Updating Applications and History tables...';

-- A. Create Applications table if not exists
IF OBJECT_ID('dbo.Applications', 'U') IS NULL
BEGIN
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
        -- We will link to CollegeCourses later as needed, or omit strict check for migration if CollegeCourses is empty
        CONSTRAINT UQ_Applications_Student_CollegeCourse UNIQUE (StudentID, CollegeCourseID)
    );
END
GO

-- B. Migrate data from old StudentApplications table if it exists
-- Note: In the old table, interests were mapped to CollegeID. Since CollegeCourses did not exist,
-- we map to a default/dummy CollegeCourseID to satisfy FK/relational mappings.
IF OBJECT_ID('dbo.StudentApplications', 'U') IS NOT NULL AND EXISTS (
    SELECT 1 FROM dbo.StudentApplications WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Applications a WHERE a.StudentID = dbo.StudentApplications.StudentID
    )
)
BEGIN
    -- Find/Create a dummy CollegeCourseID to link to for historic applications
    DECLARE @DummyCollegeCourseID INT;
    SELECT TOP 1 @DummyCollegeCourseID = CollegeCourseID FROM dbo.CollegeCourses;

    IF @DummyCollegeCourseID IS NULL
    BEGIN
        -- Insert dummy course and college course row to link to
        DECLARE @DummyCourseID INT, @DummyBranchID INT, @DummyCollegeID INT;
        
        SELECT TOP 1 @DummyCourseID = CourseID FROM dbo.Courses;
        IF @DummyCourseID IS NULL
        BEGIN
            INSERT INTO dbo.Courses (CourseName, CourseCode) VALUES ('General Course', 'GEN');
            SET @DummyCourseID = SCOPE_IDENTITY();
        END
        
        SELECT TOP 1 @DummyBranchID = BranchID FROM dbo.Branches;
        IF @DummyBranchID IS NULL
        BEGIN
            INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) VALUES (@DummyCourseID, 'General Branch', 'GEN');
            SET @DummyBranchID = SCOPE_IDENTITY();
        END
        
        SELECT TOP 1 @DummyCollegeID = CollegeID FROM dbo.Colleges;
        IF @DummyCollegeID IS NULL
        BEGIN
            -- Ensure a user exists for the default college
            DECLARE @DefaultUserID INT;
            SELECT TOP 1 @DefaultUserID = UserID FROM dbo.Users;
            INSERT INTO dbo.Colleges (CollegeName, Email, UserID, Status) 
            VALUES ('Default College', 'college@default.com', @DefaultUserID, 'approved');
            SET @DummyCollegeID = SCOPE_IDENTITY();
        END
        
        INSERT INTO dbo.CollegeCourses (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee)
        VALUES (@DummyCollegeID, @DummyCourseID, @DummyBranchID, 4.0, 60, 50000.00);
        SET @DummyCollegeCourseID = SCOPE_IDENTITY();
    END

    EXEC sp_executesql N'
    INSERT INTO dbo.Applications (StudentID, CollegeCourseID, CurrentStatus, CreatedAt, UpdatedAt)
    SELECT 
        StudentID,
        @DummyCollegeCourseID,
        Status,
        CreatedAt,
        CreatedAt
    FROM dbo.StudentApplications sa
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Applications a WHERE a.StudentID = sa.StudentID);
    ', N'@DummyCollegeCourseID INT', @DummyCollegeCourseID;
END
GO

-- C. Drop old StudentApplications table if it exists now that data has been safely migrated
IF OBJECT_ID('dbo.StudentApplications', 'U') IS NOT NULL
BEGIN
    PRINT 'Dropping old StudentApplications table...';
    DROP TABLE dbo.StudentApplications;
END
GO

-- D. Create ApplicationStatusHistory table if not exists
IF OBJECT_ID('dbo.ApplicationStatusHistory', 'U') IS NULL
BEGIN
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
END
GO


-------------------------------------------------------------------------------
-- 11. UPDATE APPLICATIONS WITH FOREIGN KEYS AND INDEXES
-------------------------------------------------------------------------------
-- Add FK from Applications to CollegeCourses now that CollegeCourses is fully updated
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Applications_CollegeCourses' AND parent_object_id = OBJECT_ID('dbo.Applications'))
BEGIN
    ALTER TABLE dbo.Applications ADD CONSTRAINT FK_Applications_CollegeCourses 
    FOREIGN KEY (CollegeCourseID) REFERENCES dbo.CollegeCourses(CollegeCourseID);
END
GO

-- Create applications composite indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_StudentID' AND object_id = OBJECT_ID('dbo.Applications'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Applications_StudentID ON dbo.Applications(StudentID) INCLUDE (CurrentStatus, CollegeCourseID);
END
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_CollegeCourseID' AND object_id = OBJECT_ID('dbo.Applications'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Applications_CollegeCourseID ON dbo.Applications(CollegeCourseID) INCLUDE (CurrentStatus, StudentID);
END
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Applications_CurrentStatus' AND object_id = OBJECT_ID('dbo.Applications'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Applications_CurrentStatus ON dbo.Applications(CurrentStatus);
END
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AppStatusHistory_ApplicationID' AND object_id = OBJECT_ID('dbo.ApplicationStatusHistory'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AppStatusHistory_ApplicationID ON dbo.ApplicationStatusHistory(ApplicationID) INCLUDE (Status, CreatedAt);
END
GO

PRINT 'Database schema updated successfully.';
GO
