import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProjectAccountDetailModal from '../../components/common/modals/ProjectAccountDetailModal';
import { formatStageLabel } from '../../utils/stageLabels';

const designationToStage = {
  hod: 'HOD',
  dean: 'DEAN',
  'r&d_helper': 'R&D_HELPER',
  rnd_helper: 'R&D_HELPER',
  'r&d_main': 'R&D_MAIN',
  rnd_main: 'R&D_MAIN',
  finance_officer_helper: 'FINANCE_OFFICER_HELPER',
  finance_officer_main: 'FINANCE_OFFICER_MAIN'
};

export default function ApproverProjectAccounts({ user, showNotification }) {
  const [forms, setForms] = useState([]);
  const [selected, setSelected] = useState(null);

  const userStage = designationToStage[user.designation?.toLowerCase()] || user.designation?.toUpperCase();

  const load = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/project-accounts/for-approval', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) return showNotification(data.error || 'Failed to fetch forms', 'error');
      setForms(Array.isArray(data) ? data : []);
    } catch (e) {
      showNotification('Failed to fetch forms', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => forms.filter((f) => f.currentStage === userStage || f.approvalHistory?.some((h) => h.stage === userStage)),
    [forms, userStage]
  );

  const mergeUpdated = (updated) => {
    setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-6 space-y-3">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Project Account Opening Forms</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Click a request to view details, documents, and approval history.</p>
      {visible.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No forms to show.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((f) => {
            const needsYou = f.currentStage === userStage && f.status === 'Pending';
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelected(f)}
                className={`w-full text-left bg-gray-100/50 dark:bg-gray-900/50 border rounded-lg p-4 transition-colors ${
                  needsYou ? 'border-amber-500/60 hover:border-amber-400' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <p className="text-gray-900 dark:text-white font-semibold">{f.projectTitle}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {f.id} · {f.projectId} · {f.status}
                  {f.status === 'Pending' && <span className="text-amber-200"> · Stage: {formatStageLabel(f.currentStage)}</span>}
                </p>
                {needsYou && <p className="text-amber-300 text-xs mt-2 font-medium">Action required — open to forward or revert</p>}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ProjectAccountDetailModal
          account={selected}
          mode="approver"
          userStage={userStage}
          onClose={() => setSelected(null)}
          showNotification={showNotification}
          onUpdated={(updated) => {
            mergeUpdated(updated);
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
