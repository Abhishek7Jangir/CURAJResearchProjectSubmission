import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCheck, FaBan, FaHistory, FaArrowRight, FaUndo } from 'react-icons/fa';
import { formatStageLabel } from '../../../utils/stageLabels';

const EquipmentDetailModal = ({ equipmentRequest, onClose, user, onStatusUpdate }) => {
    const [comment, setComment] = useState('');
    const [forwardedTo, setForwardedTo] = useState('');

    if (!equipmentRequest) {
        return null;
    }

    // Map user designation to stage for comparison
    const designationToStage = {
        'hod': 'HOD',
        'dean': 'DEAN',
        'r&d_helper': 'R&D_HELPER',
        'rnd_helper': 'R&D_HELPER',
        'r&d_main': 'R&D_MAIN',
        'rnd_main': 'R&D_MAIN',
        'academic_integrity_officer': 'ACADEMIC_INTEGRITY_OFFICER',
        'aio': 'ACADEMIC_INTEGRITY_OFFICER',
        'finance_officer_helper': 'FINANCE_OFFICER_HELPER',
        'finance_officer_main': 'FINANCE_OFFICER_MAIN',
        'registrar': 'REGISTRAR',
        'vc_office': 'VC_OFFICE',
        'vc': 'VICE_CHANCELLOR',
        'vice_chancellor': 'VICE_CHANCELLOR'
    };
    const userDesignationLower = user?.designation?.toLowerCase();
    const userStage = designationToStage[userDesignationLower] || user?.designation?.toUpperCase();
    const canApprove = user && equipmentRequest.status === 'Pending' && equipmentRequest.currentStage === userStage;
    
    // Only Vice Chancellor can reject/approve
    const isViceChancellor = userStage === 'VICE_CHANCELLOR';
    const shouldShowForward = !isViceChancellor;
    const requiresForwardSelection = userStage === 'R&D_MAIN' || userStage === 'FINANCE_OFFICER_MAIN';
    const isForwardDisabled = requiresForwardSelection && !forwardedTo;
    
    // Check if user can forward to selected stage (R&D_MAIN and FO_MAIN)
    const canSelectForward = (userStage === 'R&D_MAIN' || userStage === 'FINANCE_OFFICER_MAIN');
    
    // Available stages for forwarding (higher authorities)
    const stages = ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'ACADEMIC_INTEGRITY_OFFICER', 'FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'REGISTRAR', 'VC_OFFICE', 'VICE_CHANCELLOR', 'COMPLETED'];
    const currentStageIndex = stages.indexOf(equipmentRequest.currentStage);
    
    // Define allowed forwarding stages based on user role
    let forwardableStages = [];
    if (canSelectForward) {
      if (userStage === 'R&D_MAIN') {
        forwardableStages = [
          { value: 'AIO', label: 'Internal Audit Officer (IAO)' },
          { value: 'FO', label: 'Finance Office' },
          { value: 'REGISTRAR', label: 'Registrar' },
          { value: 'VC', label: 'Vice Chancellor (VC Office)' }
        ];
      } else if (userStage === 'FINANCE_OFFICER_MAIN') {
        forwardableStages = [
          { value: 'REGISTRAR', label: 'Registrar' },
          { value: 'VC', label: 'Vice Chancellor (VC Office)' }
        ];
      }
    } else {
      // For other users, use default behavior (next stage)
      forwardableStages = stages.slice(currentStageIndex + 1, stages.length - 1); // Exclude COMPLETED
    }

    const handleAction = (status) => {
        if (onStatusUpdate) {
            onStatusUpdate(equipmentRequest.id, status, comment, forwardedTo);
            setComment('');
            setForwardedTo('');
            onClose();
        }
    };

    const handleDownload = async (documentType) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/equipment/download/${equipmentRequest.id}?documentType=${encodeURIComponent(documentType)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to download document');
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${documentType}-${equipmentRequest.id}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download equipment document error:', error);
            alert('Failed to download document.');
        }
    };

    const handleViewDocument = async (documentType) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/equipment/download/${equipmentRequest.id}?documentType=${encodeURIComponent(documentType)}&mode=view`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to open document');
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (error) {
            console.error('View equipment document error:', error);
            alert('Failed to open document.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-8 relative border border-gray-200 dark:border-gray-700"
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-5 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-xl z-10">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{equipmentRequest.equipmentName}</h3>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-white transition-colors">
                        <FaTimes className="h-6 w-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-900">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Request ID:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.id}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Status:</strong>
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                                equipmentRequest.status === 'Approved - Fund Released' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                equipmentRequest.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                equipmentRequest.status === 'Reverted' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                            }`}>
                                {equipmentRequest.status} ({formatStageLabel(equipmentRequest.currentStage)})
                            </span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Project:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.projectTitle}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Project ID:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.projectId}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Grant Type:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.grantType || 'N/A'}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Budget Head:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.budgetHead || 'N/A'}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Amount Sanctioned:</strong> <span className="text-gray-600 dark:text-gray-400">₹{(equipmentRequest.amountSanctioned || 0).toLocaleString('en-IN')}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Available Balance:</strong> <span className="text-gray-600 dark:text-gray-400">₹{(equipmentRequest.availableBalance || 0).toLocaleString('en-IN')}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Procurement Mode:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.procurementMode || 'N/A'}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Request Type:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.requestType || 'N/A'}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Total Amount:</strong> <span className="text-gray-600 dark:text-gray-400">₹{(equipmentRequest.totalAmount || 0).toLocaleString('en-IN')}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Submitted By:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.submittedBy}</span></p>
                        <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Submitted Date:</strong> <span className="text-gray-600 dark:text-gray-400">{new Date(equipmentRequest.submittedDate).toLocaleDateString()}</span></p>
                        {equipmentRequest.billUploaded && (
                            <>
                                <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Bill Uploaded:</strong> <span className="text-green-400">Yes</span></p>
                                <p className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Bill Upload Date:</strong> <span className="text-gray-600 dark:text-gray-400">{equipmentRequest.billUploadDate ? new Date(equipmentRequest.billUploadDate).toLocaleDateString() : 'N/A'}</span></p>
                            </>
                        )}
                    </div>

                    {/* Items */}
                    {equipmentRequest.items && equipmentRequest.items.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Items Requested</h4>
                            <div className="space-y-2">
                                {equipmentRequest.items.map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800/50 p-3 rounded-lg">
                                        <div className="grid grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">Item Name:</div>
                                                <div className="text-gray-900 dark:text-white font-semibold">{item.itemName || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">Quantity:</div>
                                                <div className="text-gray-900 dark:text-white">{item.quantity || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">Rate:</div>
                                                <div className="text-gray-900 dark:text-white">₹{(item.rate || 0).toLocaleString('en-IN')}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">Amount:</div>
                                                <div className="text-gray-900 dark:text-white font-semibold">₹{((item.quantity || 0) * (item.rate || 0)).toLocaleString('en-IN')}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enclosures */}
                    {equipmentRequest.enclosures && Object.keys(equipmentRequest.enclosures).length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Enclosures</h4>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {Object.entries(equipmentRequest.enclosures).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between bg-gray-100  dark:bg-gray-800/40 rounded p-2">
                                        <strong className="text-gray-900 dark:text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</strong>
                                        {value ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDocument(key)}
                                                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white text-xs"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(key)}
                                                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-gray-900 dark:text-white text-xs"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-500">Not uploaded</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approval History */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                            <FaHistory /> Approval History
                        </h4>
                        <div className="space-y-4">
                            {!equipmentRequest.approvalHistory || equipmentRequest.approvalHistory.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400 italic text-sm">No history yet.</p>
                            ) : (
                                equipmentRequest.approvalHistory.map((history, index) => (
                                    <div key={index} className="flex items-start gap-3 bg-white dark:bg-gray-800/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                            history.status === 'Approved' ? 'bg-green-500' : 
                                            history.status === 'Rejected' ? 'bg-red-500' : 
                                            'bg-orange-500'
                                        }`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-gray-900 dark:text-white">{formatStageLabel(history.stage)} ({history.user})</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{history.date}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                <span className={`font-semibold ${
                                                    history.status === 'Approved' ? 'text-green-400' : 
                                                    history.status === 'Rejected' ? 'text-red-400' : 
                                                    'text-orange-400'
                                                }`}>{history.status}</span>
                                                {history.comment && `: ${history.comment}`}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Action Section for Approvers */}
                    {canApprove && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 bg-blue-500/10 -mx-6 px-6 py-4 mt-4 border-l-4 border-blue-500">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Review Action</h4>
                            
                            {/* Forward selection for R&D_MAIN and FO_MAIN */}
                            {canSelectForward && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        Forward to (Select higher authority):
                                    </label>
                                    <select
                                        className="w-full p-3 bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-white"
                                        value={forwardedTo}
                                        onChange={(e) => setForwardedTo(e.target.value)}
                                    >
                                        <option value="">Select stage</option>
                                        {forwardableStages.map(stage => (
                                            <option key={stage.value || stage} value={stage.value || stage}>
                                                {stage.label || stage}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            <textarea
                                className="w-full p-3 bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3 text-gray-900 dark:text-white placeholder-gray-500"
                                rows="3"
                                placeholder={shouldShowForward
                                    ? "Add a comment (optional for forwarding, required for revert/rejection)..."
                                    : "Add a comment (optional for approval, required for revert/rejection)..."}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <div className="flex gap-3 flex-wrap">
                                {shouldShowForward ? (
                                    <>
                                        <button
                                            onClick={() => handleAction('Approved')}
                                            disabled={isForwardDisabled}
                                            className="flex items-center gap-2 bg-blue-600 text-gray-900 dark:text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                                        >
                                            <FaArrowRight /> Forward
                                        </button>
                                        <button
                                            onClick={() => handleAction('Reverted')}
                                            disabled={!comment.trim()}
                                            title={!comment.trim() ? "Comment required for revert" : ""}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                                                !comment.trim()
                                                ? 'bg-gray-300 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-orange-600 text-gray-900 dark:text-white hover:bg-orange-700'
                                            }`}
                                        >
                                            <FaUndo /> Revert with Suggestions
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAction('Approved')}
                                            className="flex items-center gap-2 bg-green-600 text-gray-900 dark:text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                                        >
                                            <FaCheck /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction('Rejected')}
                                            disabled={!comment.trim()}
                                            title={!comment.trim() ? "Comment required for rejection" : ""}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                                                !comment.trim()
                                                ? 'bg-gray-300 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-red-600 text-gray-900 dark:text-white hover:bg-red-700'
                                            }`}
                                        >
                                            <FaBan /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction('Reverted')}
                                            disabled={!comment.trim()}
                                            title={!comment.trim() ? "Comment required for revert" : ""}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                                                !comment.trim()
                                                ? 'bg-gray-300 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-orange-600 text-gray-900 dark:text-white hover:bg-orange-700'
                                            }`}
                                        >
                                            <FaUndo /> Revert with Suggestions
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-5 text-right bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="bg-gray-700 text-white dark:text-white px-4 py-2 rounded-md font-medium hover:bg-gray-600 transition duration-200"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EquipmentDetailModal;

