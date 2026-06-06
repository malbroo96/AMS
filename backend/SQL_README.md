# AMS SQL Backend Guide

This document is for explaining the SQL Server side of the AMS backend in a review meeting. It covers the database purpose, connection setup, schema, backend flow, scripts, and common troubleshooting.

## 1. Overview

AMS stores application data in Microsoft SQL Server. The backend is a Node.js/Express API that connects to SQL Server using the `mssql` package.

Current SQL mode:

- Main database: `AMS`
- SQL Server host: configured by `DB_SERVER`
- SQL Server instance: configured by `DB_INSTANCE`
- Authentication mode: Windows Authentication or SQL Authentication, controlled by `.env`
- Main schema file: `backend/database/ams-schema.sql`
- Connection config: `backend/config/env.js` and `backend/config/database.js`
- SQL business logic: `backend/services/amsSql.service.js`

The application uses SQL Server for users, roles, students, colleges, applications/interests, and activity logs.

## 2. Why SQL Server Is Used

SQL Server is used because AMS needs structured relational data:

- A user belongs to one role.
- A student profile belongs to one user.
- A college profile belongs to one user.
- A student can show interest in multiple colleges.
- A college can receive interest from multiple students.
- Admin actions and important events are stored as activity logs.

This is better represented with relational tables, primary keys, foreign keys, and constraints instead of JSON files.

## 3. Environment Configuration

The backend reads SQL settings from `backend/.env`.

Example Windows Authentication setup:

```env
USE_LOCAL_AUTH=false

DB_SERVER=ERPSERVER
DB_INSTANCE=SQLEXPRESS
DB_PORT=
DB_NAME=AMS

DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
DB_TRUSTED_CONNECTION=true
DB_ODBC_DRIVER=SQL Server
```

Meaning of each SQL variable:

| Variable | Purpose |
| --- | --- |
| `USE_LOCAL_AUTH=false` | Tells backend to use SQL Server instead of local JSON auth. |
| `DB_SERVER` | SQL Server machine name or IP address. |
| `DB_INSTANCE` | SQL named instance, for example `SQLEXPRESS`. |
| `DB_PORT` | SQL Server port. Leave blank when using a named instance. |
| `DB_NAME` | Database name, currently `AMS`. |
| `DB_ENCRYPT` | Usually `false` for local/on-prem SQL Server. |
| `DB_TRUST_SERVER_CERTIFICATE` | Allows self-signed/local SQL certificates. |
| `DB_TRUSTED_CONNECTION` | `true` for Windows Authentication. |
| `DB_ODBC_DRIVER` | ODBC driver name used by `msnodesqlv8`. |

SQL Authentication alternative:

```env
DB_TRUSTED_CONNECTION=false
DB_USER=amsuser
DB_PASSWORD=StrongPassword123
```

Use Windows Authentication when the Windows user running Node has permission in SQL Server. Use SQL Authentication when connecting with a SQL login and password.

## 4. Backend Connection Flow

Connection files:

- `backend/config/env.js` reads `.env` and creates a normalized `db` config object.
- `backend/config/database.js` creates a singleton SQL connection pool.
- `backend/server.js` tests the pool before starting the API.

Flow:

```text
npm run dev
  -> server.js
  -> config/env.js loads .env
  -> config/database.js builds SQL config
  -> getPool() connects to SQL Server
  -> Express API starts on PORT
```

Important behavior:

- If `DB_TRUSTED_CONNECTION=true`, the backend uses `mssql/msnodesqlv8`.
- If `DB_TRUSTED_CONNECTION=false`, the backend uses standard SQL username/password login.
- The pool is reused across requests so the app does not reconnect for every API call.

## 5. Database Schema

The AMS schema is defined in:

```text
backend/database/ams-schema.sql
```

Main tables:

| Table | Purpose |
| --- | --- |
| `Roles` | Stores system roles: `admin`, `college`, `student`. |
| `Users` | Stores login credentials, role, approval status, name, email, and phone. |
| `Students` | Stores student profile details linked to `Users`. |
| `Colleges` | Stores college profile details linked to `Users`. |
| `StudentApplications` | Stores student interest/application records for colleges. |
| `ActivityLogs` | Stores important system activity messages. |

## 6. Table Relationships

```text
Roles
  RoleID
    |
    | one role has many users
    v
Users
  UserID
    |
    | one student user has one student profile
    v
Students

Users
  UserID
    |
    | one college user has one college profile
    v
Colleges

Students
  StudentID
    |
    | many student-college interest records
    v
StudentApplications
    ^
    | many interest records for one college
    |
Colleges
  CollegeID
```

Key relationships:

- `Users.RoleID` references `Roles.RoleID`.
- `Students.UserID` references `Users.UserID`.
- `Colleges.UserID` references `Users.UserID`.
- `StudentApplications.StudentID` references `Students.StudentID`.
- `StudentApplications.CollegeID` references `Colleges.CollegeID`.

The `StudentApplications` table has a unique constraint on `(StudentID, CollegeID)` so the same student cannot apply to the same college more than once.

## 7. Feature Mapping

How app features map to SQL tables:

| Feature | SQL Tables Used |
| --- | --- |
| Login | `Users`, `Roles` |
| Student registration | `Users`, `Students`, `ActivityLogs` |
| College creation by admin | `Users`, `Colleges`, `ActivityLogs` |
| List colleges | `Colleges` |
| Student marks interest | `Students`, `Colleges`, `StudentApplications`, `ActivityLogs` |
| Student dashboard | `Students`, `StudentApplications`, `Colleges` |
| College dashboard | `Colleges`, `StudentApplications`, `Students` |
| Admin dashboard | `Users`, `Students`, `Colleges`, `StudentApplications`, `ActivityLogs` |
| Approve/reject access | `StudentApplications` |

## 8. Important Backend Files

| File | Responsibility |
| --- | --- |
| `backend/server.js` | Starts the API and checks SQL connectivity. |
| `backend/config/env.js` | Reads `.env` and prepares database settings. |
| `backend/config/database.js` | Creates and exports the SQL connection pool. |
| `backend/database/ams-schema.sql` | Creates AMS SQL tables and constraints. |
| `backend/services/auth.service.js` | Handles login/register and creates student SQL profile. |
| `backend/services/amsSql.service.js` | Handles AMS SQL features for admin, student, and college dashboards. |
| `backend/models/AmsUser.model.js` | User CRUD queries for AMS SQL mode. |
| `backend/models/AmsActivity.model.js` | Inserts activity log records. |

## 9. Running The Backend

From the backend folder:

```bash
cd backend
npm run dev
```

Expected successful output:

```text
AMS MSSQL mode - database "AMS" on ERPSERVER
All users, students, and colleges are stored in SQL Server.
E-Admin API running on http://localhost:5000
Health check: http://localhost:5000/api/health
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

## 10. Applying The Schema

Recommended for review/demo:

1. Open SQL Server Management Studio.
2. Connect to the target SQL Server.
3. Create/select the `AMS` database.
4. Open `backend/database/ams-schema.sql`.
5. Execute the script against the `AMS` database.

The script creates these tables if they do not already exist:

- `Roles`
- `Users`
- `Colleges`
- `Students`
- `StudentApplications`
- `ActivityLogs`

It also seeds the base roles:

- `admin`
- `college`
- `student`

## 11. Useful SQL Queries For Review

Check tables:

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

Check roles:

```sql
SELECT * FROM Roles;
```

Check users with role names:

```sql
SELECT
  u.UserID,
  u.FullName,
  u.Email,
  r.RoleName,
  u.IsApproved,
  u.CreatedAt
FROM Users u
INNER JOIN Roles r ON r.RoleID = u.RoleID
ORDER BY u.CreatedAt DESC;
```

Check students:

```sql
SELECT
  StudentID,
  UserID,
  Name,
  Email,
  Mobile,
  Education,
  InterestedCollege,
  ProfileVisible,
  CreatedAt
FROM Students
ORDER BY CreatedAt DESC;
```

Check colleges:

```sql
SELECT
  CollegeID,
  CollegeName,
  Email,
  UserID,
  Status,
  CreatedAt
FROM Colleges
ORDER BY CollegeName;
```

Check student applications/interests:

```sql
SELECT
  sa.ApplicationID,
  st.Name AS StudentName,
  c.CollegeName,
  sa.Status,
  sa.ApprovedByAdmin,
  sa.CreatedAt
FROM StudentApplications sa
INNER JOIN Students st ON st.StudentID = sa.StudentID
INNER JOIN Colleges c ON c.CollegeID = sa.CollegeID
ORDER BY sa.CreatedAt DESC;
```

Check activity logs:

```sql
SELECT TOP 20 *
FROM ActivityLogs
ORDER BY CreatedAt DESC;
```

## 12. Troubleshooting

### Error: Login failed for user ''

Cause:

The backend attempted SQL Authentication with an empty username. This usually happens when Windows Authentication settings are not passed correctly to the SQL driver.

Fix:

- Set `DB_TRUSTED_CONNECTION=true` for Windows Authentication.
- Make sure `backend/config/database.js` uses `mssql/msnodesqlv8` for trusted connection.
- Do not set blank `DB_USER` and `DB_PASSWORD` when using Windows Authentication.

Correct Windows Authentication config:

```env
DB_TRUSTED_CONNECTION=true
DB_USER=
DB_PASSWORD=
```

Or simply omit `DB_USER` and `DB_PASSWORD`.

### Backend hangs while connecting

Possible causes:

- SQL Server instance is not reachable.
- SQL Server Browser service is stopped.
- Named instance `SQLEXPRESS` is not discoverable.
- Firewall is blocking SQL Server or UDP 1434.
- The Windows user running Node does not have permission on the `AMS` database.

Checks:

```powershell
Test-NetConnection ERPSERVER -Port 1433
```

Also confirm in SQL Server Configuration Manager:

- SQL Server service is running.
- SQL Server Browser service is running for named instances.
- TCP/IP is enabled.
- The target instance is correct.

### Error: Cannot open database "AMS"

Cause:

The database does not exist or the login does not have access.

Fix:

- Create the `AMS` database.
- Grant the Windows/SQL login access to `AMS`.
- Run `backend/database/ams-schema.sql`.

### Error: Missing role in AMS.Roles

Cause:

The `Roles` table exists but does not contain required rows.

Fix:

```sql
INSERT INTO Roles (RoleName)
SELECT 'admin'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'admin');

INSERT INTO Roles (RoleName)
SELECT 'college'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'college');

INSERT INTO Roles (RoleName)
SELECT 'student'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'student');
```

## 13. Review Meeting Talking Points

Use this flow when explaining:

1. The backend is Express, but all main AMS data is stored in SQL Server.
2. `.env` decides which SQL Server, database, and authentication mode are used.
3. `env.js` normalizes `.env`, and `database.js` creates one reusable SQL pool.
4. The schema uses six main tables: `Roles`, `Users`, `Students`, `Colleges`, `StudentApplications`, `ActivityLogs`.
5. Foreign keys keep the data connected and consistent.
6. Student interest in a college is stored in `StudentApplications`.
7. Admin dashboards are built from counts and joins across these SQL tables.
8. Activity logs help track important actions like registrations and interest updates.
9. The recent login issue was caused by SQL auth being attempted with an empty user; trusted Windows auth is now passed correctly.

## 14. Simple End-To-End Example

Student registration:

```text
Frontend registration form
  -> POST API request
  -> auth.service.js hashes password
  -> Users row is inserted with role student
  -> Students row is inserted with profile details
  -> ActivityLogs row is inserted
  -> JWT token is returned
```

Student marks interest:

```text
Student selects college
  -> Backend checks student profile
  -> Backend checks college is approved
  -> StudentApplications row is inserted
  -> Students.InterestedCollege is updated
  -> ActivityLogs row is inserted
```

College dashboard:

```text
College logs in
  -> Backend finds Colleges row using UserID
  -> Backend joins StudentApplications with Students
  -> Dashboard shows interested students and approval status
```

