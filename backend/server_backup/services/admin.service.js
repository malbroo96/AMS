const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const listSchoolAdmins = async ({ search, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {
    role: 'school_admin',
    ...(search && {
      OR: [{ name: { contains: search } }, { email: { contains: search } }],
    }),
  };

  const [admins, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        school: { select: { id: true, schoolName: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { admins, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createSchoolAdmin = async ({ name, email, phone, password, schoolId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role: 'school_admin',
    },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });

  if (schoolId) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new AppError('School not found', 404);
    await prisma.school.update({
      where: { id: schoolId },
      data: { adminId: user.id },
    });
  }

  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      school: { select: { id: true, schoolName: true, city: true } },
    },
  });
};

const deleteSchoolAdmin = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'school_admin') {
    throw new AppError('School admin not found', 404);
  }
  await prisma.school.updateMany({ where: { adminId: id }, data: { adminId: null } });
  await prisma.user.delete({ where: { id } });
  return { message: 'School admin deleted successfully' };
};

module.exports = { listSchoolAdmins, createSchoolAdmin, deleteSchoolAdmin };
