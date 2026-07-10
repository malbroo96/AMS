/**
 * Executes migration_alter_schema.sql against MSSQL.
 * Splits on GO batches for SQL Server compatibility.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../config/database');

async function run() {
  const migrationFile =
  process.argv[2] || 'migration_alter_schema.sql';

const sqlPath = path.join(__dirname, migrationFile);
  const script = fs.readFileSync(sqlPath, 'utf8');
  const batches = script.split(/^\s*GO\s*$/gim).filter((b) => b.trim());

  console.log('Connecting to MSSQL database and applying migration...');
  const pool = await getPool();
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i].trim();
    if (batch) {
      // Clean comments and logs for simpler output
      const preview = batch.split('\n').find(line => line.trim() && !line.trim().startsWith('--')) || 'BATCH';
      console.log(`Executing batch ${i + 1}/${batches.length}: ${preview.substring(0, 60)}...`);
      await pool.request().query(batch);
    }
  }
  
  console.log('Database migration completed successfully.');
  await closePool();
}

run().catch((err) => {
  console.error('Migration execution failed:', err.message);
  process.exit(1);
});
