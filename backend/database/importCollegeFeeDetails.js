const { spawnSync } = require('child_process');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sql, getPool, closePool } = require('../config/database');

const DEFAULT_WORKBOOK = 'C:\\Users\\SumoTech-HP-840-G3\\Downloads\\College - Courses - FEE Details (3).xlsx';
const DEFAULT_PASSWORD = 'tagme!23';
const DEFAULT_TOTAL_SEATS = 0;

function cleanText(value) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

function slug(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.slice(0, 90) || 'college';
}

function normalizeName(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeEmail(value) {
  const email = cleanText(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function importedEmail(row) {
  return `${slug(row.collegeName)}@import.local`.slice(0, 255);
}

function uniqueCode(value, suffix = '') {
  const base = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, Math.max(1, 12 - String(suffix).length));
  return `${base || 'GEN'}${suffix}`;
}

function parseCurrency(raw) {
  const value = String(raw || '').toLowerCase();
  const match = value.match(/(?:rs\.?|inr|₹)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)(?!\s*(?:st|nd|rd|th)\b)\s*(lakh|lakhs|lac|lacs)?/i);
  if (!match) return null;
  const number = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;
  const hasCurrencyMarker = /(?:rs\.?|inr|₹)/i.test(value);
  const hasComma = match[1].includes(',');
  if (!hasCurrencyMarker && !hasComma && !match[2] && number < 1000) return null;
  const amount = match[2] && !hasComma && number < 1000 ? number * 100000 : number;
  return Math.round(amount);
}

function splitLines(value) {
  return cleanText(value)
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\u2022\-o*]+/, '').trim())
    .filter(Boolean);
}

function parseCourses(value) {
  return splitLines(value)
    .map((line) => line.replace(/\s+\/+\s*$/g, '').trim())
    .map((line) => {
      const opens = (line.match(/\(/g) || []).length;
      const closes = (line.match(/\)/g) || []).length;
      return opens > closes ? `${line})` : line;
    })
    .filter((line) => !/^na$/i.test(line))
    .filter((line) => !/^(courses offered|engineering programs)$/i.test(line))
    .filter((line) => !/management\s*:$/i.test(line))
    .filter((line, index, all) => all.findIndex((item) => normalizeName(item) === normalizeName(line)) === index);
}

function inferDuration(courseName) {
  const value = courseName.toLowerCase();
  const yearMatch = value.match(/(\d+(?:\.\d+)?)\s*years?/i);
  if (yearMatch) return Number(yearMatch[1]);
  if (/\bpharm\.?d\b|doctor of pharmacy/.test(value)) return 6;
  if (/\bd\.?\s*pharm\b|diploma in pharmacy/.test(value)) return 2;
  if (/\bbba\b|\bbca\b|\bb\.?\s*com\b|\bbcom\b|business administration|commerce|computer applications/.test(value)) return 3;
  return 4;
}

function amountNearCourse(courseName, feeStructure) {
  const lines = splitLines(feeStructure);
  const target = normalizeName(courseName);
  const targetTokens = target.split(' ').filter((token) => token.length > 2);
  let bestIndex = -1;
  let bestScore = 0;

  lines.forEach((line, index) => {
    const normalized = normalizeName(line);
    if (!normalized) return;
    const score = targetTokens.filter((token) => normalized.includes(token)).length;
    if (normalized.includes(target) || score > bestScore) {
      bestScore = normalized.includes(target) ? targetTokens.length + 2 : score;
      bestIndex = index;
    }
  });

  const scan = bestIndex >= 0 ? lines.slice(bestIndex, bestIndex + 8) : lines;
  const preferred = scan.find((line) => /(1st|first|per year|yearly|annual|fee)/i.test(line) && parseCurrency(line));
  return parseCurrency(preferred) || parseCurrency(scan.join('\n')) || parseCurrency(feeStructure) || 0;
}

function courseEligibility(row) {
  const parts = [
    row.feeStructure ? `Imported fee structure:\n${row.feeStructure}` : '',
    row.scholarships ? `Scholarships/discounts:\n${row.scholarships}` : '',
  ].filter(Boolean);
  return parts.join('\n\n') || null;
}

function readWorkbookRows(workbookPath) {
  const psWorkbookPath = workbookPath.replace(/'/g, "''");
  const script = `
$Path = '${psWorkbookPath}'
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$stream=[System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
$zip=New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Read)
function Get-EntryText($name) {
  $entry=$zip.GetEntry($name)
  if (-not $entry) { return $null }
  $reader=New-Object IO.StreamReader($entry.Open())
  try { $reader.ReadToEnd() } finally { $reader.Dispose() }
}
[xml]$sstXml = Get-EntryText 'xl/sharedStrings.xml'
$shared = @()
foreach ($si in $sstXml.sst.si) { $shared += [string]$si.InnerText }
function ColIndex($ref) {
  $letters = ([regex]::Match($ref, '^[A-Z]+')).Value
  $n=0
  foreach($ch in $letters.ToCharArray()){ $n = $n*26 + ([int][char]$ch - [int][char]'A' + 1) }
  return $n-1
}
function CellValue($c) {
  $v = [string]$c.v
  if ($c.t -eq 's' -and $v -ne '') { return $shared[[int]$v] }
  if ($c.t -eq 'inlineStr') { return [string]$c.InnerText }
  if ($v -ne '') { return $v }
  return [string]$c.InnerText
}
[xml]$sheet = Get-EntryText 'xl/worksheets/sheet2.xml'
$rows = @()
foreach ($row in $sheet.worksheet.sheetData.row) {
  $vals = @{}
  foreach ($c in $row.c) { $vals[(ColIndex $c.r)] = CellValue $c }
  if ($row.r -eq '1') { continue }
  $rows += [pscustomobject]@{
    collegeName = [string]$vals[0]
    district = [string]$vals[1]
    state = [string]$vals[2]
    courses = [string]$vals[3]
    feeStructure = [string]$vals[4]
    scholarships = [string]$vals[5]
    email = [string]$vals[6]
  }
}
if ($zip) { $zip.Dispose() }
if ($stream) { $stream.Dispose() }
$rows | ConvertTo-Json -Depth 5
`;

  const result = spawnSync('powershell', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Failed to read workbook');
  }
  const parsed = JSON.parse(result.stdout || '[]');
  return (Array.isArray(parsed) ? parsed : [parsed])
    .map((row) => ({
      collegeName: cleanText(row.collegeName),
      district: cleanText(row.district),
      state: cleanText(row.state),
      courses: cleanText(row.courses),
      feeStructure: cleanText(row.feeStructure),
      scholarships: cleanText(row.scholarships),
      email: normalizeEmail(row.email),
    }))
    .filter((row) => row.collegeName);
}

async function getOrCreateCourse(pool, courseName) {
  const cleanName = cleanText(courseName).slice(0, 255);
  const existing = await pool.request()
    .input('name', sql.NVarChar(255), cleanName)
    .query('SELECT CourseID FROM dbo.Courses WHERE LOWER(CourseName) = LOWER(@name)');
  if (existing.recordset[0]) return existing.recordset[0].CourseID;

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const code = uniqueCode(cleanName, suffix || '');
    try {
      const inserted = await pool.request()
        .input('name', sql.NVarChar(255), cleanName)
        .input('code', sql.NVarChar(50), code)
        .query('INSERT INTO dbo.Courses (CourseName, CourseCode) OUTPUT inserted.CourseID VALUES (@name, @code)');
      return inserted.recordset[0].CourseID;
    } catch (error) {
      if (!String(error.message || '').includes('UNIQUE')) throw error;
    }
  }
  throw new Error(`Unable to create unique course code for ${cleanName}`);
}

async function getOrCreateBranch(pool, courseId, branchName) {
  const cleanName = cleanText(branchName).slice(0, 255);
  const existing = await pool.request()
    .input('courseId', sql.Int, courseId)
    .input('name', sql.NVarChar(255), cleanName)
    .query('SELECT BranchID FROM dbo.Branches WHERE CourseID = @courseId AND LOWER(BranchName) = LOWER(@name)');
  if (existing.recordset[0]) return existing.recordset[0].BranchID;

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const code = uniqueCode(cleanName, suffix || '');
    try {
      const inserted = await pool.request()
        .input('courseId', sql.Int, courseId)
        .input('name', sql.NVarChar(255), cleanName)
        .input('code', sql.NVarChar(50), code)
        .query('INSERT INTO dbo.Branches (CourseID, BranchName, BranchCode) OUTPUT inserted.BranchID VALUES (@courseId, @name, @code)');
      return inserted.recordset[0].BranchID;
    } catch (error) {
      if (!String(error.message || '').includes('UNIQUE')) throw error;
    }
  }
  throw new Error(`Unable to create unique branch code for ${cleanName}`);
}

async function getRoleId(pool, roleName) {
  const result = await pool.request()
    .input('roleName', sql.NVarChar(50), roleName)
    .query('SELECT RoleID FROM dbo.Roles WHERE LOWER(RoleName) = LOWER(@roleName)');
  const roleId = result.recordset[0]?.RoleID;
  if (!roleId) throw new Error(`Role not found: ${roleName}`);
  return roleId;
}

async function upsertCollegeUser(pool, row, roleId, passwordHash) {
  const email = (row.importEmail || importedEmail(row)).slice(0, 255);
  const name = row.collegeName.slice(0, 150);
  const college = await pool.request()
    .input('name', sql.NVarChar(150), row.collegeName.slice(0, 150))
    .query('SELECT UserID FROM dbo.Colleges WHERE LOWER(CollegeName) = LOWER(@name)');
  const collegeUserId = college.recordset[0]?.UserID;

  const existing = await pool.request()
    .input('email', sql.NVarChar(255), email)
    .query('SELECT UserID FROM dbo.Users WHERE LOWER(Email) = LOWER(@email)');
  let userId = existing.recordset[0]?.UserID || collegeUserId;

  if (userId) {
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .input('email', sql.NVarChar(255), email)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .input('fullName', sql.NVarChar(150), name)
      .query(`
        UPDATE dbo.Users
        SET RoleID = @roleId,
            Email = @email,
            PasswordHash = @passwordHash,
            FullName = @fullName,
            IsActive = 1,
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserID = @userId
      `);
    return { userId, email };
  }

  const inserted = await pool.request()
    .input('roleId', sql.Int, roleId)
    .input('email', sql.NVarChar(255), email)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('fullName', sql.NVarChar(150), name)
    .query(`
      INSERT INTO dbo.Users (RoleID, Email, PasswordHash, FullName, IsActive)
      OUTPUT inserted.UserID
      VALUES (@roleId, @email, @passwordHash, @fullName, 1)
    `);
  return { userId: inserted.recordset[0].UserID, email };
}

async function upsertCollege(pool, row, collegeUser) {
  const found = await pool.request()
    .input('name', sql.NVarChar(150), row.collegeName.slice(0, 150))
    .query('SELECT CollegeID FROM dbo.Colleges WHERE LOWER(CollegeName) = LOWER(@name)');

  let collegeId = found.recordset[0]?.CollegeID;

  if (!collegeId) {
    const inserted = await pool.request()
      .input('userId', sql.Int, collegeUser.userId)
      .input('name', sql.NVarChar(150), row.collegeName.slice(0, 150))
      .input('email', sql.NVarChar(255), collegeUser.email)
      .query(`
        INSERT INTO dbo.Colleges (UserID, CollegeName, Email, Status, IsActive)
        OUTPUT inserted.CollegeID
        VALUES (@userId, @name, @email, 'approved', 1)
      `);
    collegeId = inserted.recordset[0].CollegeID;
  } else {
    await pool.request()
      .input('collegeId', sql.Int, collegeId)
      .input('userId', sql.Int, collegeUser.userId)
      .input('name', sql.NVarChar(150), row.collegeName.slice(0, 150))
      .input('email', sql.NVarChar(255), collegeUser.email)
      .query(`
        UPDATE dbo.Colleges
        SET UserID = @userId,
            CollegeName = @name,
            Email = @email,
            Status = 'approved',
            IsActive = 1,
            UpdatedAt = SYSUTCDATETIME()
        WHERE CollegeID = @collegeId
      `);
  }

  const summary = [
    'Imported from College - Courses - FEE Details workbook.',
    row.feeStructure ? `Fee structure:\n${row.feeStructure}` : '',
    row.scholarships ? `Scholarships/discounts:\n${row.scholarships}` : '',
  ].filter(Boolean).join('\n\n');

  await pool.request()
    .input('collegeId', sql.Int, collegeId)
    .input('city', sql.NVarChar(100), row.district || null)
    .input('state', sql.NVarChar(100), row.state || null)
    .input('summary', sql.NVarChar(sql.MAX), summary || null)
    .query(`
      MERGE dbo.CollegeProfiles AS target
      USING (SELECT @collegeId AS CollegeID) AS source
      ON target.CollegeID = source.CollegeID
      WHEN MATCHED THEN UPDATE SET
        City = @city,
        State = @state,
        SummaryDescription = @summary,
        UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (CollegeID, City, State, SummaryDescription, AicteApproval, UgcRecognition)
        VALUES (@collegeId, @city, @state, @summary, 0, 0);
    `);

  return collegeId;
}

async function upsertCollegeCourse(pool, collegeId, courseId, branchId, courseName, row) {
  const fee = amountNearCourse(courseName, row.feeStructure);
  const duration = inferDuration(courseName);
  const eligibility = courseEligibility(row);

  await pool.request()
    .input('collegeId', sql.Int, collegeId)
    .input('courseId', sql.Int, courseId)
    .input('branchId', sql.Int, branchId)
    .input('duration', sql.Decimal(3, 1), duration)
    .input('seats', sql.Int, DEFAULT_TOTAL_SEATS)
    .input('fee', sql.Decimal(12, 2), fee)
    .input('eligibility', sql.NVarChar(sql.MAX), eligibility)
    .query(`
      MERGE dbo.CollegeCourses AS target
      USING (SELECT @collegeId AS CollegeID, @courseId AS CourseID, @branchId AS BranchID) AS source
      ON target.CollegeID = source.CollegeID AND target.CourseID = source.CourseID AND target.BranchID = source.BranchID
      WHEN MATCHED THEN UPDATE SET
        DurationYears = @duration,
        TotalSeats = @seats,
        AnnualFee = @fee,
        EligibilityCriteria = @eligibility,
        IsActive = 1,
        UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (CollegeID, CourseID, BranchID, DurationYears, TotalSeats, AnnualFee, EligibilityCriteria, IsActive)
        VALUES (@collegeId, @courseId, @branchId, @duration, @seats, @fee, @eligibility, 1);
    `);
}

async function main() {
  const workbookPath = path.resolve(process.argv[2] || DEFAULT_WORKBOOK);
  const defaultPassword = process.env.IMPORT_DEFAULT_PASSWORD || DEFAULT_PASSWORD;
  const rows = readWorkbookRows(workbookPath);
  const emailCounts = rows.reduce((counts, row) => {
    if (row.email) counts.set(row.email, (counts.get(row.email) || 0) + 1);
    return counts;
  }, new Map());

  rows.forEach((row) => {
    row.importEmail = row.email && emailCounts.get(row.email) === 1 ? row.email : importedEmail(row);
  });

  const pool = await getPool();
  const collegeRoleId = await getRoleId(pool, 'college');
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const summary = {
    workbookPath,
    rows: rows.length,
    uniqueWorkbookEmails: rows.filter((row) => row.email && row.importEmail === row.email).length,
    fallbackEmails: rows.filter((row) => row.importEmail !== row.email).length,
    colleges: 0,
    courses: 0,
    skippedCourseRows: 0,
  };

  for (const row of rows) {
    try {
      console.log(`Importing college: ${row.collegeName}`);
      const courseNames = parseCourses(row.courses);
      const collegeUser = await upsertCollegeUser(pool, row, collegeRoleId, passwordHash);
      const collegeId = await upsertCollege(pool, row, collegeUser);
      summary.colleges += 1;

      if (!courseNames.length) {
        summary.skippedCourseRows += 1;
        continue;
      }

      for (const courseName of courseNames) {
        console.log(`  Course: ${courseName}`);
        const courseId = await getOrCreateCourse(pool, courseName);
        const branchId = await getOrCreateBranch(pool, courseId, 'General');
        await upsertCollegeCourse(pool, collegeId, courseId, branchId, courseName, row);
        summary.courses += 1;
      }
    } catch (error) {
      error.message = `Failed while importing "${row.collegeName}": ${error.message}`;
      throw error;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
