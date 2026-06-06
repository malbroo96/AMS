const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const ApiError = require('../utils/ApiError');
const { getGraphClient, isSharePointConfigured, sharepointConfig } = require('../config/sharepoint');
const { upload: uploadConfig } = require('../config/env');

const quality = 80;
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

function sanitizeName(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function collegeFolderName(collegeId) {
  return `College_${sanitizeName(collegeId)}`;
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
  return `/sites/${encodeURIComponent(sharepointConfig.siteId)}/drives/${encodeURIComponent(sharepointConfig.driveId)}`;
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
  return client.api(`${driveApiBase()}/root:/${graphPath(itemPath)}`).get();
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

function assetFilename(assetType, originalName, mimeType) {
  const fallbackExt = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  const originalExt = path.extname(originalName || '').toLowerCase();
  const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(originalExt) ? originalExt : fallbackExt;
  return `${assetType}${ext === '.jpeg' ? '.jpg' : ext}`;
}

function localAssetDirectory(collegeId) {
  return path.join(__dirname, '..', uploadConfig.dir, 'colleges', collegeFolderName(collegeId));
}

function localAssetUrl(collegeId, filename) {
  return `/${uploadConfig.dir}/colleges/${collegeFolderName(collegeId)}/${filename}`;
}

async function uploadLocalAsset({ collegeId, file, assetType }) {
  const compressedBuffer = await compressImage(file);
  const filename = assetFilename(assetType, file.originalname, file.mimetype);
  const directory = localAssetDirectory(collegeId);

  await fs.mkdir(directory, { recursive: true });
  await Promise.all(
    ['.jpg', '.png', '.webp']
      .filter((extension) => !filename.endsWith(extension))
      .map((extension) => fs.rm(path.join(directory, `${assetType}${extension}`), { force: true }))
  );
  await fs.writeFile(path.join(directory, filename), compressedBuffer);

  return {
    url: localAssetUrl(collegeId, filename),
    id: null,
    name: filename,
    size: compressedBuffer.length,
    mimeType: file.mimetype,
    assetType,
    storage: 'local',
    folderPath: directory,
  };
}

async function deleteLocalAsset({ collegeId, assetType, currentUrl }) {
  const directory = localAssetDirectory(collegeId);
  const deleted = [];

  for (const extension of ['.jpg', '.png', '.webp']) {
    const filename = `${assetType}${extension}`;
    try {
      await fs.rm(path.join(directory, filename));
      deleted.push(filename);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  return {
    deleted,
    assetType,
    previousUrl: currentUrl || null,
    storage: 'local',
  };
}

const sharepointService = {
  async uploadCollegeAsset({ collegeId, file, assetType }) {
    if (!isSharePointConfigured()) {
      return uploadLocalAsset({ collegeId, file, assetType });
    }

    const client = getGraphClient();
    const rootFolder = sharepointConfig.folder;
    const folderPath = `${rootFolder}/${collegeFolderName(collegeId)}`;
    const compressedBuffer = await compressImage(file);
    const filename = assetFilename(assetType, file.originalname, file.mimetype);
    const uploadPath = `${folderPath}/${filename}`;

    await ensureFolder(client, folderPath);

    const uploaded = await client
      .api(`${driveApiBase()}/root:/${graphPath(uploadPath)}:/content`)
      .put(compressedBuffer);

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
  },

  async deleteCollegeAsset({ collegeId, assetType, currentUrl }) {
    if (!isSharePointConfigured() || String(currentUrl || '').startsWith(`/${uploadConfig.dir}/`)) {
      return deleteLocalAsset({ collegeId, assetType, currentUrl });
    }

    const client = getGraphClient();
    const rootFolder = sharepointConfig.folder;
    const folderPath = `${rootFolder}/${collegeFolderName(collegeId)}`;
    const candidates = assetType === 'banner' ? ['banner.jpg', 'banner.png', 'banner.webp'] : ['logo.jpg', 'logo.png', 'logo.webp'];
    const deleted = [];

    for (const filename of candidates) {
      const itemPath = `${folderPath}/${filename}`;
      try {
        await client.api(`${driveApiBase()}/root:/${graphPath(itemPath)}`).delete();
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
