const ApplicationStatus = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

function hasProfileAccess(status) {
  return status === ApplicationStatus.APPROVED;
}

module.exports = {
  ApplicationStatus,
  hasProfileAccess
};
