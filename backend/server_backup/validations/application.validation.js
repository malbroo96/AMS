const Joi = require('joi');

const createApplicationSchema = Joi.object({
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
  }),
  documents: Joi.array()
    .items(
      Joi.object({
        documentType: Joi.string().required(),
        fileUrl: Joi.string().required(),
      })
    )
    .optional(),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'approved', 'rejected').required(),
  remarks: Joi.string().allow('', null),
});

module.exports = { createApplicationSchema, statusSchema };
