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

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    server: process.env.DB_SERVER || fromUrl.server || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || fromUrl.port || 1433,
    database: process.env.DB_NAME || fromUrl.database || 'admission_portal',
    user: process.env.DB_USER || fromUrl.user || 'sa',
    password: process.env.DB_PASSWORD || fromUrl.password || '',
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'eadmin_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  },

  cloudinary: {
    useCloudinary: process.env.USE_CLOUDINARY === 'true',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'eadmin-portal',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
};
