require('dotenv').config();
const bcrypt = require('bcrypt');
const { getPool, closePool } = require('../config/database');
const UserModel = require('../models/User.model');
const SchoolModel = require('../models/School.model');
const CourseModel = require('../models/Course.model');

async function seed() {
  await getPool();

  const email = 'superadmin@admission.com';
  let admin = await UserModel.findByEmail(email);
  if (!admin) {
    admin = await UserModel.create({
      name: 'Super Admin',
      email,
      phone: '9999999999',
      password: await bcrypt.hash('SuperAdmin@123', 12),
      role: 'super_admin',
      isApproved: true,
    });
    console.log('Super admin created:', email, '/ SuperAdmin@123');
  }

  const schools = await SchoolModel.list({ limit: 1 });
  if (schools.total === 0) {
    const s1 = await SchoolModel.create({
      schoolName: "Knowledge L'avenir Academy",
      city: 'Paris',
      address: '12 Rue de la République',
      board: 'CBSE',
      description: 'Premier international school',
      createdBy: admin.id,
    });
    await CourseModel.create({ schoolId: s1.id, courseName: 'Science Stream', fees: 50000, seats: 60 });
    await CourseModel.create({ schoolId: s1.id, courseName: 'Commerce Stream', fees: 45000, seats: 50 });

    const s2 = await SchoolModel.create({
      schoolName: 'Lycee International',
      city: 'Lyon',
      address: '45 Avenue Victor Hugo',
      board: 'ICSE',
      description: 'Excellence in education',
      createdBy: admin.id,
    });
    await CourseModel.create({ schoolId: s2.id, courseName: 'Arts & Humanities', fees: 40000, seats: 40 });
    console.log('Sample schools and courses seeded.');
  }

  await closePool();
  console.log('Seed completed.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
