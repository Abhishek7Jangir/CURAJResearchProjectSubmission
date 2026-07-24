const mongoose = require('mongoose');

const utilizationCertificateApprovalHistorySchema = new mongoose.Schema({
  utilizationCertificateId: {
    type: String,
    required: true,
    ref: 'UtilizationCertificate'
  },
  stage: {
    type: String,
    required: true,
    enum: ['FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'PI', 'COMPLETED']
  },
  status: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'actionDate', updatedAt: false }
});

module.exports = mongoose.model('UtilizationCertificateApprovalHistory', utilizationCertificateApprovalHistorySchema);
