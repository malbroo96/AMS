const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  address: Joi.string().allow('', null),
  mobile: Joi.string().min(10).max(15),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().min(10).max(15),
  gender: Joi.string().valid('male', 'female', 'other').allow('', null),
  dob: Joi.date().iso().allow(null),
  dateOfBirth: Joi.date().iso().allow(null),
  education: Joi.string().allow('', null),
  educationDetails: Joi.string().allow('', null),
  interestedCollege: Joi.string().allow('', null),
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('student').default('student'),
});

const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const schoolSchema = Joi.object({
  schoolName: Joi.string().min(2).max(200).required(),
  city: Joi.string().min(2).max(100).required(),
  address: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  email: Joi.string().email().allow('', null),
  board: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  logoUrl: Joi.string().uri().allow('', null),
  adminId: Joi.string().uuid().allow(null),
});

const courseSchema = Joi.object({
  courseName: Joi.string().min(2).max(200).required(),
  fees: Joi.number().min(0).allow(null),
  seats: Joi.number().integer().min(0).allow(null),
});

const applicationSchema = Joi.object({
  schoolId: Joi.string().uuid().required(),
  courseId: Joi.string().uuid().required(),
  studentDetails: Joi.object({
    dob: Joi.date().iso().allow(null),
    gender: Joi.string().valid('male', 'female', 'other').allow(null),
    address: Joi.string().allow('', null),
    parentName: Joi.string().allow('', null),
    grade: Joi.string().allow('', null),
    board: Joi.string().allow('', null),
    percentage: Joi.number().min(0).max(100).allow(null),
  }).optional(),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'approved', 'rejected').required(),
  remarks: Joi.string().allow('', null),
});

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().min(10).max(15),
  dob: Joi.date().iso().allow(null),
  gender: Joi.string().valid('male', 'female', 'other').allow(null),
  address: Joi.string().allow('', null),
  parentName: Joi.string().allow('', null),
  grade: Joi.string().allow('', null),
  board: Joi.string().allow('', null),
  percentage: Joi.number().min(0).max(100).allow(null),
});

const adminUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).max(128).required(),
  schoolId: Joi.string().uuid().allow(null),
});

module.exports = {
  registerSchema,
  loginSchema,
  schoolSchema,
  courseSchema,
  applicationSchema,
  statusSchema,
  profileSchema,
  adminUserSchema,
};
