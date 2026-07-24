import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function ProjectForm({ user, onSubmit, onCancel, project = null }) {
  const [coPis, setCoPis] = useState(
    project?.coPi && project.coPi.length > 0 
      ? project.coPi 
      : [{ name: '', designation: '', department: '' }]
  );
  const [budgetHeads, setBudgetHeads] = useState(() => {
    if (project?.budgetHeads) {
      // Ensure budgetHeads is a plain object, not a Mongoose document
      return {
        equipment: project.budgetHeads.equipment || 0,
        manpower: project.budgetHeads.manpower || 0,
        consumables: project.budgetHeads.consumables || 0,
        travel: project.budgetHeads.travel || 0,
        contingency: project.budgetHeads.contingency || 0,
        overhead: project.budgetHeads.overhead || 0,
        others: project.budgetHeads.others || 0
      };
    }
    return {
      equipment: 0,
      manpower: 0,
      consumables: 0,
      travel: 0,
      contingency: 0,
      overhead: 0,
      others: 0
    };
  });
  const [files, setFiles] = useState({
    completeProposal: null,
    endorsementLetter: null,
    piCoPiUndertaking: null,
    otherSupportingDocs: []
  });
  const [uploading, setUploading] = useState(false);
  const [piDesignationSelection, setPiDesignationSelection] = useState(() => {
    const existing = project?.piDesignation || '';
    const normalized = String(existing).toLowerCase();
    if (normalized.includes('assistant professor')) return 'Assistant Professor';
    if (normalized.includes('associate professor')) return 'Associate Professor';
    if (normalized === 'professor') return 'Professor';
    if (existing) return 'Other (UGC/ INSPIRE etc.)';
    return 'Assistant Professor';
  });

  const viewExistingDocument = async (documentType, supportingIndex = null) => {
    if (!project?.id) return;
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Please login again to view document.');
        return;
      }
      let url = `/api/projects/download/${project.id}`;
      if (documentType) {
        if (documentType === 'otherSupportingDoc' && supportingIndex !== null) {
          url += `?documentType=otherSupportingDoc_${supportingIndex}&mode=view`;
        } else {
          url += `?documentType=${documentType}&mode=view`;
        }
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to open document preview.');
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (e) {
      console.error(e);
      alert('Failed to open document preview.');
    }
  };

  const addCoPi = () => {
    if (coPis.length < 2) {
      setCoPis([...coPis, { name: '', designation: '', department: '' }]);
    }
  };

  const removeCoPi = (index) => {
    setCoPis(coPis.filter((_, i) => i !== index));
  };

  const updateCoPi = (index, field, value) => {
    const newCoPis = [...coPis];
    newCoPis[index][field] = value;
    setCoPis(newCoPis);
  };

  const handleBudgetChange = (head, value) => {
    // Allow empty string while typing; coerce to number on parse.
    if (value === '') {
      setBudgetHeads({ ...budgetHeads, [head]: '' });
      return;
    }
    setBudgetHeads({ ...budgetHeads, [head]: parseFloat(value) || 0 });
  };

  const calculateTotal = () => {
    return Object.values(budgetHeads).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const handleFileChange = (field, e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        alert('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        e.target.value = '';
        return;
      }
      if (field === 'otherSupportingDocs') {
        setFiles({
          ...files,
          otherSupportingDocs: [...files.otherSupportingDocs, selectedFile]
        });
      } else {
        setFiles({ ...files, [field]: selectedFile });
      }
    }
  };

  const existingDocs = project?.documents || {};
  const hasExistingProposal = Boolean(existingDocs.completeProposal || project?.fileUrl);
  const hasExistingUndertaking = Boolean(existingDocs.piCoPiUndertaking);

  const removeOtherDoc = (index) => {
    setFiles({
      ...files,
      otherSupportingDocs: files.otherSupportingDocs.filter((_, i) => i !== index)
    });
  };

  const convertFileToBase64 = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const filteredCoPis = coPis.filter((cp) => cp.name.trim() !== '');
    const totalBudget = parseFloat(formData.get('totalBudget'), 10);
    const headKeys = Object.keys(budgetHeads);

    for (const head of headKeys) {
      if (budgetHeads[head] === '' || budgetHeads[head] === null || budgetHeads[head] === undefined) {
        alert(`Please enter a value for every budget head (${head}). Use 0 if not applicable.`);
        return;
      }
    }
    const sumHeads = headKeys.reduce((s, h) => s + (Number(budgetHeads[h]) || 0), 0);
    if (!Number.isFinite(totalBudget) || Math.abs(sumHeads - totalBudget) > 0.01) {
      alert('The sum of all budget heads must exactly equal the total estimated budget.');
      return;
    }

    const normalizedHeads = Object.fromEntries(headKeys.map((h) => [h, Number(budgetHeads[h]) || 0]));

    setUploading(true);

    const fileData = {};
    try {
      if (files.completeProposal) {
        fileData.completeProposal = await convertFileToBase64(files.completeProposal);
      }
      if (files.endorsementLetter) {
        fileData.endorsementLetter = await convertFileToBase64(files.endorsementLetter);
      }
      if (files.piCoPiUndertaking) {
        fileData.piCoPiUndertaking = await convertFileToBase64(files.piCoPiUndertaking);
      }
      fileData.otherSupportingDocs = await Promise.all(files.otherSupportingDocs.map((file) => convertFileToBase64(file)));
    } catch (error) {
      console.error('Error reading files:', error);
      alert('Failed to read files');
      setUploading(false);
      return;
    }

    try {
      const ok = await onSubmit(formData, filteredCoPis, normalizedHeads, fileData, project?.id);
      if (ok) {
        if (!project) {
          setCoPis([{ name: '', designation: '', department: '' }]);
          setFiles({
            completeProposal: null,
            endorsementLetter: null,
            piCoPiUndertaking: null,
            otherSupportingDocs: []
          });
        }
      } else {
        setUploading(false);
      }
    } catch (error) {
      console.error('Project submit failed:', error);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-blue-100 dark:text-white p-6 rounded-t-lg z-10">
          <h3 className="text-2xl font-bold">
            {project ? 'Update Project' : 'Project Submission Checklist & Declaration Form'}
          </h3>
          <p className="text-blue-100 mt-1">
            {project ? 'Edit and resubmit your project' : 'Module 1: New Project Declaration'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SECTION A: BASIC PROJECT DETAILS */}
          <div className="border-b border-gray-300 pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">SECTION A: Basic Project Details</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={project?.title || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                  placeholder="Enter project title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funding Agency *</label>
                  <input
                    type="text"
                    name="fundingAgency"
                    required
                    defaultValue={project?.fundingAgency || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                    placeholder="e.g., DST, CSIR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheme / Call Ref No *</label>
                  <input
                    type="text"
                    name="schemeCallRefNo"
                    required
                    defaultValue={project?.schemeCallRefNo || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PI Name *</label>
                  <input
                    type="text"
                    name="pi"
                    required
                    defaultValue={user.name}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PI Designation *</label>
                  <select
                    name="piDesignation"
                    required
                    value={piDesignationSelection}
                    onChange={(e) => setPiDesignationSelection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Other (UGC/ INSPIRE etc.)">Other (UGC/ INSPIRE etc.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PI Department *</label>
                  <input
                    type="text"
                    name="piDepartment"
                    required
                    defaultValue={user.department}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Summary (max ~100 words) *</label>
                <textarea
                  name="summary"
                  required
                  rows="4"
                  maxLength={800}
                  defaultValue={project?.summary || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                  placeholder="Write a short summary of the project (about 100 words)..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tip: keep it around 100 words.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Co-Principal Investigator(s)</label>
                  {coPis.length < 2 && (
                    <button
                      type="button"
                      onClick={addCoPi}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium "
                    >
                      <Plus className="w-4 h-4" /> Add Co-PI
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {coPis.map((coPi, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={coPi.name}
                        onChange={(e) => updateCoPi(index, 'name', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                        placeholder="Co-PI Name"
                      />
                      <input
                        type="text"
                        value={coPi.designation}
                        onChange={(e) => updateCoPi(index, 'designation', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700 dark:text-gray-700"
                        placeholder="Designation"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={coPi.department}
                          onChange={(e) => updateCoPi(index, 'department', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                          placeholder="Department"
                        />
                        {coPis.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCoPi(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collaborating Institute</label>
                  <input
                    type="text"
                    name="collaboratingInstitute"
                    defaultValue={project?.collaboratingInstitute || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Start Date *</label>
                    <input
                      type="date"
                      name="projectStartDate"
                      required
                      defaultValue={project?.projectStartDate ? new Date(project.projectStartDate).toISOString().split('T')[0] : ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparentm dark:text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project End Date *</label>
                    <input
                      type="date"
                      name="projectEndDate"
                      required
                      defaultValue={project?.projectEndDate ? new Date(project.projectEndDate).toISOString().split('T')[0] : ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Estimated Budget (₹) *</label>
                    <input
                      type="number"
                      name="totalBudget"
                      required
                      min="0"
                      defaultValue={project?.totalBudget ?? ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Funding Agency Format Followed *</label>
                    <select
                      name="fundingAgencyFormatFollowed"
                      required
                      defaultValue={project?.fundingAgencyFormatFollowed !== undefined ? (project.fundingAgencyFormatFollowed ? 'true' : 'false') : ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                    >
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">AI Usage in Proposal (%) *</label>
                    <input
                      type="number"
                      name="aiUsagePercentage"
                      required
                      min="0"
                      max="100"
                      defaultValue={project?.aiUsagePercentage ?? ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plagiarism Percentage (%) *</label>
                    <input
                      type="number"
                      name="plagiarismPercentage"
                      required
                      min="0"
                      max="100"
                      defaultValue={project?.plagiarismPercentage ?? ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                    />
                  </div>
                </div>
            </div>
          </div>

          {/* SECTION B: BUDGET HEADS */}
          <div className="border-b border-gray-300 pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">SECTION B: Budget Heads</h4>
            <div className="space-y-3">
              {Object.keys(budgetHeads).map((head) => (
                <div key={head} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">{head}:</label>
                  <input
                    type="number"
                    value={budgetHeads[head]}
                    onFocus={() => {
                      if (Number(budgetHeads[head]) === 0) {
                        setBudgetHeads((prev) => ({ ...prev, [head]: '' }));
                      }
                    }}
                    onChange={(e) => handleBudgetChange(head, e.target.value)}
                    onBlur={() => {
                      if (budgetHeads[head] === '') {
                        setBudgetHeads((prev) => ({ ...prev, [head]: 0 }));
                      }
                    }}
                    min="0"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-700"
                  />
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-300">
                <label className="w-32 text-sm font-bold text-gray-800">Total:</label>
                <input
                  type="number"
                  value={calculateTotal()}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 font-bold dark:text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: DOCUMENT UPLOADS */}
          <div className="border-b border-gray-300 pb-4 text-gray-700">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">SECTION C: Document Uploads</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complete Proposal (PDF) *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleFileChange('completeProposal', e)}
                  required={!project || !hasExistingProposal}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {project && hasExistingProposal && !files.completeProposal && (
                  <p className="text-xs text-gray-600 mt-1">
                    Current: <button type="button" className="text-blue-600 hover:underline" onClick={() => viewExistingDocument('completeProposal')}>View uploaded proposal</button>
                  </p>
                )}
                {files.completeProposal && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {files.completeProposal.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endorsement Letter (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleFileChange('endorsementLetter', e)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {project && existingDocs.endorsementLetter && !files.endorsementLetter && (
                  <p className="text-xs text-gray-600 mt-1">
                    Current: <button type="button" className="text-blue-600 hover:underline" onClick={() => viewExistingDocument('endorsementLetter')}>View uploaded endorsement letter</button>
                  </p>
                )}
                {files.endorsementLetter && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {files.endorsementLetter.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PI/Co-PI Undertaking (PDF) *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleFileChange('piCoPiUndertaking', e)}
                  required={!project || !hasExistingUndertaking}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {project && hasExistingUndertaking && !files.piCoPiUndertaking && (
                  <p className="text-xs text-gray-600 mt-1">
                    Current: <button type="button" className="text-blue-600 hover:underline" onClick={() => viewExistingDocument('piCoPiUndertaking')}>View uploaded undertaking</button>
                  </p>
                )}
                {files.piCoPiUndertaking && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {files.piCoPiUndertaking.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Supporting Documents (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handleFileChange('otherSupportingDocs', e)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {project &&
                  Array.isArray(existingDocs.otherSupportingDocs) &&
                  existingDocs.otherSupportingDocs.length > 0 &&
                  files.otherSupportingDocs.length === 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600">Current supporting documents:</p>
                      {existingDocs.otherSupportingDocs.map((url, idx) => (
                        <button
                          type="button"
                          key={url || idx}
                          className="block text-xs text-blue-600 hover:underline"
                          onClick={() => viewExistingDocument('otherSupportingDoc', idx)}
                        >
                          View supporting document {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                {files.otherSupportingDocs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.otherSupportingDocs.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeOtherDoc(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Max file size: 10MB per file</p>
            </div>
          </div>

          {/* SECTION D: DECLARATION */}
          <div className="border-b border-gray-300 pb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">SECTION D: Declaration</h4>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="declaration"
                required
                className="mt-1"
              />
              <label htmlFor="declaration" className="text-sm text-gray-700">
                I hereby declare that all the information provided above is true and correct to the best of my knowledge. 
                I understand that any false information may lead to rejection of the project proposal.
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : project ? 'Update & Resubmit Project' : 'Submit Project'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
