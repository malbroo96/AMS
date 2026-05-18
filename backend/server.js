const app = require('./app');
const { port } = require('./config/env');
const { getPool, closePool } = require('./config/database');

async function start() {
  try {
    await getPool();
    console.log('MSSQL connected successfully');

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
