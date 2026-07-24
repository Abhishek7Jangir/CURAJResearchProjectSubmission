const mongoose = require('mongoose');

// ── Budget head sub-schema ─────────────────────────────────────────────────
const budgetHeadSchema = new mongoose.Schema(
  {
    balanceAsPerUCSE:      { type: Number, default: 0, min: 0 },
    expenditureAfterUCSE:  { type: Number, default: 0, min: 0 },
    currentBalance:        { type: Number, default: 0 },   // computed: balanceAsPerUCSE - expenditureAfterUCSE  (a)
    bifurcationNewGrant:   { type: Number, default: 0, min: 0 }, // (b)
    totalBalance:          { type: Number, default: 0 },   // computed: (a) + (b)
  },
  { _id: false }
);

// ── Main schema ────────────────────────────────────────────────────────────
const projectAccountOpeningSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    // ── SECTION 1: BASIC INFO ──────────────────────────────────────────────
    sanctionLetterNo: {
      type: String,
      required: true,
      trim: true,   // includes date as part of the string, e.g. "DHR/123 dated 01-Jan-2025"
    },

    // ── SECTION 2: PROJECT TITLE ───────────────────────────────────────────
    projectTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // ── SECTION 3: PRINCIPAL INVESTIGATOR ─────────────────────────────────
    piName: {
      type: String,
      required: true,
      trim: true,
    },

    // ── SECTION 4: DEPARTMENT ─────────────────────────────────────────────
    department: {
      type: String,
      required: true,
      trim: true,
    },

    // ── SECTION 5: FUNDING AGENCY ─────────────────────────────────────────
    fundingAgency: {
      type: String,
      required: true,
      trim: true,
    },

    // ── SECTION 7: TYPE OF PROJECT ────────────────────────────────────────
    projectType: {
      governmentFunded:  { type: Boolean, default: false },
      industrySponsored: { type: Boolean, default: false },
      consultancy:       { type: Boolean, default: false },
      others:            { type: Boolean, default: false },
      othersSpecify:     { type: String, trim: true, default: '' },
    },

    // ── SECTION 8: FUNDING SCHEME NAME ────────────────────────────────────
    fundingSchemeName: {
      type: String,
      trim: true,
    },

    // ── SECTION 9: DURATION ───────────────────────────────────────────────
    duration: {
      from: { type: Date },
      to:   { type: Date },
    },

    // ── SECTION 10: TOTAL PROJECT COST ────────────────────────────────────
    totalProjectCost: {
      type: Number,
      required: true,
      min: 0,
    },

    // ── SECTION 11: AMOUNT RECEIVED FOR OPENING (First Installment) ───────
    amountReceivedOpening: {
      type: Number,
      required: true,
      min: 0,
    },

    // ── SECTION 12: BUDGET HEADS ──────────────────────────────────────────
    // Tick for which grant year release this form is for
    grantYearTick: {
      type: [String],
      enum: ['1st', '2nd', '3rd', '4th'],
      default: [],
    },

    // Budget heads table — fixed 7 heads matching the printed form
    budgetHeads: {
      equipment:      { type: budgetHeadSchema, default: () => ({}) },
      manpower:       { type: budgetHeadSchema, default: () => ({}) },
      contingency:    { type: budgetHeadSchema, default: () => ({}) },
      consumable:     { type: budgetHeadSchema, default: () => ({}) },
      travel:         { type: budgetHeadSchema, default: () => ({}) },
      overhead:       { type: budgetHeadSchema, default: () => ({}) },
      othersIfAny:    { type: budgetHeadSchema, default: () => ({}) },
    },

    // ── SECTION 13: FUND DETAILS ──────────────────────────────────────────
    fundDetails: {
      modeOfTransfer:  { type: String, trim: true },   // e.g. NEFT / RTGS / Cheque
      transactionUTR:  { type: String, trim: true },
      dateOfCredit:    { type: Date },
      amountReceived:  { type: Number, min: 0, default: 0 },
    },

    // ── SECTION 14: DECLARATION ───────────────────────────────────────────
    // PI checks this box on submission; forwarding by each role is their implicit approval/signature
    declarationAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },


    // ── WORKFLOW ──────────────────────────────────────────────────────────
    // Digital sign-off chain: PI submits (declaration checkbox = PI sign) →
    // HOD forwards (= HOD sign) → DEAN forwards (= Dean sign) →
    // R&D_DIRECTOR forwards (= R&D sign) → FINANCE_OFFICER approves (= Finance sign) → COMPLETED
    submittedBy: {
      type: String,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Approved', 'Rejected', 'Reverted'],
    },
    currentStage: {
      type: String,
      default: 'HOD',
      enum: [
        'HOD', 'DEAN', 'R&D_DIRECTOR', 'FINANCE_OFFICER', 'COMPLETED',
      ],
    },
    forwardedTo: {
      type: String,
      default: null,
    },

    // Tracks when each role took action — their implicit digital signature
    approvalTrail: {
      pi:            { actedAt: { type: Date } },   // set at submission
      hod:           { actedAt: { type: Date } },   // set when HOD forwards
      dean:          { actedAt: { type: Date } },   // set when Dean forwards
      rdDirector:    { actedAt: { type: Date } },   // set when R&D Director forwards
      financeOfficer:{ actedAt: { type: Date } },   // set when Finance Officer approves
    },
  },
  {
    timestamps: { createdAt: 'submittedDate', updatedAt: false },
  }
);

module.exports = mongoose.model('ProjectAccountOpening', projectAccountOpeningSchema);
