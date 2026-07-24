import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { formatStageLabel } from '../../utils/stageLabels';

const EquipmentTable = ({
    equipmentRequests,
    onViewDetails,
    startIndex = 0,
    searchQuery,
    onSearchChange
}) => {
    const formatCurrency = (amount) => (amount || 0).toLocaleString('en-IN');
    const safeText = (text) => text || 'N/A';

    const thCls = 'py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';

    return (
        <div className="bg-transparent overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">Indent Approval</h2>
                <div className="relative flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition duration-200">
                    <input
                        type="text"
                        placeholder="Search resource allotment requests..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-4 pr-10 py-2 bg-transparent rounded-lg focus:outline-none w-72 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                    />
                    <FaSearch className="absolute right-3 text-gray-400 text-sm pointer-events-none" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className={`${thCls} w-14 pl-6`}>S.No.</th>
                            <th className={`${thCls} w-60`}>Equipment Name</th>
                            <th className={`${thCls} w-52`}>Project</th>
                            <th className={`${thCls} w-24`}>Quantity</th>
                            <th className={`${thCls} w-32`}>Total Amount</th>
                            <th className={`${thCls} w-36`}>Current Stage</th>
                            <th className={`${thCls} w-32 text-center`}>Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {equipmentRequests.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No resource allotment requests found.
                                </td>
                            </tr>
                        ) : (
                            equipmentRequests.map((request, index) => (
                                <tr key={request.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">

                                    <td className="py-4 px-5 pl-6 text-sm text-gray-400 dark:text-gray-500 font-medium">
                                        {startIndex + index + 1}
                                    </td>

                                    <td
                                        className="py-4 px-5 text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-[15rem] truncate"
                                        onClick={() => onViewDetails(request)}
                                        title={request.equipmentName}
                                    >
                                        {safeText(request.equipmentName)}
                                    </td>

                                    <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300 max-w-[13rem] truncate" title={request.projectTitle}>
                                        {safeText(request.projectTitle)}
                                    </td>

                                    <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {request.quantity ?? '—'}
                                    </td>

                                    <td className="py-4 px-5 text-sm text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">
                                        ₹{formatCurrency(request.totalAmount)}
                                    </td>

                                    <td className="py-4 px-5 text-sm">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                                            border border-gray-200 dark:border-gray-700">
                                            {safeText(formatStageLabel(request.currentStage))}
                                        </span>
                                    </td>

                                    <td className="py-4 px-5 text-center">
                                        <button
                                            onClick={() => onViewDetails(request)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
                                        >
                                            Review / Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EquipmentTable;
