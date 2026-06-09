-- College Portal Database Schema
-- SQL Server

-- Colleges Table
CREATE TABLE Colleges (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeCode NVARCHAR(50) UNIQUE NOT NULL,
    collegeName NVARCHAR(255) NOT NULL,
    shortName NVARCHAR(100),
    establishmentYear INT,
    collegeType NVARCHAR(50), -- Government, Private, Autonomous
    universityAffiliation NVARCHAR(255),
    naacGrade NVARCHAR(10), -- A++, A+, A, B++, B+, B, C
    aicteApproval BIT DEFAULT 0,
    ugcRecognition BIT DEFAULT 0,
    
    -- Branding
    logoUrl NVARCHAR(MAX),
    coverBannerUrl NVARCHAR(MAX),
    prospectusUrl NVARCHAR(MAX),
    
    -- Location
    country NVARCHAR(100),
    state NVARCHAR(100),
    district NVARCHAR(100),
    city NVARCHAR(100),
    fullAddress NVARCHAR(500),
    pincode NVARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    googleMapsUrl NVARCHAR(MAX),
    
    -- Contact Information
    admissionMobileNumber NVARCHAR(20),
    officeMobileNumber NVARCHAR(20),
    landlineNumber NVARCHAR(20),
    emailAddress NVARCHAR(255),
    websiteUrl NVARCHAR(255),
    
    -- About College
    summaryDescription NVARCHAR(MAX),
    visionStatement NVARCHAR(MAX),
    missionStatement NVARCHAR(MAX),
    principalMessage NVARCHAR(MAX),
    chairmanMessage NVARCHAR(MAX),
    
    -- Placements
    placementPercentage DECIMAL(5,2),
    highestPackage NVARCHAR(50),
    averagePackage NVARCHAR(50),
    
    -- Facilities (JSON or separate table)
    facilities NVARCHAR(MAX), -- JSON array
    
    -- Analytics
    totalStudentViews INT DEFAULT 0,
    totalEnquiries INT DEFAULT 0,
    totalInterestedStudents INT DEFAULT 0,
    profileCompletionPercentage DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    isActive BIT DEFAULT 1,
    isVerified BIT DEFAULT 0,
    
    -- Audit
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    createdBy INT,
    updatedBy INT,
    
    FOREIGN KEY (createdBy) REFERENCES Users(id),
    FOREIGN KEY (updatedBy) REFERENCES Users(id)
);

-- College Courses Table
CREATE TABLE CollegeCourses (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    courseName NVARCHAR(255) NOT NULL,
    courseCategory NVARCHAR(100), -- UG, PG, Diploma, etc.
    degreeType NVARCHAR(100), -- B.Tech, B.Com, MBA, etc.
    duration INT, -- in years
    totalSeats INT,
    eligibility NVARCHAR(MAX),
    annualFee DECIMAL(10,2),
    hostelFee DECIMAL(10,2),
    examAccepted NVARCHAR(MAX), -- JSON array: JEE, NEET, GATE, etc.
    description NVARCHAR(MAX),
    courseImageUrl NVARCHAR(MAX),
    
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE
);

-- College Achievements Table
CREATE TABLE CollegeAchievements (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    achievementTitle NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    achievementYear INT,
    achievementImageUrl NVARCHAR(MAX),
    displayOrder INT,
    
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE
);

-- College Gallery Table
CREATE TABLE CollegeGallery (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    imageUrl NVARCHAR(MAX) NOT NULL,
    imageTitle NVARCHAR(255),
    imageDescription NVARCHAR(500),
    imageCategory NVARCHAR(100), -- Campus, Classroom, Lab, Event, etc.
    displayOrder INT,
    
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE
);

-- College Top Recruiters Table
CREATE TABLE CollegeRecruiters (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    recruiterName NVARCHAR(255) NOT NULL,
    recruiterLogoUrl NVARCHAR(MAX),
    displayOrder INT,
    
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE
);

-- College Ratings/Reviews Table
CREATE TABLE CollegeRatings (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    studentId INT NOT NULL,
    infrastructureRating DECIMAL(3,1), -- 1-5
    facultyRating DECIMAL(3,1),
    placementRating DECIMAL(3,1),
    campusLifeRating DECIMAL(3,1),
    overallRating DECIMAL(3,1),
    reviewText NVARCHAR(MAX),
    
    isApproved BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES Users(id) ON DELETE CASCADE
);

-- College Student Interests Table (for tracking interested students)
CREATE TABLE CollegeStudentInterests (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    studentId INT NOT NULL,
    interestedCourseId INT,
    status NVARCHAR(50), -- Interested, Enquired, Applied
    appliedDate DATETIME,
    
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (interestedCourseId) REFERENCES CollegeCourses(id)
);

-- College Enquiries Table
CREATE TABLE CollegeEnquiries (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    studentName NVARCHAR(255) NOT NULL,
    studentEmail NVARCHAR(255),
    studentPhone NVARCHAR(20),
    message NVARCHAR(MAX),
    interestedCourse NVARCHAR(255),
    status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Contacted, Resolved
    
    isRead BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE
);

-- College Admin/Staff Table
CREATE TABLE CollegeAdmins (
    id INT PRIMARY KEY IDENTITY(1,1),
    collegeId INT NOT NULL,
    userId INT NOT NULL,
    role NVARCHAR(50), -- SuperAdmin, Admin, Editor
    permissions NVARCHAR(MAX), -- JSON array of permissions
    
    isActive BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (collegeId) REFERENCES Colleges(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE (collegeId, userId)
);

-- Indexes for better query performance
CREATE INDEX idx_colleges_state_city ON Colleges(state, city);
CREATE INDEX idx_colleges_collegeType ON Colleges(collegeType);
CREATE INDEX idx_colleges_naacGrade ON Colleges(naacGrade);
CREATE INDEX idx_collegeCourses_collegeId ON CollegeCourses(collegeId);
CREATE INDEX idx_collegeAchievements_collegeId ON CollegeAchievements(collegeId);
CREATE INDEX idx_collegeGallery_collegeId ON CollegeGallery(collegeId);
CREATE INDEX idx_collegeRatings_collegeId ON CollegeRatings(collegeId);
CREATE INDEX idx_collegeRatings_studentId ON CollegeRatings(studentId);
CREATE INDEX idx_collegeStudentInterests_collegeId ON CollegeStudentInterests(collegeId);
CREATE INDEX idx_collegeStudentInterests_studentId ON CollegeStudentInterests(studentId);
CREATE INDEX idx_collegeEnquiries_collegeId ON CollegeEnquiries(collegeId);
CREATE INDEX idx_collegeAdmins_collegeId ON CollegeAdmins(collegeId);
