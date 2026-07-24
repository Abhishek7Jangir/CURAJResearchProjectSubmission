const mongoose = require('mongoose');

// Project Grant Schema (Module 3: Indent for Project Grant - Form PC)
const projectGrantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  projectId: {
    type: String,
    required: true,
    ref: 'Project'
  },
  projectTitle: {
    type: String,
    required: true
  },
  // SECTION A: GRANT TYPE
  grantType: {
    type: String,
    required: true,
    enum: ['Non-Recurring', 'Recurring', 'Overhead']
  },
  // SECTION B: PROCUREMENT DETAILS
  budgetHead: {
    type: String,
    required: true,
    enum: ['Equipment', 'Manpower', 'Consumables', 'Travel', 'Contingency', 'Overhead', 'Others']
  },
  amountSanctioned: {
    type: Number,
    required: true,
    min: 0
  },
  availableBalance: {
    type: Number,
    required: true,
    min: 0
  },
  procurementMode: {
    type: String,
    required: true,
    enum: ['GeM', 'E-Portal', 'RC', 'Tender', 'Purchase Committee', 'Single Quotation']
  },
  // SECTION C: ITEM DETAILS (Repeatable - stored as array)
  items: [{
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    catalogNo: {
      type: String,
      trim: true
    },
    make: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    gstPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 28
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    stockAvailable: {
      type: Boolean,
      default: false
    },
    location: {
      type: String,
      enum: ['PI Lab', 'Dept'],
      default: 'PI Lab'
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // SECTION D: ENCLOSURES (file URLs)
  enclosures: {
    draftPO: { type: String, default: null },
    gemNonAvailability: { type: String, default: null },
    deptNonAvailability: { type: String, default: null },
    sanctionLetter: { type: String, default: null },
    rateContractNACertificate: { type: String, default: null },
    quotationProof: { type: String, default: null },
    equipmentProof: { type: String, default: null },
    conferenceInvite: { type: String, default: null }
  },
  // SECTION E: REQUEST TYPE
  requestType: {
    type: String,
    required: true,
    enum: ['Advance', 'Reimbursement', 'Approval']
  },
  // Bill upload after purchase (proof of work)
  billUploaded: {
    type: Boolean,
    default: false
  },
  billFileUrl: {
    type: String,
    default: null
  },
  billFileName: {
    type: String,
    default: null
  },
  billUploadDate: {
    type: Date,
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
    enum: ['Pending', 'Approved', 'Rejected', 'Approved - Fund Released', 'Reverted', 'Bill Pending', 'Bill Uploaded', 'Completed']
  },
  currentStage: {
    type: String,
    default: 'HOD',
    enum: ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'ACADEMIC_INTEGRITY_OFFICER', 'FINANCE_OFFICER_HELPER', 
           'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR', 'COMPLETED']
  },
  forwardedTo: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'submittedDate', updatedAt: false }
});

// Export as ProjectGrant (keeping EquipmentRequest for backward compatibility)
const ProjectGrant = mongoose.model('ProjectGrant', projectGrantSchema);
mongoose.model('EquipmentRequest', projectGrantSchema); // Backward compatibility
module.exports = ProjectGrant;

