// UI Helper Functions - No localStorage usage
// These are just utility functions for displaying status colors and icons

export const getStatusColor = (status = 'Pending') => {
  if (status.includes('Approved') || status.includes('Completed'))
    return 'text-green-600 bg-green-50';
  if (status.includes('Rejected'))
    return 'text-red-600 bg-red-50';
  return 'text-yellow-600 bg-yellow-50';
};

export const getStatusIcon = (status = 'Pending') => {
  const icons = {
    approved: '✓',
    rejected: '✗',
    pending: '⏳'
  };

  if (status.includes('Approved') || status.includes('Completed'))
    return icons.approved;
  if (status.includes('Rejected'))
    return icons.rejected;
  return icons.pending;
};