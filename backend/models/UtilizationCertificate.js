const mongoose = require('mongoose');

const stmtRowSchema = {
  grantsReceived: { type: Number, default: 0 },
  unspentCarriedForward: { type: Number, default: 0 },
  interestEarned: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  expenditureIncurred: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  remarks: { type: String, trim: true, default: '' }
};

const utilizationCertificateSchema = new mongoose.Schema({
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

  fellowName: {
    type: String,
    required: true,
    trim: true
  },
  schemeName: {
    type: String,
    required: true,
    trim: true
  },
  financialYear: {
    type: String,
    required: true,
    trim: true
  },
  grantNature: {
    type: String,
    required: true,
    trim: true
  },

  openingCashInHand: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  openingUnadjustedAdvances: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  grantDetails: [
    {
      unspentBalance: { type: Number, required: true, min: 0 },
      interestEarned: { type: Number, default: 0, min: 0 },
      interestDepositedBack: { type: Number, default: 0, min: 0 },
      sanctionNo: { type: String, trim: true },
      sanctionDate: { type: Date },
      grantAmount: { type: Number, required: true, min: 0 },
      totalAvailableFunds: { type: Number, required: true, min: 0 },
      expenditureIncurred: { type: Number, required: true, min: 0 },
      closingBalance: { type: Number, required: true }
    }
  ],

  componentUtilization: {
    grantInAidGeneral: { type: Number, default: 0, min: 0 },
    grantInAidSalary: { type: Number, default: 0, min: 0 },
    grantInAidCapitalAssets: { type: Number, default: 0, min: 0 }
  },

  closingCashInHand: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  closingUnadjustedAdvances: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  certificationChecks: {
    type: [Boolean],
    default: () => Array(9).fill(false)
  },
  certDate: { type: Date },
  certPlace: { type: String, trim: true, default: '' },

  expenditureStatement: {
    periodFrom: { type: String, trim: true, default: '' },
    periodTo: { type: String, trim: true, default: '' },
    staff: stmtRowSchema,
    contingencies: stmtRowSchema,
    recurring: stmtRowSchema,
    travel: stmtRowSchema,
    overhead: stmtRowSchema,
    equipments: stmtRowSchema
  },

  assetsAcquired: {
    sanctioningAuthority: { type: String, trim: true },
    slNo: { type: String, trim: true },
    granteeInstitution: { type: String, trim: true },
    sanctionOrderNoDate: { type: String, trim: true },
    amountSanctionedNR: { type: Number, default: 0, min: 0 },
    purposeOfGrant: { type: String, trim: true },
    govtOwnershipCondition: { type: String, trim: true },
    assetParticulars: { type: String, trim: true },
    valueAsOn: { type: String, trim: true },
    currentPurpose: { type: String, trim: true },
    encumbered: { type: String, trim: true },
    encumberedReason: { type: String, trim: true },
    disposed: { type: String, trim: true },
    disposalReasonAuthority: { type: String, trim: true },
    amountRealizedOnDisposal: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true }
  },

  equipmentsProcured: [
    {
      slNo: { type: Number },
      equipmentName: { type: String, trim: true },
      sanctionedCost: { type: Number, min: 0 },
      actualCost: { type: Number, min: 0 },
      orderDate: { type: Date },
      receivedDate: { type: Date },
      voucherNoDate: { type: String, trim: true },
      priceFluctuationReason: { type: String, trim: true }
    }
  ],

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
    default: 'FINANCE_OFFICER_HELPER',
    enum: ['FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'PI', 'COMPLETED']
  },
  forwardedTo: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'submittedDate', updatedAt: false }
});

module.exports = mongoose.model('UtilizationCertificate', utilizationCertificateSchema);
