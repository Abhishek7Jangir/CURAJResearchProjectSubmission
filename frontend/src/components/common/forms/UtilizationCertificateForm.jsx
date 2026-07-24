import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { CERTIFICATION_POINT_TEXTS } from '../../../constants/utilizationCertificateCertification';

const num = (v) => parseFloat(v) || 0;

const emptyGrantRow = () => ({
  unspentBalance: '',
  interestEarned: '',
  interestDepositedBack: '',
  sanctionNo: '',
  sanctionDate: '',
  grantAmount: '',
  totalAvailableFunds: 0,
  expenditureIncurred: '',
  closingBalance: 0,
});

const emptyEquipmentRow = () => ({
  equipmentName: '',
  sanctionedCost: '',
  actualCost: '',
  orderDate: '',
  receivedDate: '',
  voucherNoDate: '',
  priceFluctuationReason: '',
});

const STMT_HEADS = [
  { key: 'staff',          label: 'Staff',          section: 'A. Recurring' },
  { key: 'contingencies',  label: 'Contingencies',  section: null },
  { key: 'recurring',      label: 'Recurring',      section: null },
  { key: 'travel',         label: 'Travel',         section: null },
  { key: 'overhead',       label: 'Overhead',       section: null },
  { key: 'equipments',     label: 'Equipments',     section: 'B. Non-recurring' },
];

const emptyStmtRow = () => ({
  grantsReceived: '',
  unspentCarriedForward: '',
  interestEarned: '',
  total: 0,
  expenditureIncurred: '',
  balance: 0,
  remarks: '',
});

const inp   = 'w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm bg-white';
const roInp = 'w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-50 text-gray-500 dark:text-gray-500 text-sm cursor-not-allowed';

function dateInputValue(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toISOString().slice(0, 10);
}

export default function UtilizationCertificateForm({ approvedProjects, onSubmit, onCancel, existingCertificate }) {

  // ── 1. Basic ──────────────────────────────────────────────────────────────
  const [projectId,     setProjectId]     = useState('');
  const [fellowName,    setFellowName]    = useState('');
  const [schemeName,    setSchemeName]    = useState('');
  const [grantNature,   setGrantNature]   = useState('');
  const [financialYear, setFinancialYear] = useState('');

  // ── 4. Opening balances ───────────────────────────────────────────────────
  const [openCash, setOpenCash] = useState('');
  const [openAdv,  setOpenAdv]  = useState('');

  // ── 5. Grant details table ────────────────────────────────────────────────
  const [grantRows, setGrantRows] = useState([emptyGrantRow()]);

  // Component-wise utilization
  const [compGeneral, setCompGeneral] = useState('');
  const [compSalary,  setCompSalary]  = useState('');
  const [compCapital, setCompCapital] = useState('');

  // ── Closing balances ──────────────────────────────────────────────────────
  const [closeCash, setCloseCash] = useState('');
  const [closeAdv,  setCloseAdv]  = useState('');

  // Certification checkboxes — exactly 9 points from the document
  const [checks, setChecks] = useState(Array(9).fill(false));

  // Date / Place
  const [certDate,  setCertDate]  = useState('');
  const [certPlace, setCertPlace] = useState('');

  // ── Statement of Expenditure ──────────────────────────────────────────────
  const [stmtPeriodFrom, setStmtPeriodFrom] = useState('');
  const [stmtPeriodTo,   setStmtPeriodTo]   = useState('');
  const initStmt = {};
  STMT_HEADS.forEach(h => { initStmt[h.key] = emptyStmtRow(); });
  const [stmt, setStmt] = useState(initStmt);

  // ── Assets Acquired ───────────────────────────────────────────────────────
  const [assets, setAssets] = useState({
    sanctioningAuthority:      '',
    slNo:                      '',
    granteeInstitution:        '',
    sanctionOrderNoDate:       '',
    amountSanctionedNR:        '',
    purposeOfGrant:            '',
    govtOwnershipCondition:    '',
    assetParticulars:          '',
    valueAsOn:                 '',
    currentPurpose:            '',
    encumbered:                '',
    encumberedReason:          '',
    disposed:                  '',
    disposalReasonAuthority:   '',
    amountRealizedOnDisposal:  '',
    remarks:                   '',
  });

  // ── Equipment procured — 10 rows by default like the document ─────────────
  const [equipRows, setEquipRows] = useState(
    Array(10).fill(null).map(() => emptyEquipmentRow())
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!existingCertificate) return;
    const ex = existingCertificate;
    setProjectId(ex.projectId || '');
    setFellowName(ex.fellowName || '');
    setSchemeName(ex.schemeName || '');
    setGrantNature(ex.grantNature || '');
    setFinancialYear(ex.financialYear || '');
    setOpenCash(String(ex.openingCashInHand ?? ''));
    setOpenAdv(String(ex.openingUnadjustedAdvances ?? ''));
    setGrantRows(
      Array.isArray(ex.grantDetails) && ex.grantDetails.length
        ? ex.grantDetails.map((r) => ({
            unspentBalance: r.unspentBalance ?? '',
            interestEarned: r.interestEarned ?? '',
            interestDepositedBack: r.interestDepositedBack ?? '',
            sanctionNo: r.sanctionNo ?? '',
            sanctionDate: dateInputValue(r.sanctionDate),
            grantAmount: r.grantAmount ?? '',
            totalAvailableFunds: r.totalAvailableFunds ?? 0,
            expenditureIncurred: r.expenditureIncurred ?? '',
            closingBalance: r.closingBalance ?? 0
          }))
        : [emptyGrantRow()]
    );
    const cu = ex.componentUtilization || {};
    setCompGeneral(String(cu.grantInAidGeneral ?? ''));
    setCompSalary(String(cu.grantInAidSalary ?? ''));
    setCompCapital(String(cu.grantInAidCapitalAssets ?? ''));
    setCloseCash(String(ex.closingCashInHand ?? ''));
    setCloseAdv(String(ex.closingUnadjustedAdvances ?? ''));
    setChecks(Array.isArray(ex.certificationChecks) && ex.certificationChecks.length === 9 ? ex.certificationChecks : Array(9).fill(false));
    setCertDate(dateInputValue(ex.certDate));
    setCertPlace(ex.certPlace || '');
    const es = ex.expenditureStatement || {};
    setStmtPeriodFrom(es.periodFrom || '');
    setStmtPeriodTo(es.periodTo || '');
    const nextStmt = {};
    STMT_HEADS.forEach((h) => {
      const row = es[h.key] || {};
      nextStmt[h.key] = {
        grantsReceived: row.grantsReceived ?? '',
        unspentCarriedForward: row.unspentCarriedForward ?? '',
        interestEarned: row.interestEarned ?? '',
        total: row.total ?? 0,
        expenditureIncurred: row.expenditureIncurred ?? '',
        balance: row.balance ?? 0,
        remarks: row.remarks ?? ''
      };
    });
    setStmt(nextStmt);
    const a = ex.assetsAcquired || {};
    setAssets({
      sanctioningAuthority: a.sanctioningAuthority ?? '',
      slNo: a.slNo ?? '',
      granteeInstitution: a.granteeInstitution ?? '',
      sanctionOrderNoDate: a.sanctionOrderNoDate ?? '',
      amountSanctionedNR: a.amountSanctionedNR ?? '',
      purposeOfGrant: a.purposeOfGrant ?? '',
      govtOwnershipCondition: a.govtOwnershipCondition ?? '',
      assetParticulars: a.assetParticulars ?? '',
      valueAsOn: a.valueAsOn ?? '',
      currentPurpose: a.currentPurpose ?? '',
      encumbered: a.encumbered ?? '',
      encumberedReason: a.encumberedReason ?? '',
      disposed: a.disposed ?? '',
      disposalReasonAuthority: a.disposalReasonAuthority ?? '',
      amountRealizedOnDisposal: a.amountRealizedOnDisposal ?? '',
      remarks: a.remarks ?? ''
    });
    const eq = Array.isArray(ex.equipmentsProcured) ? ex.equipmentsProcured : [];
    const mapped = eq.map((r) => ({
      equipmentName: r.equipmentName ?? '',
      sanctionedCost: r.sanctionedCost ?? '',
      actualCost: r.actualCost ?? '',
      orderDate: dateInputValue(r.orderDate),
      receivedDate: dateInputValue(r.receivedDate),
      voucherNoDate: r.voucherNoDate ?? '',
      priceFluctuationReason: r.priceFluctuationReason ?? ''
    }));
    while (mapped.length < 10) mapped.push(emptyEquipmentRow());
    setEquipRows(mapped);
  }, [existingCertificate]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const updateGrantRow = (idx, field, value) => {
    const rows = [...grantRows];
    rows[idx] = { ...rows[idx], [field]: value };
    const r = rows[idx];
    r.totalAvailableFunds =
      num(r.unspentBalance) + num(r.interestEarned) - num(r.interestDepositedBack) + num(r.grantAmount);
    r.closingBalance = r.totalAvailableFunds - num(r.expenditureIncurred);
    setGrantRows(rows);
  };

  const updateStmt = (key, field, value) => {
    const row = { ...stmt[key], [field]: value };
    row.total   = num(row.grantsReceived) + num(row.unspentCarriedForward) + num(row.interestEarned);
    row.balance = row.total - num(row.expenditureIncurred);
    setStmt({ ...stmt, [key]: row });
  };

  const toggleCheck = (i) => {
    const c = [...checks];
    c[i] = !c[i];
    setChecks(c);
  };

  const stmtTotal = (field) =>
    STMT_HEADS.reduce((s, h) => s + num(stmt[h.key][field]), 0);

  const updateEquipRow = (idx, field, value) => {
    const rows = [...equipRows];
    rows[idx] = { ...rows[idx], [field]: value };
    setEquipRows(rows);
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) { alert('Please select a project.'); return; }
    setSubmitting(true);

    const payload = {
      projectId,
      fellowName,
      schemeName,
      financialYear,
      grantNature,
      openingCashInHand:            num(openCash),
      openingUnadjustedAdvances:    num(openAdv),
      grantDetails:                 grantRows,
      componentUtilization: {
        grantInAidGeneral:          num(compGeneral),
        grantInAidSalary:           num(compSalary),
        grantInAidCapitalAssets:    num(compCapital),
      },
      closingCashInHand:            num(closeCash),
      closingUnadjustedAdvances:    num(closeAdv),
      certificationChecks:          checks,
      certDate,
      certPlace,
      expenditureStatement: {
        periodFrom: stmtPeriodFrom,
        periodTo:   stmtPeriodTo,
        ...stmt
      },
      assetsAcquired: {
        ...assets,
        amountSanctionedNR:        num(assets.amountSanctionedNR),
        amountRealizedOnDisposal:  num(assets.amountRealizedOnDisposal),
      },
      equipmentsProcured: equipRows.filter(r => r.equipmentName.trim()),
    };

    try {
      const ok = await onSubmit(payload, existingCertificate?.id);
      if (!ok) setSubmitting(false);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[96vh] overflow-y-auto my-4">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-300 p-5 z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold tracking-wider">GFR 12 – A &nbsp;·&nbsp;</p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5 uppercase tracking-wide">
                Utilization Certificate for the Year…&nbsp;&nbsp;in Respect of
              </h2>
              <p className="text-sm font-semibold text-gray-700 uppercase">
                Recurring/Non-Recurring Grants-in-Aid/Salaries/Creation of Capital Assets
              </p>
            </div>
            <button onClick={onCancel} className="text-gray-600 dark:text-gray-400 hover:text-gray-700 ml-4 mt-1 shrink-0">
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 text-sm text-gray-800">

          {/* Project selector (system field) */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <label className="block text-xs font-semibold text-blue-700 mb-1">Select Project *</label>
            <select required value={projectId} onChange={e => setProjectId(e.target.value)}
              className={`${inp} max-w-md`}>
              <option value="">Choose a project…</option>
              {approvedProjects.map(p => (
                <option key={p.id} value={p.id}>{p.id} – {p.title}</option>
              ))}
            </select>
          </div>

          {/* 1–3 */}
          <div className="space-y-4">
            <FormRow no="1." label="Name of the Fellow">
              <input required value={fellowName} onChange={e => setFellowName(e.target.value)} className={inp} />
            </FormRow>
            <FormRow no="2." label="Name of the Scheme">
              <input required value={schemeName} onChange={e => setSchemeName(e.target.value)} className={inp} />
            </FormRow>
            <FormRow no="3." label="Whether recurring or non-recurring grants">
              <input required value={grantNature} onChange={e => setGrantNature(e.target.value)}
                placeholder="e.g. Recurring / Non-Recurring / Both" className={inp} />
            </FormRow>
            <FormRow no="" label="Financial Year">
              <input required value={financialYear} onChange={e => setFinancialYear(e.target.value)}
                placeholder="e.g. 2024-25" className={`${inp} max-w-xs`} />
            </FormRow>
          </div>

          {/* 4. Grants position at beginning */}
          <div>
            <p className="font-semibold mb-3">4.&nbsp; Grants position at the beginning of the Financial year</p>
            <div className="ml-6 space-y-2">
              <LabelInput label="(i)   Cash in Hand/Bank"     value={openCash} onChange={setOpenCash} required />
              <LabelInput label="(ii)  Unadjusted advances"   value={openAdv}  onChange={setOpenAdv} required />
              <div className="flex items-center gap-4">
                <span className="w-56 shrink-0 text-gray-600">(iii) Total</span>
                <input readOnly value={num(openCash) + num(openAdv)}
                  className={`${roInp} max-w-xs`} />
              </div>
            </div>
          </div>

          {/* 5. Grant details table */}
          <div>
            <p className="font-semibold mb-3">
              5.&nbsp; Details of grants received, expenditure incurred and closing balances: (Actuals)
            </p>
            <div className="overflow-x-auto border border-gray-300 rounded">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-center align-bottom" rowSpan={2}>
                      Unspent Balances of Grants received years<br />[figure as at Sl. No. 3 (iii)]<br /><br />(1)
                    </th>
                    <th className="border border-gray-300 p-2 text-center align-bottom" rowSpan={2}>
                      Interest Earned thereon<br /><br />(2)
                    </th>
                    <th className="border border-gray-300 p-2 text-center align-bottom" rowSpan={2}>
                      Interest deposited back to the Govern-ment<br /><br />(3)
                    </th>
                    <th className="border border-gray-300 p-2 text-center" colSpan={3}>
                      Grant received during the year<br />(4)
                    </th>
                    <th className="border border-gray-300 p-2 text-center align-bottom" rowSpan={2}>
                      Total Available funds (1+2-3+4)<br /><br />(5)
                    </th>
                    <th className="border border-gray-300 p-2 text-center align-bottom" rowSpan={2}>
                      Expenditure incurred<br /><br />(6)
                    </th>
                    <th className="border border-gray-300 p-2 text-center align-bottom" rowSpan={2}>
                      Closing Balances (5-6)<br /><br />(7)
                    </th>
                    <th className="border border-gray-300 p-1" rowSpan={2}></th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-center">Sanction No.<br />(i)</th>
                    <th className="border border-gray-300 p-2 text-center">Date<br />(ii)</th>
                    <th className="border border-gray-300 p-2 text-center">Amount<br />(iii)</th>
                  </tr>
                </thead>
                <tbody>
                  {grantRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" required value={row.unspentBalance}
                          onChange={e => updateGrantRow(idx, 'unspentBalance', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" value={row.interestEarned}
                          onChange={e => updateGrantRow(idx, 'interestEarned', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" value={row.interestDepositedBack}
                          onChange={e => updateGrantRow(idx, 'interestDepositedBack', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="text" value={row.sanctionNo}
                          onChange={e => updateGrantRow(idx, 'sanctionNo', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="date" value={row.sanctionDate}
                          onChange={e => updateGrantRow(idx, 'sanctionDate', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" required value={row.grantAmount}
                          onChange={e => updateGrantRow(idx, 'grantAmount', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium whitespace-nowrap">
                        {num(row.totalAvailableFunds).toLocaleString('en-IN')}
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" required value={row.expenditureIncurred}
                          onChange={e => updateGrantRow(idx, 'expenditureIncurred', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className={`border border-gray-300 p-2 text-center font-medium bg-gray-50 whitespace-nowrap ${num(row.closingBalance) < 0 ? 'text-red-600' : ''}`}>
                        {num(row.closingBalance).toLocaleString('en-IN')}
                      </td>
                      <td className="border border-gray-300 p-1">
                        {grantRows.length > 1 && (
                          <button type="button"
                            onClick={() => setGrantRows(grantRows.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setGrantRows([...grantRows, emptyGrantRow()])}
              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
              <Plus size={13} /> Add Row
            </button>

            {/* Component-wise utilization */}
            <p className="font-semibold mt-6 mb-2">Component wise utilization of grants:</p>
            <div className="overflow-x-auto border border-gray-300 rounded">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2">Grant-in-aid– General</th>
                    <th className="border border-gray-300 p-2">Grant-in-aid– Salary</th>
                    <th className="border border-gray-300 p-2">Grant-in-aid–creation of capital assets</th>
                    <th className="border border-gray-300 p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[
                      [compGeneral, setCompGeneral],
                      [compSalary,  setCompSalary],
                      [compCapital, setCompCapital],
                    ].map(([val, setter], i) => (
                      <td key={i} className="border border-gray-300 p-1">
                        <input type="number" min="0" value={val}
                          onChange={e => setter(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center font-semibold bg-gray-50">
                      {(num(compGeneral) + num(compSalary) + num(compCapital)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Closing balances */}
          <div>
            <p className="font-semibold mb-3">Details of grants position at the end of the year</p>
            <div className="ml-6 space-y-2">
              <LabelInput label="(i)   Cash in Hand/Bank"    value={closeCash} onChange={setCloseCash} required />
              <LabelInput label="(ii)  Unadjusted Advances"  value={closeAdv}  onChange={setCloseAdv} required />
              <div className="flex items-center gap-4">
                <span className="w-56 shrink-0 text-gray-600">(iii) Total</span>
                <input readOnly value={num(closeCash) + num(closeAdv)}
                  className={`${roInp} max-w-xs`} />
              </div>
            </div>
          </div>

          {/* Certification / Declaration — exactly 9 points */}
          <div className="border border-gray-300 rounded p-5 bg-gray-50 space-y-4">
            <p className="leading-relaxed">
              Certified that I have satisfied myself that the conditions on which grants were sanctioned have been duly
              fulfilled/are being fulfilled and that I have exercised following checks to see that the money has been
              actually utilized for the purpose for which it was sanctioned:
            </p>

            <ol className="space-y-3 list-none pl-0">
              {CERTIFICATION_POINT_TEXTS.map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <input type="checkbox" checked={checks[i]} onChange={() => toggleCheck(i)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded shrink-0" />
                  <span className="text-gray-700 leading-relaxed">
                    <span className="font-medium mr-1">{i + 1}.</span>{text}
                  </span>
                </li>
              ))}
            </ol>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date:</label>
                <input type="date" required value={certDate} onChange={e => setCertDate(e.target.value)}
                  className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Place:</label>
                <input type="text" required value={certPlace} onChange={e => setCertPlace(e.target.value)}
                  className={inp} />
              </div>
            </div>


          </div>

          {/* ── STATEMENT OF EXPENDITURE ── */}
          <div>
            <p className="text-base font-bold text-center mb-1">STATEMENT OF EXPENDITURE</p>
            <p className="text-xs text-gray-600 mb-3 text-center">
              Showing grants received from the Department of Health Research (DHR), GoI and the expenditure
              incurred during the period from&nbsp;
              <input type="date" required value={stmtPeriodFrom} onChange={e => setStmtPeriodFrom(e.target.value)}
                className="px-2 py-0.5 border border-gray-300 rounded text-xs inline-block w-36" />
              &nbsp;to&nbsp;
              <input type="date" required value={stmtPeriodTo} onChange={e => setStmtPeriodTo(e.target.value)}
                className="px-2 py-0.5 border border-gray-300 rounded text-xs inline-block w-36" />
            </p>

            <div className="overflow-x-auto border border-gray-300 rounded">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">Heads<br />(1)</th>
                    <th className="border border-gray-300 p-2 text-center">Grants received from the Department during the year<br />(2)</th>
                    <th className="border border-gray-300 p-2 text-center">Unspent balance carried forward from previous year<br />(3)</th>
                    <th className="border border-gray-300 p-2 text-center">Interest Earned, if any<br />(4)</th>
                    <th className="border border-gray-300 p-2 text-center">Total (2+3)<br />(5)</th>
                    <th className="border border-gray-300 p-2 text-center">Expenditure incurred during the year<br />(6)</th>
                    <th className="border border-gray-300 p-2 text-center">Balance (5-6)<br />(7)</th>
                    <th className="border border-gray-300 p-2 text-center">Remarks, if any<br />(8)</th>
                  </tr>
                </thead>
                <tbody>
                  {STMT_HEADS.map(({ key, label, section }) => (
                    <React.Fragment key={key}>
                      {section && (
                        <tr className="bg-gray-100">
                          <td colSpan={8} className="border border-gray-300 p-2 font-semibold">{section}</td>
                        </tr>
                      )}
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{label}</td>
                        {['grantsReceived', 'unspentCarriedForward', 'interestEarned'].map(f => (
                          <td key={f} className="border border-gray-300 p-1">
                            <input type="number" min="0" value={stmt[key][f]}
                              onChange={e => updateStmt(key, f, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                          </td>
                        ))}
                        <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">
                          {stmt[key].total.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input type="number" min="0" value={stmt[key].expenditureIncurred}
                            onChange={e => updateStmt(key, 'expenditureIncurred', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className={`border border-gray-300 p-2 text-center font-medium bg-gray-50 ${stmt[key].balance < 0 ? 'text-red-600' : ''}`}>
                          {stmt[key].balance.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-gray-300 p-1">
                          <input type="text" value={stmt[key].remarks}
                            onChange={e => updateStmt(key, 'remarks', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 p-2">Total</td>
                    {['grantsReceived', 'unspentCarriedForward', 'interestEarned'].map(f => (
                      <td key={f} className="border border-gray-300 p-2 text-center">
                        {stmtTotal(f).toLocaleString('en-IN')}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center">{stmtTotal('total').toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 p-2 text-center">{stmtTotal('expenditureIncurred').toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 p-2 text-center">{stmtTotal('balance').toLocaleString('en-IN')}</td>
                    <td className="border border-gray-300 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>


          </div>

          {/* ── ASSETS ACQUIRED CERTIFICATE ── */}
          <div>
            <p className="text-base font-bold mb-1">Assets Acquired Certificate</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 italic mb-4">
              Assets acquired wholly or substantially out of govt. grant Register to be maintained by Grantee Institute
            </p>

            <div className="space-y-3">
              <AssetRow label="Name of the Sanctioning Authority:" value={assets.sanctioningAuthority}
                onChange={v => setAssets({ ...assets, sanctioningAuthority: v })} />
              <AssetRow label="1. Sl. No.:" value={assets.slNo}
                onChange={v => setAssets({ ...assets, slNo: v })} />
              <AssetRow label="2. Name of Grantee Institution:" value={assets.granteeInstitution}
                onChange={v => setAssets({ ...assets, granteeInstitution: v })} />
              <AssetRow label="3. No. & Date of sanction order:" value={assets.sanctionOrderNoDate}
                onChange={v => setAssets({ ...assets, sanctionOrderNoDate: v })} />
              <AssetRow label="4. Amount of the sanctioned NR grant:" value={assets.amountSanctionedNR}
                onChange={v => setAssets({ ...assets, amountSanctionedNR: v })} />
              <AssetRow label="5. Brief purpose of the grant:" value={assets.purposeOfGrant}
                onChange={v => setAssets({ ...assets, purposeOfGrant: v })} />
              <AssetRow
                label="6. Whether any condition regarding the right of ownership of Govt. in the property or other assets acquired out of the grant was incorporated in the grant–in-aid sanction order:"
                value={assets.govtOwnershipCondition}
                onChange={v => setAssets({ ...assets, govtOwnershipCondition: v })} />
              <AssetRow label="7. Particulars of assets actually credited or acquired: (Details as per enclosed format)"
                value={assets.assetParticulars}
                onChange={v => setAssets({ ...assets, assetParticulars: v })} />
              <AssetRow label="8. Value of the assets as on:" value={assets.valueAsOn}
                onChange={v => setAssets({ ...assets, valueAsOn: v })} />
              <AssetRow label="9. Purpose for which utilized at present:" value={assets.currentPurpose}
                onChange={v => setAssets({ ...assets, currentPurpose: v })} />
              <AssetRow label="10. Encumbered or not:" value={assets.encumbered}
                onChange={v => setAssets({ ...assets, encumbered: v })} />
              <AssetRow label="    Reasons, if encumbered:" value={assets.encumberedReason}
                onChange={v => setAssets({ ...assets, encumberedReason: v })} />
              <AssetRow label="11. Disposed of or not:" value={assets.disposed}
                onChange={v => setAssets({ ...assets, disposed: v })} />
              <AssetRow label="    Reasons and authority, if any, for disposal:" value={assets.disposalReasonAuthority}
                onChange={v => setAssets({ ...assets, disposalReasonAuthority: v })} />
              <AssetRow label="    Amount realized on disposal:" value={assets.amountRealizedOnDisposal}
                onChange={v => setAssets({ ...assets, amountRealizedOnDisposal: v })} />
              <AssetRow label="12. Remarks:" value={assets.remarks}
                onChange={v => setAssets({ ...assets, remarks: v })} />
            </div>

          </div>

          {/* ── DETAILS OF EQUIPMENT PROCURED ── */}
          <div>
            <p className="text-base font-bold mb-3">Details of Equipment Procured During the Period</p>
            <div className="overflow-x-auto border border-gray-300 rounded">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2">S. No.</th>
                    <th className="border border-gray-300 p-2">Name of Equipment</th>
                    <th className="border border-gray-300 p-2">Sanctioned cost</th>
                    <th className="border border-gray-300 p-2">Actual Cost (Factual figure, not in lakhs)</th>
                    <th className="border border-gray-300 p-2">Date of placing Order</th>
                    <th className="border border-gray-300 p-2">Date of Receiving Equipment</th>
                    <th className="border border-gray-300 p-2">Remark/Payment Voucher No. With Date (Copy of Payment Voucher may please be enclosed)</th>
                    <th className="border border-gray-300 p-2">Reasons for fluctuation in price</th>
                  </tr>
                </thead>
                <tbody>
                  {equipRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-center text-gray-600 dark:text-gray-400">{idx + 1}</td>
                      <td className="border border-gray-300 p-1">
                        <input type="text" value={row.equipmentName}
                          onChange={e => updateEquipRow(idx, 'equipmentName', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" value={row.sanctionedCost}
                          onChange={e => updateEquipRow(idx, 'sanctionedCost', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" min="0" value={row.actualCost}
                          onChange={e => updateEquipRow(idx, 'actualCost', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="date" value={row.orderDate}
                          onChange={e => updateEquipRow(idx, 'orderDate', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="date" value={row.receivedDate}
                          onChange={e => updateEquipRow(idx, 'receivedDate', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="text" value={row.voucherNoDate}
                          onChange={e => updateEquipRow(idx, 'voucherNoDate', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="text" value={row.priceFluctuationReason}
                          onChange={e => updateEquipRow(idx, 'priceFluctuationReason', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400" />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 p-2" colSpan={2}>Total:</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {equipRows.reduce((s, r) => s + num(r.sanctionedCost), 0).toLocaleString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {equipRows.reduce((s, r) => s + num(r.actualCost), 0).toLocaleString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-2" colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setEquipRows([...equipRows, emptyEquipmentRow()])}
              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
              <Plus size={13} /> Add Row
            </button>


          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={onCancel}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-8 py-2.5 bg-blue-600 text-gray-200 dark:text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting…' : existingCertificate ? 'Resubmit Utilization Certificate' : 'Submit Utilization Certificate'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function FormRow({ no, label, children }) {
  return (
    <div className="flex items-start gap-3">
      {no && <span className="w-5 shrink-0 font-semibold pt-1.5 text-sm">{no}</span>}
      <span className="w-64 shrink-0 text-gray-700 pt-1.5 text-sm">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Change this at the bottom of your file
function LabelInput({ label, value, onChange, required }) { // Add 'required' here
  return (
    <div className="flex items-center gap-4">
      <span className="w-56 shrink-0 text-gray-600 text-sm">{label}</span>
      <input 
        type="number" 
        min="0" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-48 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm bg-white" 
      />
    </div>
  );
}

function AssetRow({ label, value, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-96 shrink-0 text-gray-700 text-xs leading-relaxed pt-2">{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 px-2 py-1.5 border-b border-gray-400 focus:border-blue-500 focus:outline-none text-sm bg-transparent" />
    </div>
  );
}
