const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { registerSchema, loginSchema, validate } = require('../validations/auth.validation');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
