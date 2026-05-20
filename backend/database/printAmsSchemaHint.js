console.log(`
AMS SQL setup:
1. In SSMS, open backend/database/ams-schema.sql and execute it against your AMS database.
2. Insert an admin user (role admin) — use SQL or register via API if you add a bootstrap.
3. Set in .env: USE_AMS_SQL=true, USE_LOCAL_AUTH=false, DB_SERVER, DB_NAME=AMS, DB_USER, DB_PASSWORD.
`);
