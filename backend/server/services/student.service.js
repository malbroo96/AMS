const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const getStudentProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });
  if (!user || !user.student) {
    throw new AppError('Student profile not found', 404);
  }
  const { password, ...safe } = user;
  return safe;
};

const updateStudentProfile = async (userId, data) => {
  const { name, phone, dob, gender, address, parentName, grade, board, percentage } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });

  if (!user?.student) {
    throw new AppError('Student profile not found', 404);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
    },
  });

  await prisma.student.update({
    where: { id: user.student.id },
    data: {
      ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
      ...(gender !== undefined && { gender }),
      ...(address !== undefined && { address }),
      ...(parentName !== undefined && { parentName }),
      ...(grade !== undefined && { grade }),
      ...(board !== undefined && { board }),
      ...(percentage !== undefined && { percentage }),
    },
  });

  return getStudentProfile(userId);
};

module.exports = { getStudentProfile, updateStudentProfile };
