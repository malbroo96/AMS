require('dotenv').config();
const collegeAssetService = require('../services/collegeAsset.service');
const { getPool, closePool } = require('../config/database');

async function run() {
  try {
    console.log('Connecting to database...');
    await getPool();
    console.log('Connected.');

    // Mock user and file (using 1x1 transparent PNG base64)
    const mockUser = { id: 1, role: 'admin' };
    const mockFile = {
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'),
      originalname: 'logo.png',
      mimetype: 'image/png',
      size: 68,
    };

    console.log('Running collegeAssetService.uploadAsset...');
    const result = await collegeAssetService.uploadAsset({
      user: mockUser,
      collegeId: 1,
      file: mockFile,
      assetType: 'logo',
    });

    console.log('Upload success! Result:', result);
  } catch (error) {
    console.error('Upload failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error status code:', error.statusCode);
    console.error('Error stack:', error.stack);
  } finally {
    await closePool();
  }
}

run();
