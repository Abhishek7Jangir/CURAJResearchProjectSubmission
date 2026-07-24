import React, { useState, useMemo } from 'react';
import { FolderOpen } from 'lucide-react';
import ProjectTable from '../../components/common/ProjectTable';
import ProjectFilters, { applyProjectFilters } from '../../components/common/ProjectFilters';
import ProjectDetailModal from '../../components/common/modals/ProjectDetailModal';

/**
 * "My Projects" section (Professor / PI dashboard).
 *
 * Shows ALL of the PI's projects in a compact, row-based table (reusing
 * the same ProjectTable component used in approver dashboards), with the
 * same filtering options available elsewhere (status, duration, date
 * range, search).
 *
 * When a project is clicked, this section shows the project's details
 * AS THEY WERE AT THE MOMENT OF ITS FINAL APPROVAL (a historical
 * snapshot), not the current/live values — which may have since changed
 * due to budget revisions or budget head deductions from approved
 * indents. If a project hasn't been finally approved yet, the live
 * (current) project details are shown instead, since no snapshot exists.
 */
export default function MyProjects({ projects, user, showNotification }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [filters, setFilters] = useState({
    status: 'All',
    duration: 'All',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  const filteredProjects = useMemo(
    () => applyProjectFilters(projects, filters),
    [projects, filters]
  );

  const handleViewDetails = async (project) => {
    // Only fully-approved projects have a final-approval snapshot.
    // For anything still in progress (Pending/Reverted/Rejected), there
    // is no "as approved" state yet, so just show the live project data.
    const isFinallyApproved =
      project.status === 'Approved' &&
      (project.currentStage === 'COMPLETED' || project.currentStage === 'Approved');

    if (!isFinallyApproved) {
      setSelectedProject(project);
      return;
    }

    setLoadingSnapshot(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/projects/approval-snapshot/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const snapshot = await res.json();
        setSelectedProject(snapshot);
      } else {
        // No snapshot saved yet (e.g. project approved before this
        // feature existed) — fall back to live project data so the
        // user can still see something useful.
        setSelectedProject(project);
      }
    } catch (error) {
      console.error('Failed to fetch project approval snapshot:', error);
      setSelectedProject(project);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All your projects at a glance. Click a row to view full details — approved projects
            show details as they were when finally approved.
          </p>
        </div>
      </div>

      <ProjectFilters projects={projects} onFilterChange={setFilters} />

      {loadingSnapshot && (
        <div className="text-sm text-blue-600 dark:text-blue-400">Loading approved details…</div>
      )}

      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <ProjectTable
          projects={filteredProjects}
          onViewDetails={handleViewDetails}
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
        />
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          user={user}
          onClose={() => setSelectedProject(null)}
          showBudgetTable
        />
      )}
    </div>
  );
}
