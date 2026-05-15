-- Microsoft SQL Server setup for Admission Portal
-- Run in SSMS or sqlcmd before prisma db push

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'admission_portal')
BEGIN
  CREATE DATABASE admission_portal;
END
GO

USE admission_portal;
GO

-- Prisma will create tables via: npm run prisma:push
-- Then seed data via: npm run prisma:seed

PRINT 'Database admission_portal is ready. Run prisma:push and prisma:seed from backend folder.';
