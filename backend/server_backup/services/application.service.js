const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const createApplication = async (userId, { schoolId, courseId, studentDetails, documents }) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  if (studentDetails) {
    await prisma.student.update({
      where: { id: student.id },
      data: studentDetails,
    });
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, schoolId },
  });
  if (!course) {
    throw new AppError('Course not found for selected school', 404);
  }

  const application = await prisma.application.create({
    data: {
      studentId: student.id,
      schoolId,
      courseId,
      status: 'pending',
      documents: documents?.length
        ? { create: documents }
        : undefined,
    },
    include: {
      school: true,
      course: true,
      documents: true,
      student: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
    },
  });

  return application;
};

const listApplications = async (user, { status, search, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  let where = {};

  if (user.role === 'student') {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw new AppError('Student profile not found', 404);
    where.studentId = student.id;
  } else if (user.role === 'school_admin') {
    const school = await prisma.school.findFirst({ where: { adminId: user.id } });
    if (!school) throw new AppError('No school assigned to this admin', 403);
    where.schoolId = school.id;
  }

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { school: { schoolName: { contains: search } } },
      { course: { courseName: { contains: search } } },
      { student: { user: { name: { contains: search } } } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: limit,
      include: {
        school: true,
        course: true,
        documents: true,
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.application.count({ where }),
  ]);

  return { applications, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getApplicationById = async (id, user) => {
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      school: true,
      course: true,
      documents: true,
      student: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
    },
  });

  if (!application) throw new AppError('Application not found', 404);

  if (user.role === 'student') {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (application.studentId !== student?.id) {
      throw new AppError('Access denied', 403);
    }
  }

  if (user.role === 'school_admin') {
    const school = await prisma.school.findFirst({ where: { adminId: user.id } });
    if (application.schoolId !== school?.id) {
      throw new AppError('Access denied', 403);
    }
  }

  return application;
};

const updateApplicationStatus = async (id, user, { status, remarks }) => {
  const application = await getApplicationById(id, user);

  if (!['school_admin', 'super_admin'].includes(user.role)) {
    throw new AppError('Access denied', 403);
  }

  return prisma.application.update({
    where: { id: application.id },
    data: { status, remarks },
    include: {
      school: true,
      course: true,
      documents: true,
      student: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
    },
  });
};

module.exports = {
  createApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
};
