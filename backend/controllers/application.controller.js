const asyncHandler = require('../utils/asyncHandler');
const applicationService = require('../services/application.service');

exports.apply = asyncHandler(async (req, res) => {
  const application = await applicationService.apply(req.user.id, req.body);
  res.status(201).json({ success: true, data: application });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const data = await applicationService.list(req.user, req.query);
  res.json({ success: true, data });
});

exports.getApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.getById(req.params.id, req.user);
  res.json({ success: true, data: application });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateStatus(req.params.id, req.user, req.body);
  res.json({ success: true, data: application });
});
