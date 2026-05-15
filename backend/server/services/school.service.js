const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const listSchools = async ({ search, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { schoolName: { contains: search } },
          { city: { contains: search } },
          { board: { contains: search } },
        ],
      }
    : {};

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where,
      skip,
      take: limit,
      include: { courses: true, admin: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.school.count({ where }),
  ]);

  return { schools, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getSchoolById = async (id) => {
  const school = await prisma.school.findUnique({
    where: { id },
    include: { courses: true, admin: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!school) throw new AppError('School not found', 404);
  return school;
};

const createSchool = async (data) => {
  return prisma.school.create({
    data,
    include: { courses: true },
  });
};

const updateSchool = async (id, data) => {
  await getSchoolById(id);
  return prisma.school.update({
    where: { id },
    data,
    include: { courses: true, admin: { select: { id: true, name: true, email: true } } },
  });
};

const deleteSchool = async (id) => {
  await getSchoolById(id);
  await prisma.school.delete({ where: { id } });
  return { message: 'School deleted successfully' };
};

const addCourse = async (schoolId, data) => {
  await getSchoolById(schoolId);
  return prisma.course.create({
    data: { ...data, schoolId },
  });
};

const getCoursesBySchool = async (schoolId) => {
  await getSchoolById(schoolId);
  return prisma.course.findMany({ where: { schoolId } });
};

module.exports = {
  listSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  addCourse,
  getCoursesBySchool,
};
