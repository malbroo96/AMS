const express = require('express');
const router = express.Router();
const sharepointService = require('../services/sharepointService');
const asyncHandler = require('../utils/asyncHandler');

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

  if (stream && typeof stream.pipe === 'function') {
    stream.pipe(res);
  } else if (stream && stream.body && typeof stream.body.pipe === 'function') {
    // Handling fetch API Response object
    stream.body.pipe(res);
  } else {
    // Fallback if it returns a buffer or something else
    res.send(stream);
  }
}));

module.exports = router;
