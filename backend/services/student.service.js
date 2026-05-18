const ApiError = require('../utils/ApiError');
const { mapUser, mapStudent } = require('../utils/mappers');
const UserModel = require('../models/User.model');
const StudentModel = require('../models/Student.model');

const studentService = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError('User not found', 404);
    const student = await StudentModel.findByUserId(userId);
    if (!student) throw new ApiError('Student profile not found', 404);
    return {
      ...mapUser(user),
      student: {
        ...mapStudent(student),
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      },
    };
  },

  async updateProfile(userId, data) {
    if (data.name || data.phone) {
      await UserModel.update(userId, { name: data.name, phone: data.phone });
    }
    await StudentModel.update(userId, {
      dob: data.dob,
      gender: data.gender,
      parentName: data.parentName,
      address: data.address,
      grade: data.grade,
      board: data.board,
      percentage: data.percentage,
      profileImage: data.profileImage,
    });
    return studentService.getProfile(userId);
  },
};

module.exports = studentService;
