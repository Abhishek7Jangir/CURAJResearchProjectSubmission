import React, { useState, useMemo } from 'react';
import { FileText, Upload } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/storage';
import ProjectFilters, { applyProjectFilters } from '../../components/common/ProjectFilters';

export default function Dashboard({ projects, onNewProject }) {
  const [filters, setFilters] = useState({
    status: 'All',
    duration: 'All',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  const filteredProjects = useMemo(() => {
    return applyProjectFilters(projects, filters);
  }, [projects, filters]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onNewProject}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 ml-auto"
        >
          <Upload className="w-4 h-4 text-white" />
          Submit New Project
        </button>
      </div>

      {/* Stats Cards - Matching HOD style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-gray-800/80 dark:text-white/80 mb-1 font-medium">Pending for Review</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {filteredProjects.filter(p => p.status.includes('Pending')).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-gray-800/80 dark:text-white/80 mb-1 font-medium">Approved</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {filteredProjects.filter(p => p.status.includes('Approved')).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-gray-800/80 dark:text-white/80 mb-1 font-medium">Rejected</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {filteredProjects.filter(p => p.status.includes('Rejected')).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-xl shadow-lg">
          <div className="text-sm text-gray-800/80 dark:text-white/80 mb-1 font-medium">Total Projects</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{filteredProjects.length}</div>
        </div>
      </div>

      {/* Recent Projects - Dark card */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700/50">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {filters.status !== 'All' || filters.duration !== 'All' || filters.dateFrom || filters.dateTo || filters.searchQuery
            ? 'Filtered Projects'
            : 'Recent Projects'}
        </h3>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p>No projects submitted yet</p>
            <button
              onClick={onNewProject}
              className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
            >
              Submit your first project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.slice(-10).reverse().map(project => (
              <div key={project.id} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-100/70 dark:bg-gray-900/70 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{project.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">PI: {project.pi}</p>
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">Funding Agency:</span>
                    <div className="font-medium text-gray-700 dark:text-gray-300">{project.fundingAgency}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">Duration:</span>
                    <div className="font-medium text-gray-700 dark:text-gray-300">{project.duration}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">Total Budget:</span>
                    <div className="font-medium text-gray-700 dark:text-gray-300">₹{project.totalBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">Available:</span>
                    <div className="font-medium text-green-400">₹{project.availableBudget.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}