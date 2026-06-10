# Data directory

AMS data is stored in **MSSQL** (`AMS` database), not in JSON files.

- Run `backend/database/ams-schema.sql` in SSMS once.
- Import old JSON (if any): `npm run db:migrate-json` from `backend/`.
- After migration, `ams-local-db.json` is renamed to `ams-local-db.json.migrated.bak`.

Do not re-enable `USE_LOCAL_AUTH=true` in production.
