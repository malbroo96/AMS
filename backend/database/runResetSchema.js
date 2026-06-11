require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../config/database');

async function run() {
  const sqlPath = path.join(__dirname, 'reset_and_init.sql');
  const script = fs.readFileSync(sqlPath, 'utf8');
  const batches = script.split(/^\s*GO\s*$/gim).filter((b) => b.trim());

  console.log('Resetting database and applying final schema...');
  const pool = await getPool();
  for (const batch of batches) {
    if (batch.trim()) {
      await pool.request().query(batch);
    }
  }
  console.log('Database finalized schema applied successfully.');
  await closePool();
}

run().catch((err) => {
  console.error('Schema reset error:', err.message);
  process.exit(1);
});
