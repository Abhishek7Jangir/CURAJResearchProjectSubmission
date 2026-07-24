import React, { useState, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/storage';
import UtilizationCertificateDetailModal from '../../components/common/modals/UtilizationCertificateDetailModal';
import { formatStageLabel } from '../../utils/stageLabels';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Reverted'];

function ucMatchesFilter(cert, filter) {
  if (filter === 'All') return true;
  return cert.status === filter;
}

export default function UtilizationCertificatePage({
  user,
  certificates,
  approvedProjects,
  onNewRequest,
  onEditRequest
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const filteredCertificates = useMemo(
    () => certificates.filter((c) => ucMatchesFilter(c, activeFilter)),
    [certificates, activeFilter]
  );

  const countForFilter = (filter) =>
    certificates.filter((c) => ucMatchesFilter(c, filter)).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onNewRequest}
          disabled={approvedProjects.length === 0}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-violet-100 dark:text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          <ClipboardList className="w-4 h-4" />
          New Utilization Certificate
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
        <div className="grid grid-cols-5 border-b border-gray-200 dark:border-gray-700/50">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-3 text-md font-semibold ${activeFilter === filter ? 'bg-blue-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300' } border-r border-gray-200 dark:border-gray-700/50 last:border-r-0 transition-colors`}
            >
              {filter} ({countForFilter(filter)})
            </button>
          ))}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Utilization Certificates (GFR 12-A)</h3>

          {certificates.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No utilization certificates submitted yet</p>
              {approvedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={onNewRequest}
                  className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Submit your first utilization certificate
                </button>
              )}
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p>No certificates in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((cert) => {
                const latestHistory =
                  Array.isArray(cert.approvalHistory) && cert.approvalHistory.length > 0
                    ? cert.approvalHistory[cert.approvalHistory.length - 1]
                    : null;
                return (
                  <div
                    key={cert.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCertificate(cert)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCertificate(cert);
                      }
                    }}
                    className="bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-100/70 dark:hover:bg-gray-900/70 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer text-left w-full"
                  >
                    <p className="text-xs text-blue-400/90 mb-2">Click to view full form details and approval status</p>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{cert.id}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-md mt-1">Project: {cert.projectTitle}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">FY {cert.financialYear}</p>
                      </div>
                      <span
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(cert.status)}`}
                      >
                        {getStatusIcon(cert.status)}
                        {cert.status}
                        {cert.currentStage && cert.status === 'Pending' && ` (${formatStageLabel(cert.currentStage)})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800/50 rounded-lg text-sm">
                      <div>
                        <span className="text-gray-900 dark:text-gray-300">Scheme</span>
                        <div className="font-semibold text-black dark:text-gray-200">{cert.schemeName}</div>
                      </div>
                      <div>
                        <span className="text-gray-900 dark:text-gray-300">Fellow</span>
                        <div className="font-semibold text-black dark:text-gray-200">{cert.fellowName}</div>
                      </div>
                      <div>
                        <span className="text-gray-900 dark:text-gray-300">Submitted</span>
                        <div className="font-semibold text-black dark:text-gray-200">
                          {cert.submittedDate ? new Date(cert.submittedDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>

                    {latestHistory && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Latest action: </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatStageLabel(latestHistory.stage)} — {latestHistory.status}
                        </span>
                        {latestHistory.comment && (
                          <p className="text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{latestHistory.comment}</p>
                        )}
                      </div>
                    )}

                    {cert.status === 'Reverted' && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRequest?.(cert);
                          }}
                          className="text-orange-400 hover:text-orange-300 font-medium text-sm"
                        >
                          Update &amp; Resubmit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <UtilizationCertificateDetailModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        user={user}
        onStatusUpdate={undefined}
        viewerOnly
      />
    </div>
  );
}
