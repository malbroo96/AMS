const { getGraphClient, sharepointConfig } = require('../config/sharepoint');
const { getPool } = require('../config/database');

function driveApiBase() {
  return `/drives/${encodeURIComponent(sharepointConfig.driveId)}`;
}

function graphPath(rawPath) {
  return String(rawPath).split('/').filter(Boolean).map(segment => encodeURIComponent(segment)).join('/');
}

async function testFolder() {
  const client = getGraphClient();
  const folderPath = 'EADMIT PORTAL/TEST';
  const parts = String(folderPath).split('/').filter(Boolean);
  let currentPath = '';

  for (const part of parts) {
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const checkEndpoint = `${driveApiBase()}/root:/${graphPath(currentPath)}:`;

    console.log('Checking', checkEndpoint);
    try {
      await client.api(checkEndpoint).get();
      console.log('Exists:', currentPath);
    } catch (error) {
      console.log('Error checking', currentPath);
      console.log('Status code:', error.statusCode);
      console.log('Code:', error.code);
      console.log('Message:', error.message);
      
      // Attempt creation
      const parentApi = parentPath
        ? `${driveApiBase()}/root:/${graphPath(parentPath)}:/children`
        : `${driveApiBase()}/root/children`;
      
      console.log('Creating via', parentApi);
      try {
        await client.api(parentApi).post({
          name: part,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        });
        console.log('Created:', currentPath);
      } catch (createErr) {
        console.log('Error creating', currentPath);
        console.log('Create err code:', createErr.code);
      }
    }
  }
}

testFolder().catch(console.error).finally(async () => {
  const pool = await getPool();
  pool.close();
});
