const cloudinary = require('cloudinary').v2;
const { cloudinary: cloudinaryEnv } = require('./env');

/**
 * Cloudinary-ready upload module.
 * When USE_CLOUDINARY=false, callers should fall back to local disk storage.
 */
function configureCloudinary() {
  if (!cloudinaryEnv.useCloudinary) {
    return false;
  }
  if (!cloudinaryEnv.cloudName || !cloudinaryEnv.apiKey || !cloudinaryEnv.apiSecret) {
    console.warn('Cloudinary enabled but credentials missing — using local uploads.');
    return false;
  }
  cloudinary.config({
    cloud_name: cloudinaryEnv.cloudName,
    api_key: cloudinaryEnv.apiKey,
    api_secret: cloudinaryEnv.apiSecret,
    secure: true,
  });
  return true;
}

const isCloudinaryEnabled = configureCloudinary();

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder subfolder under CLOUDINARY_FOLDER
 * @param {string} resourceType 'image' | 'raw' | 'auto'
 */
async function uploadToCloudinary(buffer, folder = '', resourceType = 'auto') {
  if (!isCloudinaryEnabled) {
    throw new Error('Cloudinary is not configured');
  }
  const fullFolder = folder
    ? `${cloudinaryEnv.folder}/${folder}`
    : cloudinaryEnv.folder;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: fullFolder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryEnabled || !publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

module.exports = {
  cloudinary,
  isCloudinaryEnabled,
  uploadToCloudinary,
  deleteFromCloudinary,
};
