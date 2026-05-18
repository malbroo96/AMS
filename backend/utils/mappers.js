/** Map MSSQL snake_case rows to API camelCase for frontend compatibility */

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isApproved: !!row.is_approved,
    createdAt: row.created_at,
  };
};

const mapSchool = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    schoolName: row.school_name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    description: row.description,
    logoUrl: row.logo_url,
    board: row.board,
    adminId: row.admin_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
};

const mapStudent = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    dob: row.dob,
    gender: row.gender,
    parentName: row.parent_name,
    address: row.address,
    grade: row.grade,
    board: row.board,
    percentage: row.percentage,
    profileImage: row.profile_image,
  };
};

const mapCourse = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    schoolId: row.school_id,
    courseName: row.course_name,
    fees: row.fees,
    seats: row.seats,
    createdAt: row.created_at,
  };
};

const mapApplication = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    schoolId: row.school_id,
    courseId: row.course_id,
    status: row.status,
    remarks: row.remarks,
    submittedAt: row.applied_date,
    appliedDate: row.applied_date,
  };
};

const mapNotification = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
};

module.exports = { mapUser, mapSchool, mapStudent, mapCourse, mapApplication, mapNotification };
