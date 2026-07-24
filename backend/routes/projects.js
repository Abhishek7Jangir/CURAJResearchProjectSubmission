const express = require('express');
const Project = require('../models/Project');
const ApprovalHistory = require('../models/ApprovalHistory');
const ProjectCounter = require('../models/ProjectCounter');
const UtilizationCertificate = require('../models/UtilizationCertificate');
const ProjectApprovalSnapshot = require('../models/ProjectApprovalSnapshot');
const ProjectAccount = require('../models/ProjectAccount');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const authMiddleware = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

function isPdfDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:application/pdf;base64,');
}

async function uploadPdfDataUrl(dataUrl, fileName, folder = 'research-proposals') {
  if (!isPdfDataUrl(dataUrl)) {
    throw new Error('Only PDF files are allowed');
  }
  const base64Data = dataUrl.replace(/^data:application\/pdf;base64,/, '');
  const fileBuffer = Buffer.from(base64Data, 'base64');
  const uploadResult = await uploadToCloudinary(fileBuffer, fileName, folder);
  return uploadResult.url;
}

// Helper function to format project with history
async function formatProjectWithHistory(project) {
  const history = await ApprovalHistory.find({ projectId: project.id })
    .sort({ actionDate: 1 });

  return {
    id: project.id,
    title: project.title,
    fundingAgency: project.fundingAgency,
    schemeCallRefNo: project.schemeCallRefNo,
    pi: project.pi,
    principalInvestigator: project.pi, // Alias for compatibility
    piDesignation: project.piDesignation,
    piDepartment: project.piDepartment,
    coPi: project.coPi,
    collaboratingInstitute: project.collaboratingInstitute,
    projectStartDate: project.projectStartDate,
    projectEndDate: project.projectEndDate,
    totalBudget: project.totalBudget,
    budget: project.totalBudget, // Alias for compatibility
    availableBudget: project.availableBudget,
    budgetHeads: project.budgetHeads,
    duration: project.duration,
    fundingAgencyFormatFollowed: project.fundingAgencyFormatFollowed,
    aiUsagePercentage: project.aiUsagePercentage,
    plagiarismPercentage: project.plagiarismPercentage,
    summary: project.summary,
    submittedBy: project.submittedBy,
    submittedDate: project.submittedDate,
    status: project.status,
    lifecycleStatus: project.lifecycleStatus || (project.status === 'Approved' ? 'Approved' : 'Pending'),
    currentStage: project.currentStage,
    forwardedTo: project.forwardedTo,
    workflowVersion: project.workflowVersion || 'v1',
    documents: project.documents ? {
      completeProposal: project.documents.completeProposal || project.fileUrl || null,
      endorsementLetter: project.documents.endorsementLetter || null,
      piCoPiUndertaking: project.documents.piCoPiUndertaking || null,
      institutionalForwardingLetter: project.documents.institutionalForwardingLetter || null,
      otherSupportingDocs: project.documents.otherSupportingDocs || []
    } : {
      completeProposal: project.fileUrl || null,
      endorsementLetter: null,
      piCoPiUndertaking: null,
      institutionalForwardingLetter: null,
      otherSupportingDocs: []
    },
    fileName: project.fileName,
    fileUrl: project.fileUrl,
    fileType: project.fileType,
    cloudinaryPublicId: project.cloudinaryPublicId,
    budgetUpdateRequests: project.budgetUpdateRequests || [],
    approvalHistory: history.map(h => ({
      stage: h.stage,
      status: h.status,
      user: h.userName,
      date: h.actionDate.toISOString().split('T')[0],
      comment: h.comment
    }))
  };
}

// Save a full snapshot of the project's formatted data at the moment of
// FINAL approval. If a snapshot already exists for this project (e.g. it
// went through a budget revision and was re-approved), it is overwritten
// with the latest final-approval state.
// Maps the Project Account's budget head field names (e.g. "consumable")
// to the Project model's budget head field names (e.g. "consumables").
const ACCOUNT_TO_PROJECT_HEAD_MAP = {
  equipment: 'equipment',
  manpower: 'manpower',
  consumable: 'consumables',
  travel: 'travel',
  contingency: 'contingency',
  overhead: 'overhead',
  othersIfAny: 'others'
};

// Computes, for a given project, a per-budget-head breakdown of:
//   - sanctioned: the total amount ever allocated to that head
//     (balance brought forward + any new grant added), from the most
//     recently APPROVED Project Account (Module 2 / Budget Bifurcation).
//   - available: what's currently left under that head right now
//     (Project.budgetHeads, which gets reduced as indents are approved).
//
// This is always computed fresh/live (not frozen at project-approval
// time), because a Project Account is usually opened AFTER the project
// itself is approved — so it may not exist yet when the project's
// approval snapshot is first taken.
//
// Returns null if no approved Project Account exists yet for this project.
async function getBudgetHeadsDetailed(project) {
  const approvedAccount = await ProjectAccount.findOne({
    projectId: project.id,
    status: 'Approved',
    currentStage: 'COMPLETED'
  }).sort({ submittedDate: -1 });

  if (!approvedAccount) {
    return null;
  }

  const budgetHeadsDetailed = {};
  for (const [accountKey, projectKey] of Object.entries(ACCOUNT_TO_PROJECT_HEAD_MAP)) {
    const row = approvedAccount.budgetHeads?.[accountKey] || {};
    budgetHeadsDetailed[projectKey] = {
      sanctioned: Number(row.balanceAsPerUCSE || 0) + Number(row.bifurcationNewGrant || 0),
      available: Number(project.budgetHeads?.[projectKey] || 0)
    };
  }
  return budgetHeadsDetailed;
}

async function saveProjectApprovalSnapshot(project, approvedByStage) {
  try {
    const formatted = await formatProjectWithHistory(project);

    await ProjectApprovalSnapshot.findOneAndUpdate(
      { projectId: project.id },
      {
        projectId: project.id,
        snapshot: formatted,
        approvedAt: new Date(),
        approvedByStage
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Snapshot failure should never block the actual approval action.
    console.error('Failed to save project approval snapshot:', err);
  }
}

// Get all projects for the logged-in user
router.get('/my-projects', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ submittedBy: req.user.email })
      .sort({ submittedDate: -1 });

    const projectsWithHistory = await Promise.all(
      projects.map(project => formatProjectWithHistory(project))
    );

    res.json(projectsWithHistory);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get the snapshot of a project's data as it was at the moment of its
// FINAL approval (used by the "My Projects" section to show historical,
// as-approved details rather than the live, possibly-changed values).
router.get('/approval-snapshot/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized for this project' });
    }

    const snapshotDoc = await ProjectApprovalSnapshot.findOne({ projectId });
    if (!snapshotDoc) {
      return res.status(404).json({ error: 'No approval snapshot found for this project yet' });
    }

    // Budget head sanctioned/available breakdown is always computed LIVE
    // (not frozen in the snapshot), since the Project Account is often
    // opened after the project itself is approved.
    const budgetHeadsDetailed = await getBudgetHeadsDetailed(project);
    const responsePayload = { ...snapshotDoc.snapshot };
    if (budgetHeadsDetailed) {
      responsePayload.budgetHeadsDetailed = budgetHeadsDetailed;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Get project approval snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch project approval snapshot' });
  }
});

// Professor requests a project budget update (only for approved projects)
router.post('/request-budget-update', authMiddleware, async (req, res) => {
  try {
    const { projectId, newTotalBudget, reason, supportingDocs } = req.body;

    if (!projectId || !newTotalBudget || !reason) {
      return res.status(400).json({ error: 'projectId, newTotalBudget and reason are required' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to request budget update for this project' });
    }

    if (project.status !== 'Approved') {
      return res.status(400).json({ error: 'Budget update can only be requested for approved projects' });
    }

    const numericNewBudget = Number(newTotalBudget);
    if (!Number.isFinite(numericNewBudget) || numericNewBudget <= 0) {
      return res.status(400).json({ error: 'newTotalBudget must be a positive number' });
    }

    const oldTotalBudget = project.totalBudget || 0;
    const difference = numericNewBudget - oldTotalBudget;

    // Upload any supporting documents (base64) to Cloudinary
    let uploadedSupportingDocs = [];
    if (Array.isArray(supportingDocs) && supportingDocs.length > 0) {
      try {
        const uploadPromises = supportingDocs.map(async (docBase64, index) => {
          if (!docBase64) return null;
          const base64Data = docBase64.replace(/^data:.*;base64,/, '');
          const fileBuffer = Buffer.from(base64Data, 'base64');
          const uploadResult = await uploadToCloudinary(
            fileBuffer,
            `budget-update-supporting-${projectId}-${Date.now()}-${index}.pdf`,
            'budget-update-supporting'
          );
          return uploadResult.url;
        });
        const results = await Promise.all(uploadPromises);
        uploadedSupportingDocs = results.filter(Boolean);
      } catch (err) {
        console.error('Budget update supporting docs upload error:', err);
        return res.status(500).json({ error: 'Failed to upload supporting documents' });
      }
    }

    const requestEntry = {
      oldTotalBudget,
      requestedTotalBudget: numericNewBudget,
      difference,
      reason,
      supportingDocs: uploadedSupportingDocs,
      status: 'Pending',
      requestedBy: req.user.email,
      requestedByName: req.user.name
    };

    project.budgetUpdateRequests.push(requestEntry);
    await project.save();

    const formattedProject = await formatProjectWithHistory(project);
    res.status(201).json(formattedProject);
  } catch (error) {
    console.error('Request budget update error:', error);
    res.status(500).json({ error: 'Failed to request budget update' });
  }
});

// R&D_MAIN handles a budget update request (approve/reject)
router.post('/update-budget', authMiddleware, async (req, res) => {
  try {
    const { projectId, requestId, action, comment } = req.body;

    if (!projectId || !requestId || !action) {
      return res.status(400).json({ error: 'projectId, requestId and action are required' });
    }

    const project = await Project.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Map user designation to stage
    const designationToStage = {
      'hod': 'HOD',
      'dean': 'DEAN',
      'r&d_helper': 'R&D_HELPER',
      'rnd_helper': 'R&D_HELPER',
      'r&d_main': 'R&D_MAIN',
      'rnd_main': 'R&D_MAIN',
      'academic_integrity_officer': 'ACADEMIC_INTEGRITY_OFFICER',
      'aio': 'ACADEMIC_INTEGRITY_OFFICER',
      'finance_officer_helper': 'FINANCE_OFFICER_HELPER',
      'finance_officer_main': 'FINANCE_OFFICER_MAIN',
      'registrar': 'REGISTRAR',
      'vc_office': 'VC_OFFICE',
      'vc': 'VICE_CHANCELLOR',
      'vice_chancellor': 'VICE_CHANCELLOR'
    };
    const userDesignationLower = req.user.designation.toLowerCase();
    const userStage = designationToStage[userDesignationLower] || req.user.designation.toUpperCase();

    if (userStage !== 'R&D_MAIN') {
      return res.status(403).json({ error: 'Only R&D Main can handle budget update requests' });
    }

    if (project.status !== 'Approved') {
      return res.status(400).json({ error: 'Budget can only be updated for approved projects' });
    }

    const requestEntry = project.budgetUpdateRequests.id(requestId);
    if (!requestEntry) {
      return res.status(404).json({ error: 'Budget update request not found' });
    }

    if (requestEntry.status !== 'Pending') {
      return res.status(400).json({ error: 'This budget update request has already been processed' });
    }

    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be Approved or Rejected.' });
    }

    // Apply budget update if approved
    if (action === 'Approved') {
      const oldTotal = project.totalBudget || 0;
      const newTotal = requestEntry.requestedTotalBudget;
      const delta = newTotal - oldTotal;

      project.totalBudget = newTotal;
      project.availableBudget = (project.availableBudget || 0) + delta;
      if (project.availableBudget < 0) {
        project.availableBudget = 0;
      }
    }

    requestEntry.status = action;
    requestEntry.decidedBy = req.user.name;
    requestEntry.decidedByEmail = req.user.email;
    requestEntry.decidedAt = new Date();

    await project.save();

    // Log to approval history for traceability
    const historyEntry = new ApprovalHistory({
      projectId: project.id,
      stage: 'R&D_MAIN',
      status: action === 'Approved' ? 'Approved' : 'Rejected',
      userName: req.user.name,
      userEmail: req.user.email,
      comment: comment || (action === 'Approved'
        ? `Budget updated to ₹${requestEntry.requestedTotalBudget}`
        : 'Budget update request rejected')
    });
    await historyEntry.save();

    const formattedProject = await formatProjectWithHistory(project);
    res.json(formattedProject);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update project budget' });
  }
});

// Get projects for approval (for HOD, Dean, etc.)
router.get('/for-approval', authMiddleware, async (req, res) => {
  try {
    // Map user designation to stage (handle different naming conventions)
    const designationToStage = {
      'hod': 'HOD',
      'dean': 'DEAN',
      'r&d_helper': 'R&D_HELPER',
      'rnd_helper': 'R&D_HELPER',
      'r&d_main': 'R&D_MAIN',
      'rnd_main': 'R&D_MAIN',
      'academic_integrity_officer': 'ACADEMIC_INTEGRITY_OFFICER',
      'aio': 'ACADEMIC_INTEGRITY_OFFICER',
      'finance_officer_helper': 'FINANCE_OFFICER_HELPER',
      'finance_officer_main': 'FINANCE_OFFICER_MAIN',
      'registrar': 'REGISTRAR',
      'vc_office': 'VC_OFFICE',
      'vc': 'VICE_CHANCELLOR',
      'vice_chancellor': 'VICE_CHANCELLOR'
    };

    const userDesignationLower = req.user.designation.toLowerCase();
    const userStage = designationToStage[userDesignationLower] || req.user.designation.toUpperCase();

    // Department scoping: HOD & Dean should only see projects from their department
    const deptScope =
      (userStage === 'HOD' || userStage === 'DEAN') && req.user.department && req.user.department !== 'N/A'
        ? { piDepartment: req.user.department }
        : {};

    // Get projects at this user's stage OR projects this user has already reviewed
    const projectsAtStage = await Project.find({ currentStage: userStage, ...deptScope })
      .sort({ submittedDate: -1 });

    const reviewedProjects = await ApprovalHistory.find({ 
      stage: userStage,
      userEmail: req.user.email
    }).distinct('projectId');

    const reviewedProjectsList = await Project.find({
      id: { $in: reviewedProjects },
      ...deptScope
    }).sort({ submittedDate: -1 });

    // Combine and remove duplicates
    const allProjectIds = new Set();
    const uniqueProjects = [];
    
    [...projectsAtStage, ...reviewedProjectsList].forEach(project => {
      if (!allProjectIds.has(project.id)) {
        allProjectIds.add(project.id);
        uniqueProjects.push(project);
      }
    });

    const projectsWithHistory = await Promise.all(
      uniqueProjects.map(project => formatProjectWithHistory(project))
    );

    res.json(projectsWithHistory);
  } catch (error) {
    console.error('Get projects for approval error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Shared helper to create/update core project fields + upload file
async function buildProjectPayloadFromRequest(req, existingProject = null) {
  const {
    // Basic details
    title,
    fundingAgency,
    schemeCallRefNo,
    pi,
    piDesignation,
    piDepartment,
    coPi,
    collaboratingInstitute,
    projectStartDate,
    projectEndDate,
    totalBudget,
    // Budget heads object
    budgetHeads,
    // Flags & percentages
    fundingAgencyFormatFollowed,
    aiUsagePercentage,
    plagiarismPercentage,
    summary,
    // Documents object from frontend (base64)
    documents,
    // Backward‑compat single file payload
    fileName,
    fileData,
    fileType
  } = req.body;

  // Basic required fields from Module 1
  if (!title || !fundingAgency || !pi || !totalBudget || !projectStartDate || !projectEndDate || !schemeCallRefNo) {
    throw new Error('Missing required fields');
  }

  const budgetHeadKeys = ['equipment', 'manpower', 'consumables', 'travel', 'contingency', 'overhead', 'others'];
  const normalizedBudgetHeads = {};
  for (const key of budgetHeadKeys) {
    const raw = budgetHeads && Object.prototype.hasOwnProperty.call(budgetHeads, key) ? budgetHeads[key] : undefined;
    if (raw === '' || raw === null || raw === undefined) {
      throw new Error('Every budget head must be filled in (use 0 if not applicable).');
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('Budget head amounts must be valid non-negative numbers.');
    }
    normalizedBudgetHeads[key] = n;
  }
  const budgetSum = budgetHeadKeys.reduce((s, k) => s + normalizedBudgetHeads[k], 0);
  if (Math.abs(budgetSum - Number(totalBudget)) > 0.01) {
    throw new Error('The sum of all budget heads must exactly equal the total estimated budget.');
  }

  let fileUrl = existingProject ? existingProject.fileUrl : null;
  let cloudinaryPublicId = existingProject ? existingProject.cloudinaryPublicId : null;

  // Prefer completeProposal from documents; fall back to legacy fileData
  const primaryProposalData =
    (documents && documents.completeProposal) ||
    fileData ||
    null;

  const hasExistingProposal = Boolean(existingProject?.documents?.completeProposal || existingProject?.fileUrl);
  const hasExistingUndertaking = Boolean(existingProject?.documents?.piCoPiUndertaking);
  const hasIncomingProposal = isPdfDataUrl(primaryProposalData);
  const hasIncomingUndertaking = isPdfDataUrl(documents?.piCoPiUndertaking);

  // Required document rules:
  // - New submission: both proposal + PI/Co-PI undertaking must be provided as PDF data URLs.
  // - Resubmission: user can either re-upload PDFs or keep previously stored URLs.
  if (!(hasIncomingProposal || hasExistingProposal) || !(hasIncomingUndertaking || hasExistingUndertaking)) {
    throw new Error('Complete Proposal and PI/Co-PI Undertaking PDFs are required');
  }

  // Upload main proposal to Cloudinary if provided
  if (primaryProposalData) {
    try {
      fileUrl = await uploadPdfDataUrl(
        primaryProposalData,
        fileName || existingProject?.fileName || 'research-proposal.pdf',
        'research-proposals'
      );
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      if (uploadError.message === 'Only PDF files are allowed') {
        throw uploadError;
      }
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  let endorsementLetterUrl = existingProject?.documents?.endorsementLetter || null;
  let piCoPiUndertakingUrl = existingProject?.documents?.piCoPiUndertaking || null;
  let otherSupportingDocsUrls = existingProject?.documents?.otherSupportingDocs || [];

  try {
    if (documents?.endorsementLetter) {
      endorsementLetterUrl = await uploadPdfDataUrl(
        documents.endorsementLetter,
        'endorsement-letter.pdf',
        'research-proposals'
      );
    }

    if (documents?.piCoPiUndertaking) {
      piCoPiUndertakingUrl = await uploadPdfDataUrl(
        documents.piCoPiUndertaking,
        'pi-copi-undertaking.pdf',
        'research-proposals'
      );
    }

    if (Array.isArray(documents?.otherSupportingDocs) && documents.otherSupportingDocs.length > 0) {
      otherSupportingDocsUrls = await Promise.all(
        documents.otherSupportingDocs.map((doc, index) =>
          uploadPdfDataUrl(
            doc,
            `supporting-document-${index + 1}.pdf`,
            'research-proposals'
          )
        )
      );
    }
  } catch (uploadError) {
    console.error('Secondary docs upload error:', uploadError);
    if (uploadError.message === 'Only PDF files are allowed') {
      throw uploadError;
    }
    throw new Error('Failed to upload file to Cloudinary');
  }

  // Compute duration string from dates for backward compatibility
  const durationString = `${projectStartDate} to ${projectEndDate}`;

  return {
    title,
    fundingAgency,
    schemeCallRefNo,
    pi,
    piDesignation: piDesignation || null,
    piDepartment: piDepartment || null,
    coPi: Array.isArray(coPi) ? coPi : coPi || [],
    collaboratingInstitute: collaboratingInstitute || null,
    projectStartDate: new Date(projectStartDate),
    projectEndDate: new Date(projectEndDate),
    duration: durationString,
    totalBudget,
    availableBudget: totalBudget,
    fundingAgencyFormatFollowed: typeof fundingAgencyFormatFollowed === 'boolean'
      ? fundingAgencyFormatFollowed
      : fundingAgencyFormatFollowed === 'true',
    aiUsagePercentage,
    plagiarismPercentage,
    summary: typeof summary === 'string' ? summary.trim() : (existingProject?.summary || ''),
    budgetHeads: normalizedBudgetHeads,
    documents: {
      completeProposal: fileUrl || null,
      endorsementLetter: endorsementLetterUrl,
      piCoPiUndertaking: piCoPiUndertakingUrl,
      institutionalForwardingLetter: existingProject?.documents?.institutionalForwardingLetter || null,
      otherSupportingDocs: otherSupportingDocsUrls
    },
    // Legacy file fields kept for compatibility
    fileName: fileName || existingProject?.fileName || 'research-proposal.pdf',
    fileUrl,
    fileType: fileType || existingProject?.fileType || 'application/pdf',
    cloudinaryPublicId
  };
}

// Submit a new project (Module 1: Project Submission Checklist & Declaration Form)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Atomic per-year counter (YYYYMMNNNN)
    const counter = await ProjectCounter.findOneAndUpdate(
      { year },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const seq = String(counter.seq).padStart(4, '0');
    const projectId = `${year}${month}${seq}`;
    const corePayload = await buildProjectPayloadFromRequest(req);

    const project = new Project({
      id: projectId,
      ...corePayload,
      submittedBy: req.user.email,
      status: 'Pending',
      currentStage: 'HOD',
      forwardedTo: null,
      lifecycleStatus: 'Pending',
      workflowVersion: 'registrar_final_v2'
    });

    await project.save();

    const formattedProject = await formatProjectWithHistory(project);
    res.status(201).json(formattedProject);
  } catch (error) {
    console.error('Submit project error:', error);
    if (error.message === 'Missing required fields') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Failed to upload file to Cloudinary') {
      return res.status(500).json({ error: error.message });
    }
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Complete Proposal and PI/Co-PI Undertaking PDFs are required') {
      return res.status(400).json({ error: error.message });
    }
    if (
      error.message === 'Every budget head must be filled in (use 0 if not applicable).' ||
      error.message === 'Budget head amounts must be valid non-negative numbers.' ||
      error.message === 'The sum of all budget heads must exactly equal the total estimated budget.'
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to submit project' });
  }
});

// Resubmit an existing (reverted) project with updates
router.post('/resubmit', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required for resubmission' });
    }

    const project = await Project.findOne({ id: projectId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to resubmit this project' });
    }

    if (project.status !== 'Reverted') {
      return res.status(400).json({ error: 'Only reverted projects can be resubmitted' });
    }

    const corePayload = await buildProjectPayloadFromRequest(req, project);

    Object.assign(project, corePayload, {
      status: 'Pending',
      currentStage: 'HOD',
      lifecycleStatus: 'Pending',
      forwardedTo: null
    });

    await project.save();

    const formattedProject = await formatProjectWithHistory(project);
    res.json(formattedProject);
  } catch (error) {
    console.error('Resubmit project error:', error);
    if (error.message === 'Missing required fields') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Failed to upload file to Cloudinary') {
      return res.status(500).json({ error: error.message });
    }
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Complete Proposal and PI/Co-PI Undertaking PDFs are required') {
      return res.status(400).json({ error: error.message });
    }
    if (
      error.message === 'Every budget head must be filled in (use 0 if not applicable).' ||
      error.message === 'Budget head amounts must be valid non-negative numbers.' ||
      error.message === 'The sum of all budget heads must exactly equal the total estimated budget.'
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to resubmit project' });
  }
});

// Update project status (approve/reject/revert)
router.post('/update-status', authMiddleware, async (req, res) => {
  try {
    const { projectId, status, comment, forwardedTo } = req.body;

    if (!projectId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if ((status === 'Rejected' || status === 'Reverted') && !comment) {
      return res.status(400).json({ error: 'Comment required for rejection/revert' });
    }

    const project = await Project.findOne({ id: projectId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Map user designation to stage (handle different naming conventions)
    const designationToStage = {
      'hod': 'HOD',
      'dean': 'DEAN',
      'r&d_helper': 'R&D_HELPER',
      'rnd_helper': 'R&D_HELPER',
      'r&d_main': 'R&D_MAIN',
      'rnd_main': 'R&D_MAIN',
      'academic_integrity_officer': 'ACADEMIC_INTEGRITY_OFFICER',
      'aio': 'ACADEMIC_INTEGRITY_OFFICER',
      'finance_officer_helper': 'FINANCE_OFFICER_HELPER',
      'finance_officer_main': 'FINANCE_OFFICER_MAIN',
      'registrar': 'REGISTRAR',
      'vc_office': 'VC_OFFICE',
      'vc': 'VICE_CHANCELLOR',
      'vice_chancellor': 'VICE_CHANCELLOR'
    };

    const userDesignationLower = req.user.designation.toLowerCase();
    const userStage = designationToStage[userDesignationLower] || req.user.designation.toUpperCase();
    
    if (project.currentStage !== userStage) {
      return res.status(403).json({ error: 'Not authorized to approve at this stage' });
    }

    const workflowVersion = project.workflowVersion || 'v1';

    // v1: existing chain ends with VC Office + Vice Chancellor
    const stagesV1 = ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'ACADEMIC_INTEGRITY_OFFICER', 'FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR', 'COMPLETED'];

    // v2: registrar-final hierarchy with optional AIO/FO path from R&D Main
    const stagesV2 = ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'ACADEMIC_INTEGRITY_OFFICER', 'FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'Approved'];

    const stages = workflowVersion === 'registrar_final_v2' ? stagesV2 : stagesV1;
    const currentStageIndex = stages.indexOf(project.currentStage);
    
    let newStatus = project.status;
    let newStage = project.currentStage;

    // Only Vice Chancellor can reject or approve (final approval)
    const isViceChancellor = userStage === 'VICE_CHANCELLOR';
    
    // Check if user can reject (VC in v1, Registrar in v2)
    const canReject =
      isViceChancellor ||
      (workflowVersion === 'registrar_final_v2' && userStage === 'REGISTRAR');
    if (status === 'Rejected' && !canReject) {
      return res.status(403).json({ error: 'Not authorized to reject projects at this stage' });
    }

    // Handle revert - all approvers can revert
    if (status === 'Reverted') {
      // Revert to previous stage or to HOD if at early stage
      if (currentStageIndex > 0) {
        newStage = stages[currentStageIndex - 1];
      } else {
        newStage = 'HOD';
      }
      newStatus = 'Reverted';
      project.forwardedTo = null;
    }
    // Handle approval
    else if (status === 'Approved') {
      if (userStage === 'REGISTRAR') {
        if (workflowVersion === 'registrar_final_v2') {
          // v2: Registrar is the final approver — terminal stage is Approved (not COMPLETED)
          newStage = 'Approved';
          newStatus = 'Approved';
        } else {
          // v1: Registrar can fully approve only projects < 50000
          if (project.totalBudget < 50000) {
            newStage = 'COMPLETED';
            newStatus = 'Approved';
          } else {
            newStage = stages[currentStageIndex + 1];
            newStatus = 'Pending';
          }
        }
      }
      // R&D_MAIN and FINANCE_OFFICER_MAIN can forward to selected approver
      else if (userStage === 'R&D_MAIN' || userStage === 'FINANCE_OFFICER_MAIN') {
        if (workflowVersion === 'registrar_final_v2') {
          if (userStage === 'R&D_MAIN') {
            // v2: R&D Main can choose only AIO / Finance Officer / Registrar.
            // 'Finance Officer' means FINANCE_OFFICER_HELPER stage.
            const selection = String(forwardedTo || '').trim().toUpperCase();
            let targetStage = null;
            if (selection === 'ACADEMIC_INTEGRITY_OFFICER' || selection === 'AIO') {
              targetStage = 'ACADEMIC_INTEGRITY_OFFICER';
            } else if (
              selection === 'FINANCE_OFFICER' ||
              selection === 'FINANCE_OFFICER_HELPER' ||
              selection === 'FO'
            ) {
              targetStage = 'FINANCE_OFFICER_HELPER';
            } else if (selection === 'REGISTRAR') {
              targetStage = 'REGISTRAR';
            }

            if (!targetStage) {
              return res.status(400).json({
                error: 'R&D Main must select one option: IAO, Finance Officer, or Registrar.'
              });
            }
            newStage = targetStage;
            newStatus = 'Pending';
            project.forwardedTo = targetStage;
          } else if (userStage === 'FINANCE_OFFICER_MAIN') {
            // v2: Finance Main forwards by default to Registrar.
            newStage = 'REGISTRAR';
            newStatus = 'Pending';
            project.forwardedTo = 'REGISTRAR';
          }
        } else {
          // v1 behavior (existing approval chain)
          if (forwardedTo && stages.includes(forwardedTo)) {
            // Define allowed forwarding stages based on user role
            let allowedStages = [];
            if (userStage === 'R&D_MAIN') {
              allowedStages = ['FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR'];
            } else if (userStage === 'FINANCE_OFFICER_MAIN') {
              allowedStages = ['REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR'];
            }
            
            // Validate that forwarded stage is allowed for this role
            if (!allowedStages.includes(forwardedTo)) {
              return res.status(400).json({
                error: `Cannot forward to ${forwardedTo}. Allowed stages: ${allowedStages.join(', ')}`
              });
            }
            
            // Validate that forwarded stage is after current stage
            const forwardedIndex = stages.indexOf(forwardedTo);
            if (forwardedIndex > currentStageIndex) {
              newStage = forwardedTo;
              newStatus = 'Pending';
              project.forwardedTo = forwardedTo;
            } else {
              return res.status(400).json({ error: 'Cannot forward to a previous stage' });
            }
          } else {
            // Default forward to next stage (only if next stage is in allowed list)
            let nextStage = null;
            if (currentStageIndex < stages.length - 2) {
              nextStage = stages[currentStageIndex + 1];
              
              // Check if next stage is allowed
              let allowedStages = [];
              if (userStage === 'R&D_MAIN') {
                allowedStages = ['FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR'];
              } else if (userStage === 'FINANCE_OFFICER_MAIN') {
                allowedStages = ['REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR'];
              }
              
              if (allowedStages.includes(nextStage)) {
                newStage = nextStage;
                newStatus = 'Pending';
              } else {
                return res.status(400).json({ error: 'Please select a stage to forward to' });
              }
            } else {
              return res.status(400).json({ error: 'Please select a stage to forward to' });
            }
          }
        }
      }
      // v2: AIO can only forward to FO_HELPER
      else if (workflowVersion === 'registrar_final_v2' && userStage === 'ACADEMIC_INTEGRITY_OFFICER') {
        newStage = 'FINANCE_OFFICER_HELPER';
        newStatus = 'Pending';
      }
      // v2: FO_HELPER forwards by default to FO_MAIN
      else if (workflowVersion === 'registrar_final_v2' && userStage === 'FINANCE_OFFICER_HELPER') {
        newStage = 'FINANCE_OFFICER_MAIN';
        newStatus = 'Pending';
      }
      // Vice Chancellor can fully approve
      else if (isViceChancellor) {
        newStage = 'COMPLETED';
        newStatus = 'Approved';
      }
      // Other approvers just forward to next stage
      else {
        if (currentStageIndex < stages.length - 2) {
          newStage = stages[currentStageIndex + 1];
          newStatus = 'Pending';
        } else {
          return res.status(400).json({ error: 'Invalid approval action' });
        }
      }
    }
    // Handle rejection (VC in v1, Registrar in v2)
    else if (status === 'Rejected') {
      if (!(isViceChancellor || (workflowVersion === 'registrar_final_v2' && userStage === 'REGISTRAR'))) {
        return res.status(403).json({ error: 'Not authorized to reject projects at this stage' });
      }
      newStatus = 'Rejected';
      newStage = 'COMPLETED';
    }

    // Update project
    project.status = newStatus;
    project.currentStage = newStage;
    if (newStatus === 'Approved' && userStage === 'REGISTRAR') {
      project.lifecycleStatus = 'Approved';
    }
    await project.save();

    // If this action represents the project's FINAL approval (v1: reaches
    // COMPLETED with Approved status via VC or small-budget Registrar path;
    // v2: reaches Approved status via Registrar-final workflow), capture a
    // full snapshot of the project exactly as it is right now. This is what
    // the "My Projects" section will show, regardless of later changes
    // (e.g. budget head deductions from approved indents).
    const isFinalApproval =
      newStatus === 'Approved' && (newStage === 'COMPLETED' || newStage === 'Approved');
    if (isFinalApproval) {
      await saveProjectApprovalSnapshot(project, userStage);
    }

    // Add to approval history
    const approvalHistory = new ApprovalHistory({
      projectId: projectId,
      stage: userStage,
      status: status,
      userName: req.user.name,
      userEmail: req.user.email,
      comment: comment || (status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Reverted')
    });

    await approvalHistory.save();

    const formattedProject = await formatProjectWithHistory(project);
    res.json(formattedProject);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});


// Get project file for viewing/downloading
router.get('/download/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { documentType, mode } = req.query;
    const project = await Project.findOne({ id: projectId });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only the submitting PI or an approver role can download project documents
    const approverRoles = ['hod','dean','r&d_helper','r&d_main','academic_integrity_officer',
      'aio','finance_officer_helper','finance_officer_main','registrar','vc_office','vice_chancellor'];
    const isApprover = approverRoles.includes((req.user.designation || '').toLowerCase());
    if (project.submittedBy !== req.user.email && !isApprover) {
      return res.status(403).json({ error: 'Not authorized to download this file' });
    }

    let fileUrl = project.fileUrl;
    let fileName = 'research-proposal.pdf';

    if (documentType === 'completeProposal') {
      fileUrl = project.documents?.completeProposal || project.fileUrl;
      fileName = 'complete-proposal.pdf';
    } else if (documentType === 'endorsementLetter') {
      fileUrl = project.documents?.endorsementLetter;
      fileName = 'endorsement-letter.pdf';
    } else if (documentType === 'piCoPiUndertaking') {
      fileUrl = project.documents?.piCoPiUndertaking;
      fileName = 'pi-copi-undertaking.pdf';
    } else if (documentType === 'institutionalForwardingLetter') {
      fileUrl = project.documents?.institutionalForwardingLetter;
      fileName = 'institutional-forwarding-letter.pdf';
    } else if (typeof documentType === 'string' && documentType.startsWith('otherSupportingDoc_')) {
      const index = Number(documentType.split('_')[1]);
      fileUrl = project.documents?.otherSupportingDocs?.[index];
      fileName = `supporting-document-${Number.isNaN(index) ? 1 : index + 1}.pdf`;
    }

    if (!fileUrl) {
      return res.status(404).json({ error: 'File not found for this project' });
    }

    const upstream = await fetch(fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Failed to fetch file from storage' });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${mode === 'view' ? 'inline' : 'attachment'}; filename="${fileName}"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

// VC: list approved projects with expenditure/balance and ongoing/completed
router.get('/approved-summary', authMiddleware, async (req, res) => {
  try {
    const d = String(req.user.designation || '').toLowerCase();
    const isVc = d === 'vc' || d === 'vice_chancellor';
    if (!isVc) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const approved = await Project.find({
      status: 'Approved',
      lifecycleStatus: { $in: ['Ongoing', 'Completed'] }
    }).sort({ submittedDate: -1 });
    const projectIds = approved.map((p) => p.id);

    const completedIds = new Set(
      (await UtilizationCertificate.find({
        projectId: { $in: projectIds },
        status: 'Approved',
        currentStage: 'COMPLETED'
      }).distinct('projectId')) || []
    );

    const out = approved.map((p) => {
      const total = Number(p.totalBudget || 0);
      const balance = Number(p.availableBudget || 0);
      const expenditure = Math.max(0, total - balance);
      return {
        id: p.id,
        title: p.title,
        pi: p.pi,
        department: p.piDepartment || '',
        submittedDate: p.submittedDate,
        totalBudget: total,
        expenditure,
        balance,
        statusLabel: p.lifecycleStatus || (completedIds.has(p.id) ? 'Completed' : 'Ongoing')
      };
    });

    res.json(out);
  } catch (e) {
    console.error('Approved summary error:', e);
    res.status(500).json({ error: 'Failed to fetch approved projects' });
  }
});

// PI: download a consolidated "approved project" PDF (details + approval history + attached PDFs)
router.get('/download-approved/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ id: projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only the submitting PI can download this consolidated PDF
    if (project.submittedBy !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (project.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved projects can be downloaded in consolidated format' });
    }

    const history = await ApprovalHistory.find({ projectId: project.id }).sort({ actionDate: 1 });

    const cover = await PDFDocument.create();
    const font = await cover.embedFont(StandardFonts.Helvetica);
    const fontBold = await cover.embedFont(StandardFonts.HelveticaBold);
    let page = cover.addPage([595.28, 841.89]); // A4
    const margin = 48;
    let y = 800;
    const toPdfSafe = (value) =>
      String(value ?? '')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const line = (text, opts = {}) => {
      const size = opts.size || 11;
      const f = opts.bold ? fontBold : font;
      page.drawText(toPdfSafe(text), { x: margin, y, size, font: f });
      y -= size + 6;
      if (y < 70) {
        page = cover.addPage([595.28, 841.89]);
        y = 800;
      }
    };

    line('Approved Project Dossier', { bold: true, size: 18 });
    y -= 6;
    line(`Project ID: ${project.id}`, { bold: true });
    line(`Title: ${project.title}`);
    line(`PI: ${project.pi}`);
    line(`Department: ${project.piDepartment || 'N/A'}`);
    line(`Funding Agency: ${project.fundingAgency || 'N/A'}`);
    line(`Scheme / Call Ref No: ${project.schemeCallRefNo || 'N/A'}`);
    line(`Duration: ${project.duration || 'N/A'}`);
    line(`Start: ${project.projectStartDate ? new Date(project.projectStartDate).toISOString().slice(0, 10) : 'N/A'}`);
    line(`End: ${project.projectEndDate ? new Date(project.projectEndDate).toISOString().slice(0, 10) : 'N/A'}`);
    line(`Total Budget: INR ${Number(project.totalBudget || 0).toLocaleString('en-IN')}`);
    line(`Available Budget: INR ${Number(project.availableBudget || 0).toLocaleString('en-IN')}`);
    line(`PI Designation: ${project.piDesignation || 'N/A'}`);
    y -= 6;
    line('Summary', { bold: true, size: 14 });
    line(project.summary || 'No summary provided.');
    y -= 6;
    line('Approval History', { bold: true, size: 14 });
    if (!history.length) {
      line('No approval history found.');
    } else {
      history.forEach((h, idx) => {
        const date = h.actionDate ? new Date(h.actionDate).toISOString().slice(0, 10) : 'N/A';
        line(
          `${idx + 1}. ${h.stage} - ${h.status} by ${h.userName} (${date})${h.comment ? ` | ${h.comment}` : ''}`
        );
      });
    }

    // Start with cover as base PDF
    const output = await PDFDocument.create();
    const coverBytes = await cover.save();
    const coverLoaded = await PDFDocument.load(coverBytes);
    const coverPages = await output.copyPages(coverLoaded, coverLoaded.getPageIndices());
    coverPages.forEach((p) => output.addPage(p));

    // Append all attached PDFs (if present)
    const docUrls = [];
    const docs = project.documents || {};
    if (docs.completeProposal) docUrls.push({ url: docs.completeProposal, label: 'Complete Proposal' });
    if (docs.piCoPiUndertaking) docUrls.push({ url: docs.piCoPiUndertaking, label: 'PI/Co-PI Undertaking' });
    if (docs.endorsementLetter) docUrls.push({ url: docs.endorsementLetter, label: 'Endorsement Letter' });
    if (docs.institutionalForwardingLetter) docUrls.push({ url: docs.institutionalForwardingLetter, label: 'Institutional Forwarding Letter' });
    if (Array.isArray(docs.otherSupportingDocs)) {
      docs.otherSupportingDocs.forEach((u, i) => {
        if (u) docUrls.push({ url: u, label: `Supporting Document ${i + 1}` });
      });
    }

    for (const d of docUrls) {
      try {
        const upstream = await fetch(d.url);
        if (!upstream.ok) continue;
        const ab = await upstream.arrayBuffer();
        const buf = Buffer.from(ab);
        const loaded = await PDFDocument.load(buf);
        const pages = await output.copyPages(loaded, loaded.getPageIndices());
        pages.forEach((p) => output.addPage(p));
      } catch (e) {
        // skip non-PDF or corrupt doc
        console.warn('[download-approved] failed to append:', d.label, e?.message || e);
      }
    }

    const finalBytes = await output.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.id}-approved-project.pdf"`);
    res.send(Buffer.from(finalBytes));
  } catch (e) {
    console.error('Download approved project error:', e);
    res.status(500).json({ error: 'Failed to generate approved project PDF' });
  }
});

module.exports = router;


