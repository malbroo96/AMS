const path = require('path');
const fs = require('fs');
const { upload: uploadConfig } = require('../config/env');
const { isCloudinaryEnabled, uploadToCloudinary } = require('../config/cloudinary');

/**
 * Handles file upload to Cloudinary (if enabled) or local disk.
 */
async function processUpload(file, subfolder = 'general') {
  if (!file) {
    throw new Error('No file provided');
  }

  if (isCloudinaryEnabled) {
    const buffer = fs.readFileSync(file.path);
    const result = await uploadToCloudinary(buffer, subfolder, 'auto');
    fs.unlinkSync(file.path);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      storage: 'cloudinary',
    };
  }

  const url = `/${uploadConfig.dir}/${file.filename}`;
  return { url, publicId: null, storage: 'local' };
}

module.exports = { processUpload };
