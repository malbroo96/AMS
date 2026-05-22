const sql = require('mssql');
const { db } = require('./env');

/** MSSQL connection pool — singleton for the application lifecycle */
let pool = null;

const dbConfig = {
  server: db.server,
  database: db.database,
  user: db.user,
  password: db.password,

  options: {
    ...db.options,

    ...(db.port == null && db.instanceName
      ? { instanceName: db.instanceName }
      : {}),

    enableArithAbort: true,

    // Fix SSL/OpenSSL issue
    encrypt: false,
    trustServerCertificate: true,
  },

  ...(db.port != null && !Number.isNaN(db.port)
    ? { port: db.port }
    : {}),

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

/**
 * Gracefully close the pool (e.g. on shutdown).
 */
async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { sql, getPool, closePool };