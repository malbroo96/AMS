require('dotenv').config();
const amsSqlService = require('../services/amsSql.service');
const { getPool, closePool } = require('../config/database');

async function test() {
  const pool = await getPool();
  const collegeUsers = await pool.request().query(`
    SELECT UserID, CollegeID, CollegeName FROM dbo.Colleges
  `);
  
  for (const row of collegeUsers.recordset) {
    const user = { id: row.UserID };
    console.log(`\nFetching profile for College: ${row.CollegeName} (CollegeID: ${row.CollegeID}, UserID: ${row.UserID})`);
    try {
      const profile = await amsSqlService.getCollegeProfile(user);
      console.log('  Profile collegeId:', profile.collegeId);
      console.log('  Profile id:', profile.id);
      console.log('  Profile collegeName:', profile.collegeName);
      console.log('  Profile logoUrl:', profile.logoUrl);
      console.log('  Profile bannerUrl:', profile.bannerUrl);
      console.log('  Profile coverBannerUrl:', profile.coverBannerUrl);
      console.log('  Profile prospectusUrl:', profile.prospectusUrl);
    } catch (e) {
      console.error('  Failed to fetch profile:', e.message);
    }
  }
  
  await closePool();
}
test();
