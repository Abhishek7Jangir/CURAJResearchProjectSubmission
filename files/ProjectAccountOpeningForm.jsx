import React, { useState } from 'react';
import { X } from 'lucide-react';

const num = (v) => parseFloat(v) || 0;

const BUDGET_HEADS = [
  'Equipment',
  'Manpower',
  'Contingency',
  'Consumable',
  'Travel',
  'Overhead',
  'Others (if any)',
];

const emptyBudgetRow = () => ({
  balanceAsPerUCSE: '',
  expenditureAfterUCSE: '',
  currentBalance: 0,
  bifurcationNewGrant: '',
  totalBalance: 0,
});

const GRANT_YEARS = ['1st', '2nd', '3rd', '4th'];

const PROJECT_TYPES = [
  { key: 'governmentFunded', label: 'Government Funded' },
  { key: 'industrySponsored', label: 'Industry Sponsored' },
  { key: 'consultancy', label: 'Consultancy' },
  { key: 'others', label: 'Others (Specify)' },
];

const inp =
  'w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm bg-white';

export default function ProjectAccountOpeningForm({ onSubmit, onCancel }) {
  // ── 1. Basic Info ─────────────────────────────────────────────────────────
  const [sanctionLetterNo, setSanctionLetterNo] = useState('');
  const [projectTitle, setProjectTitle]         = useState('');
  const [piName, setPiName]                     = useState('');
  const [department, setDepartment]             = useState('');
  const [fundingAgency, setFundingAgency]       = useState('');

  // ── 7. Project Type ───────────────────────────────────────────────────────
  const [projectTypes, setProjectTypes] = useState({
    governmentFunded: false,
    industrySponsored: false,
    consultancy: false,
    others: false,
  });
  const [othersSpecify, setOthersSpecify] = useState('');

  // ── 8–11. Scheme / Duration / Cost / First Installment ───────────────────
  const [fundingSchemeName, setFundingSchemeName]           = useState('');
  const [durationFrom, setDurationFrom]                     = useState('');
  const [durationTo, setDurationTo]                         = useState('');
  const [totalProjectCost, setTotalProjectCost]             = useState('');
  const [amountReceivedOpening, setAmountReceivedOpening]   = useState('');

  // ── 12. Budget Heads ──────────────────────────────────────────────────────
  const [grantYears, setGrantYears] = useState({ '1st': false, '2nd': false, '3rd': false, '4th': false });

  const initBudget = {};
  BUDGET_HEADS.forEach(h => { initBudget[h] = emptyBudgetRow(); });
  const [budgetRows, setBudgetRows] = useState(initBudget);

  // ── 13. Fund Details ──────────────────────────────────────────────────────
  const [modeOfTransfer, setModeOfTransfer]   = useState('');
  const [transactionUTR, setTransactionUTR]   = useState('');
  const [dateOfCredit, setDateOfCredit]       = useState('');
  const [amountReceived, setAmountReceived]   = useState('');

  // ── 14. Declaration checkbox ──────────────────────────────────────────────
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ── helpers ───────────────────────────────────────────────────────────────
  const toggleProjectType = (key) => {
    setProjectTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGrantYear = (year) => {
    setGrantYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const updateBudgetRow = (head, field, value) => {
    setBudgetRows(prev => {
      const row = { ...prev[head], [field]: value };
      // currentBalance = balanceAsPerUCSE - expenditureAfterUCSE  (a)
      row.currentBalance =
        num(row.balanceAsPerUCSE) - num(row.expenditureAfterUCSE);
      // totalBalance = currentBalance(a) + bifurcationNewGrant(b)
      row.totalBalance = row.currentBalance + num(row.bifurcationNewGrant);
      return { ...prev, [head]: row };
    });
  };

  const colTotal = (field) =>
    BUDGET_HEADS.reduce((s, h) => s + num(budgetRows[h][field]), 0);

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!declarationAccepted) {
      alert('Please accept the declaration before submitting.');
      return;
    }
    setSubmitting(true);

    const payload = {
      sanctionLetterNo,
      projectTitle,
      piName,
      department,
      fundingAgency,
      projectType: {
        ...projectTypes,
        othersSpecify: projectTypes.others ? othersSpecify : '',
      },
      fundingSchemeName,
      duration: { from: durationFrom, to: durationTo },
      totalProjectCost:        num(totalProjectCost),
      amountReceivedOpening:   num(amountReceivedOpening),
      grantYearTick:           Object.keys(grantYears).filter(y => grantYears[y]),
      budgetHeads:             budgetRows,
      fundDetails: {
        modeOfTransfer,
        transactionUTR,
        dateOfCredit,
        amountReceived: num(amountReceived),
      },
      declarationAccepted,
    };
    try { await onSubmit(payload); }
    finally { setSubmitting(false); }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[96vh] overflow-y-auto my-4">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-300 p-5 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900 underline uppercase tracking-wide text-center w-full">
                Project Account Opening &amp; Budget Bifurcation Form
              </h2>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 ml-4 mt-1 shrink-0">
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm text-gray-800">

          {/* 1. Sanction Letter No. */}
          <FormRow no="1." label="Sanction Letter No. with date:">
            <input required value={sanctionLetterNo} onChange={e => setSanctionLetterNo(e.target.value)} className={inp} />
          </FormRow>

          {/* 2. Title */}
          <FormRow no="2." label="Title of the Project:">
            <input required value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className={inp} />
          </FormRow>

          {/* 3. PI Name */}
          <FormRow no="3." label="Name of the Principal Investigator (PI):">
            <input required value={piName} onChange={e => setPiName(e.target.value)} className={inp} />
          </FormRow>

          {/* 4. Department */}
          <FormRow no="4." label="Department:">
            <input required value={department} onChange={e => setDepartment(e.target.value)} className={inp} />
          </FormRow>

          {/* 5. Funding Agency */}
          <FormRow no="5." label="Funding Agency:">
            <input required value={fundingAgency} onChange={e => setFundingAgency(e.target.value)} className={inp} />
          </FormRow>

          {/* 7. Type of Project */}
          <div className="flex items-start gap-3">
            <span className="w-5 shrink-0 font-semibold pt-1 text-sm">7.</span>
            <span className="w-52 shrink-0 text-gray-700 pt-1 text-sm font-semibold">Type of Project:</span>
            <div className="flex flex-wrap gap-4 pt-1">
              {PROJECT_TYPES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={projectTypes[key]}
                    onChange={() => toggleProjectType(key)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  {label}
                  {key === 'others' && projectTypes.others && (
                    <input
                      type="text"
                      value={othersSpecify}
                      onChange={e => setOthersSpecify(e.target.value)}
                      placeholder="Specify…"
                      className="ml-1 px-2 py-0.5 border border-gray-300 rounded text-sm w-32"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 8. Funding Scheme Name */}
          <FormRow no="8." label="Name of Funding Scheme:">
            <input value={fundingSchemeName} onChange={e => setFundingSchemeName(e.target.value)} className={inp} />
          </FormRow>

          {/* 9. Duration */}
          <div className="flex items-center gap-3">
            <span className="w-5 shrink-0 font-semibold text-sm">9.</span>
            <span className="w-52 shrink-0 text-gray-700 text-sm font-semibold">Duration of the Project:</span>
            <span className="text-sm text-gray-600 mr-2">From</span>
            <input
              type="date"
              value={durationFrom}
              onChange={e => setDurationFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-40"
            />
            <span className="text-sm text-gray-600 mx-2">To</span>
            <input
              type="date"
              value={durationTo}
              onChange={e => setDurationTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-40"
            />
          </div>

          {/* 10. Total Project Cost */}
          <FormRow no="10." label="Total Project Cost (₹):">
            <input type="number" min="0" value={totalProjectCost}
              onChange={e => setTotalProjectCost(e.target.value)}
              className={`${inp} max-w-xs`} />
          </FormRow>

          {/* 11. Amount Received for Opening */}
          <FormRow no="11." label="Amount Received for Opening (First Installment) (₹):">
            <input type="number" min="0" value={amountReceivedOpening}
              onChange={e => setAmountReceivedOpening(e.target.value)}
              className={`${inp} max-w-xs`} />
          </FormRow>

          {/* 12. Budget Heads */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold text-sm">12.</span>
              <span className="font-semibold text-sm">Budget Heads as per Sanction:</span>
            </div>

            {/* Grant year tick */}
            <div className="ml-8 mb-3 flex items-center gap-2 text-sm text-gray-700">
              <span>Please tick: grant release for</span>
              {GRANT_YEARS.map((yr, i) => (
                <React.Fragment key={yr}>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantYears[yr]}
                      onChange={() => toggleGrantYear(yr)}
                      className="w-3.5 h-3.5 text-blue-600"
                    />
                    <span className="text-xs">{yr} Year</span>
                  </label>
                  {i < GRANT_YEARS.length - 1 && <span className="text-gray-400">/</span>}
                </React.Fragment>
              ))}
            </div>

            {/* Budget table */}
            <div className="ml-4 overflow-x-auto border border-gray-300 rounded">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Heads</th>
                    <th className="border border-gray-300 p-2 text-center">
                      Balance as per<br />UC/SE
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Expenditure as on date<br />after submission of UC/SE
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Current balance<br />(a)
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      Bifurcation of new Grant as per<br />guidelines of funding agency Rs. (b)
                    </th>
                    <th className="border border-gray-300 p-2 text-center">
                      (a + b)<br />Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BUDGET_HEADS.map((head) => {
                    const row = budgetRows[head];
                    return (
                      <tr key={head} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium whitespace-nowrap">{head}</td>
                        <td className="border border-gray-300 p-1">
                          <input type="number" min="0" value={row.balanceAsPerUCSE}
                            onChange={e => updateBudgetRow(head, 'balanceAsPerUCSE', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input type="number" min="0" value={row.expenditureAfterUCSE}
                            onChange={e => updateBudgetRow(head, 'expenditureAfterUCSE', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">
                          {row.currentBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input type="number" min="0" value={row.bifurcationNewGrant}
                            onChange={e => updateBudgetRow(head, 'bifurcationNewGrant', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">
                          {row.totalBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 p-2">Total</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {colTotal('balanceAsPerUCSE').toLocaleString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {colTotal('expenditureAfterUCSE').toLocaleString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {colTotal('currentBalance').toLocaleString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {colTotal('bifurcationNewGrant').toLocaleString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {colTotal('totalBalance').toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 13. Fund Details */}
          <div>
            <p className="font-semibold mb-3 text-sm">
              13. Detail of the fund received <span className="font-normal italic">(Enclosed Proof)</span>
            </p>
            <div className="ml-8 space-y-3">
              <FundRow label="a. Mode of Transfer:">
                <input value={modeOfTransfer} onChange={e => setModeOfTransfer(e.target.value)} className={inp} />
              </FundRow>
              <FundRow label="b. Transaction / UTR No.:">
                <input value={transactionUTR} onChange={e => setTransactionUTR(e.target.value)} className={inp} />
              </FundRow>
              <FundRow label="c. Date of Credit:">
                <input type="date" value={dateOfCredit} onChange={e => setDateOfCredit(e.target.value)}
                  className={`${inp} max-w-xs`} />
              </FundRow>
              <FundRow label="d. Amount Received (₹):">
                <input type="number" min="0" value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  className={`${inp} max-w-xs`} />
              </FundRow>
            </div>
          </div>

          {/* 14. Declaration checkbox */}
          <div className="border border-blue-200 rounded p-4 bg-blue-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={e => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold">14. Declaration by Principal Investigator: </span>
                I hereby declare that the above information is correct to the best of my knowledge and
                request for opening of a dedicated project account for the mentioned project.
                By submitting this form digitally, I understand that this submission is considered
                equivalent to my physical signature and I take full responsibility for the accuracy
                of the information provided.
              </span>
            </label>
            {!declarationAccepted && (
              <p className="mt-2 ml-7 text-xs text-red-500">
                * You must accept the declaration before submitting.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onCancel}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting…' : 'Submit Form'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────
function FormRow({ no, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-5 shrink-0 font-semibold pt-1.5 text-sm">{no}</span>
      <span className="w-52 shrink-0 text-gray-700 pt-1.5 text-sm font-semibold">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function FundRow({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-52 shrink-0 text-gray-700 text-sm font-medium">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
