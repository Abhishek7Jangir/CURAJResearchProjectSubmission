const mongoose = require('mongoose');

// Project Schema (Module 1: Project Submission Checklist & Declaration Form)
const projectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  // SECTION A: BASIC PROJECT DETAILS
  title: {
    type: String,
    required: true,
    trim: true
  },
  fundingAgency: {
    type: String,
    required: true,
    trim: true
  },
  schemeCallRefNo: {
    type: String,
    required: true,
    trim: true
  },
  pi: {
    type: String,
    required: true,
    trim: true
  },
  piDesignation: {
    type: String,
    default: null
  },
  piDepartment: {
    type: String,
    default: null
  },
  coPi: {
    type: [{
      name: String,
      designation: String,
      department: String
    }],
    default: []
  },
  collaboratingInstitute: {
    type: String,
    default: null
  },
  projectStartDate: {
    type: Date,
    required: true
  },
  projectEndDate: {
    type: Date,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  availableBudget: {
    type: Number,
    required: true,
    min: 0
  },
  fundingAgencyFormatFollowed: {
    type: Boolean,
    required: true,
    default: false
  },
  aiUsagePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  plagiarismPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  summary: {
    type: String,
    default: ''
  },
  // SECTION B: BUDGET HEADS
  budgetHeads: {
    equipment: { type: Number, default: 0 },
    manpower: { type: Number, default: 0 },
    consumables: { type: Number, default: 0 },
    travel: { type: Number, default: 0 },
    contingency: { type: Number, default: 0 },
    overhead: { type: Number, default: 0 },
    others: { type: Number, default: 0 }
  },
  // SECTION C: DOCUMENT UPLOADS
  documents: {
    completeProposal: { type: String, default: null },
    endorsementLetter: { type: String, default: null },
    piCoPiUndertaking: { type: String, default: null },
    institutionalForwardingLetter: { type: String, default: null },
    otherSupportingDocs: [{ type: String }]
  },
  // Legacy fields for backward compatibility
  fileName: {
    type: String,
    default: 'research-proposal.pdf'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  submittedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Approved', 'Rejected', 'Reverted']
  },
  lifecycleStatus: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Approved', 'Ongoing', 'Completed']
  },
  currentStage: {
    type: String,
    default: 'HOD',
    enum: ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'ACADEMIC_INTEGRITY_OFFICER', 'FINANCE_OFFICER_HELPER', 
           'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR', 'COMPLETED', 'Approved']
  },
  forwardedTo: {
    type: String,
    default: null
  },
  // Controls which approval workflow stages are used when moving the project
  // forward through approvals. Existing projects default to 'v1' to avoid
  // changing in-progress approvals retroactively.
  workflowVersion: {
    type: String,
    default: 'v1',
    enum: ['v1', 'registrar_final_v2']
  },
  // Budget update requests initiated by PI and handled by R&D_MAIN
  budgetUpdateRequests: {
    type: [
      {
        oldTotalBudget: { type: Number, required: true },
        requestedTotalBudget: { type: Number, required: true },
        difference: { type: Number, required: true },
        reason: { type: String, required: true },
        supportingDocs: [{ type: String }],
        status: {
          type: String,
          enum: ['Pending', 'Approved', 'Rejected'],
          default: 'Pending'
        },
        requestedBy: { type: String, required: true },
        requestedByName: { type: String, required: true },
        requestedAt: { type: Date, default: Date.now },
        decidedBy: { type: String, default: null },
        decidedByEmail: { type: String, default: null },
        decidedAt: { type: Date, default: null }
      }
    ],
    default: []
  }
}, {
  timestamps: { createdAt: 'submittedDate', updatedAt: false }
});

module.exports = mongoose.model('Project', projectSchema);

