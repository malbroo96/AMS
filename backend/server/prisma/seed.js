const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@admission.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super admin already exists');
    return;
  }

  const password = await bcrypt.hash('SuperAdmin@123', 12);
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      phone: '9999999999',
      password,
      role: 'super_admin',
    },
  });

  const schools = [
    {
      schoolName: 'Knowledge Lavenir Academy',
      city: 'Paris',
      address: '12 Rue de la République',
      board: 'CBSE',
      description: 'Premier international school',
      courses: {
        create: [
          { courseName: 'Science Stream', fees: 50000, seats: 60 },
          { courseName: 'Commerce Stream', fees: 45000, seats: 50 },
        ],
      },
    },
    {
      schoolName: 'Lycee International',
      city: 'Lyon',
      address: '45 Avenue Victor Hugo',
      board: 'ICSE',
      description: 'Excellence in education',
      courses: {
        create: [{ courseName: 'Arts & Humanities', fees: 40000, seats: 40 }],
      },
    },
  ];

  for (const school of schools) {
    await prisma.school.create({ data: school });
  }

  console.log('Seed completed: super admin + sample schools');
  console.log('Login: superadmin@admission.com / SuperAdmin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
