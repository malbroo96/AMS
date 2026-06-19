const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { getGraphClient, assertSharePointConfig, sharepointConfig } = require('../config/sharepoint');
const { sql, getPool } = require('../config/database');

const quality = 80;

function driveApiBase() {
  return `/drives/${encodeURIComponent(sharepointConfig.driveId)}`;
}

function graphPath(rawPath) {
  return String(rawPath).split('/').filter(Boolean).map(segment => encodeURIComponent(segment)).join('/');
}

function getConfiguredRootFolder() {
  return String(sharepointConfig.folder || 'CollegeAssets').replace(/^\/+|\/+$/g, '');
}

async function ensureFolderExists(client, folderPath) {
  const parts = String(folderPath).split('/').filter(Boolean);
  let currentPath = '';

  for (const part of parts) {
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const checkEndpoint = `${driveApiBase()}/root:/${graphPath(currentPath)}:`;

    try {
      await client.api(checkEndpoint).get();
    } catch (error) {
      if (error?.statusCode === 404 || error?.code === 'itemNotFound') {
        const parentApi = parentPath
          ? `${driveApiBase()}/root:/${graphPath(parentPath)}:/children`
          : `${driveApiBase()}/root/children`;
        
        try {
          await client.api(parentApi).post({
            name: part,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail',
          });
        } catch (createErr) {
          if (createErr?.statusCode !== 409 && createErr?.code !== 'nameAlreadyExists') {
            throw createErr;
          }
        }
      } else {
        throw error;
      }
    }
  }
}

async function uploadFile({ buffer, originalName, mimeType, folderPath, entityType, entityId, uploadedBy }) {
  assertSharePointConfig();
  const client = getGraphClient();
  
  let finalBuffer = buffer;
  // Compress if image
  if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      let transformer = sharp(buffer, { failOn: 'warning' }).rotate();
      if (mimeType === 'image/png') {
        transformer = transformer.png({ quality, compressionLevel: 9, adaptiveFiltering: true });
      } else if (mimeType === 'image/webp') {
        transformer = transformer.webp({ quality });
      } else {
        transformer = transformer.jpeg({ quality, mozjpeg: true });
        mimeType = 'image/jpeg';
        originalName = originalName.replace(/\.png|\.webp/i, '.jpg');
      }
      finalBuffer = await transformer.toBuffer();
  }

  // Ensure folder exists
  await ensureFolderExists(client, folderPath);
  
  const safeName = `${crypto.randomUUID().slice(0,8)}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const uploadPath = `${folderPath}/${safeName}`;
  const endpoint = `${driveApiBase()}/root:/${graphPath(uploadPath)}:/content`;

  const uploaded = await client.api(endpoint).header('Content-Type', mimeType).put(finalBuffer);

  // SQL Storage
  const fileId = crypto.randomUUID();
  const pool = await getPool();
  
  await pool.request()
    .input('fileId', sql.NVarChar(255), fileId)
    .input('driveId', sql.NVarChar(255), sharepointConfig.driveId)
    .input('siteId', sql.NVarChar(255), sharepointConfig.siteId)
    .input('folderPath', sql.NVarChar(500), folderPath)
    .input('fileName', sql.NVarChar(255), safeName)
    .input('mimeType', sql.NVarChar(100), mimeType)
    .input('size', sql.BigInt, uploaded.size)
    .input('entityType', sql.NVarChar(50), entityType)
    .input('entityId', sql.Int, entityId)
    .input('uploadedBy', sql.Int, uploadedBy)
    .query(`
      INSERT INTO dbo.FileMetadata (fileId, driveId, siteId, folderPath, fileName, mimeType, size, entityType, entityId, uploadedBy)
      VALUES (@fileId, @driveId, @siteId, @folderPath, @fileName, @mimeType, @size, @entityType, @entityId, @uploadedBy)
    `);

  return {
    fileId,
    fileName: safeName,
    driveId: sharepointConfig.driveId,
    siteId: sharepointConfig.siteId,
    folderPath,
    webUrl: uploaded.webUrl,
    mimeType,
    size: uploaded.size
  };
}

async function getFileMetadata(fileId) {
  const pool = await getPool();
  const res = await pool.request()
    .input('fileId', sql.NVarChar(255), fileId)
    .query('SELECT * FROM dbo.FileMetadata WHERE fileId = @fileId');
  if (!res.recordset[0]) throw new ApiError('File not found', 404);
  return res.recordset[0];
}

async function getFileStream(fileId) {
  const meta = await getFileMetadata(fileId);
  assertSharePointConfig();
  const client = getGraphClient();
  
  const itemPath = `${meta.folderPath}/${meta.fileName}`;
  const endpoint = `${driveApiBase()}/root:/${graphPath(itemPath)}:/content`;
  
  try {
    const stream = await client.api(endpoint).responseType('stream').get();
    return { stream, meta };
  } catch (error) {
    throw new ApiError('Failed to fetch file from SharePoint', 500);
  }
}

async function deleteFile(fileId) {
  const meta = await getFileMetadata(fileId);
  assertSharePointConfig();
  const client = getGraphClient();
  
  const itemPath = `${meta.folderPath}/${meta.fileName}`;
  const endpoint = `${driveApiBase()}/root:/${graphPath(itemPath)}:`;
  
  try {
    await client.api(endpoint).delete();
  } catch (error) {
    if (error?.statusCode !== 404 && error?.code !== 'itemNotFound') {
      throw error;
    }
  }

  const pool = await getPool();
  await pool.request()
    .input('fileId', sql.NVarChar(255), fileId)
    .query('DELETE FROM dbo.FileMetadata WHERE fileId = @fileId');
    
  return { success: true };
}

module.exports = {
  uploadFile,
  getFileMetadata,
  getFileStream,
  deleteFile,
  getConfiguredRootFolder
};
