const path = require('path');
const sharp = require('sharp');
const ApiError = require('../utils/ApiError');
const { getGraphClient, isSharePointConfigured, sharepointConfig, assertSharePointConfig } = require('../config/sharepoint');
const { sql, getPool } = require('../config/database');

const quality = 80;
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

function assertSharePointReady() {
  assertSharePointConfig();
}

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
  const rawResponseBody = error.body || null;

  console.error(`[DEBUG] [Graph] Error during ${contextMessage}:`, {
    endpoint,
    requestBody,
    driveId,
    parentPath,
    statusCode,
    errorCode,
    message,
    body: rawResponseBody,
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

  const detailMsg = rawResponseBody ? ` Details: ${rawResponseBody}` : '';
  const apiError = new ApiError(
    `SharePoint / Microsoft Graph Error (${contextMessage}) [Endpoint: ${endpoint}, Code: ${errorCode}, Status: ${status}]: ${message}${detailMsg}`,
    status
  );

  apiError.endpoint = endpoint;
  apiError.requestBody = details.requestBody || null;
  apiError.driveId = driveId;
  apiError.parentPath = parentPath;
  apiError.errorCode = errorCode;
  apiError.rawResponseBody = rawResponseBody;

  throw apiError;
}


function sanitizeName(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function getCollegeFolderName(collegeId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('collegeId', sql.Int, collegeId)
    .query(`
      SELECT c.CollegeName, cp.ShortName 
      FROM dbo.Colleges c 
      LEFT JOIN dbo.CollegeProfiles cp ON cp.CollegeID = c.CollegeID 
      WHERE c.CollegeID = @collegeId
    `);

  const college = result.recordset[0];
  if (!college) {
    throw new ApiError(`College with ID ${collegeId} not found in database`, 404);
  }

  // Priority order: collegeCode (checks columns dynamically just in case) -> shortName -> name
  const code = college.Code || college.collegeCode || college.college_code;
  const shortName = college.ShortName || college.shortName;
  const name = college.CollegeName || college.collegeName;

  const folderName = code || shortName || name;
  if (!folderName) {
    throw new ApiError(`Could not resolve folder name for college ID ${collegeId}`, 400);
  }

  const sanitized = sanitizeName(folderName);
  console.log(`[DEBUG] [SharePoint] Resolved college folder name for ID ${collegeId}: "${sanitized}"`);
  return sanitized;
}

function graphPath(rawPath) {
  return String(rawPath)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function isGraphNotFound(error) {
  return error?.statusCode === 404 || error?.code === 'itemNotFound';
}

function driveApiBase() {
  return `/drives/${encodeURIComponent(sharepointConfig.driveId)}`;
}

async function compressImage(file) {
  if (!file?.buffer) {
    throw new ApiError('No file uploaded', 400);
  }
  if (!allowedMimes.includes(file.mimetype)) {
    throw new ApiError('Only PNG, JPEG, and WebP images are allowed', 400);
  }

  let transformer = sharp(file.buffer, { failOn: 'warning' }).rotate();

  if (file.mimetype === 'image/png') {
    transformer = transformer.png({ quality, compressionLevel: 9, adaptiveFiltering: true });
  } else if (file.mimetype === 'image/webp') {
    transformer = transformer.webp({ quality });
  } else {
    transformer = transformer.jpeg({ quality, mozjpeg: true });
  }

  return transformer.toBuffer();
}

async function getItemByPath(client, itemPath) {
  const driveId = sharepointConfig.driveId;
  const endpoint = `${driveApiBase()}/root:/${graphPath(itemPath)}:`;
  const parentPath = itemPath.split('/').slice(0, -1).join('/') || 'root';

  console.log(`[DEBUG] [Graph Request] Before execution:`, {
    method: 'GET',
    endpoint,
    body: 'None',
    driveId,
    parentPath,
  });

  return client.api(endpoint).get();
}

async function createFolder(client, parentPath, folderName) {
  const driveId = sharepointConfig.driveId;
  const parentApi = parentPath
    ? `${driveApiBase()}/root:/${graphPath(parentPath)}:/children`
    : `${driveApiBase()}/root/children`;

  const requestBody = {
    name: folderName,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'fail',
  };

  console.log(`[DEBUG] [Graph Request] Before execution:`, {
    method: 'POST',
    endpoint: parentApi,
    body: requestBody,
    driveId,
    parentPath: parentPath || 'root',
  });

  try {
    return await client.api(parentApi).post(requestBody);
  } catch (error) {
    const isConflict = error?.statusCode === 409 || error?.code === 'nameAlreadyExists';
    if (isConflict) {
      throw error;
    }
    handleGraphError(error, `creating folder "${folderName}"`, {
      endpoint: `POST ${parentApi}`,
      requestBody,
      parentPath: parentPath || 'root',
    });
  }
}

async function ensureFolderExists(client, folderPath) {
  const driveId = sharepointConfig.driveId;
  const verifyEndpoint = `/drives/${encodeURIComponent(driveId)}`;

  console.log(`[DEBUG] [Graph Request] Before execution:`, {
    method: 'GET',
    endpoint: verifyEndpoint,
    body: 'None',
    driveId,
    parentPath: 'None',
  });

  try {
    const driveInfo = await client.api(verifyEndpoint).get();
    console.log(`[DEBUG] [SharePoint] Drive verified. Metadata:`, {
      driveId: driveInfo.id,
      name: driveInfo.name,
      driveType: driveInfo.driveType,
    });
  } catch (error) {
    if (error?.statusCode === 404) {
      throw new ApiError(`SharePoint Drive ID is invalid (returns 404): ${driveId}`, 404);
    }
    handleGraphError(error, `verifying drive ID ${driveId}`, {
      endpoint: `GET ${verifyEndpoint}`,
    });
  }

  const parts = String(folderPath).split('/').filter(Boolean);
  let currentPath = '';

  for (const part of parts) {
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}/${part}` : part;

    const checkEndpoint = `${driveApiBase()}/root:/${graphPath(currentPath)}:`;

    try {
      await getItemByPath(client, currentPath);
      console.log(`[DEBUG] [SharePoint] Folder exists: "${currentPath}"`);
    } catch (error) {
      if (isGraphNotFound(error)) {
        console.log(`[DEBUG] [SharePoint] Folder creation attempt: "${part}" under parent: "${parentPath || 'root'}" (Path: ${currentPath})`);
        try {
          await createFolder(client, parentPath, part);
          console.log(`[DEBUG] [SharePoint] Folder created successfully: "${currentPath}"`);
        } catch (createErr) {
          const isConflict = createErr?.statusCode === 409 || createErr?.code === 'nameAlreadyExists';
          if (isConflict) {
            console.log(`[DEBUG] [SharePoint] Folder already exists (409 Conflict): "${currentPath}", continuing...`);
          } else {
            throw createErr;
          }
        }
      } else {
        handleGraphError(error, `checking folder "${currentPath}"`, {
          endpoint: `GET ${checkEndpoint}`,
          parentPath: parentPath || 'root',
        });
      }
    }
  }
}

function assetFilename(assetType, originalName, mimeType) {
  const fallbackExt = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  const originalExt = path.extname(originalName || '').toLowerCase();
  const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(originalExt) ? originalExt : fallbackExt;
  return `${assetType}${ext === '.jpeg' ? '.jpg' : ext}`;
}

function galleryFilename(itemId, originalName, mimeType) {
  const fallbackExt = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  const originalExt = path.extname(originalName || '').toLowerCase();
  const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(originalExt) ? originalExt : fallbackExt;
  return `gallery-${sanitizeName(itemId)}${ext === '.jpeg' ? '.jpg' : ext}`;
}

async function putBuffer(client, uploadPath, buffer, mimeType) {
  const driveId = sharepointConfig.driveId;
  const endpoint = `${driveApiBase()}/root:/${graphPath(uploadPath)}:/content`;
  const parentPath = uploadPath.split('/').slice(0, -1).join('/') || 'root';

  console.log(`[DEBUG] [Graph Request] Before execution:`, {
    method: 'PUT',
    endpoint,
    body: '<Buffer>',
    driveId,
    parentPath,
  });

  return client
    .api(endpoint)
    .header('Content-Type', mimeType || 'application/octet-stream')
    .put(buffer);
}

const sharepointService = {
  async uploadCollegeAsset({ collegeId, file, assetType }) {
    console.log(`[DEBUG] [SharePoint] Upload request received: collegeId=${collegeId}, assetType=${assetType}`);
    if (file) {
      console.log(`[DEBUG] [SharePoint] File metadata: name=${file.originalname}, mime=${file.mimetype}, size=${file.size} bytes`);
    }

    assertSharePointReady();

    const client = getGraphClient();
    const rootFolder = sharepointConfig.folder;
    const collegeFolder = await getCollegeFolderName(collegeId);
    const folderPath = `${rootFolder}/${collegeFolder}`;
    const compressedBuffer = await compressImage(file);
    const filename = assetFilename(assetType, file.originalname, file.mimetype);
    const uploadPath = `${folderPath}/${filename}`;

    console.log(`[DEBUG] [SharePoint] Final upload path: ${uploadPath}`);
    try {
      await ensureFolderExists(client, folderPath);
      console.log(`[DEBUG] [SharePoint] Upload request start`);
      const uploaded = await putBuffer(client, uploadPath, compressedBuffer, file.mimetype);
      console.log(`[DEBUG] [SharePoint] Upload request success. webUrl: ${uploaded.webUrl}`);

      return {
        url: uploaded.webUrl,
        id: uploaded.id,
        name: uploaded.name,
        size: uploaded.size,
        mimeType: file.mimetype,
        assetType,
        storage: 'sharepoint',
        folderPath,
      };
    } catch (error) {
      handleGraphError(error, `uploading college asset ${assetType}`);
    }
  },

  async uploadCollegeGalleryImage({ collegeId, file, itemId }) {
    console.log(`[DEBUG] [SharePoint] Upload request received: collegeId=${collegeId}, assetType=gallery`);
    if (file) {
      console.log(`[DEBUG] [SharePoint] File metadata: name=${file.originalname}, mime=${file.mimetype}, size=${file.size} bytes`);
    }

    assertSharePointReady();

    const client = getGraphClient();
    const rootFolder = sharepointConfig.folder;
    const collegeFolder = await getCollegeFolderName(collegeId);
    const folderPath = `${rootFolder}/${collegeFolder}/gallery`;
    const compressedBuffer = await compressImage(file);
    const filename = galleryFilename(itemId, file.originalname, file.mimetype);
    const uploadPath = `${folderPath}/${filename}`;

    console.log(`[DEBUG] [SharePoint] Final upload path: ${uploadPath}`);
    try {
      await ensureFolderExists(client, folderPath);
      console.log(`[DEBUG] [SharePoint] Upload request start`);
      const uploaded = await putBuffer(client, uploadPath, compressedBuffer, file.mimetype);
      console.log(`[DEBUG] [SharePoint] Upload request success. webUrl: ${uploaded.webUrl}`);

      return {
        url: uploaded.webUrl,
        id: uploaded.id,
        name: uploaded.name,
        size: uploaded.size,
        mimeType: file.mimetype,
        assetType: 'gallery',
        storage: 'sharepoint',
        folderPath,
      };
    } catch (error) {
      handleGraphError(error, 'uploading college gallery image');
    }
  },

  async deleteCollegeAsset({ collegeId, assetType, currentUrl }) {
    assertSharePointReady();

    const client = getGraphClient();
    const rootFolder = sharepointConfig.folder;
    const collegeFolder = await getCollegeFolderName(collegeId);
    const folderPath = `${rootFolder}/${collegeFolder}`;
    const candidates = assetType === 'banner' ? ['banner.jpg', 'banner.png', 'banner.webp'] : ['logo.jpg', 'logo.png', 'logo.webp'];
    const deleted = [];

    for (const filename of candidates) {
      const itemPath = `${folderPath}/${filename}`;
      const endpoint = `${driveApiBase()}/root:/${graphPath(itemPath)}:`;
      console.log(`[DEBUG] [Graph Request] Before execution:`, {
        method: 'DELETE',
        endpoint,
        body: 'None',
        driveId: sharepointConfig.driveId,
        parentPath: folderPath
      });
      try {
        await client.api(endpoint).delete();
        deleted.push(filename);
      } catch (error) {
        if (!isGraphNotFound(error)) throw error;
      }
    }

    return {
      deleted,
      assetType,
      previousUrl: currentUrl || null,
      storage: 'sharepoint',
    };
  },
};

module.exports = sharepointService;
