const prisma = require('../config/database');

const getDashboardAnalytics = async () => {
  const [
    totalSchools,
    totalStudents,
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    schoolAdmins,
    recentApplications,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.student.count(),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'pending' } }),
    prisma.application.count({ where: { status: 'approved' } }),
    prisma.application.count({ where: { status: 'rejected' } }),
    prisma.user.count({ where: { role: 'school_admin' } }),
    prisma.application.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        school: { select: { schoolName: true } },
        student: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  const applicationsByStatus = await prisma.application.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  return {
    totalSchools,
    totalStudents,
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    schoolAdmins,
    applicationsByStatus,
    recentApplications,
  };
};

module.exports = { getDashboardAnalytics };
