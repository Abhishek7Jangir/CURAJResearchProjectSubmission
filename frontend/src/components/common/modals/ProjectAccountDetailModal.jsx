import React, { useMemo, useState } from 'react';
import { X, FileText, IndianRupee, Calendar, Briefcase, Upload } from 'lucide-react';
import { formatStageLabel } from '../../../utils/stageLabels';

const num = (v) => parseFloat(v) || 0;

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

const STAGE_LABEL = {
  HOD: 'Head of Department (HOD)',
  DEAN: 'Dean',
  'R&D_HELPER': 'R&D Office',
  'R&D_MAIN': 'R&D',
  FINANCE_OFFICER_HELPER: 'Finance Office',
  FINANCE_OFFICER_MAIN: 'Finance Officer',
  COMPLETED: 'Completed',
  PI: 'Principal Investigator'
};

function dateStr(d) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function openAccountPdfInNewWindow(accountId, documentType, showNotification) {
  try {
    const token = sessionStorage.getItem('token');
    const url = `/api/project-accounts/download/${accountId}?documentType=${encodeURIComponent(documentType)}&mode=view`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      let msg = 'Could not open document';
      try {
        const j = await res.json();
        msg = j.error || msg;
      } catch (_) {}
      showNotification(msg, 'error');
      return;
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  } catch (e) {
    console.error(e);
    showNotification('Failed to open document', 'error');
  }
}

export default function ProjectAccountDetailModal({
  account,
  mode,
  userStage,
  onClose,
  showNotification,
  onUpdated,
  onEdit
}) {
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState(false);

  const canAct = account.status === 'Pending' && account.currentStage === userStage;
  const isFoMain = userStage === 'FINANCE_OFFICER_MAIN';

  const budgetRows = useMemo(() => {
    const bh = account.budgetHeads || {};
    return BUDGET_KEYS.map((k) => {
      const r = bh[k] || {};
      return {
        key: k,
        label: KEY_TO_LABEL[k],
        balanceAsPerUCSE: num(r.balanceAsPerUCSE),
        expenditureAfterUCSE: num(r.expenditureAfterUCSE),
        currentBalance: num(r.currentBalance),
        bifurcationNewGrant: num(r.bifurcationNewGrant),
        totalBalance: num(r.totalBalance)
      };
    });
  }, [account.budgetHeads]);

  const grandTotal = useMemo(() => budgetRows.reduce((s, r) => s + r.totalBalance, 0), [budgetRows]);

  const postStatus = async (status) => {
    setActing(true);
    try {
      const token = sessionStorage.getItem('token');
      const body = { accountId: account.id, status };
      if (status === 'Rejected' || status === 'Reverted') {
        body.comment = comment.trim();
      } else if (comment.trim()) {
        body.comment = comment.trim();
      }
      const res = await fetch('/api/project-accounts/update-status', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'Update failed', 'error');
        return;
      }
      showNotification(`Form ${status.toLowerCase()} successfully`, 'success');
      onUpdated?.(data);
      onClose();
    } catch (e) {
      console.error(e);
      showNotification('Request failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const commentOk = comment.trim().length > 0;
  const currentStageLabel = STAGE_LABEL[account.currentStage] || account.currentStage;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Project account opening</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {account.id} · {account.projectId}
            </p>
            <p className="text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>{' '}
              <span className="text-gray-900 dark:text-white font-medium">{account.status}</span>
              {account.status === 'Pending' && (
                <>
                  <span className="text-gray-500 dark:text-gray-500 mx-2">·</span>
                  <span className="text-gray-600 dark:text-gray-400">Currently with:</span>{' '}
                  <span className="text-amber-300 font-medium">{currentStageLabel}</span>
                </>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6 text-sm text-gray-200">
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 flex items-center gap-2">
              <Briefcase size={14} /> Identification
            </h3>
            <div className="grid md:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
              <p><span className="text-gray-500 dark:text-gray-500">Title:</span> {account.projectTitle}</p>
              <p><span className="text-gray-500 dark:text-gray-500">PI:</span> {account.piName}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Department:</span> {account.department}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Funding agency:</span> {account.fundingAgency}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Scheme:</span> {account.fundingSchemeName || '—'}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Project type:</span> {account.projectTypeLabel || '—'}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Sanction letter no.:</span> {account.sanctionLetterNo}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Sanction date:</span> {dateStr(account.sanctionDate)}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 flex items-center gap-2">
              <Calendar size={14} /> Period & cost
            </h3>
            <div className="grid md:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
              <p>
                <span className="text-gray-500 dark:text-gray-500">Duration:</span> {dateStr(account.duration?.from)} — {dateStr(account.duration?.to)}
              </p>
              <p>
                <span className="text-gray-500 dark:text-gray-500">Total sanctioned cost:</span> ₹{num(account.totalProjectCost).toLocaleString('en-IN')}
              </p>
              <p>
                <span className="text-gray-500 dark:text-gray-500">Opening installment received:</span> ₹
                {num(account.amountReceivedOpening).toLocaleString('en-IN')}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">Fund received</h3>
            <div className="grid md:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
              <p><span className="text-gray-500 dark:text-gray-500">Mode:</span> {account.fundDetails?.modeOfTransfer || '—'}</p>
              <p><span className="text-gray-500 dark:text-gray-500">Date of credit:</span> {dateStr(account.fundDetails?.dateOfCredit)}</p>
              <p><span className="text-gray-500 dark:text-gray-500">UTR / ref:</span> {account.fundDetails?.transactionUTR || '—'}</p>
              <p>
                <span className="text-gray-500 dark:text-gray-500">Amount credited:</span> ₹{num(account.fundDetails?.amountReceived).toLocaleString('en-IN')}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 flex items-center gap-2">
              <IndianRupee size={14} /> Budget heads & bifurcation
            </h3>
            <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-700 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="p-2 text-white font-semibold text-sm ">Head</th>
                    <th className="p-2 text-white font-semibold text-sm  text-right">Bal. UC/SE</th>
                    <th className="p-2 text-white font-semibold text-sm  text-right">Exp. after UC</th>
                    <th className="p-2  text-white font-semibold text-sm text-right">Current (a)</th>
                    <th className="p-2 text-white font-semibold text-sm  text-right">New grant (b)</th>
                    <th className="p-2  text-white font-semibold text-sm text-right">Total (a+b)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {budgetRows.map((r) => (
                    <tr key={r.key}>
                      <td className="p-2 text-gray-700 dark:text-gray-300">{r.label}</td>
                      <td className="p-2 text-right">{r.balanceAsPerUCSE.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right">{r.expenditureAfterUCSE.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right">{r.currentBalance.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right">{r.bifurcationNewGrant.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-semibold text-gray-900 dark:text-white">{r.totalBalance.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="p-2 font-bold text-white dark:text-gray-300">Grand total</td>
                    <td colSpan={4} />
                    <td className="p-2 text-right font-bold text-amber-300">₹{grandTotal.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 flex items-center gap-2">
              <Upload size={14} /> Documents
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="text-blue-400 hover:underline"
                onClick={() => openAccountPdfInNewWindow(account.id, 'sanctionedOrder', showNotification)}
              >
                View sanctioned order (PDF)
              </button>
              {(account.documents?.supportingDocuments || []).map(
                (url, idx) =>
                  url ? (
                    <button
                      key={idx}
                      type="button"
                      className="text-blue-400 hover:underline"
                      onClick={() => openAccountPdfInNewWindow(account.id, `supporting_${idx}`, showNotification)}
                    >
                      View support doc {idx + 1}
                    </button>
                  ) : null
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 flex items-center gap-2">
              <FileText size={14} /> Approval history
            </h3>
            {!account.approvalHistory?.length ? (
              <p className="text-gray-500 dark:text-gray-500">No actions yet.</p>
            ) : (
              <ul className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800/50">
                {account.approvalHistory.map((h, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300 border-b border-gray-800 last:border-0 pb-2 last:pb-0">
                    <span className="text-gray-500 dark:text-gray-500">{dateStr(h.date)}</span> · <span className="text-gray-900 dark:text-white">{formatStageLabel(h.stage)}</span> ·{' '}
                    <span className="text-blue-500 dark:text-blue-400 text-semibold ">{h.status}</span> · {h.user}
                    {h.comment && <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">{h.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {mode === 'pi' && account.status === 'Reverted' && (
            <div className="pt-2">
              <button
                type="button"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-gray-900 dark:text-white rounded-lg font-medium"
                onClick={() => {
                  onEdit?.(account);
                  onClose();
                }}
              >
                Edit & resubmit
              </button>
            </div>
          )}

          {mode === 'approver' && canAct && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Comment {isFoMain ? '(required for Reject / Revert)' : '(required for Revert)'}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 text-sm"
                placeholder="Enter comment…"
              />
              <div className="flex flex-wrap gap-2">
                {isFoMain ? (
                  <>
                    <button
                      type="button"
                      disabled={acting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium"
                      onClick={() => postStatus('Approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={acting || !commentOk}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium"
                      onClick={() => postStatus('Rejected')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={acting || !commentOk}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium"
                      onClick={() => postStatus('Reverted')}
                    >
                      Revert
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={acting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium"
                      onClick={() => postStatus('Approved')}
                    >
                      Forward
                    </button>
                    <button
                      type="button"
                      disabled={acting || !commentOk}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium"
                      onClick={() => postStatus('Reverted')}
                    >
                      Revert
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
