import React, { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/storage';
import ProjectAccountDetailModal from '../../components/common/modals/ProjectAccountDetailModal';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Reverted'];

export default function ProjectAccounts({
  accounts,
  eligibleProjects,
  onNewRequest,
  onEditRequest,
  onViewDocument,
  showNotification,
  onAccountUpdated
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [detailAccount, setDetailAccount] = useState(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  const filtered = useMemo(
    () => accounts.filter((a) => activeFilter === 'All' || a.status === activeFilter),
    [accounts, activeFilter]
  );

  const handleOpenDetails = async (account) => {
    // Only a fully-approved account (COMPLETED + Approved) has a
    // final-approval snapshot. For anything still in progress, just show
    // the live account data since no "as approved" state exists yet.
    const isFinallyApproved = account.status === 'Approved' && account.currentStage === 'COMPLETED';

    if (!isFinallyApproved) {
      setDetailAccount(account);
      return;
    }

    setLoadingSnapshot(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/project-accounts/approval-snapshot/${account.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const snapshot = await res.json();
        setDetailAccount(snapshot);
      } else {
        // No snapshot saved yet (e.g. account approved before this
        // feature existed) — fall back to live account data.
        setDetailAccount(account);
      }
    } catch (error) {
      console.error('Failed to fetch project account approval snapshot:', error);
      setDetailAccount(account);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {loadingSnapshot && (
          <span className="text-sm text-blue-600 dark:text-blue-400">Loading approved details…</span>
        )}
        <button
          onClick={onNewRequest}
          disabled={eligibleProjects.length === 0}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white dark:text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 ml-auto"
        >
          New Project Account Opening
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="grid grid-cols-5 border-b border-gray-200 dark:border-gray-700/50">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-3 text-md font-semibold ${activeFilter === f ? 'bg-blue-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300' } border-r border-gray-200 dark:border-gray-700/50 last:border-r-0 transition-colors`}
            >
              {f} ({accounts.filter((a) => f === 'All' || a.status === f).length})
            </button>
          ))}
        </div>
        <div className="p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <Landmark className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              No project account forms
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.id}
                className="bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer"
                onClick={() => handleOpenDetails(a)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenDetails(a);
                  }
                }}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h1 className="text-gray-900 dark:text-white font-semibold text-lg">{a.projectTitle}   -  {a.projectId}</h1>
                    <p className="text-gray-800 dark:text-gray-400 text-md font-semibold  mt-1">
                      {a.id} 
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">Click this card for full details, approval history, and PDFs</p>
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm shrink-0 h-fit ${getStatusColor(a.status)}`}>
                    {getStatusIcon(a.status)} {a.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    className="text-blue-400 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(a.id, 'sanctionedOrder');
                    }}
                  >
                    View: Sanctioned Order
                  </button>
                  {a.status === 'Reverted' && (
                    <button
                      type="button"
                      className="text-orange-400 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRequest(a);
                      }}
                    >
                      Edit &amp; Resubmit
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {detailAccount && (
        <ProjectAccountDetailModal
          account={detailAccount}
          mode="pi"
          userStage={null}
          onClose={() => setDetailAccount(null)}
          showNotification={showNotification}
          onUpdated={(updated) => {
            onAccountUpdated?.(updated);
            setDetailAccount((prev) => (prev && prev.id === updated.id ? updated : prev));
          }}
          onEdit={(acc) => onEditRequest(acc)}
        />
      )}
    </div>
  );
}
