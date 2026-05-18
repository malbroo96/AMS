const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const LocalDb = require('../models/LocalDb');
const UserModel = require('../models/userStore');

const visibleCollege = (college) => ({
  id: college.id,
  collegeName: college.collegeName,
  email: college.email,
  status: college.status,
  createdByAdmin: college.createdByAdmin,
});

const publicStudent = (student, interest) => ({
  studentId: student.id,
  status: interest.approvedByAdmin ? 'Approved' : 'Interested',
  interestedAt: interest.createdAt,
});

const fullStudent = (student, interest) => ({
  ...publicStudent(student, interest),
  name: student.name,
  address: student.address,
  mobile: student.mobile,
  email: student.email,
  gender: student.gender,
  dateOfBirth: student.dateOfBirth,
  education: student.education,
  fullProfile: student,
});

function requireLocal() {
  return null;
}

const amsService = {
  async listColleges(query = {}) {
    requireLocal();
    const db = await LocalDb.read();
    const search = query.search?.toLowerCase() || '';
    const status = query.status || 'approved';
    return db.colleges
      .filter((college) => (status === 'all' ? true : college.status === status))
      .filter((college) => !search || college.collegeName.toLowerCase().includes(search) || college.email.toLowerCase().includes(search))
      .map(visibleCollege);
  },

  async markInterest(user, collegeId) {
    const db = await LocalDb.read();
    const student = db.students.find((item) => item.userId === user.id);
    if (!student) throw new ApiError('Student profile not found', 404);

    const college = db.colleges.find((item) => item.id === collegeId && item.status === 'approved');
    if (!college) throw new ApiError('College not found or not approved', 404);

    const existing = db.interests.find((item) => item.studentId === student.id && item.collegeId === collegeId);
    if (existing) return this.getStudentDashboard(user);

    db.interests.push({
      id: uuidv4(),
      studentId: student.id,
      collegeId,
      status: 'Interested',
      approvedByAdmin: false,
      createdAt: new Date().toISOString(),
    });
    student.interestedCollege = college.collegeName;
    LocalDb.addActivity(db, `${student.name} marked interest in ${college.collegeName}`);
    await LocalDb.write(db);
    return this.getStudentDashboard(user);
  },

  async getStudentDashboard(user) {
    const db = await LocalDb.read();
    const student = db.students.find((item) => item.userId === user.id);
    if (!student) throw new ApiError('Student profile not found', 404);
    const interests = db.interests
      .filter((interest) => interest.studentId === student.id)
      .map((interest) => ({
        ...interest,
        college: visibleCollege(db.colleges.find((college) => college.id === interest.collegeId) || {}),
      }));

    return {
      student,
      stats: {
        registeredColleges: db.colleges.filter((college) => college.status === 'approved').length,
        appliedColleges: interests.length,
        approvedAccess: interests.filter((interest) => interest.approvedByAdmin).length,
      },
      interests,
    };
  },

  async getCollegeDashboard(user) {
    const db = await LocalDb.read();
    const college = db.colleges.find((item) => item.userId === user.id);
    if (!college) throw new ApiError('College profile not found', 404);
    const interests = db.interests.filter((interest) => interest.collegeId === college.id);
    return {
      college: visibleCollege(college),
      stats: {
        interestedStudents: interests.length,
        grantedProfiles: interests.filter((interest) => interest.approvedByAdmin).length,
        hiddenProfiles: interests.filter((interest) => !interest.approvedByAdmin).length,
      },
      students: interests.map((interest) => {
        const student = db.students.find((item) => item.id === interest.studentId);
        return interest.approvedByAdmin ? fullStudent(student, interest) : publicStudent(student, interest);
      }),
    };
  },

  async adminDashboard() {
    const db = await LocalDb.read();
    return {
      totalStudents: db.students.length,
      totalColleges: db.colleges.length,
      interestedStudentsCount: db.interests.length,
      permissionRequests: db.interests.filter((interest) => !interest.approvedByAdmin).length,
      recentActivities: db.activities,
    };
  },

  async adminStudents() {
    const db = await LocalDb.read();
    return db.students.map((student) => ({
      ...student,
      interests: db.interests.filter((interest) => interest.studentId === student.id),
    }));
  },

  async adminInterests() {
    const db = await LocalDb.read();
    return db.interests.map((interest) => ({
      ...interest,
      student: db.students.find((student) => student.id === interest.studentId),
      college: db.colleges.find((college) => college.id === interest.collegeId),
    }));
  },

  async createCollege(admin, data) {
    const email = data.email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError('Email already registered', 409);

    const password = data.password || 'College@123';
    const user = await UserModel.create({
      name: data.collegeName,
      email,
      phone: data.mobile || null,
      password: await bcrypt.hash(password, 12),
      role: 'college',
      isApproved: true,
    });

    const db = await LocalDb.read();
    const college = {
      id: uuidv4(),
      userId: user.id,
      collegeName: data.collegeName,
      email,
      createdByAdmin: admin.id,
      status: data.status || 'approved',
      createdAt: new Date().toISOString(),
    };
    db.colleges.push(college);
    LocalDb.addActivity(db, `Admin created college account: ${college.collegeName}`);
    await LocalDb.write(db);
    return { college, temporaryPassword: password };
  },

  async updateCollege(id, data) {
    const db = await LocalDb.read();
    const college = db.colleges.find((item) => item.id === id);
    if (!college) throw new ApiError('College not found', 404);
    if (data.collegeName !== undefined) college.collegeName = data.collegeName;
    if (data.status !== undefined) college.status = data.status;
    LocalDb.addActivity(db, `College updated: ${college.collegeName}`);
    await LocalDb.write(db);
    return college;
  },

  async deleteCollege(id) {
    const db = await LocalDb.read();
    const college = db.colleges.find((item) => item.id === id);
    if (!college) throw new ApiError('College not found', 404);
    db.colleges = db.colleges.filter((item) => item.id !== id);
    db.interests = db.interests.filter((interest) => interest.collegeId !== id);
    db.users = db.users.filter((user) => user.id !== college.userId);
    LocalDb.addActivity(db, `College deleted: ${college.collegeName}`);
    await LocalDb.write(db);
    return { message: 'College deleted successfully' };
  },

  async setInterestPermission(id, approvedByAdmin) {
    const db = await LocalDb.read();
    const interest = db.interests.find((item) => item.id === id);
    if (!interest) throw new ApiError('Interest request not found', 404);
    interest.approvedByAdmin = !!approvedByAdmin;
    interest.status = interest.approvedByAdmin ? 'Approved' : 'Interested';
    const college = db.colleges.find((item) => item.id === interest.collegeId);
    LocalDb.addActivity(db, `${interest.approvedByAdmin ? 'Granted' : 'Revoked'} student profile access for ${college?.collegeName || 'college'}`);
    await LocalDb.write(db);
    return interest;
  },
};

module.exports = amsService;
