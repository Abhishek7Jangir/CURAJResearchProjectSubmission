const express = require('express');
const EquipmentRequest = require('../models/EquipmentRequest');
const EquipmentApprovalHistory = require('../models/EquipmentApprovalHistory');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// Maps the human-readable budget head label used in the Indent form
// (e.g. "Consumables") to the lowercase key used on Project.budgetHeads
// (e.g. "consumables"). Used to look up / deduct the correct per-head balance.
const BUDGET_HEAD_KEY_MAP = {
  equipment: 'equipment',
  manpower: 'manpower',
  consumables: 'consumables',
  travel: 'travel',
  contingency: 'contingency',
  overhead: 'overhead',
  others: 'others'
};

function getBudgetHeadKey(budgetHead) {
  if (!budgetHead) return null;
  const normalized = String(budgetHead).trim().toLowerCase();
  return BUDGET_HEAD_KEY_MAP[normalized] || null;
}

const DESIGNATION_TO_STAGE = {
  hod: 'HOD',
  dean: 'DEAN',
  'r&d_helper': 'R&D_HELPER',
  rnd_helper: 'R&D_HELPER',
  'r&d_main': 'R&D_MAIN',
  rnd_main: 'R&D_MAIN',
  academic_integrity_officer: 'ACADEMIC_INTEGRITY_OFFICER',
  aio: 'ACADEMIC_INTEGRITY_OFFICER',
  finance_officer_helper: 'FINANCE_OFFICER_HELPER',
  finance_officer_main: 'FINANCE_OFFICER_MAIN',
  registrar: 'REGISTRAR',
  vc_office: 'VC_OFFICE',
  vc: 'VICE_CHANCELLOR',
  vice_chancellor: 'VICE_CHANCELLOR'
};

const ENCLOSURE_KEYS = [
  'draftPO',
  'gemNonAvailability',
  'deptNonAvailability',
  'sanctionLetter',
  'rateContractNACertificate',
  'quotationProof',
  'equipmentProof',
  'conferenceInvite'
];

function toStageFromDesignation(designation = '') {
  const key = String(designation || '').toLowerCase();
  return DESIGNATION_TO_STAGE[key] || String(designation || '').toUpperCase();
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,');
}

function sanitizeFileName(name, fallback) {
  const base = String(name || fallback || 'document').trim();
  return base.replace(/[^\w.\-]/g, '_');
}

async function uploadDataUrlToCloudinary(dataUrl, fileName, folder = 'project-grant-enclosures') {
  if (!isDataUrl(dataUrl)) return null;
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return null;
  const fileBuffer = Buffer.from(base64Data, 'base64');
  const result = await uploadToCloudinary(fileBuffer, sanitizeFileName(fileName, 'document'), folder);
  return result.url;
}

function mapRAndDMainForwardChoice(forwardedTo = '') {
  const normalized = String(forwardedTo || '').trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === 'ACADEMIC_INTEGRITY_OFFICER' || normalized === 'AIO') return 'ACADEMIC_INTEGRITY_OFFICER';
  if (normalized === 'FINANCE_OFFICER_HELPER' || normalized === 'FINANCE_OFFICER' || normalized === 'FO') return 'FINANCE_OFFICER_HELPER';
  if (normalized === 'REGISTRAR') return 'REGISTRAR';
  if (normalized === 'VC_OFFICE' || normalized === 'VICE_CHANCELLOR' || normalized === 'VC') return 'VC_OFFICE';
  return null;
}

function mapFinanceMainForwardChoice(forwardedTo = '') {
  const normalized = String(forwardedTo || '').trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === 'REGISTRAR') return 'REGISTRAR';
  if (normalized === 'VC_OFFICE' || normalized === 'VICE_CHANCELLOR' || normalized === 'VC') return 'VC_OFFICE';
  return null;
}

async function buildEnclosuresFromPayload(enclosures = {}, existingEnclosures = {}) {
  const result = { ...existingEnclosures };
  for (const key of ENCLOSURE_KEYS) {
    const value = enclosures?.[key];
    if (!value) {
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = null;
      }
      continue;
    }
    if (isDataUrl(value)) {
      const uploadedUrl = await uploadDataUrlToCloudinary(
        value,
        `${key}-${Date.now()}.pdf`,
        'project-grant-enclosures'
      );
      result[key] = uploadedUrl;
    } else if (typeof value === 'string') {
      // Keep already uploaded URLs unchanged during resubmission.
      result[key] = value;
    }
  }
  return result;
}

// Helper function to format project grant with history
async function formatEquipmentRequestWithHistory(request) {
  const history = await EquipmentApprovalHistory.find({ equipmentRequestId: request.id })
    .sort({ actionDate: 1 });

  const stageLabel =
    request.status === 'Rejected'
      ? 'Rejected'
      : request.currentStage === 'COMPLETED'
      ? 'Approved'
      : request.currentStage;

  return {
    id: request.id,
    projectId: request.projectId,
    projectTitle: request.projectTitle,
    // For backward‑compatible UI fields
    equipmentName: request.items?.[0]?.itemName || `${request.grantType} Project Grant`,
    quantity: request.items?.[0]?.quantity || null,
    unitPrice: request.items?.[0]?.rate || null,
    totalAmount: request.totalAmount,
    // Expose full grant details for new UI
    grantType: request.grantType,
    budgetHead: request.budgetHead,
    amountSanctioned: request.amountSanctioned,
    availableBalance: request.availableBalance,
    procurementMode: request.procurementMode,
    items: request.items,
    enclosures: request.enclosures,
    requestType: request.requestType,
    billUploaded: request.billUploaded,
    billFileUrl: request.billFileUrl,
    billFileName: request.billFileName,
    billUploadDate: request.billUploadDate,
    submittedBy: request.submittedBy,
    submittedDate: request.submittedDate,
    status: request.status,
    currentStage: stageLabel,
    forwardedTo: request.forwardedTo,
    approvalHistory: history.map(h => ({
      stage: h.stage,
      status: h.status,
      user: h.userName,
      date: h.actionDate.toISOString().split('T')[0],
      comment: h.comment
    }))
  };
}

// Get resource allotment requests for the logged-in user
router.get('/my-requests', authMiddleware, async (req, res) => {
  try {
    const requests = await EquipmentRequest.find({ submittedBy: req.user.email })
      .sort({ submittedDate: -1 });

    const formattedRequests = await Promise.all(
      requests.map(request => formatEquipmentRequestWithHistory(request))
    );

    res.json(formattedRequests);
  } catch (error) {
    console.error('Get resource allotment requests error:', error);
    res.status(500).json({ error: 'Failed to fetch resource allotment requests' });
  }
});

// Get resource allotment requests for approval (for HOD, Dean, etc.)
router.get('/for-approval', authMiddleware, async (req, res) => {
  try {
    const userStage = toStageFromDesignation(req.user.designation);

    // HOD and Dean can only see resource allotment requests from their own department
    let departmentProjectIds = null;
    if (userStage === 'HOD' || userStage === 'DEAN') {
      const userDepartment = req.user.department;
      if (!userDepartment || userDepartment === 'N/A') {
        return res.status(403).json({ error: 'Department not assigned to your account' });
      }
      const deptProjects = await Project.find({ piDepartment: userDepartment }).select('id');
      departmentProjectIds = deptProjects.map((p) => p.id);
    }

    const stageQuery = { currentStage: userStage };
    if (departmentProjectIds !== null) {
      stageQuery.projectId = { $in: departmentProjectIds };
    }

    // Get equipment requests at this user's stage OR requests this user has already reviewed
    const requestsAtStage = await EquipmentRequest.find(stageQuery)
      .sort({ submittedDate: -1 });

    const reviewedRequestIds = await EquipmentApprovalHistory.find({ 
      stage: userStage,
      userEmail: req.user.email
    }).distinct('equipmentRequestId');

    const reviewedQuery = { id: { $in: reviewedRequestIds } };
    if (departmentProjectIds !== null) {
      reviewedQuery.projectId = { $in: departmentProjectIds };
    }

    const reviewedRequests = await EquipmentRequest.find(reviewedQuery)
      .sort({ submittedDate: -1 });

    // Combine and remove duplicates
    const allRequestIds = new Set();
    const uniqueRequests = [];
    
    [...requestsAtStage, ...reviewedRequests].forEach(request => {
      if (!allRequestIds.has(request.id)) {
        allRequestIds.add(request.id);
        uniqueRequests.push(request);
      }
    });

    const requestsWithHistory = await Promise.all(
      uniqueRequests.map(request => formatEquipmentRequestWithHistory(request))
    );

    res.json(requestsWithHistory);
  } catch (error) {
    console.error('Get resource allotment requests for approval error:', error);
    res.status(500).json({ error: 'Failed to fetch resource allotment requests' });
  }
});

// Submit project grant (Module 3: Indent for Project Grant)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const {
      projectId,
      grantType,
      budgetHead,
      amountSanctioned,
      availableBalance,
      procurementMode,
      items,
      totalAmount,
      enclosures,
      requestType
    } = req.body;

    if (!projectId || !grantType || !budgetHead || !procurementMode || !items || !Array.isArray(items) || items.length === 0 || !totalAmount || !requestType) {
      return res.status(400).json({ error: 'Missing required fields for project grant' });
    }

    // Get project details for validation and title
    const project = await Project.findOne({ id: projectId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized for this project' });
    }
    if (project.status !== 'Approved' || project.lifecycleStatus !== 'Ongoing') {
      return res.status(400).json({ error: 'Resource allotment is allowed only for ongoing projects' });
    }

    const budgetHeadKey = getBudgetHeadKey(budgetHead);
    if (!budgetHeadKey) {
      return res.status(400).json({ error: 'Invalid budget head selected' });
    }
    const headAvailableBalance = Number(project.budgetHeads?.[budgetHeadKey] ?? 0);

    if (headAvailableBalance < totalAmount) {
      return res.status(400).json({
        error: `Insufficient budget under "${budgetHead}" head. Available: ₹${headAvailableBalance.toLocaleString()}`
      });
    }

    const requestId = `PG-${Date.now()}`;
    const uploadedEnclosures = await buildEnclosuresFromPayload(enclosures || {}, {});

    // Create project grant with Pending status at HOD stage
    const grant = new EquipmentRequest({
      id: requestId,
      projectId,
      projectTitle: project.title,
      grantType,
      budgetHead,
      amountSanctioned: headAvailableBalance,
      availableBalance: headAvailableBalance,
      procurementMode,
      items,
      totalAmount,
      enclosures: uploadedEnclosures,
      requestType,
      submittedBy: req.user.email,
      status: 'Pending',
      currentStage: 'HOD'
    });

    await grant.save();

    const formattedRequest = await formatEquipmentRequestWithHistory(grant);
    res.status(201).json(formattedRequest);
  } catch (error) {
    console.error('Submit resource allotment request error:', error);
    res.status(500).json({ error: 'Failed to submit resource allotment request' });
  }
});

// Resubmit a reverted equipment request by PI
router.post('/resubmit', authMiddleware, async (req, res) => {
  try {
    const {
      equipmentRequestId,
      projectId,
      grantType,
      budgetHead,
      amountSanctioned,
      availableBalance,
      procurementMode,
      items,
      totalAmount,
      enclosures,
      requestType
    } = req.body;

    if (!equipmentRequestId || !projectId || !grantType || !budgetHead || !procurementMode || !Array.isArray(items) || items.length === 0 || !totalAmount || !requestType) {
      return res.status(400).json({ error: 'Missing required fields for request resubmission' });
    }

    const request = await EquipmentRequest.findOne({ id: equipmentRequestId });
    if (!request) {
      return res.status(404).json({ error: 'Resource allotment request not found' });
    }
    if (request.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to resubmit this request' });
    }
    if (request.status !== 'Reverted') {
      return res.status(400).json({ error: 'Only reverted requests can be resubmitted' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized for this project' });
    }
    if (project.status !== 'Approved' || project.lifecycleStatus !== 'Ongoing') {
      return res.status(400).json({ error: 'Resource allotment is allowed only for ongoing projects' });
    }
    const budgetHeadKey = getBudgetHeadKey(budgetHead);
    if (!budgetHeadKey) {
      return res.status(400).json({ error: 'Invalid budget head selected' });
    }
    const headAvailableBalance = Number(project.budgetHeads?.[budgetHeadKey] ?? 0);
    if (headAvailableBalance < totalAmount) {
      return res.status(400).json({
        error: `Insufficient budget under "${budgetHead}" head. Available: ₹${headAvailableBalance.toLocaleString()}`
      });
    }

    const uploadedEnclosures = await buildEnclosuresFromPayload(enclosures || {}, request.enclosures || {});

    Object.assign(request, {
      projectId,
      projectTitle: project.title,
      grantType,
      budgetHead,
      amountSanctioned: headAvailableBalance,
      availableBalance: headAvailableBalance,
      procurementMode,
      items,
      totalAmount,
      enclosures: uploadedEnclosures,
      requestType,
      status: 'Pending',
      currentStage: 'HOD',
      forwardedTo: null
    });

    await request.save();

    const formattedRequest = await formatEquipmentRequestWithHistory(request);
    res.json(formattedRequest);
  } catch (error) {
    console.error('Resubmit resource allotment request error:', error);
    res.status(500).json({ error: 'Failed to resubmit resource allotment request' });
  }
});

// Update resource allotment request status (approve/reject/revert)
router.post('/update-status', authMiddleware, async (req, res) => {
  try {
    const { equipmentRequestId, status, comment, forwardedTo } = req.body;

    if (!equipmentRequestId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if ((status === 'Rejected' || status === 'Reverted') && !comment) {
      return res.status(400).json({ error: 'Comment required for rejection/revert' });
    }

    const request = await EquipmentRequest.findOne({ id: equipmentRequestId });

    if (!request) {
      return res.status(404).json({ error: 'Resource allotment request not found' });
    }

    const userStage = toStageFromDesignation(req.user.designation);
    
    if (request.currentStage !== userStage) {
      return res.status(403).json({ error: 'Not authorized to approve at this stage' });
    }

    let newStatus = request.status;
    let newStage = request.currentStage;

    // Only Vice Chancellor can reject or approve (final approval)
    const isViceChancellor = userStage === 'VICE_CHANCELLOR';
    
    // Check if user can reject (only VC)
    if (status === 'Rejected' && !isViceChancellor) {
      return res.status(403).json({ error: 'Only Vice Chancellor can reject resource allotment requests' });
    }

    // Handle revert - all approvers can revert, returns to PI for resubmission.
    if (status === 'Reverted') {
      newStage = 'HOD';
      newStatus = 'Reverted';
      request.forwardedTo = null;
    }
    // Handle approval
    else if (status === 'Approved') {
      if (userStage === 'HOD') {
        newStage = 'DEAN';
        newStatus = 'Pending';
      } else if (userStage === 'DEAN') {
        newStage = 'R&D_HELPER';
        newStatus = 'Pending';
      } else if (userStage === 'R&D_HELPER') {
        newStage = 'R&D_MAIN';
        newStatus = 'Pending';
      } else if (userStage === 'R&D_MAIN') {
        const targetStage = mapRAndDMainForwardChoice(forwardedTo);
        if (!targetStage) {
          return res.status(400).json({
            error: 'R&D Main must select one forwarding option: IAO, Finance Officer, Registrar, or Vice Chancellor.'
          });
        }
        newStage = targetStage;
        newStatus = 'Pending';
        request.forwardedTo = targetStage;
      } else if (userStage === 'ACADEMIC_INTEGRITY_OFFICER') {
        newStage = 'FINANCE_OFFICER_HELPER';
        newStatus = 'Pending';
      } else if (userStage === 'FINANCE_OFFICER_HELPER') {
        newStage = 'FINANCE_OFFICER_MAIN';
        newStatus = 'Pending';
      } else if (userStage === 'FINANCE_OFFICER_MAIN') {
        const targetStage = mapFinanceMainForwardChoice(forwardedTo);
        if (!targetStage) {
          return res.status(400).json({
            error: 'Finance Officer Main must select forwarding option: Registrar or Vice Chancellor.'
          });
        }
        newStage = targetStage;
        newStatus = 'Pending';
        request.forwardedTo = targetStage;
      } else if (userStage === 'REGISTRAR') {
        newStage = 'VC_OFFICE';
        newStatus = 'Pending';
      } else if (userStage === 'VC_OFFICE') {
        newStage = 'VICE_CHANCELLOR';
        newStatus = 'Pending';
      } else if (isViceChancellor) {
        newStage = 'COMPLETED';
        newStatus = 'Approved';

        // Deduct budget from project only when VC gives final approval.
        // Deduction happens at BOTH levels:
        //   1. The specific budget head the indent was raised against
        //   2. The project's overall available budget
        const project = await Project.findOne({ id: request.projectId });
        if (!project) {
          return res.status(404).json({ error: 'Associated project not found' });
        }

        const budgetHeadKey = getBudgetHeadKey(request.budgetHead);
        if (!budgetHeadKey) {
          return res.status(400).json({ error: 'Invalid budget head on this request' });
        }
        const headAvailableBalance = Number(project.budgetHeads?.[budgetHeadKey] ?? 0);

        if (headAvailableBalance < request.totalAmount) {
          return res.status(400).json({
            error: `Insufficient budget under "${request.budgetHead}" head. Available: ₹${headAvailableBalance.toLocaleString()}`
          });
        }
        if (project.availableBudget < request.totalAmount) {
          return res.status(400).json({
            error: `Insufficient overall project budget. Available: ₹${project.availableBudget.toLocaleString()}`
          });
        }

        project.budgetHeads[budgetHeadKey] = headAvailableBalance - request.totalAmount;
        project.availableBudget -= request.totalAmount;
        await project.save();
      } else {
        return res.status(400).json({ error: 'Invalid approval action for current stage' });
      }
    }
    // Handle rejection (only VC can do this)
    else if (status === 'Rejected') {
      newStatus = 'Rejected';
      newStage = 'COMPLETED';
    }

    // Update resource allotment request
    request.status = newStatus;
    request.currentStage = newStage;
    await request.save();

    // Add to approval history
    const approvalHistory = new EquipmentApprovalHistory({
      equipmentRequestId: equipmentRequestId,
      stage: userStage,
      status: status,
      userName: req.user.name,
      userEmail: req.user.email,
      comment: comment || (status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Reverted')
    });

    await approvalHistory.save();

    const formattedRequest = await formatEquipmentRequestWithHistory(request);
    res.json(formattedRequest);
  } catch (error) {
    console.error('Update resource allotment request status error:', error);
    res.status(500).json({ error: 'Failed to update resource allotment request status' });
  }
});

// Download any uploaded enclosure / bill by request id
router.get('/download/:equipmentRequestId', authMiddleware, async (req, res) => {
  try {
    const { equipmentRequestId } = req.params;
    const { documentType, mode } = req.query;

    const request = await EquipmentRequest.findOne({ id: equipmentRequestId });
    if (!request) {
      return res.status(404).json({ error: 'Resource allotment request not found' });
    }

    // Only the submitting PI or an approver role can download indent documents
    const approverRoles = ['hod','dean','r&d_helper','r&d_main','academic_integrity_officer',
      'aio','finance_officer_helper','finance_officer_main','registrar','vc_office','vice_chancellor'];
    const isApprover = approverRoles.includes((req.user.designation || '').toLowerCase());
    if (request.submittedBy !== req.user.email && !isApprover) {
      return res.status(403).json({ error: 'Not authorized to download this document' });
    }

    const fileUrl =
      documentType === 'bill'
        ? request.billFileUrl
        : request.enclosures?.[documentType];

    if (!fileUrl) {
      return res.status(404).json({ error: 'Document not found for this request' });
    }

    const upstream = await fetch(fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Failed to fetch document from storage' });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const downloadName = `${documentType || 'document'}-${equipmentRequestId}.pdf`;
    const disposition = mode === 'view' ? 'inline' : 'attachment';

    // Keep equipment document behavior consistent with proposal docs.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${downloadName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download equipment document error:', error);
    res.status(500).json({ error: 'Failed to download equipment document' });
  }
});

// Upload bill after equipment purchase (proof of work)
router.post('/upload-bill', authMiddleware, async (req, res) => {
  try {
    const { grantId, billFileName, billFileData, billFileType } = req.body;

    if (!grantId || !billFileData) {
      return res.status(400).json({ error: 'Missing required fields: grantId and bill file' });
    }

    const grant = await EquipmentRequest.findOne({ id: grantId });

    if (!grant) {
      return res.status(404).json({ error: 'Project grant not found' });
    }

    // Check if user is authorized (must be the submitter)
    if (grant.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to upload bill for this grant' });
    }

    // Check if grant is approved and fund is released
    if (!['Approved - Fund Released', 'Approved'].includes(grant.status)) {
      return res.status(400).json({ error: 'Bill can only be uploaded after fund is released' });
    }

    // Upload bill to Cloudinary
    let billFileUrl = null;
    let billCloudinaryPublicId = null;

    if (billFileData) {
      try {
        const base64Data = billFileData.replace(/^data:.*;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');
        
        const uploadResult = await uploadToCloudinary(
          fileBuffer,
          billFileName || 'bill.pdf',
          'project-grant-bills'
        );
        
        billFileUrl = uploadResult.url;
        billCloudinaryPublicId = uploadResult.publicId;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload bill to Cloudinary' });
      }
    }

    // Update grant with bill information
    grant.billUploaded = true;
    grant.billFileUrl = billFileUrl;
    grant.billFileName = billFileName || 'bill.pdf';
    grant.billUploadDate = new Date();
    grant.status = 'Bill Uploaded';
    
    await grant.save();

    const formattedGrant = await formatEquipmentRequestWithHistory(grant);
    res.json(formattedGrant);
  } catch (error) {
    console.error('Upload bill error:', error);
    res.status(500).json({ error: 'Failed to upload bill' });
  }
});

module.exports = router;
