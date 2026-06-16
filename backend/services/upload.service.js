const sharepointService = require('./sharepoint.service');
const ApiError = require('../utils/ApiError');

/** Handles file upload to SharePoint under AMS/{subfolder}/. */
async function processUpload(file, subfolder = 'general') {
  if (!file) {
    throw new Error('No file provided');
  }

  const buffer = file.buffer;
  if (!buffer) {
    throw new ApiError('File buffer missing — ensure multer memoryStorage is used', 500);
  }

  return sharepointService.uploadFile({
    buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    subfolder,
  });
}

module.exports = { processUpload };
