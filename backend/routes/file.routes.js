const express = require('express');
const router = express.Router();
const sharepointService = require('../services/sharepointService');
const asyncHandler = require('../utils/asyncHandler');
const { Readable } = require('stream');

function asNodeReadable(value) {
  if (!value) return null;
  if (typeof value.pipe === 'function') return value;
  if (value.body && typeof value.body.pipe === 'function') return value.body;
  if (typeof value.getReader === 'function') return Readable.fromWeb(value);
  if (value.body && typeof value.body.getReader === 'function') return Readable.fromWeb(value.body);
  if (typeof value[Symbol.asyncIterator] === 'function') return Readable.from(value);
  if (value.body && typeof value.body[Symbol.asyncIterator] === 'function') return Readable.from(value.body);
  return null;
}

router.get('/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { download } = req.query;

  const { stream, meta } = await sharepointService.getFileStream(fileId);

  res.setHeader('Content-Type', meta.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('ETag', `"${meta.fileId}"`);
  res.setHeader('Last-Modified', new Date(meta.createdAt).toUTCString());

  if (download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${meta.fileName}"`);
  } else {
    res.setHeader('Content-Disposition', `inline; filename="${meta.fileName}"`);
  }

  const readable = asNodeReadable(stream);
  if (readable) {
    readable.on('error', (error) => {
      if (!res.headersSent) res.status(502).json({ success: false, message: 'Failed to stream file from SharePoint' });
      else res.destroy(error);
    });
    readable.pipe(res);
  } else if (Buffer.isBuffer(stream) || typeof stream === 'string') {
    res.send(stream);
  } else {
    throw new Error('SharePoint returned an unsupported file response');
  }
}));

module.exports = router;
