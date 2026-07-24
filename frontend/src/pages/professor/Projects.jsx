import React, { useState, useMemo } from 'react';
import { FileText, Upload } from 'lucide-react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { getStatusColor, getStatusIcon } from '../../utils/storage';
import ProjectDetailModal from '../../components/common/modals/ProjectDetailModal';
import ProjectFilters, { applyProjectFilters } from '../../components/common/ProjectFilters';
import BudgetUpdateForm from '../../components/common/forms/BudgetUpdateForm';
import { formatStageLabel } from '../../utils/stageLabels';

// Safely derive a display string for PI / Co-PI fields that may be
// plain strings, populated user objects, or arrays of either.
const getPersonLabel = (value) => {
  if (!value) return '';

  // If already a string, use directly
  if (typeof value === 'string') return value;

  // If it's an array (e.g. multiple Co-PIs), join their labels
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') {
          return v.name || v.designation || v.department || '';
        }
        return String(v);
      })
      .filter(Boolean)
      .join(', ');
  }

  // If it's an object (e.g. populated user doc)
  if (typeof value === 'object') {
    return value.name || value.designation || value.department || '';
  }

  // Fallback to string conversion
  return String(value);
};

export default function Projects({ projects, onNewProject, onEditProject, onRequestEquipment, showNotification }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [budgetProject, setBudgetProject] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewerUrl, setViewerUrl] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    duration: 'All',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="text-gray-500 dark:text-gray-500 inline ml-1" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="text-blue-400 inline ml-1" />
      : <FaSortDown className="text-blue-400 inline ml-1" />;
  };

  const filteredProjects = useMemo(() => {
    let filtered = activeFilter === 'All'
      ? projects
      : projects.filter(project => project.status === activeFilter);
    
    const filtersToApply = { 
      ...filters, 
      status: 'All'
    };
    filtered = applyProjectFilters(filtered, filtersToApply);
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const piLabel = getPersonLabel(p.pi).toLowerCase();
        const idString = (p.id || p._id || '').toString().toLowerCase();

        return (
          p.title?.toLowerCase().includes(query) ||
          piLabel.includes(query) ||
          p.fundingAgency?.toLowerCase().includes(query) ||
          idString.includes(query)
        );
      });
    }

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'totalBudget') {
          aValue = a.totalBudget || 0;
          bValue = b.totalBudget || 0;
        } else if (sortConfig.key === 'submittedDate') {
          aValue = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
          bValue = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [projects, activeFilter, filters, sortConfig]);

  const openBudgetUpdateForm = (project) => {
    setBudgetProject(project);
  };

  const closeViewer = () => {
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
  };

  const handleViewProposal = async (project) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showNotification?.('Please login again to view proposal.', 'error');
        return;
      }

      const res = await fetch(`/api/projects/download/${project.id}?documentType=completeProposal`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        showNotification?.('Proposal file is not available for this project.', 'error');
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setViewerUrl(blobUrl);
    } catch (error) {
      console.error('View proposal error:', error);
      showNotification?.('Failed to open proposal preview.', 'error');
    }
  };

  const handleDownloadApprovedProject = async (project) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showNotification?.('Please login again to download.', 'error');
        return;
      }
      const res = await fetch(`/api/projects/download-approved/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotification?.(err?.error || 'Failed to download approved project PDF.', 'error');
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${project.id}-approved-project.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      showNotification?.('Failed to download approved project PDF.', 'error');
    }
  };

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

      {/* Filter Tabs - Dark theme */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <div className="grid grid-cols-5 border-b border-gray-200 dark:border-gray-700">
          {['All', 'Pending', 'Approved', 'Rejected', 'Completed'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-3 font-medium border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
              }`}
            >
              {filter} ({projects.filter(p =>
                filter === 'All' || p.status === filter
              ).length})
            </button>
          ))}
        </div>

        {/* Sortable Headers */}
        <div className="px-6 py-3 bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 grid grid-cols-5 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <div 
            className="cursor-pointer hover:text-blue-400 flex items-center"
            onClick={() => handleSort('title')}
          >
            Title {getSortIcon('title')}
          </div>
          <div 
            className="cursor-pointer hover:text-blue-400 flex items-center"
            onClick={() => handleSort('submittedDate')}
          >
            Date {getSortIcon('submittedDate')}
          </div>
          <div 
            className="cursor-pointer hover:text-blue-400 flex items-center"
            onClick={() => handleSort('duration')}
          >
            Duration {getSortIcon('duration')}
          </div>
          <div 
            className="cursor-pointer hover:text-blue-400 flex items-center"
            onClick={() => handleSort('totalBudget')}
          >
            Budget {getSortIcon('totalBudget')}
          </div>
          <div 
            className="cursor-pointer hover:text-blue-400 flex items-center"
            onClick={() => handleSort('status')}
          >
            Status {getSortIcon('status')}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No projects found</p>
            </div>
          ) : (
            filteredProjects.map(project => (
              <div key={project.id || project._id} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:bg-gray-900/70 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{project.title}</h4>
                      <span className="text-sm text-black
                      bg-gray-100
                      dark:text-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                        {project.id || project._id}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Principal Investigator: {getPersonLabel(project.pi)}
                    </p>
                    {project.coPi && (
                      <p className="text-gray-600 dark:text-gray-400">
                        Co-PI: {getPersonLabel(project.coPi)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      {project.status}
                    </span>
                    {project.currentStage && project.status === 'Pending' && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-200/30 dark:text-blue-400 dark:bg-blue-900/30 px-2 py-1 rounded">
                        Current Stage: {formatStageLabel(project.currentStage)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Funding Agency</span>
                    <div className="font-semibold text-gray-900 dark:text-white">{project.fundingAgency}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Duration</span>
                    <div className="font-semibold text-gray-900 dark:text-white">{project.duration}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Total Budget</span>
                    <div className="font-semibold text-gray-900 dark:text-white">₹{project.totalBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Available Budget</span>
                    <div className="font-semibold text-green-400">₹{project.availableBudget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">Submitted Date</span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(project.submittedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                  >
                    View Details
                  </button>
                  {project.status === 'Reverted' && onEditProject && (
                    <button
                      onClick={() => onEditProject(project)}
                      className="text-orange-400 hover:text-orange-300 font-medium text-sm"
                    >
                      Edit &amp; Resubmit
                    </button>
                  )}
                  <button
                    onClick={() => handleViewProposal(project)}
                    className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                  >
                    View Proposal
                  </button>
                  {project.status === 'Approved' && (
                    <button
                      onClick={() => handleDownloadApprovedProject(project)}
                      className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                    >
                      Download Approved Project
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {budgetProject && (
        <BudgetUpdateForm
          project={budgetProject}
          onClose={() => setBudgetProject(null)}
          showNotification={showNotification}
        />
      )}

      {viewerUrl && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b bg-gray-100">
              <h4 className="font-semibold text-gray-800">Proposal Preview</h4>
              <button
                onClick={closeViewer}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
              >
                Close
              </button>
            </div>
            <iframe
              src={viewerUrl}
              title="Proposal Preview"
              className="w-full h-[calc(85vh-56px)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}