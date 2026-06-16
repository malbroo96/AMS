require('dotenv').config();
const { getGraphClient } = require('../config/sharepoint');

async function run() {
  const client = getGraphClient();
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  console.log('Testing with Drive ID:', driveId);

  try {
    console.log('--- 1. GET /drives/{driveId} ---');
    const drive = await client.api(`/drives/${driveId}`).get();
    console.log('Drive info:', { id: drive.id, name: drive.name, driveType: drive.driveType });

    console.log('--- 2. GET /drives/{driveId}/root ---');
    const root = await client.api(`/drives/${driveId}/root`).get();
    console.log('Root folder info:', { id: root.id, name: root.name });

    console.log('--- 3. GET /drives/{driveId}/root/children ---');
    const children = await client.api(`/drives/${driveId}/root/children`).get();
    console.log('Root children count:', children.value?.length);
    console.log('Root children names:', children.value?.map(c => c.name));

    console.log('--- 4. GET /drives/{driveId}/root:/EADMIT PORTAL: (with colon) ---');
    try {
      const folderWithColon = await client.api(`/drives/${driveId}/root:/EADMIT PORTAL:`).get();
      console.log('EADMIT PORTAL (with colon) info:', { id: folderWithColon.id, name: folderWithColon.name });
    } catch (e) {
      console.log('EADMIT PORTAL (with colon) failed:', e.statusCode, e.code, e.message);
    }

    console.log('--- 5. GET /drives/{driveId}/root:/EADMIT PORTAL (no colon) ---');
    try {
      const folderNoColon = await client.api(`/drives/${driveId}/root:/EADMIT PORTAL`).get();
      console.log('EADMIT PORTAL (no colon) info:', { id: folderNoColon.id, name: folderNoColon.name });
    } catch (e) {
      console.log('EADMIT PORTAL (no colon) failed:', e.statusCode, e.code, e.message);
    }
  } catch (error) {
    console.error('Fatal error during test:', error);
  }
}

run();
