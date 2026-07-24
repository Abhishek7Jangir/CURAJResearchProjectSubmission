const express = require('express');
const ProjectAccount = require('../models/ProjectAccount');
const ProjectAccountApprovalHistory = require('../models/ProjectAccountApprovalHistory');
const ProjectAccountApprovalSnapshot = require('../models/ProjectAccountApprovalSnapshot');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

const DESIGNATION_TO_STAGE = {
  hod: 'HOD',
  dean: 'DEAN',
  'r&d_helper': 'R&D_HELPER',
  rnd_helper: 'R&D_HELPER',
  'r&d_main': 'R&D_MAIN',
  rnd_main: 'R&D_MAIN',
  finance_officer_helper: 'FINANCE_OFFICER_HELPER',
  finance_officer_main: 'FINANCE_OFFICER_MAIN'
};

function toStageFromDesignation(designation = '') {
  return DESIGNATION_TO_STAGE[String(designation || '').toLowerCase()] || null;
}

function isPdfDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:application/pdf;base64,');
}

const ACCOUNT_BUDGET_KEYS = ['equipment', 'manpower', 'contingency', 'consumable', 'travel', 'overhead', 'othersIfAny'];

function sumAccountBudgetHeadTotals(budgetHeads) {
  return ACCOUNT_BUDGET_KEYS.reduce((s, k) => s + Number(budgetHeads?.[k]?.totalBalance ?? 0), 0);
}

function validateAccountBudgetHeads(budgetHeads, totalProjectCost) {
  const total = Number(totalProjectCost || 0);
  for (const k of ACCOUNT_BUDGET_KEYS) {
    const tb = budgetHeads?.[k]?.totalBalance;
    if (tb === '' || tb === null || tb === undefined) {
      return 'Every budget head must have an amount (enter 0 if not applicable).';
    }
    const n = Number(tb);
    if (!Number.isFinite(n) || n < 0) {
      return 'Budget head amounts must be valid non-negative numbers.';
    }
  }
  const sum = sumAccountBudgetHeadTotals(budgetHeads);
  if (Math.abs(sum - total) > 0.01) {
    return 'Sum of budget heads (as per sanction) must exactly equal total project sanctioned cost.';
  }
  return null;
}

async function uploadPdfDataUrl(dataUrl, fileName, folder = 'project-account-opening') {
  if (!isPdfDataUrl(dataUrl)) {
    throw new Error('Only PDF files are allowed');
  }
  const base64Data = dataUrl.replace(/^data:application\/pdf;base64,/, '');
  const fileBuffer = Buffer.from(base64Data, 'base64');
  const uploaded = await uploadToCloudinary(fileBuffer, fileName, folder);
  return uploaded.url;
}

async function formatAccountWithHistory(account) {
  const history = await ProjectAccountApprovalHistory.find({ projectAccountId: account.id }).sort({ actionDate: 1 });
  return {
    ...(account.toObject ? account.toObject() : account),
    approvalHistory: history.map((h) => ({
      stage: h.stage,
      status: h.status,
      user: h.userName,
      date: h.actionDate,
      comment: h.comment
    }))
  };
}

// Save a full snapshot of the project account's formatted data at the
// moment of its FINAL approval (Finance Officer Main approving moves it
// to COMPLETED). If a snapshot already exists (e.g. account was
// resubmitted and re-approved), it is overwritten with the latest state.
async function saveAccountApprovalSnapshot(account) {
  try {
    const formatted = await formatAccountWithHistory(account);
    await ProjectAccountApprovalSnapshot.findOneAndUpdate(
      { projectAccountId: account.id },
      {
        projectAccountId: account.id,
        snapshot: formatted,
        approvedAt: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Snapshot failure should never block the actual approval action.
    console.error('Failed to save project account approval snapshot:', err);
  }
}

// Get the snapshot of a project account's data as it was at the moment
// of its FINAL approval (used by the "Project Accounts" section to show
// historical, as-approved details rather than the live, possibly-changed
// values).
router.get('/approval-snapshot/:accountId', authMiddleware, async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await ProjectAccount.findOne({ id: accountId });
    if (!account) {
      return res.status(404).json({ error: 'Project account form not found' });
    }
    if (account.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized for this project account' });
    }

    const snapshotDoc = await ProjectAccountApprovalSnapshot.findOne({ projectAccountId: accountId });
    if (!snapshotDoc) {
      return res.status(404).json({ error: 'No approval snapshot found for this project account yet' });
    }

    res.json(snapshotDoc.snapshot);
  } catch (error) {
    console.error('Get project account approval snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch project account approval snapshot' });
  }
});

router.get('/eligible-projects', authMiddleware, async (req, res) => {
  try {
    const approvedProjects = await Project.find({
      submittedBy: req.user.email,
      lifecycleStatus: 'Approved',
      status: 'Approved'
    }).sort({ submittedDate: -1 });

    const existingAccountProjectIds = await ProjectAccount.find({
      projectId: { $in: approvedProjects.map((p) => p.id) },
      status: { $in: ['Pending', 'Approved'] }
    }).distinct('projectId');

    const eligible = approvedProjects
      .filter((p) => !existingAccountProjectIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        title: p.title,
        piName: p.pi,
        department: p.piDepartment,
        fundingAgency: p.fundingAgency,
        duration: {
          from: p.projectStartDate,
          to: p.projectEndDate
        },
        totalProjectCost: p.totalBudget,
        budgetHeads: p.budgetHeads
      }));
    res.json(eligible);
  } catch (error) {
    console.error('Eligible project accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch eligible projects' });
  }
});

// Get project accounts for the logged-in user
router.get('/my-accounts', authMiddleware, async (req, res) => {
  try {
    const accounts = await ProjectAccount.find({ submittedBy: req.user.email })
      .sort({ submittedDate: -1 });

    const formatted = await Promise.all(accounts.map((a) => formatAccountWithHistory(a)));
    res.json(formatted);
  } catch (error) {
    console.error('Get project accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch project accounts' });
  }
});

router.get('/for-approval', authMiddleware, async (req, res) => {
  try {
    const userStage = toStageFromDesignation(req.user.designation);
    if (!userStage) {
      return res.status(403).json({ error: 'Not authorized to review project account forms' });
    }

    let query = {};

    // HOD and Dean can only see project account forms from their own department
    // and only those currently awaiting their action (at their stage)
    if (userStage === 'HOD' || userStage === 'DEAN') {
      const userDepartment = req.user.department;
      if (!userDepartment || userDepartment === 'N/A') {
        return res.status(403).json({ error: 'Department not assigned to your account' });
      }
      query.department = userDepartment;
      query.currentStage = userStage;
    }

    const accounts = await ProjectAccount.find(query).sort({ submittedDate: -1 });
    const formatted = await Promise.all(accounts.map((a) => formatAccountWithHistory(a)));
    res.json(formatted);
  } catch (error) {
    console.error('Get accounts for approval error:', error);
    res.status(500).json({ error: 'Failed to fetch project account forms' });
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const {
      projectId,
      projectTitle,
      piName,
      department,
      fundingAgency,
      sanctionLetterNo,
      sanctionDate,
      fundingSchemeName,
      projectTypeLabel,
      duration,
      totalProjectCost,
      amountReceivedOpening,
      grantYearTick,
      budgetHeads,
      fundDetails,
      declarationAccepted,
      documents
    } = req.body;

    if (!projectId || !sanctionLetterNo || !sanctionDate || !duration?.from || !duration?.to || !totalProjectCost || !fundDetails || !declarationAccepted) {
      return res.status(400).json({ error: 'Missing required fields for project account' });
    }
    if (amountReceivedOpening === undefined || amountReceivedOpening === null || Number(amountReceivedOpening) < 0) {
      return res.status(400).json({ error: 'Amount received for opening (first installment) is required' });
    }
    if (!fundDetails.modeOfTransfer || !fundDetails.transactionUTR || !fundDetails.dateOfCredit || fundDetails.amountReceived === undefined || fundDetails.amountReceived === null) {
      return res.status(400).json({ error: 'Complete fund received details are required (mode, UTR, date of credit, amount)' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized for this project' });
    }
    if (project.lifecycleStatus !== 'Approved' || project.status !== 'Approved') {
      return res.status(400).json({ error: 'Account opening is allowed only for approved projects' });
    }
    if (new Date(duration.from) > new Date(duration.to)) {
      return res.status(400).json({ error: 'Project start date cannot be after project end date' });
    }
    if (!isPdfDataUrl(documents?.sanctionedOrder)) {
      return res.status(400).json({ error: 'Sanctioned order PDF is required' });
    }
    const supportingIn = Array.isArray(documents?.supportingDocuments) ? documents.supportingDocuments.filter(Boolean) : [];
    if (supportingIn.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 supporting documents are allowed' });
    }
    for (let i = 0; i < supportingIn.length; i += 1) {
      if (!isPdfDataUrl(supportingIn[i])) {
        return res.status(400).json({ error: 'Each supporting document must be a PDF file' });
      }
    }

    const budgetErr = validateAccountBudgetHeads(budgetHeads, totalProjectCost);
    if (budgetErr) return res.status(400).json({ error: budgetErr });

    const existingOpenAccount = await ProjectAccount.findOne({
      projectId,
      status: { $in: ['Pending', 'Approved'] }
    });
    if (existingOpenAccount) {
      return res.status(400).json({ error: 'Project account form already exists for this project' });
    }

    const accountId = `PAC-${Date.now()}`;
    const sanctionedOrderUrl = await uploadPdfDataUrl(documents.sanctionedOrder, `${projectId}-sanctioned-order.pdf`);
    const supportingDocuments = [];
    for (let i = 0; i < supportingIn.length; i += 1) {
      supportingDocuments.push(await uploadPdfDataUrl(supportingIn[i], `${projectId}-supporting-${i + 1}.pdf`));
    }

    const account = new ProjectAccount({
      id: accountId,
      projectId,
      projectTitle: projectTitle || project.title,
      piName: piName || project.pi,
      department: department || project.piDepartment || '',
      fundingAgency: fundingAgency || project.fundingAgency || '',
      sanctionLetterNo,
      sanctionDate: new Date(sanctionDate),
      fundingSchemeName: fundingSchemeName || null,
      projectTypeLabel: typeof projectTypeLabel === 'string' ? projectTypeLabel.trim() : '',
      duration: { from: new Date(duration.from), to: new Date(duration.to) },
      totalProjectCost: Number(totalProjectCost || 0),
      amountReceivedOpening: Number(amountReceivedOpening || 0),
      grantYearTick: Array.isArray(grantYearTick) ? grantYearTick : [],
      budgetHeads: budgetHeads || {},
      fundDetails,
      declarationAccepted: Boolean(declarationAccepted),
      documents: {
        sanctionedOrder: sanctionedOrderUrl,
        supportingDocuments
      },
      submittedBy: req.user.email,
      status: 'Pending',
      currentStage: 'HOD'
    });

    await account.save();
    await Project.updateOne(
      { id: projectId },
      {
        $set: {
          projectStartDate: new Date(duration.from),
          projectEndDate: new Date(duration.to),
          duration: `${duration.from} to ${duration.to}`,
          totalBudget: Number(totalProjectCost || 0),
          availableBudget: Number(totalProjectCost || 0),
          budgetHeads: {
            equipment: Number(budgetHeads?.equipment?.totalBalance || 0),
            manpower: Number(budgetHeads?.manpower?.totalBalance || 0),
            consumables: Number(budgetHeads?.consumable?.totalBalance || 0),
            travel: Number(budgetHeads?.travel?.totalBalance || 0),
            contingency: Number(budgetHeads?.contingency?.totalBalance || 0),
            overhead: Number(budgetHeads?.overhead?.totalBalance || 0),
            others: Number(budgetHeads?.othersIfAny?.totalBalance || 0)
          }
        }
      }
    );

    const formatted = await formatAccountWithHistory(account);
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Submit project account error:', error);
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to submit project account' });
  }
});

router.post('/resubmit', authMiddleware, async (req, res) => {
  try {
    const { accountId, documents, duration, totalProjectCost, budgetHeads } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId is required' });

    const account = await ProjectAccount.findOne({ id: accountId });
    if (!account) return res.status(404).json({ error: 'Project account form not found' });
    if (account.submittedBy !== req.user.email) return res.status(403).json({ error: 'Not authorized to resubmit this form' });
    if (account.status !== 'Reverted') return res.status(400).json({ error: 'Only reverted forms can be resubmitted' });
    if (!duration?.from || !duration?.to) {
      return res.status(400).json({ error: 'Project duration (from and to dates) are required' });
    }
    if (new Date(duration.from) > new Date(duration.to)) {
      return res.status(400).json({ error: 'Project start date cannot be after project end date' });
    }

    const mergedBudget = budgetHeads || account.budgetHeads;
    const tc = Number(totalProjectCost ?? account.totalProjectCost);
    const budgetErrResubmit = validateAccountBudgetHeads(mergedBudget, tc);
    if (budgetErrResubmit) return res.status(400).json({ error: budgetErrResubmit });

    let sanctionedOrderUrl = account.documents?.sanctionedOrder || null;
    if (documents?.sanctionedOrder) {
      sanctionedOrderUrl = await uploadPdfDataUrl(documents.sanctionedOrder, `${account.projectId}-sanctioned-order.pdf`);
    }
    if (!sanctionedOrderUrl) return res.status(400).json({ error: 'Sanctioned order PDF is required' });

    let supportingDocuments = account.documents?.supportingDocuments || [];
    if (documents && Object.prototype.hasOwnProperty.call(documents, 'supportingDocuments')) {
      const sup = Array.isArray(documents.supportingDocuments) ? documents.supportingDocuments.filter(Boolean) : [];
      if (sup.length > 3) {
        return res.status(400).json({ error: 'Maximum 3 supporting documents are allowed' });
      }
      supportingDocuments = [];
      for (let i = 0; i < sup.length; i += 1) {
        if (!isPdfDataUrl(sup[i])) {
          return res.status(400).json({ error: 'Each supporting document must be a PDF file' });
        }
        supportingDocuments.push(
          await uploadPdfDataUrl(sup[i], `${account.projectId}-supporting-${i + 1}.pdf`)
        );
      }
    }

    Object.assign(account, {
      ...req.body,
      duration: { from: new Date(duration.from), to: new Date(duration.to) },
      totalProjectCost: Number(totalProjectCost || 0),
      amountReceivedOpening: Number(req.body.amountReceivedOpening || 0),
      budgetHeads: budgetHeads || {},
      documents: {
        sanctionedOrder: sanctionedOrderUrl,
        supportingDocuments
      },
      status: 'Pending',
      currentStage: 'HOD',
      forwardedTo: null
    });
    await account.save();

    await Project.updateOne(
      { id: account.projectId },
      {
        $set: {
          projectStartDate: new Date(duration.from),
          projectEndDate: new Date(duration.to),
          duration: `${duration.from} to ${duration.to}`,
          totalBudget: Number(totalProjectCost || 0),
          availableBudget: Number(totalProjectCost || 0),
          budgetHeads: {
            equipment: Number(budgetHeads?.equipment?.totalBalance || 0),
            manpower: Number(budgetHeads?.manpower?.totalBalance || 0),
            consumables: Number(budgetHeads?.consumable?.totalBalance || 0),
            travel: Number(budgetHeads?.travel?.totalBalance || 0),
            contingency: Number(budgetHeads?.contingency?.totalBalance || 0),
            overhead: Number(budgetHeads?.overhead?.totalBalance || 0),
            others: Number(budgetHeads?.othersIfAny?.totalBalance || 0)
          }
        }
      }
    );

    const formatted = await formatAccountWithHistory(account);
    res.json(formatted);
  } catch (error) {
    console.error('Resubmit project account error:', error);
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to resubmit project account form' });
  }
});

router.post('/update-status', authMiddleware, async (req, res) => {
  try {
    const { accountId, status, comment } = req.body;
    if (!accountId || !status) return res.status(400).json({ error: 'Missing required fields' });
    if ((status === 'Rejected' || status === 'Reverted') && !String(comment || '').trim()) {
      return res.status(400).json({ error: 'Comment required for rejection/revert' });
    }

    const account = await ProjectAccount.findOne({ id: accountId });
    if (!account) return res.status(404).json({ error: 'Project account form not found' });
    const userStage = toStageFromDesignation(req.user.designation);
    if (!userStage || account.currentStage !== userStage) {
      return res.status(403).json({ error: 'Not authorized at this stage' });
    }

    let newStage = account.currentStage;
    let newStatus = account.status;
    if (status === 'Reverted') {
      newStage = 'PI';
      newStatus = 'Reverted';
    } else if (status === 'Rejected') {
      if (userStage !== 'FINANCE_OFFICER_MAIN') {
        return res.status(403).json({ error: 'Only Finance Officer Main can reject this form' });
      }
      newStage = 'COMPLETED';
      newStatus = 'Rejected';
    } else if (status === 'Approved') {
      if (userStage === 'HOD') newStage = 'DEAN';
      else if (userStage === 'DEAN') newStage = 'R&D_HELPER';
      else if (userStage === 'R&D_HELPER') newStage = 'R&D_MAIN';
      else if (userStage === 'R&D_MAIN') newStage = 'FINANCE_OFFICER_HELPER';
      else if (userStage === 'FINANCE_OFFICER_HELPER') newStage = 'FINANCE_OFFICER_MAIN';
      else if (userStage === 'FINANCE_OFFICER_MAIN') {
        newStage = 'COMPLETED';
        newStatus = 'Approved';
        await Project.updateOne({ id: account.projectId }, { $set: { lifecycleStatus: 'Ongoing' } });
      } else {
        return res.status(400).json({ error: 'Invalid approval action' });
      }
      if (newStatus !== 'Approved') newStatus = 'Pending';
    } else {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    account.currentStage = newStage;
    account.status = newStatus;
    await account.save();

    // If this action represents the account's FINAL approval (Finance
    // Officer Main approving moves it to COMPLETED with Approved status),
    // capture a full snapshot of the account exactly as it is right now.
    // This is what the "Project Accounts" section will show, regardless
    // of later changes (e.g. budget head deductions from approved indents).
    if (newStatus === 'Approved' && newStage === 'COMPLETED') {
      await saveAccountApprovalSnapshot(account);
    }

    await new ProjectAccountApprovalHistory({
      projectAccountId: accountId,
      stage: userStage,
      status,
      userName: req.user.name,
      userEmail: req.user.email,
      comment: comment || status
    }).save();

    const formatted = await formatAccountWithHistory(account);
    res.json(formatted);
  } catch (error) {
    console.error('Update project account status error:', error);
    res.status(500).json({ error: 'Failed to update project account form' });
  }
});

router.get('/download/:accountId', authMiddleware, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { documentType = 'sanctionedOrder', mode } = req.query;
    const account = await ProjectAccount.findOne({ id: accountId });
    if (!account) return res.status(404).json({ error: 'Project account form not found' });

    let fileUrl = null;
    if (documentType === 'sanctionedOrder') {
      fileUrl = account.documents?.sanctionedOrder;
    } else if (String(documentType).startsWith('supporting_')) {
      const idx = Number(String(documentType).split('_')[1] || 0);
      fileUrl = account.documents?.supportingDocuments?.[idx];
    }
    if (!fileUrl) return res.status(404).json({ error: 'Document not found' });

    const upstream = await fetch(fileUrl);
    if (!upstream.ok) return res.status(502).json({ error: 'Failed to fetch file from storage' });
    const ab = await upstream.arrayBuffer();
    const disposition = mode === 'view' ? 'inline' : 'attachment';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${documentType}-${accountId}.pdf"`);
    res.send(Buffer.from(ab));
  } catch (error) {
    console.error('Download project account document error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

module.exports = router;


