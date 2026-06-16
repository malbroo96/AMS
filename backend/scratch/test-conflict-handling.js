require('dotenv').config();
const { getGraphClient } = require('../config/sharepoint');

async function test() {
  const client = getGraphClient();
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const parentApi = `/drives/${driveId}/root/children`;

  const requestBody = {
    name: 'EADMIT PORTAL',
    folder: {},
    '@microsoft.graph.conflictBehavior': 'fail'
  };

  try {
    console.log('Sending POST request to create EADMIT PORTAL (which already exists)...');
    await client.api(parentApi).post(requestBody);
    console.log('Unexpected success!');
  } catch (error) {
    console.log('Caught expected conflict error:');
    console.log('  Status Code:', error.statusCode);
    console.log('  Code:', error.code);
    console.log('  Message:', error.message);
  }
}

test();
