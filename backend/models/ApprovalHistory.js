const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    ref: 'Project'
  },
  stage: {
    type: String,
    required: true,
    enum: ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'ACADEMIC_INTEGRITY_OFFICER', 'FINANCE_OFFICER_HELPER', 
           'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR', 'COMPLETED']
  },
  status: {
    type: String,
    required: true,
    enum: ['Approved', 'Rejected', 'Reverted']
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

module.exports = mongoose.model('ApprovalHistory', approvalHistorySchema);

