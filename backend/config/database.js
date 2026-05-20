const sql = require('mssql');
const { db } = require('./env');

/** MSSQL connection pool — singleton for the application lifecycle */
let pool = null;

const dbHost = {
  server: db.server,
  instanceName: db.instanceName,
};

const dbConfig = {
  server: dbHost.server,
  database: db.database,
  user: db.user,
  password: db.password,
  options: {
    instanceName: dbHost.instanceName,
    trustServerCertificate: db.options.trustServerCertificate,
    encrypt: db.options.encrypt,
    enableArithAbort: true,
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};

if (db.port) {
  dbConfig.port = db.port;
}

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
    console.log('DB Host:', dbHost);
    await getPool();
    console.log('AMS Database Connected');
  } catch (err) {
    console.error('Failed to connect to DB:', err.message || err);
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
