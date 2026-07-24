// Shared helper to convert internal workflow stage / designation codes
// into human-readable display labels.
// IMPORTANT: Internal values ('aio', 'ACADEMIC_INTEGRITY_OFFICER') are kept
// as-is in the database and code logic. Only the DISPLAYED text changes here.

const STAGE_DISPLAY_LABELS = {
  'ACADEMIC_INTEGRITY_OFFICER': 'IAO',
  'AIO': 'IAO',
  'HOD': 'HOD',
  'DEAN': 'Dean',
  'R&D_HELPER': 'R&D Office',
  'R&D_MAIN': 'R&D Officer',
  'FINANCE_OFFICER_HELPER': 'Finance Office',
  'FINANCE_OFFICER_MAIN': 'Finance Officer',
  'REGISTRAR': 'Registrar',
  'VC_OFFICE': 'VC Office',
  'VICE_CHANCELLOR': 'Vice Chancellor',
  'COMPLETED': 'Completed',
  'Approved': 'Approved',
  'PI': 'PI'
};

const DESIGNATION_DISPLAY_LABELS = {
  'academic_integrity_officer': 'Internal Audit Officer (IAO)',
  'aio': 'Internal Audit Officer (IAO)'
};

/**
 * Convert a raw workflow stage code (e.g. 'ACADEMIC_INTEGRITY_OFFICER')
 * into a human-readable label (e.g. 'IAO'). Falls back to the raw value
 * if no mapping is found, so unknown/future stages still render.
 */
export function formatStageLabel(stage) {
  if (!stage) return stage;
  return STAGE_DISPLAY_LABELS[stage] || stage;
}

/**
 * Convert a raw user designation code (e.g. 'aio') into a human-readable
 * label (e.g. 'Internal Audit Officer (IAO)'). Falls back to the raw value.
 */
export function formatDesignationLabel(designation) {
  if (!designation) return designation;
  return DESIGNATION_DISPLAY_LABELS[designation.toLowerCase()] || designation;
}
