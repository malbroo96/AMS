require('dotenv').config();

/** Parse Prisma-style DATABASE_URL into DB_* fields when individual vars are missing */
function parseDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return {};
  try {
    const normalized = url.replace('sqlserver://', 'http://');
    const parsed = new URL(normalized);
    return {
      server: parsed.hostname || undefined,
      port: parsed.port ? parseInt(parsed.port, 10) : undefined,
      database: parsed.searchParams.get('database') || undefined,
      user: parsed.username || undefined,
      password: parsed.password || undefined,
    };
  } catch {
    return {};
  }
}

const fromUrl = parseDatabaseUrl();
const dbTrustedConnection = process.env.DB_TRUSTED_CONNECTION === 'true';
const dbDriver = process.env.DB_DRIVER || (dbTrustedConnection ? 'msnodesqlv8' : undefined);
const dbUser = dbTrustedConnection ? undefined : process.env.DB_USER || fromUrl.user || 'sa';
const dbPassword = dbTrustedConnection ? undefined : process.env.DB_PASSWORD || fromUrl.password || '';

/** Split ERPSERVER\SQLEXPRESS into host + instanceName for the mssql driver */
function parseDbServer() {
  const raw = (process.env.DB_SERVER || fromUrl.server || 'localhost').trim();
  const explicitInstance = process.env.DB_INSTANCE?.trim();
  if (explicitInstance) {
    return { raw, server: raw, instanceName: explicitInstance };
  }
  const sep = raw.includes('\\') ? '\\' : raw.includes('/') ? '/' : null;
  if (sep) {
    const idx = raw.indexOf(sep);
    return { raw, server: raw.slice(0, idx), instanceName: raw.slice(idx + 1) };
  }
  return { raw, server: raw, instanceName: null };
}

const dbHost = parseDbServer();
/** JSON file storage only when USE_LOCAL_AUTH=true (dev fallback). Default: MSSQL AMS. */
const localAuth = false;
/** AMS portal + auth via dbo.Users, Colleges, Students, … */
const useAmsSql = true;

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  localAuth,
  useAmsSql,

  db: {
    rawServer: dbHost.raw,
    server: dbHost.server,
    instanceName: dbHost.instanceName,
    port: parseInt(process.env.DB_PORT, 10) || fromUrl.port || (dbHost.instanceName ? undefined : 1433),
    database: process.env.DB_NAME || fromUrl.database || 'AMS',
    driver: dbDriver,
    user: dbUser,
    password: dbPassword,
    odbcDriver: process.env.DB_ODBC_DRIVER || 'SQL Server',
    trustedConnection: dbTrustedConnection,
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      trustedConnection: dbTrustedConnection,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'eadmin_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  },

  sharepoint: {
    tenantId: process.env.SHAREPOINT_TENANT_ID || process.env.TENANT_ID,
    clientId: process.env.SHAREPOINT_CLIENT_ID || process.env.CLIENT_ID,
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET || process.env.CLIENT_SECRET,
    siteId: process.env.SHAREPOINT_SITE_ID || process.env.SITE_ID,
    driveId: process.env.SHAREPOINT_DRIVE_ID || process.env.DRIVE_ID,
    folder: process.env.SHAREPOINT_FOLDER || process.env.SHAREPOINT_ROOT_FOLDER || 'CollegeAssets',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
};
