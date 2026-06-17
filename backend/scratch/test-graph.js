require('dotenv').config();
const { getGraphClient, isSharePointConfigured } = require('../config/sharepoint');

async function test() {
  console.log('Is SharePoint configured?', isSharePointConfigured());
  try {
    const client = getGraphClient();
    console.log('Graph client initialized successfully');
    
    // Attempt a simple call
    console.log('Fetching site details...');
    const site = await client.api('/sites/root').get();
    console.log('Root site displayName:', site.displayName);
  } catch (error) {
    console.error('Test failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error status code:', error.statusCode);
    console.error('Error code:', error.code);
    console.error('Error body:', error.body);
    console.error('Error stack:', error.stack);
  }
}

test();
