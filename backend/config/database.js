const sql = require('mssql');
const { db } = require('./env');

/** MSSQL connection pool — singleton for the application lifecycle */
let pool = null;

const dbConfig = {
  server: db.server,
  port: db.port,
  database: db.database,
  user: db.user,
  password: db.password,
  options: {
    ...db.options,
    enableArithAbort: true,
    instanceName: db.instanceName,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

/**
 * Returns the shared connection pool, creating it on first call.
 */
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(dbConfig);
  pool.on('error', (err) => {
    console.error('MSSQL pool error:', err.message);
  });
  return pool;
}

async function connectDB() {
  try {
    await getPool();
    console.log('AMS DB Connected');
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Gracefully close the pool (e.g. on shutdown).
 */
async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { sql, getPool, connectDB, closePool };
