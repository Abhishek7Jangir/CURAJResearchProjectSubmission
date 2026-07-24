const mongoose = require('mongoose');

// Stores a full snapshot of a ProjectAccount document at the exact moment
// it receives FINAL approval (Finance Officer Main approval, which moves
// it to the COMPLETED stage). This lets the "Project Accounts" section
// show the account details exactly as they were when finally approved,
// even if the underlying ProjectAccount or linked Project document later
// changes (e.g. due to budget head deductions from approved indents).
const projectAccountApprovalSnapshotSchema = new mongoose.Schema({
  projectAccountId: {
    type: String,
    required: true,
    unique: true,
    ref: 'ProjectAccount'
  },
  // Full plain-object copy of the ProjectAccount document at approval time.
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  approvedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: false, updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('ProjectAccountApprovalSnapshot', projectAccountApprovalSnapshotSchema);
