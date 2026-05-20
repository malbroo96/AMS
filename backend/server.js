const app = require('./app');
const { localAuth, port } = require('./config/env');
const { connectDB, closePool } = require('./config/database');

async function start() {
  try {
    if (localAuth) {
      console.log('Local auth mode enabled. AMS data will be saved in backend/data/ams-local-db.json');
    } else {
      await connectDB();
    }

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
