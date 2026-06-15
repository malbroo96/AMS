const Joi = require('joi');

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

module.exports = { profileSchema };
