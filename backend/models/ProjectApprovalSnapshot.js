const mongoose = require('mongoose');

// Stores a full snapshot of a Project document at the exact moment it
// receives its FINAL approval (VC approval in v1, or Registrar approval
// in the v2 registrar-final workflow). This lets the "My Projects" section
// show the project exactly as it was when it was approved, even if the
// underlying Project document later changes (e.g. due to budget revisions
// or budget head deductions from approved indents).
const projectApprovalSnapshotSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
    ref: 'Project'
  },
  // Full plain-object copy of the Project document at approval time.
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  approvedAt: {
    type: Date,
    default: Date.now
  },
  approvedByStage: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: false, updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('ProjectApprovalSnapshot', projectApprovalSnapshotSchema);
