import React, { useState, useMemo } from 'react';
import { Package, DollarSign } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/storage';
import EquipmentDetailModal from '../../components/common/modals/EquipmentDetailModal';
import { formatStageLabel } from '../../utils/stageLabels';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Reverted'];

function equipmentMatchesFilter(request, filter) {
  if (filter === 'All') return true;
  const s = request.status || '';
  if (filter === 'Pending') return s === 'Pending';
  if (filter === 'Approved') {
    return (
      s.includes('Approved') ||
      s === 'Bill Uploaded' ||
      s === 'Bill Pending' ||
      s === 'Completed'
    );
  }
  if (filter === 'Rejected') return s === 'Rejected';
  if (filter === 'Reverted') return s === 'Reverted';
  return true;
}

export default function Equipment({ user, equipmentRequests, approvedProjects, onNewRequest, onEditRequest }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = useMemo(
    () => equipmentRequests.filter((r) => equipmentMatchesFilter(r, activeFilter)),
    [equipmentRequests, activeFilter]
  );

  const countForFilter = (filter) =>
    equipmentRequests.filter((r) => equipmentMatchesFilter(r, filter)).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onNewRequest}
          disabled={approvedProjects.length === 0}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white dark:text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          <DollarSign className="w-4 h-4" />
          New Indent Approval Request
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Indent Approval</h3>

          {equipmentRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No resource allotment requests submitted yet</p>
              {approvedProjects.length > 0 && (
                <button
                  onClick={onNewRequest}
                  className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
                >
                  Submit your first resource allotment request
                </button>
              )}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p>No requests in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const latestHistory =
                  Array.isArray(request.approvalHistory) && request.approvalHistory.length > 0
                    ? request.approvalHistory[request.approvalHistory.length - 1]
                    : null;
                return (
                  <div
                    key={request.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRequest(request)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRequest(request);
                      }
                    }}
                    className="bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-100/70 dark:hover:bg-gray-900/70 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer text-left w-full"
                  >
                    <p className="text-xs text-blue-400/90 mb-2">Click to view full details and approval status</p>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{request.equipmentName}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Project: {request.projectTitle}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">{request.id}</p>
                      </div>
                      <span
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                        {request.currentStage && request.status === 'Pending' && ` (${formatStageLabel(request.currentStage)})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-800 dark:text-gray-300">Quantity</span>
                        <div className="font-semibold text-black dark:text-gray-200">{request.quantity}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-800 dark:text-gray-300">Unit Price</span>
                        <div className="font-semibold text-black dark:text-gray-200">₹{request.unitPrice?.toLocaleString?.() ?? request.unitPrice}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-800 dark:text-gray-300">Total Amount</span>
                        <div className="font-semibold text-green-400">₹{request.totalAmount?.toLocaleString?.() ?? request.totalAmount}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-800 dark:text-gray-300">Request Date</span>
                        <div className="font-semibold text-black dark:text-gray-200">
                          {request.submittedDate ? new Date(request.submittedDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>

                    {request.justification && (
                      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <span className="text-sm font-medium text-blue-400">Justification:</span>
                        <p className="text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{request.justification}</p>
                      </div>
                    )}
                    {latestHistory && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Latest Action: </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatStageLabel(latestHistory.stage)} - {latestHistory.status}
                        </span>
                        {latestHistory.comment && <p className="text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{latestHistory.comment}</p>}
                      </div>
                    )}
                    {request.status === 'Reverted' && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRequest?.(request);
                          }}
                          className="text-orange-400 hover:text-orange-300 font-medium text-sm"
                        >
                          Update & Resubmit
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

      <EquipmentDetailModal
        equipmentRequest={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        user={user}
        onStatusUpdate={undefined}
      />
    </div>
  );
}
