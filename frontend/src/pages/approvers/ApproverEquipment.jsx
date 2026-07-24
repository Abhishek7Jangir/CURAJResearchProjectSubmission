import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import EquipmentTable from '../../components/common/EquipmentTable';
import EquipmentDetailModal from '../../components/common/modals/EquipmentDetailModal';
import Pagination from '../../components/common/Pagination';
import { formatStageLabel } from '../../utils/stageLabels';

const ApproverEquipment = ({ user, showNotification }) => {
    const designationToStage = {
        hod: 'HOD',
        dean: 'DEAN',
        'r&d_helper': 'R&D_HELPER',
        rnd_helper: 'R&D_HELPER',
        'r&d_main': 'R&D_MAIN',
        rnd_main: 'R&D_MAIN',
        academic_integrity_officer: 'ACADEMIC_INTEGRITY_OFFICER',
        aio: 'ACADEMIC_INTEGRITY_OFFICER',
        finance_officer_helper: 'FINANCE_OFFICER_HELPER',
        finance_officer_main: 'FINANCE_OFFICER_MAIN',
        registrar: 'REGISTRAR',
        vc_office: 'VC_OFFICE',
        vc: 'VICE_CHANCELLOR',
        vice_chancellor: 'VICE_CHANCELLOR'
    };
    const userDesignation = designationToStage[user.designation?.toLowerCase()] || user.designation?.toUpperCase();

    const [equipmentRequests, setEquipmentRequests] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEquipmentRequests();
    }, []);

    const fetchEquipmentRequests = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/equipment/for-approval', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setEquipmentRequests(Array.isArray(data) ? data : []);
            } else {
                let message = 'Failed to fetch resource allotment requests';
                try {
                    const error = await res.json();
                    message = error?.error || message;
                } catch (_) {
                    // ignore parse errors and use fallback message
                }
                console.error(message);
                showNotification(message, 'error');
            }
        } catch (error) {
            console.error('Error fetching resource allotment requests:', error);
            showNotification('Unable to load resource allotments. Please check backend connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEquipmentUpdateStatus = async (id, newStatus, comment = '', forwardedTo = '') => {
        try {
            const token = sessionStorage.getItem('token');

            const res = await fetch('/api/equipment/update-status', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    equipmentRequestId: id,
                    status: newStatus,
                    comment: comment,
                    forwardedTo: forwardedTo
                })
            });

            if (res.ok) {
                const updatedRequest = await res.json();
                setEquipmentRequests(equipmentRequests.map(r => r.id === id ? updatedRequest : r));
                setSelectedEquipment(null);

                const isHodOrDean = user.designation?.toLowerCase() === 'hod' || user.designation?.toLowerCase() === 'dean';
                const message = isHodOrDean && newStatus === 'Approved' 
                    ? 'Indent approval request forwarded successfully!' 
                    : `Indent approval request ${newStatus.toLowerCase()} successfully!`;
                showNotification(message, 'success');
            } else {
                const error = await res.json();
                showNotification(error.error || 'Failed to update resource allotment request', 'error');
            }
        } catch (error) {
            console.error('Error updating equipment request:', error);
            showNotification('Failed to update resource allotment request', 'error');
        }
    };

    // Filter equipment requests
    const filteredEquipmentRequests = useMemo(() => {
        let displayRequests = equipmentRequests.filter(
            r =>
                r.currentStage === userDesignation ||
                r.approvalHistory?.some(h => h.stage === userDesignation)
        );

        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            displayRequests = displayRequests.filter(
                request =>
                    request.equipmentName.toLowerCase().includes(lower) ||
                    request.projectTitle.toLowerCase().includes(lower) ||
                    request.status.toLowerCase().includes(lower)
            );
        }

        return displayRequests;
    }, [equipmentRequests, searchQuery, userDesignation]);

    // Calculate stats
    const stats = useMemo(() => {
        const pendingForReview = filteredEquipmentRequests.filter(
            r => r.currentStage === userDesignation && r.status === 'Pending'
        ).length;
        
        const approvedCount = filteredEquipmentRequests.filter(
            r => r.status === 'Approved - Fund Released' || r.status === 'Approved'
        ).length;
        const rejectedCount = filteredEquipmentRequests.filter(r => r.status === 'Rejected').length;
        const totalRequests = filteredEquipmentRequests.length;
        const totalAmount = filteredEquipmentRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        return {
            pendingForReview,
            approvedCount,
            rejectedCount,
            totalRequests,
            totalAmount
        };
    }, [filteredEquipmentRequests, userDesignation]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEquipmentRequests.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards with animations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                {[
                    { label: 'Pending for Review', value: stats.pendingForReview, color: 'from-yellow-600 to-orange-600', border: 'border-yellow-500' },
                    { label: 'Approved', value: stats.approvedCount, color: 'from-green-600 to-emerald-600', border: 'border-green-500' },
                    { label: 'Rejected', value: stats.rejectedCount, color: 'from-red-600 to-rose-600', border: 'border-red-500' },
                    { label: 'Total Requests', value: stats.totalRequests, color: 'from-purple-600 to-pink-600', border: 'border-purple-500' }
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className={`bg-gradient-to-br ${stat.color} p-6 rounded-xl shadow-2xl border-2 ${stat.border} backdrop-blur-sm`}
                    >
                        <div className="text-sm text-gray-800/80 dark:text-white/80 mb-1">{stat.label}</div>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Recent Equipment Requests Needing Attention */}
            {stats.pendingForReview > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700/50"
                >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Indent Approval Requests Needing Your Review</h3>
                    <div className="space-y-4">
                        {filteredEquipmentRequests
                            .filter(r => r.currentStage === userDesignation && r.status === 'Pending')
                            .slice(0, 5)
                            .map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    className="bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all cursor-pointer"
                                    onClick={() => setSelectedEquipment(request)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{request.equipmentName}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Project: {request.projectTitle}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                                            {request.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                                            <div className="font-medium text-gray-900 dark:text-white">{request.quantity}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Unit Price:</span>
                                            <div className="font-medium text-gray-900 dark:text-white">₹{request.unitPrice.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                                            <div className="font-medium text-green-400">₹{request.totalAmount.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Current Stage:</span>
                                            <div className="font-medium text-gray-900 dark:text-white">{formatStageLabel(request.currentStage) || 'N/A'}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </motion.div>
            )}

            {/* All Equipment Requests Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden"
            >
                <div className="p-6">
                    <EquipmentTable
                        equipmentRequests={currentItems}
                        onApprove={(id) => handleEquipmentUpdateStatus(id, 'Approved')}
                        onReject={(id) => handleEquipmentUpdateStatus(id, 'Rejected')}
                        onViewDetails={(request) => setSelectedEquipment(request)}
                        startIndex={indexOfFirstItem}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </div>

                <div className="px-6 pb-6">
                    <Pagination
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredEquipmentRequests.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </div>
            </motion.div>

            <EquipmentDetailModal
                equipmentRequest={selectedEquipment}
                onClose={() => setSelectedEquipment(null)}
                user={user}
                onStatusUpdate={handleEquipmentUpdateStatus}
            />
        </div>
    );
};

export default ApproverEquipment;

