const { db } = require('./env');
const useTrustedConnection = db.options.trustedConnection === true;
const sql = useTrustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

/** MSSQL connection pool — singleton for the application lifecycle */
let pool = null;

<<<<<<< HEAD
function odbcValue(value) {
  return String(value).replace(/}/g, '}}');
}

function trustedConnectionString() {
  const server = db.instanceName ? `${db.server}\\${db.instanceName}` : db.server;
  const serverWithPort =
    db.port != null && !Number.isNaN(db.port) && !db.instanceName
      ? `${db.server},${db.port}`
      : server;

  const parts = [
    `Driver={${odbcValue(db.odbcDriver)}}`,
    `Server=${odbcValue(serverWithPort)}`,
    `Database=${odbcValue(db.database)}`,
    'Trusted_Connection=Yes',
  ];

  if (db.options.encrypt === false) parts.push('Encrypt=No');
  if (db.options.trustServerCertificate) parts.push('TrustServerCertificate=Yes');
  return `${parts.join(';')};`;
}

const poolOptions = {
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
=======
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
>>>>>>> 5476f9ce4516e86be9df4646010d1ed05be7365f
};

const dbConfig = useTrustedConnection
  ? {
      connectionString: trustedConnectionString(),
      driver: 'msnodesqlv8',
      pool: poolOptions,
    }
  : {
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

      pool: poolOptions,
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
