import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Pagination from '../../components/common/Pagination';
import UtilizationCertificateDetailModal from '../../components/common/modals/UtilizationCertificateDetailModal';
import { formatStageLabel } from '../../utils/stageLabels';

const designationToStage = {
  finance_officer_helper: 'FINANCE_OFFICER_HELPER',
  finance_officer_main: 'FINANCE_OFFICER_MAIN',
  registrar: 'REGISTRAR'
};

const ApproverUtilizationCertificate = ({ user, showNotification }) => {
  const userDesignation =
    designationToStage[user.designation?.toLowerCase()] || user.designation?.toUpperCase();

  const [certificates, setCertificates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/utilization-certificates/for-approval', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(Array.isArray(data) ? data : []);
      } else {
        let message = 'Failed to fetch utilization certificates';
        try {
          const err = await res.json();
          message = err?.error || message;
        } catch (_) {}
        showNotification(message, 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Unable to load utilization certificates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, comment = '') => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/utilization-certificates/update-status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ certificateId: id, status, comment })
      });
      if (res.ok) {
        const updated = await res.json();
        setCertificates((prev) => prev.map((c) => (c.id === id ? updated : c)));
        setSelected(null);
        const msg =
          status === 'Approved' && userDesignation !== 'REGISTRAR'
            ? 'Utilization certificate forwarded successfully.'
            : `Utilization certificate ${status.toLowerCase()} successfully.`;
        showNotification(msg, 'success');
      } else {
        const err = await res.json();
        showNotification(err.error || 'Update failed', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to update utilization certificate', 'error');
    }
  };

  const filtered = useMemo(() => {
    let list = certificates.filter(
      (c) =>
        c.currentStage === userDesignation ||
        c.approvalHistory?.some((h) => h.stage === userDesignation)
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.id?.toLowerCase().includes(q) ||
          c.projectTitle?.toLowerCase().includes(q) ||
          c.financialYear?.toLowerCase().includes(q) ||
          c.status?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [certificates, searchQuery, userDesignation]);

  const stats = useMemo(() => {
    const pendingForReview = filtered.filter(
      (c) => c.currentStage === userDesignation && c.status === 'Pending'
    ).length;
    const approvedCount = filtered.filter((c) => c.status === 'Approved').length;
    const rejectedCount = filtered.filter((c) => c.status === 'Rejected').length;
    return {
      pendingForReview,
      approvedCount,
      rejectedCount,
      total: filtered.length
    };
  }, [filtered, userDesignation]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const pageItems = filtered.slice(indexOfFirst, indexOfLast);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: 'Pending for Review', value: stats.pendingForReview, color: 'from-yellow-600 to-orange-600' },
          { label: 'Approved', value: stats.approvedCount, color: 'from-green-600 to-emerald-600' },
          { label: 'Rejected', value: stats.rejectedCount, color: 'from-red-600 to-rose-600' },
          { label: 'Total (visible)', value: stats.total, color: 'from-purple-600 to-pink-600' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${stat.color} p-6 rounded-xl shadow-xl border border-white/10`}
          >
            <div className="text-sm text-gray-800/80 dark:text-white/80 mb-1">{stat.label}</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Utilization Certificates</h3>
          <input
            type="search"
            placeholder="Search by ID, project, year…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:max-w-md px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 dark:bg-gray-900 dark:border-gray-600 dark:text-white placeholder-gray-500"
          />
        </div>

        <div className="space-y-3">
          {pageItems.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-12">No utilization certificates to show.</p>
          ) : (
            pageItems.map((c) => (
              <motion.button
                type="button"
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelected(c)}
                className="w-full text-left bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{c.id}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.projectTitle}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">FY {c.financialYear}</div>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                      c.status === 'Approved'
                        ? 'bg-green-500/20 text-green-400'
                        : c.status === 'Rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : c.status === 'Reverted'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {c.status}
                    {c.status === 'Pending' && c.currentStage && ` · ${formatStageLabel(c.currentStage)}`}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>

        <div className="mt-6">
          <Pagination
            itemsPerPage={itemsPerPage}
            totalItems={filtered.length}
            paginate={setCurrentPage}
            currentPage={currentPage}
          />
        </div>
      </div>

      <UtilizationCertificateDetailModal
        certificate={selected}
        onClose={() => setSelected(null)}
        user={user}
        onStatusUpdate={handleUpdateStatus}
      />
    </div>
  );
};

export default ApproverUtilizationCertificate;
