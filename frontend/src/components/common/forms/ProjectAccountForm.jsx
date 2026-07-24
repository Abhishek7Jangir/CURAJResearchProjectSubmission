import React, { useState } from 'react';
import { X, FileText, IndianRupee, Calendar, Briefcase, PlusCircle, Upload, CheckCircle2, ClipboardCheck } from 'lucide-react';

const num = (v) => parseFloat(v) || 0;

/** Strip leading zeros when typing amounts (e.g. 0500 → 500). */
const sanitizeMoneyTyping = (raw) => {
  if (raw === '' || raw === undefined) return '';
  let s = String(raw).replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) {
    s = `${s.slice(0, dot + 1)}${s.slice(dot + 1).replace(/\./g, '')}`;
  }
  if (/^0+\d/.test(s)) s = s.replace(/^0+/, '');
  return s;
};

const BUDGET_KEYS = ['equipment', 'manpower', 'contingency', 'consumable', 'travel', 'overhead', 'othersIfAny'];

const KEY_TO_LABEL = {
  equipment: 'Equipment',
  manpower: 'Manpower',
  contingency: 'Contingency',
  consumable: 'Consumable',
  travel: 'Travel',
  overhead: 'Overhead',
  othersIfAny: 'Others (if any)'
};

const PROJECT_TYPES = [
  { key: 'governmentFunded', label: 'Government Funded' },
  { key: 'industrySponsored', label: 'Industry Sponsored' },
  { key: 'consultancy', label: 'Consultancy' },
  { key: 'others', label: 'Others (Specify)' }
];

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all text-sm bg-white text-slate-800';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';
const sectionWrapper = 'bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4';
const sectionTitle = 'text-md font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider';

const emptyBudgetRow = () => ({
  balanceAsPerUCSE: '0',
  expenditureAfterUCSE: '0',
  currentBalance: 0,
  bifurcationNewGrant: '0',
  totalBalance: 0
});

function normalizeLoadedBudgetRow(row) {
  const nz = (v) => {
    if (v === '' || v === null || v === undefined) return '0';
    return String(v);
  };
  const balanceAsPerUCSE = nz(row?.balanceAsPerUCSE);
  const expenditureAfterUCSE = nz(row?.expenditureAfterUCSE);
  const bifurcationNewGrant = nz(row?.bifurcationNewGrant);
  const currentBalance = num(balanceAsPerUCSE) - num(expenditureAfterUCSE);
  const totalBalance = currentBalance + num(bifurcationNewGrant);
  return { balanceAsPerUCSE, expenditureAfterUCSE, currentBalance, bifurcationNewGrant, totalBalance };
}

function budgetRowsFromExisting(budgetHeads) {
  return Object.fromEntries(
    BUDGET_KEYS.map((k) => {
      const row = budgetHeads?.[k];
      if (!row) return [k, emptyBudgetRow()];
      return [k, normalizeLoadedBudgetRow(row)];
    })
  );
}

function normalizeBudgetHeadsForPayload(budgetRows) {
  return Object.fromEntries(
    BUDGET_KEYS.map((k) => {
      const r = budgetRows[k];
      const balanceAsPerUCSE = num(r.balanceAsPerUCSE);
      const expenditureAfterUCSE = num(r.expenditureAfterUCSE);
      const bifurcationNewGrant = num(r.bifurcationNewGrant);
      const currentBalance = balanceAsPerUCSE - expenditureAfterUCSE;
      const totalBalance = currentBalance + bifurcationNewGrant;
      return [
        k,
        {
          balanceAsPerUCSE,
          expenditureAfterUCSE,
          currentBalance,
          bifurcationNewGrant,
          totalBalance
        }
      ];
    })
  );
}

function projectTypeLabelFromSelection(selectedType, othersSpecify) {
  if (!selectedType) return '';
  if (selectedType === 'others') return `Others: ${(othersSpecify || '').trim()}`;
  const row = PROJECT_TYPES.find((p) => p.key === selectedType);
  return row ? row.label : selectedType;
}

function deriveTypeKeyFromLabel(label) {
  if (!label || typeof label !== 'string') return '';
  const t = label.trim();
  if (t.toLowerCase().startsWith('others:')) return 'others';
  const match = PROJECT_TYPES.find((p) => p.label === t);
  return match ? match.key : '';
}

export default function ProjectAccountForm({ approvedProjects = [], onSubmit, onCancel, existingAccount = null }) {
  const [selectedProjectId, setSelectedProjectId] = useState(existingAccount?.projectId || '');
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState({});

  const [selectedType, setSelectedType] = useState(deriveTypeKeyFromLabel(existingAccount?.projectTypeLabel));

  const [formData, setFormData] = useState({
    projectTitle: existingAccount?.projectTitle || '',
    piName: existingAccount?.piName || '',
    department: existingAccount?.department || '',
    fundingAgency: existingAccount?.fundingAgency || '',
    sanctionLetterNo: existingAccount?.sanctionLetterNo || '',
    sanctionDate: existingAccount?.sanctionDate?.slice?.(0, 10) || '',
    fundingSchemeName: existingAccount?.fundingSchemeName || '',
    durationFrom: existingAccount?.duration?.from?.slice?.(0, 10) || '',
    durationTo: existingAccount?.duration?.to?.slice?.(0, 10) || '',
    totalProjectCost:
      existingAccount != null && existingAccount.totalProjectCost != null && existingAccount.totalProjectCost !== ''
        ? String(existingAccount.totalProjectCost)
        : '0',
    amountReceivedOpening:
      existingAccount != null &&
      existingAccount.amountReceivedOpening != null &&
      existingAccount.amountReceivedOpening !== ''
        ? String(existingAccount.amountReceivedOpening)
        : '0',
    modeOfTransfer: existingAccount?.fundDetails?.modeOfTransfer || '',
    transactionUTR: existingAccount?.fundDetails?.transactionUTR || '',
    dateOfCredit: existingAccount?.fundDetails?.dateOfCredit?.slice?.(0, 10) || '',
    amountReceived:
      existingAccount?.fundDetails?.amountReceived != null && existingAccount.fundDetails.amountReceived !== ''
        ? String(existingAccount.fundDetails.amountReceived)
        : '0',
    othersSpecify:
      existingAccount?.projectTypeLabel?.startsWith?.('Others:')
        ? existingAccount.projectTypeLabel.replace(/^Others:\s*/i, '').trim()
        : '',
    declarationAccepted: Boolean(existingAccount?.declarationAccepted)
  });

  const [budgetRows, setBudgetRows] = useState(
    existingAccount?.budgetHeads ? budgetRowsFromExisting(existingAccount.budgetHeads) : Object.fromEntries(BUDGET_KEYS.map((k) => [k, emptyBudgetRow()]))
  );

  const updateBudgetRow = (key, field, value) => {
    setBudgetRows((prev) => {
      const row = { ...prev[key], [field]: value };
      row.currentBalance = num(row.balanceAsPerUCSE) - num(row.expenditureAfterUCSE);
      row.totalBalance = row.currentBalance + num(row.bifurcationNewGrant);
      return { ...prev, [key]: row };
    });
  };

  const colTotal = (field) => BUDGET_KEYS.reduce((s, k) => s + num(budgetRows[k]?.[field]), 0);

  const handleProjectChange = (id) => {
    setSelectedProjectId(id);
    const p = approvedProjects.find((x) => x.id === id);
    if (!p || existingAccount) return;

    setFormData((prev) => ({
      ...prev,
      projectTitle: p.title || '',
      piName: p.piName || '',
      department: p.department || '',
      fundingAgency: p.fundingAgency || '',
      durationFrom: p.duration?.from?.slice?.(0, 10) || '',
      durationTo: p.duration?.to?.slice?.(0, 10) || '',
      totalProjectCost: String(p.totalProjectCost ?? '0'),
    }));
  };

  const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.declarationAccepted) {
      alert('Please accept the declaration.');
      return;
    }
    if (!selectedType) {
      alert('Please select a project type.');
      return;
    }
    if (selectedType === 'others' && !formData.othersSpecify.trim()) {
      alert('Please specify the project type.');
      return;
    }
    if (!selectedProjectId) {
      alert('Please select an approved project.');
      return;
    }

    const totalCost = num(formData.totalProjectCost);
    const budgetHeadsPayload = normalizeBudgetHeadsForPayload(budgetRows);
    const sumPayload = BUDGET_KEYS.reduce((s, k) => s + budgetHeadsPayload[k].totalBalance, 0);
    if (Math.abs(sumPayload - totalCost) > 0.01) {
      alert('The combined total of budget heads (Total a+b column) must exactly equal the total project sanctioned cost.');
      return;
    }

    setSubmitting(true);
    try {
      const budgetHeads = budgetHeadsPayload;
      const projectTypeLabel = projectTypeLabelFromSelection(selectedType, formData.othersSpecify);

      const documents = {};
      if (files.sanctionedOrder) {
        documents.sanctionedOrder = await readAsDataUrl(files.sanctionedOrder);
      } else if (!existingAccount) {
        alert('Sanction order PDF is required.');
        setSubmitting(false);
        return;
      }

      const supportUrls = [];
      for (const key of ['supporting1', 'supporting2', 'supporting3']) {
        const f = files[key];
        if (f) supportUrls.push(await readAsDataUrl(f));
      }

      if (!existingAccount) {
        documents.supportingDocuments = supportUrls;
      } else if (supportUrls.length > 0) {
        documents.supportingDocuments = supportUrls;
      }

      const payload = {
        accountId: existingAccount?.id,
        projectId: selectedProjectId,
        projectTitle: formData.projectTitle,
        piName: formData.piName,
        department: formData.department,
        fundingAgency: formData.fundingAgency,
        sanctionLetterNo: formData.sanctionLetterNo,
        sanctionDate: formData.sanctionDate,
        fundingSchemeName: formData.fundingSchemeName,
        projectTypeLabel,
        duration: { from: formData.durationFrom, to: formData.durationTo },
        totalProjectCost: totalCost,
        amountReceivedOpening: num(formData.amountReceivedOpening),
        grantYearTick: [],
        budgetHeads,
        fundDetails: {
          modeOfTransfer: formData.modeOfTransfer,
          transactionUTR: formData.transactionUTR,
          dateOfCredit: formData.dateOfCredit,
          amountReceived: num(formData.amountReceived)
        },
        declarationAccepted: formData.declarationAccepted,
        ...(Object.keys(documents).length ? { documents } : {})
      };

      const ok = await onSubmit(payload, existingAccount?.id);
      if (!ok) setSubmitting(false);
    } catch (err) {
      console.error(err);
      alert('Something went wrong while preparing the form. Please try again.');
      setSubmitting(false);
    }
  };

  const formId = 'project-account-opening-form';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="px-8 py-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 flex justify-between items-center shrink-0 shadow-md">
          <div>
            <h2 className="text-xl font-bold text-purple-100  dark:text-white tracking-tight flex items-center gap-2">
              <ClipboardCheck size={24} className="text-purple-200" /> Project Account Opening Form
            </h2>
            <p className="text-purple-100 text-[10px] uppercase tracking-[0.2em] mt-1 font-medium opacity-80">Budget Bifurcation & Administration</p>
          </div>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors text-gray-900 dark:text-white">
            <X size={24} />
          </button>
        </div>

        <form id={formId} onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 flex-1 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
          <div className={sectionWrapper}>
            <h3 className={sectionTitle}>
              <Briefcase size={18} className="text-indigo-600" /> Project Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className={labelClass}>Select Approved Project *</label>
                <select
                  required
                  disabled={Boolean(existingAccount)}
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose project from list...</option>
                  {approvedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sanction Letter No. *</label>
                <input
                  required
                  value={formData.sanctionLetterNo}
                  onChange={(e) => setFormData({ ...formData, sanctionLetterNo: e.target.value })}
                  className={inputClass}
                  placeholder="Agency/Letter/Year/001"
                />
              </div>
              <div>
                <label className={labelClass}>Sanction Date *</label>
                <input
                  required
                  type="date"
                  value={formData.sanctionDate}
                  onChange={(e) => setFormData({ ...formData, sanctionDate: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={sectionWrapper}>
            <h3 className={sectionTitle}>
              <FileText size={18} className="text-purple-600" /> Basic Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Title of the Project *</label>
                <input
                  required
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Name of Principal Investigator (PI) *</label>
                <input
                  required
                  value={formData.piName}
                  onChange={(e) => setFormData({ ...formData, piName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Department *</label>
                <input
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Funding Agency *</label>
                <input
                  required
                  value={formData.fundingAgency}
                  onChange={(e) => setFormData({ ...formData, fundingAgency: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Name of Funding Scheme</label>
                <input
                  value={formData.fundingSchemeName}
                  onChange={(e) => setFormData({ ...formData, fundingSchemeName: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. SERB-CRG"
                />
              </div>
            </div>

            <div className="mt-4 p-5 bg-indigo-50/30 rounded-xl border border-indigo-100">
              <label className="text-[11px] font-bold text-indigo-900 block mb-4 uppercase tracking-widest opacity-70">Nature of Project (Select One) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PROJECT_TYPES.map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedType === key ? 'bg-white border-purple-600 shadow-md shadow-purple-100' : 'bg-white border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="projType"
                      checked={selectedType === key}
                      onChange={() => setSelectedType(key)}
                      className="w-4 h-4 text-purple-700 focus:ring-purple-600"
                    />
                    <span className={`text-sm font-bold ${selectedType === key ? 'text-purple-900' : 'text-slate-600'}`}>{label}</span>
                  </label>
                ))}
              </div>
              {selectedType === 'others' && (
                <div className="mt-4">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">SPECIFY NATURE</label>
                  <input
                    required
                    type="text"
                    value={formData.othersSpecify}
                    onChange={(e) => setFormData({ ...formData, othersSpecify: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={sectionWrapper}>
            <h3 className={sectionTitle}>
              <IndianRupee size={18} className="text-violet-600" /> Budget Heads & Bifurcation
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-4 border-b">Budget Heads</th>
                    <th className="p-4 border-b text-center">Bal. as per UC/SE</th>
                    <th className="p-4 border-b text-center">Exp. After UC</th>
                    <th className="p-4 border-b text-center bg-slate-100/50 text-slate-900">Current (a)</th>
                    <th className="p-4 border-b text-center">New Grant (b)</th>
                    <th className="p-4 border-b text-center bg-purple-50 text-purple-900 font-black">Total (a+b)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {BUDGET_KEYS.map((k) => (
                    <tr key={k} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{KEY_TO_LABEL[k]}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={budgetRows[k].balanceAsPerUCSE}
                          onFocus={(e) => {
                            if (e.target.value === '0') updateBudgetRow(k, 'balanceAsPerUCSE', '');
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || e.target.value === '.') updateBudgetRow(k, 'balanceAsPerUCSE', '0');
                          }}
                          onChange={(e) => updateBudgetRow(k, 'balanceAsPerUCSE', sanitizeMoneyTyping(e.target.value))}
                          className={`${inputClass} text-center`}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={budgetRows[k].expenditureAfterUCSE}
                          onFocus={(e) => {
                            if (e.target.value === '0') updateBudgetRow(k, 'expenditureAfterUCSE', '');
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || e.target.value === '.') updateBudgetRow(k, 'expenditureAfterUCSE', '0');
                          }}
                          onChange={(e) => updateBudgetRow(k, 'expenditureAfterUCSE', sanitizeMoneyTyping(e.target.value))}
                          className={`${inputClass} text-center`}
                        />
                      </td>
                      <td className="p-4 text-center font-bold text-slate-400 bg-slate-50/50">
                        {num(budgetRows[k].currentBalance).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={budgetRows[k].bifurcationNewGrant}
                          onFocus={(e) => {
                            if (e.target.value === '0') updateBudgetRow(k, 'bifurcationNewGrant', '');
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || e.target.value === '.') updateBudgetRow(k, 'bifurcationNewGrant', '0');
                          }}
                          onChange={(e) => updateBudgetRow(k, 'bifurcationNewGrant', sanitizeMoneyTyping(e.target.value))}
                          className={`${inputClass} text-center border-purple-200`}
                        />
                      </td>
                      <td className="p-4 text-center font-black text-purple-700 bg-purple-50/50">
                        {num(budgetRows[k].totalBalance).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className=" bg-slate-300 dark:bg-slate-600 text-gray-900 dark:text-white font-bold">
                  <tr>
                    <td className="p-4 rounded-bl-xl uppercase text-xs tracking-widest">Grand Total</td>
                    <td className="p-4 text-center">₹{colTotal('balanceAsPerUCSE').toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center">₹{colTotal('expenditureAfterUCSE').toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center text-slate-900 dark:text-white font-medium">₹{colTotal('currentBalance').toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center">₹{colTotal('bifurcationNewGrant').toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center text-purple-900 dark:text-purple-400 font-black rounded-br-xl text-md">
                      ₹{colTotal('totalBalance').toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Grand total of <strong>Total (a+b)</strong> must equal <strong>Total Project Sanctioned Cost</strong> in the section below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={sectionWrapper}>
              <h3 className={sectionTitle}>
                <Calendar size={18} className="text-indigo-600" /> Project Period & Cost
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Duration From *</label>
                  <input
                    type="date"
                    required
                    value={formData.durationFrom}
                    onChange={(e) => setFormData({ ...formData, durationFrom: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Duration To *</label>
                  <input
                    type="date"
                    required
                    value={formData.durationTo}
                    onChange={(e) => setFormData({ ...formData, durationTo: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Total Project Sanctioned Cost (Rs) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.totalProjectCost}
                    onFocus={(e) => {
                      if (e.target.value === '0') setFormData((p) => ({ ...p, totalProjectCost: '' }));
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === '.') setFormData((p) => ({ ...p, totalProjectCost: '0' }));
                    }}
                    onChange={(e) => setFormData((p) => ({ ...p, totalProjectCost: sanitizeMoneyTyping(e.target.value) }))}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Opening Installment Received (Rs) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.amountReceivedOpening}
                    onFocus={(e) => {
                      if (e.target.value === '0') setFormData((p) => ({ ...p, amountReceivedOpening: '' }));
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === '.') setFormData((p) => ({ ...p, amountReceivedOpening: '0' }));
                    }}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, amountReceivedOpening: sanitizeMoneyTyping(e.target.value) }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className={sectionWrapper}>
              <h3 className={sectionTitle}>
                <PlusCircle size={18} className="text-violet-600" /> Fund Credit Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Mode of Transfer *</label>
                    <input
                      required
                      value={formData.modeOfTransfer}
                      onChange={(e) => setFormData({ ...formData, modeOfTransfer: e.target.value })}
                      className={inputClass}
                      placeholder="NEFT/RTGS"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Actual Date of Credit *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfCredit}
                      onChange={(e) => setFormData({ ...formData, dateOfCredit: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Transaction Ref / UTR No. *</label>
                  <input
                    required
                    value={formData.transactionUTR}
                    onChange={(e) => setFormData({ ...formData, transactionUTR: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Net Amount Credited (Rs) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.amountReceived}
                    onFocus={(e) => {
                      if (e.target.value === '0') setFormData((p) => ({ ...p, amountReceived: '' }));
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === '.') setFormData((p) => ({ ...p, amountReceived: '0' }));
                    }}
                    onChange={(e) => setFormData((p) => ({ ...p, amountReceived: sanitizeMoneyTyping(e.target.value) }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-8 rounded-2xl border border-slate-200 space-y-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest opacity-80">
              <Upload size={18} className="text-indigo-600" /> Mandatory Enclosures
            </h3>
            <p className="text-xs text-slate-600">
              <strong>Sanctioned order PDF is required.</strong> Up to three supporting PDFs are optional.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DocBox
                label="Sanctioned Order *"
                required={!existingAccount?.documents?.sanctionedOrder}
                onChange={(f) => setFiles({ ...files, sanctionedOrder: f })}
              />
              <DocBox label="Support Doc 1" required={false} onChange={(f) => setFiles({ ...files, supporting1: f })} />
              <DocBox label="Support Doc 2" required={false} onChange={(f) => setFiles({ ...files, supporting2: f })} />
              <DocBox label="Support Doc 3" required={false} onChange={(f) => setFiles({ ...files, supporting3: f })} />
            </div>
            {existingAccount && (
              <p className="text-xs text-slate-600">
                Leave file inputs empty to keep existing uploads. You may upload 1–3 new supporting PDFs to replace the previous set.
              </p>
            )}

            <label className="flex items-start gap-4 cursor-pointer mt-8 p-5 bg-white border-2 border-indigo-50 rounded-xl hover:border-purple-200 transition-all group">
              <input
                type="checkbox"
                required
                checked={formData.declarationAccepted}
                onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                className="mt-1 w-6 h-6 rounded border-slate-300 text-purple-700 focus:ring-purple-600"
              />
              <span className="text-sm leading-relaxed text-slate-600">
                <span className="font-bold text-slate-900 block mb-1 uppercase text-[11px] tracking-wider group-hover:text-purple-800 transition-colors">
                  PI Affirmation:
                </span>
                I hereby declare that all information provided is accurate and the requested budget bifurcation strictly adheres to the
                funding agency's approved sanction letter and university regulations.
              </span>
            </label>
          </div>
        </form>

        <div className="px-8 py-6 bg-white border-t border-slate-200 flex justify-end gap-6 shrink-0">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-400 font-bold hover:text-slate-900 transition-colors text-xs uppercase tracking-[0.2em]">
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="px-12 py-3.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 text-purple-100 dark:text-white rounded-xl font-bold shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3 uppercase text-xs tracking-widest"
          >
            {submitting ? (
              'Processing...'
            ) : (
              <>
                <CheckCircle2 size={18} />
                {existingAccount ? 'Update Records' : 'Open Account & Submit'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocBox({ label, onChange, required }) {
  return (
    <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <input
        type="file"
        accept=".pdf,application/pdf"
        required={required}
        onChange={(e) => onChange(e.target.files[0])}
        className="block w-full text-[10px] text-slate-500
          file:mr-2 file:py-1 file:px-3
          file:rounded-md file:border-0
          file:text-[10px] file:font-bold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100 transition-all cursor-pointer"
      />
    </div>
  );
}
