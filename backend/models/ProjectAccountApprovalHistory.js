const mongoose = require('mongoose');

const projectAccountApprovalHistorySchema = new mongoose.Schema(
  {
    projectAccountId: {
      type: String,
      required: true,
      ref: 'ProjectAccount'
    },
    stage: {
      type: String,
      required: true,
      enum: ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN']
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
  },
  {
    timestamps: { createdAt: 'actionDate', updatedAt: false }
  }
);

module.exports = mongoose.model('ProjectAccountApprovalHistory', projectAccountApprovalHistorySchema);
