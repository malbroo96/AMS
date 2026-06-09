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
