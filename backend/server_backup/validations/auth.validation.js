const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  role: Joi.string().valid('student', 'school_admin').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    error.isJoi = true;
    return next(error);
  }
  next();
};

module.exports = { registerSchema, loginSchema, validate };
