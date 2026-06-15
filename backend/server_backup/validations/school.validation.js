const Joi = require('joi');

const schoolSchema = Joi.object({
  schoolName: Joi.string().min(2).max(200).required(),
  city: Joi.string().min(2).max(100).required(),
  address: Joi.string().allow('', null),
  board: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  adminId: Joi.string().uuid().allow(null),
});

const courseSchema = Joi.object({
  courseName: Joi.string().min(2).max(200).required(),
  fees: Joi.number().min(0).allow(null),
  seats: Joi.number().integer().min(0).allow(null),
});

const adminUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).max(128).required(),
  schoolId: Joi.string().uuid().allow(null),
});

module.exports = { schoolSchema, courseSchema, adminUserSchema };
