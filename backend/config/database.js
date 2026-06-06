const { db } = require('./env');
const useTrustedConnection = db.trustedConnection === true;
const sql = useTrustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

/** MSSQL connection pool - singleton for the application lifecycle */
let pool = null;
const dbConfig = {
  server: db.server,
  database: db.database,
  options: {
    enableArithAbort: true,
    encrypt: db.options.encrypt,
    trustServerCertificate: db.options.trustServerCertificate,
    ...(db.instanceName ? { instanceName: db.instanceName } : {}),
    ...(useTrustedConnection ? { trustedConnection: true } : {}),
  },

  ...(db.port != null && !Number.isNaN(db.port)
    ? { port: db.port }
    : {}),

  ...(useTrustedConnection
    ? { driver: db.odbcDriver }
    : {
        user: db.user,
        password: db.password,
      }),

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
