const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'ams-local-db.json');
const ADMIN_EMAIL = 'admin@23';
const ADMIN_PASSWORD = 'tagme!23';

const emptyDb = () => ({
  users: [],
  students: [],
  colleges: [],
  interests: [],
  activities: [],
});

async function ensureAdmin(db) {
  if (db.users.some((user) => user.email === ADMIN_EMAIL)) return db;

  const now = new Date().toISOString();
  db.users.push({
    id: uuidv4(),
    name: 'System Admin',
    email: ADMIN_EMAIL,
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'admin',
    phone: null,
    is_approved: 1,
    created_at: now,
  });
  db.activities.unshift({
    id: uuidv4(),
    message: 'Admin account seeded',
    createdAt: now,
  });
  return db;
}

async function read() {
  let db;
  try {
    db = JSON.parse(await fs.readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    db = emptyDb();
  }

  db = { ...emptyDb(), ...db };
  await ensureAdmin(db);
  await write(db);
  return db;
}

async function write(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(db, null, 2));
}

function addActivity(db, message) {
  db.activities.unshift({
    id: uuidv4(),
    message,
    createdAt: new Date().toISOString(),
  });
  db.activities = db.activities.slice(0, 20);
}

module.exports = {
  addActivity,
  read,
  write,
};
