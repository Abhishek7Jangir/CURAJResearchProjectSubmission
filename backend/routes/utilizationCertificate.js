const express = require('express');
const UtilizationCertificate = require('../models/UtilizationCertificate');
const UtilizationCertificateApprovalHistory = require('../models/UtilizationCertificateApprovalHistory');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function toStageFromDesignation(designation) {
  const d = (designation || '').toLowerCase();
  const map = {
    finance_officer_helper: 'FINANCE_OFFICER_HELPER',
    finance_officer_main: 'FINANCE_OFFICER_MAIN',
    registrar: 'REGISTRAR'
  };
  return map[d] || null;
}

async function formatCertificateWithHistory(cert) {
  if (!cert) return null;
  const plain = cert.toObject ? cert.toObject() : { ...cert };
  const history = await UtilizationCertificateApprovalHistory.find({
    utilizationCertificateId: plain.id
  }).sort({ actionDate: 1 });
  return {
    ...plain,
    approvalHistory: history.map((h) => ({
      stage: h.stage,
      status: h.status,
      userName: h.userName,
      userEmail: h.userEmail,
      comment: h.comment,
      actionDate: h.actionDate
    }))
  };
}

function projectIsApprovedForUC(project) {
  return project && project.status === 'Approved' && ['Ongoing', 'Completed'].includes(project.lifecycleStatus);
}

// ── GET: my certificates (PI) ─────────────────────────────────────────────
router.get('/my-certificates', authMiddleware, async (req, res) => {
  try {
    const certs = await UtilizationCertificate.find({ submittedBy: req.user.email })
      .sort({ submittedDate: -1 });
    const out = await Promise.all(certs.map((c) => formatCertificateWithHistory(c)));
    res.json(out);
  } catch (error) {
    console.error('Get UC error:', error);
    res.status(500).json({ error: 'Failed to fetch utilization certificates' });
  }
});

// ── GET: for approval (FO Help, FO Main, Registrar) ─────────────────────────
router.get('/for-approval', authMiddleware, async (req, res) => {
  try {
    const userStage = toStageFromDesignation(req.user.designation);
    if (!userStage) {
      return res.status(403).json({ error: 'Not authorized to list utilization certificates' });
    }
    const certs = await UtilizationCertificate.find({}).sort({ submittedDate: -1 });
    const out = await Promise.all(certs.map((c) => formatCertificateWithHistory(c)));
    res.json(out);
  } catch (error) {
    console.error('Get UC for approval error:', error);
    res.status(500).json({ error: 'Failed to fetch utilization certificates' });
  }
});

// ── POST: submit ───────────────────────────────────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      projectId,
      fellowName,
      schemeName,
      financialYear,
      grantNature,
      openingCashInHand,
      openingUnadjustedAdvances,
      grantDetails,
      componentUtilization,
      closingCashInHand,
      closingUnadjustedAdvances,
      certificationChecks,
      certDate,
      certPlace,
      expenditureStatement,
      assetsAcquired,
      equipmentsProcured
    } = body;

    if (!projectId || !fellowName || !schemeName || !financialYear || !grantNature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'You can only submit certificates for your own projects' });
    }
    if (!projectIsApprovedForUC(project)) {
      return res.status(400).json({ error: 'Utilization certificate can only be submitted for approved projects' });
    }

    const ucId = `UC-${Date.now()}`;

    const cert = new UtilizationCertificate({
      id: ucId,
      projectId,
      projectTitle: project.title,
      fellowName,
      schemeName,
      financialYear,
      grantNature,
      openingCashInHand: openingCashInHand ?? 0,
      openingUnadjustedAdvances: openingUnadjustedAdvances ?? 0,
      grantDetails: grantDetails || [],
      componentUtilization: componentUtilization || {},
      closingCashInHand: closingCashInHand ?? 0,
      closingUnadjustedAdvances: closingUnadjustedAdvances ?? 0,
      certificationChecks: Array.isArray(certificationChecks) ? certificationChecks : Array(9).fill(false),
      certDate: certDate ? new Date(certDate) : undefined,
      certPlace: certPlace || '',
      expenditureStatement: expenditureStatement || {},
      assetsAcquired: assetsAcquired || {},
      equipmentsProcured: equipmentsProcured || [],
      submittedBy: req.user.email,
      status: 'Pending',
      currentStage: 'FINANCE_OFFICER_HELPER',
      forwardedTo: null
    });

    await cert.save();

    const formatted = await formatCertificateWithHistory(cert);
    res.status(201).json(formatted);
  } catch (error) {
      console.error('Submit UC error:', error);
      // If Mongoose validation fails (missing fields), send a 400 instead of 500
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed. Please fill all required fields.', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to submit utilization certificate' });
  }
});

// ── POST: resubmit (PI, Reverted only) ───────────────────────────────────────
router.post('/resubmit', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const { certificateId } = body;
    if (!certificateId) {
      return res.status(400).json({ error: 'certificateId is required' });
    }

    const cert = await UtilizationCertificate.findOne({ id: certificateId });
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    if (cert.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (cert.status !== 'Reverted' || cert.currentStage !== 'PI') {
      return res.status(400).json({ error: 'Only reverted certificates can be resubmitted' });
    }

    const project = await Project.findOne({ id: cert.projectId });
    if (!project || !projectIsApprovedForUC(project)) {
      return res.status(400).json({ error: 'Associated project must still be approved' });
    }

    const {
      fellowName,
      schemeName,
      financialYear,
      grantNature,
      openingCashInHand,
      openingUnadjustedAdvances,
      grantDetails,
      componentUtilization,
      closingCashInHand,
      closingUnadjustedAdvances,
      certificationChecks,
      certDate,
      certPlace,
      expenditureStatement,
      assetsAcquired,
      equipmentsProcured
    } = body;

    if (!fellowName || !schemeName || !financialYear || !grantNature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    cert.fellowName = fellowName;
    cert.schemeName = schemeName;
    cert.financialYear = financialYear;
    cert.grantNature = grantNature;
    cert.openingCashInHand = openingCashInHand ?? 0;
    cert.openingUnadjustedAdvances = openingUnadjustedAdvances ?? 0;
    cert.grantDetails = grantDetails || [];
    cert.componentUtilization = componentUtilization || {};
    cert.closingCashInHand = closingCashInHand ?? 0;
    cert.closingUnadjustedAdvances = closingUnadjustedAdvances ?? 0;
    cert.certificationChecks = Array.isArray(certificationChecks) ? certificationChecks : Array(9).fill(false);
    cert.certDate = certDate ? new Date(certDate) : undefined;
    cert.certPlace = certPlace || '';
    cert.expenditureStatement = expenditureStatement || {};
    cert.assetsAcquired = assetsAcquired || {};
    cert.equipmentsProcured = equipmentsProcured || [];
    cert.status = 'Pending';
    cert.currentStage = 'FINANCE_OFFICER_HELPER';
    cert.forwardedTo = null;

    await cert.save();

    const formatted = await formatCertificateWithHistory(cert);
    res.json(formatted);
  } catch (error) {
      console.error('Resubmit UC error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed during resubmission.', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to resubmit utilization certificate' });
  }
});

// ── POST: update status (forward / approve / reject / revert) ─────────────
router.post('/update-status', authMiddleware, async (req, res) => {
  try {
    const { certificateId, status, comment } = req.body;
    if (!certificateId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if ((status === 'Rejected' || status === 'Reverted') && !comment) {
      return res.status(400).json({ error: 'Comment required for rejection or revert' });
    }

    const cert = await UtilizationCertificate.findOne({ id: certificateId });
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const userStage = toStageFromDesignation(req.user.designation);
    if (!userStage) {
      return res.status(403).json({ error: 'Not authorized to act on utilization certificates' });
    }

    if (cert.status !== 'Pending' || cert.currentStage !== userStage) {
      return res.status(403).json({ error: 'Not authorized to approve at this stage' });
    }

    let newStatus = cert.status;
    let newStage = cert.currentStage;

    if (status === 'Approved') {
      if (userStage === 'FINANCE_OFFICER_HELPER') {
        newStage = 'FINANCE_OFFICER_MAIN';
        newStatus = 'Pending';
      } else if (userStage === 'FINANCE_OFFICER_MAIN') {
        newStage = 'REGISTRAR';
        newStatus = 'Pending';
      } else if (userStage === 'REGISTRAR') {
        newStage = 'COMPLETED';
        newStatus = 'Approved';
        await Project.updateOne({ id: cert.projectId }, { $set: { lifecycleStatus: 'Completed' } });
      } else {
        return res.status(400).json({ error: 'Invalid approval action for current stage' });
      }
    } else if (status === 'Rejected') {
      if (userStage !== 'REGISTRAR') {
        return res.status(403).json({ error: 'Only Registrar can reject utilization certificates' });
      }
      newStage = 'COMPLETED';
      newStatus = 'Rejected';
    } else if (status === 'Reverted') {
      newStage = 'PI';
      newStatus = 'Reverted';
      cert.forwardedTo = null;
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    cert.status = newStatus;
    cert.currentStage = newStage;
    await cert.save();

    const historyStatus =
      status === 'Approved' && userStage !== 'REGISTRAR'
        ? 'Forwarded'
        : status;

    await new UtilizationCertificateApprovalHistory({
      utilizationCertificateId: certificateId,
      stage: userStage,
      status: historyStatus,
      userName: req.user.name,
      userEmail: req.user.email,
      comment:
        comment ||
        (status === 'Approved' && userStage === 'REGISTRAR'
          ? 'Approved'
          : status === 'Rejected'
            ? 'Rejected'
            : status === 'Reverted'
              ? 'Reverted'
              : 'Forwarded')
    }).save();

    const formatted = await formatCertificateWithHistory(cert);
    res.json(formatted);
  } catch (error) {
      console.error('UC update-status error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Update failed due to data validation errors.', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to update utilization certificate' });
  }
});

// ── GET: single by id ───────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cert = await UtilizationCertificate.findOne({ id: req.params.id });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    const userStage = toStageFromDesignation(req.user.designation);
    const isOwner = cert.submittedBy === req.user.email;
    const isApprover = !!userStage;
    if (!isOwner && !isApprover) {
      return res.status(403).json({ error: 'Not authorized to view this certificate' });
    }

    const formatted = await formatCertificateWithHistory(cert);
    res.json(formatted);
  } catch (error) {
    console.error('Get UC by id error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

module.exports = router;
