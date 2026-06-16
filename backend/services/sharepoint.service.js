const path = require('path');
require('isomorphic-fetch');
const ApiError = require('../utils/ApiError');
const { getGraphClient, isSharePointConfigured, sharepointConfig, assertSharePointConfig } = require('../config/sharepoint');

function handleGraphError(error, contextMessage, details = {}) {
  if (error instanceof ApiError || error.isOperational) {
    throw error;
  }

  const endpoint = details.endpoint || 'Unknown';
  const requestBody = details.requestBody ? JSON.stringify(details.requestBody) : 'None';
  const driveId = sharepointConfig.driveId;
  const parentPath = details.parentPath || 'None';
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'UnknownCode';
  const message = error.message || 'Unknown Microsoft Graph error';

  console.error(`[DEBUG] [Graph] Error during ${contextMessage}:`, {
    endpoint,
    requestBody,
    driveId,
    parentPath,
    statusCode,
    errorCode,
    message,
    body: error.body,
  });

  let status = typeof statusCode === 'number' && statusCode > 0 ? statusCode : 500;
  if (
    message.includes('MSAL') ||
    message.includes('authentication') ||
    message.includes('Authentication') ||
    message.includes('token') ||
    message.includes('Token')
  ) {
    status = 401;
  }

  const detailMsg = error.body ? ` Details: ${error.body}` : '';
  throw new ApiError(
    `SharePoint / Microsoft Graph Error (${contextMessage}) [Endpoint: ${endpoint}, Code: ${errorCode}, Status: ${status}]: ${message}${detailMsg}`,
    status
  );
}

/** Microsoft Graph simple upload limit */
const SIMPLE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
/** Must be a multiple of 320 KiB (327680) */
const UPLOAD_SESSION_CHUNK_SIZE = 5 * 1024 * 1024;

function graphPath(rawPath) {
  return String(rawPath)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function driveApiBase() {
  return `/drives/${encodeURIComponent(sharepointConfig.driveId)}`;
}

function isGraphNotFound(error) {
  return error?.statusCode === 404 || error?.code === 'itemNotFound';
}

function buildFilename(originalName) {
  const base = path.basename(originalName || 'file');
  const sanitized = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitized || 'file'}`;
}

async function getItemByPath(client, itemPath) {
  return client.api(`${driveApiBase()}/root:/${graphPath(itemPath)}:`).get();
}

async function createFolder(client, parentPath, folderName) {
  const parentApi = parentPath
    ? `${driveApiBase()}/root:/${graphPath(parentPath)}:/children`
    : `${driveApiBase()}/root/children`;

  return client.api(parentApi).post({
    name: folderName,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'fail',
  });
}

async function ensureFolder(client, itemPath) {
  try {
    return await getItemByPath(client, itemPath);
  } catch (error) {
    if (!isGraphNotFound(error)) throw error;
  }

  const parts = String(itemPath).split('/').filter(Boolean);
  const folderName = parts.pop();
  const parentPath = parts.join('/');

  if (parentPath) {
    await ensureFolder(client, parentPath);
  }

  try {
    return await createFolder(client, parentPath, folderName);
  } catch (error) {
    if (error?.statusCode === 409) {
      return getItemByPath(client, itemPath);
    }
    throw error;
  }
}

async function simpleUpload(client, uploadPath, buffer, mimeType) {
  return client
    .api(`${driveApiBase()}/root:/${graphPath(uploadPath)}:/content`)
    .header('Content-Type', mimeType || 'application/octet-stream')
    .put(buffer);
}

async function sessionUpload(uploadPath, buffer, mimeType) {
  const client = getGraphClient();
  const filename = path.basename(uploadPath);

  const session = await client
    .api(`${driveApiBase()}/root:/${graphPath(uploadPath)}:/createUploadSession`)
    .post({
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
        name: filename,
      },
    });

  const uploadUrl = session.uploadUrl;
  if (!uploadUrl) {
    throw new ApiError('SharePoint did not return an upload session URL', 500);
  }

  const fileSize = buffer.length;
  let offset = 0;
  let driveItem = null;

  while (offset < fileSize) {
    const chunkSize = Math.min(UPLOAD_SESSION_CHUNK_SIZE, fileSize - offset);
    const chunk = buffer.subarray(offset, offset + chunkSize);
    const end = offset + chunkSize - 1;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunkSize),
        'Content-Range': `bytes ${offset}-${end}/${fileSize}`,
        ...(mimeType ? { 'Content-Type': mimeType } : {}),
      },
      body: chunk,
    });

    if (response.status === 200 || response.status === 201) {
      driveItem = await response.json();
      break;
    }

    if (response.status !== 202) {
      const detail = await response.text().catch(() => '');
      throw new ApiError(`SharePoint upload session failed (${response.status}): ${detail}`, 500);
    }

    offset += chunkSize;
  }

  if (!driveItem) {
    throw new ApiError('SharePoint upload session completed without a drive item response', 500);
  }

  return driveItem;
}

/**
 * Upload a file buffer to SharePoint under AMS/{subfolder}/.
 * Uses simple upload for files <= 4 MB and upload sessions for larger files.
 */
async function uploadFile({ buffer, originalName, mimeType, subfolder = 'general' }) {
  console.log(`[DEBUG] [SharePoint] Upload request received: originalName=${originalName}, mimeType=${mimeType}, size=${buffer?.length} bytes`);
  if (!buffer?.length) {
    throw new ApiError('No file buffer provided', 400);
  }

  assertSharePointConfig();

  const client = getGraphClient();
  const safeSubfolder = String(subfolder || 'general')
    .replace(/[^a-zA-Z0-9/_-]/g, '_')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
  const folderPath = `AMS/${safeSubfolder || 'general'}`;
  const filename = buildFilename(originalName);
  const uploadPath = `${folderPath}/${filename}`;

  console.log(`[DEBUG] [SharePoint] Uploading file. Target path: ${uploadPath}`);
  try {
    await ensureFolder(client, folderPath);
    console.log(`[DEBUG] [SharePoint] Upload request start`);
    const uploaded =
      buffer.length <= SIMPLE_UPLOAD_MAX_BYTES
        ? await simpleUpload(client, uploadPath, buffer, mimeType)
        : await sessionUpload(uploadPath, buffer, mimeType);
    console.log(`[DEBUG] [SharePoint] Upload request success. webUrl: ${uploaded.webUrl}`);

    return {
      url: uploaded.webUrl,
      publicId: uploaded.id,
      storage: 'sharepoint',
    };
  } catch (error) {
    handleGraphError(error, 'uploading file');
  }
}

module.exports = {
  uploadFile,
  isSharePointConfigured,
};
