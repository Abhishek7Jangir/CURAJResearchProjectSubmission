import React, { useState } from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';

const ProjectFilters = ({ 
    projects, 
    onFilterChange, 
    showStatusFilter = true,
    showDateFilter = true,
    showDurationFilter = true
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState({
        status: 'All',
        duration: 'All',
        dateFrom: '',
        dateTo: '',
        searchQuery: ''
    });

    // Get unique durations from projects
    const uniqueDurations = ['All', ...new Set(projects.map(p => p.duration).filter(Boolean))];

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            status: 'All',
            duration: 'All',
            dateFrom: '',
            dateTo: '',
            searchQuery: ''
        };
        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    const hasActiveFilters = filters.status !== 'All' || 
                            filters.duration !== 'All' || 
                            filters.dateFrom || 
                            filters.dateTo || 
                            filters.searchQuery;

    const applyFilters = (projectList) => {
        let filtered = [...projectList];

        // Status filter
        if (filters.status !== 'All') {
            filtered = filtered.filter(p => p.status === filters.status);
        }

        // Duration filter
        if (filters.duration !== 'All') {
            filtered = filtered.filter(p => p.duration === filters.duration);
        }

        // Date range filter
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(p => {
                const projectDate = new Date(p.submittedDate);
                return projectDate >= fromDate;
            });
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // Include entire day
            filtered = filtered.filter(p => {
                const projectDate = new Date(p.submittedDate);
                return projectDate <= toDate;
            });
        }

        // Search query filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.title?.toLowerCase().includes(query) ||
                p.pi?.toLowerCase().includes(query) ||
                p.fundingAgency?.toLowerCase().includes(query) ||
                p.id?.toString().includes(query)
            );
        }

        return filtered;
    };

    return (
        <div className="bg-white dark:bg-gray-800/80 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700/70">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/70">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaFilter className="text-gray-600 dark:text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
                        {hasActiveFilters && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-xs font-medium rounded-full">
                                Active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex items-center gap-1"
                            >
                                <FaTimes className="text-xs" />
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Query */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search by title, PI, agency..."
                            value={filters.searchQuery}
                            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    {showStatusFilter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    )}

                    {/* Duration Filter */}
                    {showDurationFilter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Duration
                            </label>
                            <select
                                value={filters.duration}
                                onChange={(e) => handleFilterChange('duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            >
                                {uniqueDurations.map(duration => (
                                    <option key={duration} value={duration}>
                                        {duration}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date From */}
                    {showDateFilter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Date To */}
                    {showDateFilter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Export the filter function for use in components
export const applyProjectFilters = (projects, filters) => {
    let filtered = [...projects];

    // Status filter
    if (filters.status && filters.status !== 'All') {
        filtered = filtered.filter(p => p.status === filters.status);
    }

    // Duration filter
    if (filters.duration && filters.duration !== 'All') {
        filtered = filtered.filter(p => p.duration === filters.duration);
    }

    // Date range filter
    if (filters.dateFrom) {
        try {
            const fromDate = new Date(filters.dateFrom);
            if (!isNaN(fromDate.getTime())) {
                filtered = filtered.filter(p => {
                    if (!p.submittedDate) return false;
                    try {
                        const projectDate = new Date(p.submittedDate);
                        return !isNaN(projectDate.getTime()) && projectDate >= fromDate;
                    } catch {
                        return false;
                    }
                });
            }
        } catch (e) {
            // Invalid date, skip filter
        }
    }

    if (filters.dateTo) {
        try {
            const toDate = new Date(filters.dateTo);
            if (!isNaN(toDate.getTime())) {
                toDate.setHours(23, 59, 59, 999);
                filtered = filtered.filter(p => {
                    if (!p.submittedDate) return false;
                    try {
                        const projectDate = new Date(p.submittedDate);
                        return !isNaN(projectDate.getTime()) && projectDate <= toDate;
                    } catch {
                        return false;
                    }
                });
            }
        } catch (e) {
            // Invalid date, skip filter
        }
    }

    // Search query filter
    if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.title?.toLowerCase().includes(query) ||
            p.pi?.toLowerCase().includes(query) ||
            p.principalInvestigator?.toLowerCase().includes(query) ||
            p.fundingAgency?.toLowerCase().includes(query) ||
            p.id?.toString().includes(query)
        );
    }

    return filtered;
};

export default ProjectFilters;

