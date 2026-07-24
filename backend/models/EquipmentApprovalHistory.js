const mongoose = require('mongoose');

const equipmentApprovalHistorySchema = new mongoose.Schema({
  equipmentRequestId: {
    type: String,
    required: true,
    ref: 'EquipmentRequest'
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

module.exports = mongoose.model('EquipmentApprovalHistory', equipmentApprovalHistorySchema);

