const { db } = require('./env');
const useTrustedConnection = db.trustedConnection === true;
const sql = useTrustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

/** MSSQL connection pool - singleton for the application lifecycle */
let pool = null;
const dbConfig = {
  server: db.server,
  database: db.database,
  connectionTimeout: 15000,
  requestTimeout: 30000,
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

  try {
    console.log('Attempting MSSQL connection to:', dbConfig.server);
    pool = await Promise.race([
      sql.connect(dbConfig),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
      )
    ]);

    pool.on('error', (err) => {
      console.error('MSSQL pool error:', err.message);
    });

    console.log('Successfully connected to MSSQL database');
    return pool;
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    throw error;
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

module.exports = { sql, getPool, closePool };
