const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');

const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

const register = async ({ name, email, phone, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role,
      ...(role === 'student' && {
        student: { create: {} },
      }),
    },
    include: { student: true, school: true },
  });

  const token = signToken({ id: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { student: true, school: true },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ id: user.id, role: user.role });
  return { user: sanitizeUser(user), token };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true, school: true },
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sanitizeUser(user);
};

module.exports = { register, login, getProfile };
