import React, { useState, useMemo } from 'react';
import { FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { formatStageLabel } from '../../utils/stageLabels';

const ProjectTable = ({
    projects,
    onApprove,
    onReject,
    onViewDetails,
    startIndex = 0,
    searchQuery,
    onSearchChange,
    isHodOrDean = false
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedProjects = useMemo(() => {
        if (!sortConfig.key) return projects;
        return [...projects].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            if (sortConfig.key === 'totalBudget') {
                aVal = a.totalBudget || 0; bVal = b.totalBudget || 0;
            } else if (sortConfig.key === 'submittedDate' || sortConfig.key === 'projectStartDate' || sortConfig.key === 'projectEndDate') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [projects, sortConfig]);

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="text-gray-400 dark:text-gray-500 w-3 h-3" />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp className="text-blue-500 w-3 h-3" />
            : <FaSortDown className="text-blue-500 w-3 h-3" />;
    };

    const formatCurrency = (val) => typeof val === 'number' ? val.toLocaleString('en-IN') : 'N/A';
    const safeText = (val) => val || 'N/A';

    // Parse duration string "2026-05-20 to 2026-06-03" => { start, end }
    const parseDuration = (dur) => {
        if (!dur) return { start: null, end: null };
        const parts = String(dur).split(' to ');
        return { start: parts[0]?.trim() || null, end: parts[1]?.trim() || null };
    };

    const formatDate = (raw) => {
        if (!raw) return '—';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return raw;
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return raw; }
    };

    const TH = ({ label, sortKey, className = '' }) => (
        <th
            className={`py-3 px-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
                ${sortKey ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors select-none' : ''}
                ${className}`}
            onClick={sortKey ? () => handleSort(sortKey) : undefined}
        >
            <div className="flex items-center gap-1.5">
                {label}
                {sortKey && getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="bg-transparent overflow-hidden">
            {/* Table header bar */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">Project Applications</h2>
                <div className="relative flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition duration-200">
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-4 pr-10 py-2 bg-transparent rounded-lg focus:outline-none w-60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                    />
                    <FaSearch className="absolute right-3 text-gray-400 text-sm pointer-events-none" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <TH label="S.No." className="w-14 pl-6" />
                            <TH label="Title" sortKey="title" className="w-52" />
                            <TH label="Proposed Date" sortKey="submittedDate" className="w-32" />
                            <TH label="Start Date" sortKey="projectStartDate" className="w-28" />
                            <TH label="End Date" sortKey="projectEndDate" className="w-28" />
                            <TH label="Budget" sortKey="totalBudget" className="w-28" />
                            <TH label="Current Stage" sortKey="currentStage" className="w-36" />
                            <th className="py-3 px-5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {sortedProjects.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No projects found.
                                </td>
                            </tr>
                        ) : (
                            sortedProjects.map((project, index) => {
                                const dur = parseDuration(project.duration);
                                const startDate = project.projectStartDate || dur.start;
                                const endDate   = project.projectEndDate   || dur.end;

                                return (
                                    <tr key={project.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">

                                        <td className="py-4 px-5 pl-6 text-sm text-gray-400 dark:text-gray-500 font-medium">
                                            {startIndex + index + 1}
                                        </td>

                                        <td
                                            className="py-4 px-5 text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-[13rem] truncate"
                                            onClick={() => onViewDetails(project)}
                                            title={project.title}
                                        >
                                            {safeText(project.title)}
                                        </td>

                                        <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatDate(project.submittedDate)}
                                        </td>

                                        <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatDate(startDate)}
                                        </td>

                                        <td className="py-4 px-5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatDate(endDate)}
                                        </td>

                                        <td className="py-4 px-5 text-sm text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">
                                            ₹{formatCurrency(project.totalBudget)}
                                        </td>

                                        <td className="py-4 px-5 text-sm">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                                                border border-gray-200 dark:border-gray-700">
                                                {safeText(formatStageLabel(project.currentStage))}
                                            </span>
                                        </td>

                                        <td className="py-4 px-5 text-center">
                                            <button
                                                onClick={() => onViewDetails(project)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                Review / Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectTable;
