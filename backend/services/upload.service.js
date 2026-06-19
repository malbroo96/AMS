const sharepointService = require('./sharepointService');
const ApiError = require('../utils/ApiError');

/** Handles generic file upload to SharePoint under EADMIT PORTAL/{subfolder}/. */
async function processUpload(file, subfolder = 'general', user = { id: 0 }) {
  if (!file) {
    throw new Error('No file provided');
  }

  const buffer = file.buffer;
  if (!buffer) {
    throw new ApiError('File buffer missing — ensure multer memoryStorage is used', 500);
  }

  const folderPath = `EADMIT PORTAL/${subfolder.toUpperCase()}`;
  
  const uploaded = await sharepointService.uploadFile({
    buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folderPath,
    entityType: 'General',
    entityId: 0,
    uploadedBy: user.id,
  });

  return {
    url: `/api/files/${uploaded.fileId}`,
    publicId: uploaded.fileId,
    storage: 'sharepoint'
  };
}

module.exports = { processUpload };
