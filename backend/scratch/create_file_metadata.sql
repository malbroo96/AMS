IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FileMetadata]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.FileMetadata (
        fileId NVARCHAR(255) NOT NULL,
        driveId NVARCHAR(255) NOT NULL,
        siteId NVARCHAR(255) NOT NULL,
        folderPath NVARCHAR(500) NOT NULL,
        fileName NVARCHAR(255) NOT NULL,
        mimeType NVARCHAR(100) NOT NULL,
        size BIGINT NOT NULL,
        entityType NVARCHAR(50) NOT NULL,
        entityId INT NOT NULL,
        uploadedBy INT NOT NULL,
        createdAt DATETIME2 NOT NULL CONSTRAINT DF_FileMetadata_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_FileMetadata PRIMARY KEY CLUSTERED (fileId)
    );
END
