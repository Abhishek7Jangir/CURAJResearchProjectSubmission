const mongoose = require('mongoose');

const budgetHeadSchema = new mongoose.Schema(
  {
    balanceAsPerUCSE: { type: Number, default: 0, min: 0 },
    expenditureAfterUCSE: { type: Number, default: 0, min: 0 },
    currentBalance: { type: Number, default: 0 },
    bifurcationNewGrant: { type: Number, default: 0, min: 0 },
    totalBalance: { type: Number, default: 0 }
  },
  { _id: false }
);

const projectAccountSchema = new mongoose.Schema({
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
  piName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  fundingAgency: {
    type: String,
    required: true,
    trim: true
  },
  sanctionLetterNo: {
    type: String,
    required: true,
    trim: true
  },
  sanctionDate: {
    type: Date,
    required: true
  },
  fundingSchemeName: {
    type: String,
    trim: true
  },
  /** Single-line description of project type (e.g. Government Funded) from account opening form */
  projectTypeLabel: {
    type: String,
    default: '',
    trim: true
  },
  duration: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  totalProjectCost: {
    type: Number,
    required: true,
    min: 0
  },
  amountReceivedOpening: {
    type: Number,
    required: true,
    min: 0
  },
  grantYearTick: {
    type: [String],
    enum: ['1st', '2nd', '3rd', '4th'],
    default: []
  },
  budgetHeads: {
    equipment: { type: budgetHeadSchema, default: () => ({}) },
    manpower: { type: budgetHeadSchema, default: () => ({}) },
    contingency: { type: budgetHeadSchema, default: () => ({}) },
    consumable: { type: budgetHeadSchema, default: () => ({}) },
    travel: { type: budgetHeadSchema, default: () => ({}) },
    overhead: { type: budgetHeadSchema, default: () => ({}) },
    othersIfAny: { type: budgetHeadSchema, default: () => ({}) }
  },
  fundDetails: {
    modeOfTransfer: { type: String, required: true, trim: true },
    transactionUTR: { type: String, required: true, trim: true },
    dateOfCredit: { type: Date, required: true },
    amountReceived: { type: Number, required: true, min: 0 }
  },
  declarationAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  documents: {
    sanctionedOrder: { type: String, required: true },
    supportingDocuments: { type: [String], default: [] }
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
  currentStage: {
    type: String,
    default: 'HOD',
    enum: ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'COMPLETED', 'PI']
  },
  forwardedTo: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'submittedDate', updatedAt: false }
});

module.exports = mongoose.model('ProjectAccount', projectAccountSchema);

