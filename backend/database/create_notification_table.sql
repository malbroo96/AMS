CREATE TABLE Notifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    CollegeId INT NOT NULL,

    Type NVARCHAR(50) NOT NULL,

    Title NVARCHAR(200) NOT NULL,

    Description NVARCHAR(MAX),

    Priority NVARCHAR(20) NOT NULL DEFAULT 'info',

    IsRead BIT NOT NULL DEFAULT 0,

    ReferenceId INT NULL,

    ReferenceType NVARCHAR(50) NULL,

    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);