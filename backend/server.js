const app = require('./app');
const { port, db } = require('./config/env');
const { getPool, closePool } = require('./config/database');

async function start() {
  try {
    if (!db.options.trustedConnection && !db.password) {
      console.error('DB_PASSWORD is required. Copy backend/.env.example to backend/.env and configure MSSQL.');
      process.exit(1);
    }
    await getPool();
    console.log(`AMS MSSQL mode - database "${db.database}" on ${db.server}`);
    console.log('All users, students, and colleges are stored in SQL Server.');

    const { validateSharePointConfig } = require('./config/sharepoint');
    console.log('SharePoint configuration status:', validateSharePointConfig());

    app.listen(port, () => {
      console.log(`E-Admin API running on http://localhost:${port}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

start();
