const applicationService = require('../services/application.service');
const asyncHandler = require('../utils/asyncHandler');

exports.createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(req.user.id, req.body);
  res.status(201).json({ success: true, data: application });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listApplications(req.user, req.query);
  res.json({ success: true, data: result });
});

exports.getApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id, req.user);
  res.json({ success: true, data: application });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    req.user,
    req.body
  );
  res.json({ success: true, data: application });
});
