const { v4: uuidv4 } = require('uuid');
const LocalDb = require('./LocalDb');

const LocalUserModel = {
  async findByEmail(email) {
    const db = await LocalDb.read();
    return db.users.find((user) => user.email === email) || null;
  },

  async findById(id) {
    const db = await LocalDb.read();
    return db.users.find((user) => user.id === id) || null;
  },

  async create({ name, email, password, role, phone, isApproved = true }) {
    const db = await LocalDb.read();
    const user = {
      id: uuidv4(),
      name,
      email,
      password,
      role,
      phone: phone || null,
      is_approved: isApproved ? 1 : 0,
      created_at: new Date().toISOString(),
    };

    db.users.push(user);
    LocalDb.addActivity(db, `${role} account created for ${email}`);
    await LocalDb.write(db);
    return user;
  },

  async update(id, fields) {
    const db = await LocalDb.read();
    const index = db.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    if (fields.name !== undefined) db.users[index].name = fields.name;
    if (fields.phone !== undefined) db.users[index].phone = fields.phone;
    if (fields.isApproved !== undefined) db.users[index].is_approved = fields.isApproved ? 1 : 0;

    await LocalDb.write(db);
    return db.users[index];
  },

  async delete(id) {
    const db = await LocalDb.read();
    db.users = db.users.filter((user) => user.id !== id);
    db.students = db.students.filter((student) => student.userId !== id);
    db.colleges = db.colleges.filter((college) => college.userId !== id);
    await LocalDb.write(db);
  },

  async countByRole(role) {
    const db = await LocalDb.read();
    return db.users.filter((user) => user.role === role).length;
  },

  async listSchoolAdmins({ search, page = 1, limit = 10 }) {
    const db = await LocalDb.read();
    const filtered = db.users.filter((user) => {
      if (user.role !== 'college') return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    });
    const start = (page - 1) * limit;
    return { rows: filtered.slice(start, start + limit), total: filtered.length };
  },
};

module.exports = LocalUserModel;
