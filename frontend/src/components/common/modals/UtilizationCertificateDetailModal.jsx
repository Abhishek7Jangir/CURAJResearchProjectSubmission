import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCheck, FaBan, FaHistory, FaArrowRight, FaUndo } from 'react-icons/fa';
import { CERTIFICATION_POINT_TEXTS } from '../../../constants/utilizationCertificateCertification';
import { formatStageLabel } from '../../../utils/stageLabels';

const STMT_LABELS = [
  { key: 'staff', label: 'Staff' },
  { key: 'contingencies', label: 'Contingencies' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'travel', label: 'Travel' },
  { key: 'overhead', label: 'Overhead' },
  { key: 'equipments', label: 'Equipments' }
];

/** Dark-theme table: readable text on distinct slate backgrounds */
function DataTable({ children }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-slate-500/70 shadow-inner bg-white dark:bg-slate-900/80">
      <table className="w-full text-xs sm:text-sm border-collapse">{children}</table>
    </div>
  );
}

function Th({ children, className = '', numeric }) {
  return (
    <th
      className={`px-2 py-2.5 font-semibold text-gray-700 dark:text-slate-100 bg-gray-100 dark:bg-slate-700 border-b border-gray-300 dark:border-slate-500/80 align-bottom ${
        numeric ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '', numeric }) {
  return (
    <td
      className={`px-2 py-2 border-b border-gray-200 dark:border-slate-600/60 text-gray-700 dark:text-slate-100 bg-white dark:bg-slate-800/90 align-top ${
        numeric ? 'text-right tabular-nums whitespace-nowrap' : 'text-left'
      } ${className}`}
    >
      {children}
    </td>
  );
}

function statusBadgeClasses(status) {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/50';
  if (status === 'Rejected') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/50';
  if (status === 'Reverted') return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/50';
  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:border-amber-500/40';
}

export default function UtilizationCertificateDetailModal({
  certificate,
  onClose,
  user,
  onStatusUpdate,
  viewerOnly = false
}) {
  const [comment, setComment] = useState('');

  if (!certificate) return null;

  const designationToStage = {
    finance_officer_helper: 'FINANCE_OFFICER_HELPER',
    finance_officer_main: 'FINANCE_OFFICER_MAIN',
    registrar: 'REGISTRAR'
  };
  const userStage = designationToStage[user?.designation?.toLowerCase()] || null;
  const canAct =
    !viewerOnly && user && certificate.status === 'Pending' && certificate.currentStage === userStage;

  const isRegistrar = userStage === 'REGISTRAR';
  const showForward = canAct && !isRegistrar;
  const showRegistrarActions = canAct && isRegistrar;

  const fmt = (n) => (n === undefined || n === null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('en-IN'));
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const handleAction = (status) => {
    if ((status === 'Rejected' || status === 'Reverted') && !comment.trim()) {
      alert('Please enter a comment.');
      return;
    }
    if (onStatusUpdate) {
      onStatusUpdate(certificate.id, status, comment);
      setComment('');
      onClose();
    }
  };

  const es = certificate.expenditureStatement || {};
  const assets = certificate.assetsAcquired || {};
  const cu = certificate.componentUtilization || {};
  const checks = Array.isArray(certificate.certificationChecks) ? certificate.certificationChecks : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl w-full max-w-4xl my-8 relative border border-gray-200 dark:border-slate-600/80"
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-600 p-5 sticky top-0 bg-gray-50/95 dark:bg-slate-900 z-20 rounded-t-xl">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Utilization Certificate</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{certificate.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white p-1 rounded-full transition-colors">
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm bg-white dark:bg-slate-950">
          {/* Status strip — same idea as approver dashboards */}
          <div
            className={`rounded-lg px-4 py-3 border flex flex-wrap items-center gap-2 ${statusBadgeClasses(certificate.status)}`}
          >
            <span className="font-semibold">Request status:</span>
            <span className="font-medium">{certificate.status}</span>
            <span className="opacity-70">·</span>
            <span className="opacity-80">
              Current stage: <strong className="text-gray-900 dark:text-white">{formatStageLabel(certificate.currentStage)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 dark:text-slate-200">
            <p>
              <strong className="text-gray-900 dark:text-white">Project:</strong> {certificate.projectTitle}
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Project ID:</strong> {certificate.projectId}
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Financial Year:</strong> {certificate.financialYear}
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Submitted:</strong> {fmtDate(certificate.submittedDate)}
            </p>
            <p className="md:col-span-2">
              <strong className="text-gray-900 dark:text-white">Submitted By:</strong> {certificate.submittedBy}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4 space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">Basic details</h4>
            <p className="text-gray-700 dark:text-slate-200">
              <span className="text-gray-500 dark:text-slate-400">Fellow:</span> {certificate.fellowName}
            </p>
            <p className="text-gray-700 dark:text-slate-200">
              <span className="text-gray-500 dark:text-slate-400">Scheme:</span> {certificate.schemeName}
            </p>
            <p className="text-gray-700 dark:text-slate-200">
              <span className="text-gray-500 dark:text-slate-400">Grant nature:</span> {certificate.grantNature}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Opening balances</h4>
            <p className="text-gray-700 dark:text-slate-200">Cash in hand: ₹{fmt(certificate.openingCashInHand)}</p>
            <p className="text-gray-700 dark:text-slate-200">Unadjusted advances: ₹{fmt(certificate.openingUnadjustedAdvances)}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Closing balances</h4>
            <p className="text-gray-700 dark:text-slate-200">Cash in hand: ₹{fmt(certificate.closingCashInHand)}</p>
            <p className="text-gray-700 dark:text-slate-200">Unadjusted advances: ₹{fmt(certificate.closingUnadjustedAdvances)}</p>
          </div>

          {(cu.grantInAidGeneral != null || cu.grantInAidSalary != null || cu.grantInAidCapitalAssets != null) && (
            <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Component-wise utilization</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-700 dark:text-slate-200 text-sm">
                <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600/60 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-slate-400 text-xs">General</div>
                  <div className="font-medium">₹{fmt(cu.grantInAidGeneral)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600/60 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-slate-400 text-xs">Salary</div>
                  <div className="font-medium">₹{fmt(cu.grantInAidSalary)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600/60 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-slate-400 text-xs">Capital assets</div>
                  <div className="font-medium">₹{fmt(cu.grantInAidCapitalAssets)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Certification checklist</h4>
            <p className="text-gray-600 dark:text-slate-300 text-xs leading-relaxed mb-3">
              Certified that I have satisfied myself that the conditions on which grants were sanctioned have been duly
              fulfilled/are being fulfilled and that I have exercised following checks to see that the money has been
              actually utilized for the purpose for which it was sanctioned:
            </p>
            <ul className="text-gray-700 dark:text-slate-200 text-xs space-y-3 list-none">
              {CERTIFICATION_POINT_TEXTS.map((text, i) => {
                const ok = checks[i];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 shrink-0 ${ok ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                      {ok ? '☑' : '☐'}
                    </span>
                    <span className="leading-relaxed text-gray-700 dark:text-slate-200">
                      <span className="font-semibold text-gray-900 dark:text-slate-100 mr-1">{i + 1}.</span>
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-3">
              Date: {fmtDate(certificate.certDate)} · Place: {certificate.certPlace || '—'}
            </p>
          </div>

          {certificate.grantDetails?.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Details of grants received, expenditure incurred and closing balances
              </h4>
              <div className="rounded-lg overflow-x-auto border border-gray-300 dark:border-slate-500/70 shadow-inner bg-white dark:bg-slate-900/80">
                <table className="min-w-[1000px] w-full text-[11px] sm:text-xs border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[11%]" />
                    <col className="w-[9%]" />
                    <col className="w-[11%]" />
                    <col className="w-[10%]" />
                    <col className="w-[11%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th numeric>Unspent balance</Th>
                      <Th numeric>Interest earned</Th>
                      <Th numeric>Interest to govt.</Th>
                      <Th>Sanction No.</Th>
                      <Th>Sanction date</Th>
                      <Th numeric>Grant amount</Th>
                      <Th numeric>Total available</Th>
                      <Th numeric>Expenditure</Th>
                      <Th numeric>Closing balance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificate.grantDetails.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-700/40">
                        <Td numeric>{fmt(row.unspentBalance)}</Td>
                        <Td numeric>{fmt(row.interestEarned)}</Td>
                        <Td numeric>{fmt(row.interestDepositedBack)}</Td>
                        <Td>{row.sanctionNo || '—'}</Td>
                        <Td className="whitespace-nowrap">{fmtDate(row.sanctionDate)}</Td>
                        <Td numeric>{fmt(row.grantAmount)}</Td>
                        <Td numeric>{fmt(row.totalAvailableFunds)}</Td>
                        <Td numeric>{fmt(row.expenditureIncurred)}</Td>
                        <Td numeric>{fmt(row.closingBalance)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Statement of expenditure</h4>
            <p className="text-gray-500 dark:text-slate-400 text-xs mb-2">
              Period: {es.periodFrom || '—'} to {es.periodTo || '—'}
            </p>
            <DataTable>
              <thead>
                <tr>
                  <Th>Head</Th>
                  <Th numeric>Total</Th>
                  <Th numeric>Exp.</Th>
                  <Th numeric>Balance</Th>
                </tr>
              </thead>
              <tbody>
                {STMT_LABELS.map(({ key, label }) => {
                  const row = es[key] || {};
                  return (
                    <tr key={key} className="hover:bg-slate-700/50">
                      <Td>{label}</Td>
                      <Td numeric>{fmt(row.total)}</Td>
                      <Td numeric>{fmt(row.expenditureIncurred)}</Td>
                      <Td numeric>{fmt(row.balance)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Assets acquired</h4>
            <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600/60 rounded-lg p-4 text-gray-700 dark:text-slate-200 text-xs space-y-2">
              <p>
                <span className="text-gray-500 dark:text-slate-400">Purpose:</span> {assets.purposeOfGrant || '—'}
              </p>
              <p>
                <span className="text-gray-500 dark:text-slate-400">Sanctioning authority:</span> {assets.sanctioningAuthority || '—'}
              </p>
              <p>
                <span className="text-gray-500 dark:text-slate-400">Grantee institution:</span> {assets.granteeInstitution || '—'}
              </p>
            </div>
          </div>

          {certificate.equipmentsProcured?.filter((r) => r.equipmentName)?.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Equipment procured</h4>
              <DataTable>
                <thead>
                  <tr>
                    <Th>Equipment</Th>
                    <Th numeric>Sanctioned</Th>
                    <Th numeric>Actual</Th>
                  </tr>
                </thead>
                <tbody>
                  {certificate.equipmentsProcured
                    .filter((r) => r.equipmentName)
                    .map((r, i) => (
                      <tr key={i} className="hover:bg-slate-700/50">
                        <Td>{r.equipmentName}</Td>
                        <Td numeric>₹{fmt(r.sanctionedCost)}</Td>
                        <Td numeric>₹{fmt(r.actualCost)}</Td>
                      </tr>
                    ))}
                </tbody>
              </DataTable>
            </div>
          )}

          {certificate.approvalHistory?.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaHistory className="text-gray-500 dark:text-slate-400" /> Approval history
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {certificate.approvalHistory.map((h, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-600/60 p-3 rounded-lg text-xs text-gray-700 dark:text-slate-100"
                  >
                    <div>
                      <span className="text-sky-600 dark:text-sky-300 font-medium">{formatStageLabel(h.stage)}</span>
                      <span className="text-gray-500 dark:text-slate-400"> — {h.status}</span>
                      <span className="text-gray-500 dark:text-slate-400 ml-2">{h.userName}</span>
                    </div>
                    <div className="text-gray-500 dark:text-slate-400 mt-0.5">{fmtDate(h.actionDate)}</div>
                    {h.comment && <p className="text-gray-700 dark:text-slate-200 mt-1">{h.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canAct && (
            <div className="border-t border-gray-200 dark:border-slate-600 pt-4 space-y-3">
              <label className="block text-gray-500 dark:text-slate-400 text-sm">
                Comment {showRegistrarActions ? '(required for reject/revert)' : '(required for revert)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-slate-100 text-sm min-h-[80px] placeholder-gray-400 dark:placeholder-slate-500"
                placeholder="Add remarks…"
              />
              <div className="flex flex-wrap gap-3">
                {showForward && (
                  <button
                    type="button"
                    onClick={() => handleAction('Approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium"
                  >
                    <FaArrowRight /> Forward
                  </button>
                )}
                {canAct && !isRegistrar && (
                  <button
                    type="button"
                    onClick={() => handleAction('Reverted')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium"
                  >
                    <FaUndo /> Revert
                  </button>
                )}
                {showRegistrarActions && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction('Approved')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('Rejected')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium"
                    >
                      <FaBan /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('Reverted')}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium"
                    >
                      <FaUndo /> Revert
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-600 p-4 text-right bg-gray-50 dark:bg-slate-900 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 px-5 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
