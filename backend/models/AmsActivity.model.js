const { sql, getPool } = require('../config/database');

/** Inserts one row into dbo.ActivityLogs (AMS SQL mode). */
async function add(message) {
  const pool = await getPool();
  const text = String(message).slice(0, 500);
  await pool.request().input('msg', sql.NVarChar(500), text).query('INSERT INTO ActivityLogs (Message) VALUES (@msg)');
}

module.exports = { add };
