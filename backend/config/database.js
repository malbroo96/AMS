const sql = require('mssql');
const { db } = require('./env');

/** MSSQL connection pool — singleton for the application lifecycle */
let pool = null;

const dbConfig = {
  server: process.env.DB_SERVER || db.server,
  port: parseInt(process.env.DB_PORT, 10) || db.port,
  database: process.env.DB_NAME || db.database,
  ...(db.trustedConnection
    ? { driver: db.driver || 'msnodesqlv8' }
    : { user: process.env.DB_USER || db.user, password: process.env.DB_PASSWORD || db.password }),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    trustedConnection: db.trustedConnection,
    ...db.options,
    ...(db.port == null && db.instanceName ? { instanceName: db.instanceName } : {}),
    enableArithAbort: true,
  },
  ...(db.port != null && !Number.isNaN(db.port) ? { port: db.port } : {}),
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
