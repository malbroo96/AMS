const { getPool } = require('../config/database');

async function main() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT @@VERSION AS version');
    console.log(result.recordset[0].version);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
